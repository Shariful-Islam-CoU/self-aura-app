import { useMemo, useState, type ReactNode } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { getErrorMessage } from '@/api';
import { EmptyState, ErrorState, LoadingIndicator } from '@/components/feedback';
import { AppHeader, Screen } from '@/components/layout';
import { SearchInput, Select, type SelectOption } from '@/components/ui';
import { useCategoriesList } from '@/features/categories/queries';
import {
  InventoryCard,
  InventoryListSkeleton,
  InventorySummarySection,
} from '@/features/inventory/components';
import {
  useInventoryList,
  useInventoryTotals,
  useLowStockInventory,
} from '@/features/inventory/queries';
import type {
  InventoryListStatusFilter,
  Product,
  ProductListFilters,
  ProductSortBy,
  SortOrder,
} from '@/features/inventory/types';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { usePermissions } from '@/hooks/usePermissions';
import { useTheme } from '@/providers';
import { spacing } from '@/theme';

/** Sort options mapped to the backend's `sortBy`/`sortOrder` pair. */
const SORT_OPTIONS: readonly SelectOption[] = [
  { value: 'createdAt:desc', label: 'Newest first' },
  { value: 'createdAt:asc', label: 'Oldest first' },
  { value: 'stock:asc', label: 'Stock low to high' },
  { value: 'stock:desc', label: 'Stock high to low' },
  { value: 'name:asc', label: 'Name A-Z' },
  { value: 'name:desc', label: 'Name Z-A' },
];

/** Web `InventoryListStatusFilter` labels - `low_stock` swaps the source. */
const STATUS_OPTIONS: readonly SelectOption[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active products' },
  { value: 'inactive', label: 'Inactive products' },
  { value: 'low_stock', label: 'Low stock products' },
];

/**
 * Inventory list (More -> Operations -> Inventory). Web parity: the list
 * IS the shared `GET /products` endpoint (server-side search/category/
 * status/sort/pagination) while the `Low stock products` view switches to
 * `GET /inventory/low-stock` (all matches, no pagination, sorting off);
 * search or category input switches back to the full list, exactly like
 * the web page. The summary cards come from `GET /reports/inventory`
 * (backend-computed, gated by `reports.inventory`). No stock value is ever
 * calculated client-side.
 */
