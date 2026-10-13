import { useMemo, useState, type ReactNode } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { getErrorMessage } from '@/api';
import { EmptyState, ErrorState, LoadingIndicator } from '@/components/feedback';
import { AppHeader, Screen } from '@/components/layout';
import { IconButton, SearchInput, Select, type SelectOption } from '@/components/ui';
import { useCategoriesList } from '@/features/categories/queries';
import { ProductCard, ProductListSkeleton } from '@/features/products/components';
import { useProductsInfinite } from '@/features/products/queries';
import type {
  Product,
  ProductListFilters,
  ProductSortBy,
  SortOrder,
} from '@/features/products/types';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { usePermissions } from '@/hooks/usePermissions';
import { useTheme } from '@/providers';
import { spacing } from '@/theme';

/** Sort options mapped to the backend's `sortBy`/`sortOrder` pair. */
const SORT_OPTIONS: readonly SelectOption[] = [
  { value: 'createdAt:desc', label: 'Newest first' },
  { value: 'createdAt:asc', label: 'Oldest first' },
  { value: 'name:asc', label: 'Name A-Z' },
  { value: 'name:desc', label: 'Name Z-A' },
  { value: 'sellingPrice:asc', label: 'Price low to high' },
  { value: 'sellingPrice:desc', label: 'Price high to low' },
  { value: 'stock:asc', label: 'Stock low to high' },
  { value: 'stock:desc', label: 'Stock high to low' },
];

/** The backend's active-flag filter (web parity - no draft/published enums). */
const STATUS_OPTIONS: readonly SelectOption[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active only' },
  { value: 'inactive', label: 'Inactive only' },
];

type StatusFilter = 'all' | 'active' | 'inactive';

/**
 * Products tab root: server-side search (name/SKU/description - exactly what
 * the backend matches), category + status filters, sort, infinite pagination
 * and pull-to-refresh. Categories for the filter come from the Step 11
 * Categories API (active only, like the web dropdown) - never duplicated or
 * hardcoded. All querying is server-side: no downloading the catalogue to
 * filter locally.
 */
export default function ProductsListScreen() {
  const { theme } = useTheme();
  const { hasPermission } = usePermissions();

  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 400);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sort, setSort] = useState<{ sortBy: ProductSortBy; sortOrder: SortOrder }>({
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [refreshing, setRefreshing] = useState(false);

  const search = debouncedSearch.trim();
  const canView = hasPermission('products.view');
  const canCreate = hasPermission('products.create');

  const categoriesQuery = useCategoriesList();
  const categoryOptions = useMemo<SelectOption[]>(
    () => [
      { value: '', label: 'All categories' },
      ...(categoriesQuery.data ?? [])
        .filter((category) => category.isActive)
        .map((category) => ({ value: category.id, label: category.name })),
    ],
    [categoriesQuery.data],
  );

  const filters: ProductListFilters = useMemo(
    () => ({
      category: categoryFilter || undefined,
      isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
      ...sort,
    }),
    [categoryFilter, statusFilter, sort],
  );
  const productsQuery = useProductsInfinite(filters, search);

  const hasCriteria = statusFilter !== 'all' || categoryFilter !== '' || search.length > 0;

  // Flatten pages while de-duplicating ids so a page fetched during a
  // refresh can never render a product twice.
  const products = useMemo(() => {
    const seen = new Set<string>();
    const list: Product[] = [];
    for (const page of productsQuery.data?.pages ?? []) {
      for (const product of page.items) {
        if (!seen.has(product.id)) {
          seen.add(product.id);
          list.push(product);
        }
      }
    }
    return list;
  }, [productsQuery.data]);

  const handleRefresh = async () => {
    if (productsQuery.isFetching) return; // never race an in-flight request
    setRefreshing(true);
    try {
      await productsQuery.refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const handleEndReached = () => {
    if (productsQuery.hasNextPage && !productsQuery.isFetching) {
      void productsQuery.fetchNextPage();
    }
  };

  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split(':') as [ProductSortBy, SortOrder];
    setSort({ sortBy, sortOrder });
  };

  const resetCriteria = () => {
    setSearchInput('');
    setCategoryFilter('');
    setStatusFilter('all');
  };

  const header = (
    <AppHeader
      variant="feature"
      title="Products"
      actions={
        canCreate ? (
          <IconButton
            icon="add-outline"
            accessibilityLabel="Add product"
            onPress={() => router.push('/products/new')}
          />
        ) : null
      }
    />
  );

  if (!canView) {
    return (
      <Screen>
        {header}
        <ErrorState title="Access denied" message="You don't have permission to view products." />
      </Screen>
    );
  }

  let content: ReactNode;
  if (productsQuery.isPending && products.length === 0) {
    content = <ProductListSkeleton />;
  } else if (productsQuery.isError && products.length === 0) {
    content = (
      <ErrorState
        title="Failed to load products"
        message={getErrorMessage(productsQuery.error)}
        onRetry={() => void productsQuery.refetch()}
        retryLabel="Retry"
      />
    );
  } else {
    content = (
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ProductCard product={item} onPress={(id) => router.push(`/products/${id}`)} />
        )}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void handleRefresh()}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
        ListEmptyComponent={
          hasCriteria ? (
            <EmptyState
              icon="search-outline"
              title="No products match"
              description="Try a different search or clear the applied filters."
              actionLabel="Clear filters"
              onAction={resetCriteria}
            />
          ) : (
            <EmptyState
              icon="cube-outline"
              title="No products yet"
              description="Add your first product to start selling."
              actionLabel={canCreate ? 'Add product' : undefined}
              onAction={canCreate ? () => router.push('/products/new') : undefined}
            />
          )
        }
        ListFooterComponent={
          productsQuery.hasNextPage && productsQuery.isFetchingNextPage ? <LoadingMore /> : null
        }
      />
    );
  }

  return (
    <Screen scroll={false} padded={false}>
      {header}
      <View style={styles.toolbar}>
        <SearchInput
          value={searchInput}
          onValueChange={setSearchInput}
          placeholder="Search name, SKU or description"
          accessibilityLabel="Search products by name, SKU or description"
        />
        <View style={styles.controlsRow}>
          <View style={styles.control}>
            <Select
              value={categoryFilter}
              options={categoryOptions}
              onChange={setCategoryFilter}
              placeholder="All categories"
            />
          </View>
          <View style={styles.control}>
            <Select
              value={statusFilter}
              options={STATUS_OPTIONS}
              onChange={(value) => setStatusFilter(value as StatusFilter)}
            />
          </View>
        </View>
        <Select
          value={`${filters.sortBy}:${filters.sortOrder}`}
          options={SORT_OPTIONS}
          onChange={handleSortChange}
        />
      </View>

      <View style={styles.content}>{content}</View>
    </Screen>
  );
}

function LoadingMore() {
  return (
    <View style={styles.loadingMore}>
      <LoadingIndicator label="Loading more products..." />
    </View>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  control: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  listContent: {
    flexGrow: 1, // lets pull-to-refresh work on an empty list
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  loadingMore: { paddingVertical: spacing.sm },
});