export default function InventoryListScreen() {
  const { theme } = useTheme();
  const { hasPermission } = usePermissions();

  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 400);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<InventoryListStatusFilter>('all');
  const [sort, setSort] = useState<{ sortBy: ProductSortBy; sortOrder: SortOrder }>({
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [refreshing, setRefreshing] = useState(false);

  const search = debouncedSearch.trim();
  const canView = hasPermission('inventory.view');
  const canSeeTotals = hasPermission('reports.inventory');
  const isLowStockMode = statusFilter === 'low_stock';

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
      isActive: statusFilter === 'all' || isLowStockMode ? undefined : statusFilter === 'active',
      ...sort,
    }),
    [categoryFilter, statusFilter, isLowStockMode, sort],
  );

  const listQuery = useInventoryList(filters, search, !isLowStockMode);
  const lowStockQuery = useLowStockInventory(isLowStockMode);
  const totalsQuery = useInventoryTotals(canView && canSeeTotals);

  const hasCriteria = statusFilter !== 'all' || categoryFilter !== '' || search.length > 0;

  // Flatten pages while de-duplicating ids so a page fetched during a
  // refresh can never render a product twice. The low-stock view is a
  // single unpaginated response.
  const products = useMemo(() => {
    if (isLowStockMode) return lowStockQuery.data ?? [];
    const seen = new Set<string>();
    const list: Product[] = [];
    for (const page of listQuery.data?.pages ?? []) {
      for (const product of page.items) {
        if (!seen.has(product.id)) {
          seen.add(product.id);
          list.push(product);
        }
      }
    }
    return list;
  }, [isLowStockMode, lowStockQuery.data, listQuery.data]);

  const isPending = isLowStockMode ? lowStockQuery.isPending : listQuery.isPending;
  const isError = isLowStockMode ? lowStockQuery.isError : listQuery.isError;
  const activeError = isLowStockMode ? lowStockQuery.error : listQuery.error;
  const refetchActive = () => (isLowStockMode ? lowStockQuery.refetch() : listQuery.refetch());

  const handleRefresh = async () => {
    if (listQuery.isFetching || lowStockQuery.isFetching) return; // never race an in-flight request
    setRefreshing(true);
    try {
      await refetchActive();
      if (canSeeTotals) await totalsQuery.refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const handleEndReached = () => {
    if (isLowStockMode) return; // low-stock view is intentionally unpaginated
    if (listQuery.hasNextPage && !listQuery.isFetching) {
      void listQuery.fetchNextPage();
    }
  };

  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split(':') as [ProductSortBy, SortOrder];
    setSort({ sortBy, sortOrder });
  };

  // Web parity: typing a search or picking a category leaves the low-stock
  // view (which ignores both) and returns to the full server-side list.
  const handleSearchChange = (value: string) => {
    if (isLowStockMode) setStatusFilter('all');
    setSearchInput(value);
  };

  const handleCategoryChange = (value: string) => {
    if (isLowStockMode) setStatusFilter('all');
    setCategoryFilter(value);
  };

  const resetCriteria = () => {
    setSearchInput('');
    setCategoryFilter('');
    setStatusFilter('all');
  };

  const header = <AppHeader variant="feature" title="Inventory" />;

  if (!canView) {
    return (
      <Screen>
        {header}
        <ErrorState title="Access denied" message="You don't have permission to view inventory." />
      </Screen>
    );
  }

  const summary = canSeeTotals ? (
    <InventorySummarySection
      totals={totalsQuery.data}
      isLoading={totalsQuery.isPending}
      error={totalsQuery.isError ? getErrorMessage(totalsQuery.error) : null}
      onRetry={() => void totalsQuery.refetch()}
    />
  ) : null;

  let content: ReactNode;
  if (isPending && products.length === 0) {
    content = <InventoryListSkeleton />;
  } else if (isError && products.length === 0) {
    content = (
      <ErrorState
        title="Unable to load inventory."
        message={getErrorMessage(activeError)}
        onRetry={() => void refetchActive()}
        retryLabel="Try again"
      />
    );
  } else {
    content = (
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <InventoryCard product={item} onPress={(id) => router.push(`/inventory/${id}`)} />
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
        ListHeaderComponent={summary ? <View style={styles.summary}>{summary}</View> : null}
        ListEmptyComponent={
          isLowStockMode ? (
            <EmptyState
              icon="warning-outline"
              title="No low stock products."
              description="No active products are at or below their low-stock threshold."
              actionLabel="Show all products"
              onAction={resetCriteria}
            />
          ) : hasCriteria ? (
            <EmptyState
              icon="search-outline"
              title="No products found."
              description="Try adjusting or resetting your filters."
              actionLabel="Reset filters"
              onAction={resetCriteria}
            />
          ) : (
            <EmptyState
              icon="archive-outline"
              title="No products found."
              description="Add products to your catalog to manage their inventory here."
            />
          )
        }
        ListFooterComponent={
          !isLowStockMode && listQuery.hasNextPage && listQuery.isFetchingNextPage ? (
            <LoadingMore />
          ) : null
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
          onValueChange={handleSearchChange}
          placeholder="Search name, SKU or description"
          accessibilityLabel="Search inventory by name, SKU or description"
        />
        <View style={styles.controlsRow}>
          <View style={styles.control}>
            <Select
              value={categoryFilter}
              options={categoryOptions}
              onChange={handleCategoryChange}
              placeholder="All categories"
            />
          </View>
          <View style={styles.control}>
            <Select
              value={statusFilter}
              options={STATUS_OPTIONS}
              onChange={(value) => setStatusFilter(value as InventoryListStatusFilter)}
            />
          </View>
        </View>
        <Select
          value={`${filters.sortBy}:${filters.sortOrder}`}
          options={SORT_OPTIONS}
          onChange={handleSortChange}
          disabled={isLowStockMode}
          helperText={isLowStockMode ? 'Sorting is off in the low stock view' : null}
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
  summary: { marginBottom: spacing.md },
  listContent: {
    flexGrow: 1, // lets pull-to-refresh work on an empty list
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  loadingMore: { paddingVertical: spacing.sm },
});
