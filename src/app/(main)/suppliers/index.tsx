import { useMemo, useState, type ReactNode } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { getErrorMessage } from '@/api';
import { EmptyState, ErrorState, LoadingIndicator } from '@/components/feedback';
import { AppHeader, Screen } from '@/components/layout';
import { IconButton, SearchInput, Select, type SelectOption } from '@/components/ui';
import {
  SupplierCard,
  SupplierListSkeleton,
  SupplierPurchaseSummarySection,
} from '@/features/suppliers/components';
import { useSuppliersInfinite, useSupplierPurchaseStats } from '@/features/suppliers/queries';
import type {
  Supplier,
  SupplierListFilters,
  SupplierSortBy,
  SortOrder,
} from '@/features/suppliers/types';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { usePermissions } from '@/hooks/usePermissions';
import { useTheme } from '@/providers';
import { spacing } from '@/theme';
import {
  SUPPLIER_SORT_LABELS,
  SUPPLIER_STATUS_OPTIONS,
  type SupplierStatusFilter,
} from '@/features/suppliers/labels';

/** Sort options mapped to the backend's `sortBy`/`sortOrder` pair. */
const SORT_OPTIONS: readonly SelectOption[] = [
  { value: 'createdAt:desc', label: SUPPLIER_SORT_LABELS['createdAt:desc'] },
  { value: 'createdAt:asc', label: SUPPLIER_SORT_LABELS['createdAt:asc'] },
  { value: 'name:asc', label: SUPPLIER_SORT_LABELS['name:asc'] },
  { value: 'name:desc', label: SUPPLIER_SORT_LABELS['name:desc'] },
  { value: 'phone:asc', label: SUPPLIER_SORT_LABELS['phone:asc'] },
  { value: 'phone:desc', label: SUPPLIER_SORT_LABELS['phone:desc'] },
];

/**
 * Suppliers list (More > Operations): server-side search (name/phone/email - exactly what
 * the backend matches), status filter, sort, infinite pagination and
 * pull-to-refresh, plus the backend-computed purchase statistics strip when
 * the user has `reports.purchases` permission. Every request goes through
 * TanStack Query with the filters baked into the key, so cache entries are
 * never mixed up between filter combinations.
 */
export default function SuppliersListScreen() {
  const { hasPermission } = usePermissions();
  const { theme } = useTheme();
  const canViewSuppliers = hasPermission('suppliers.view');
  const canCreate = hasPermission('suppliers.create');
  const canViewStats = hasPermission('reports.purchases');

  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 400);
  const [statusFilter, setStatusFilter] = useState<SupplierStatusFilter>('all');
  const [sort, setSort] = useState<{
    sortBy: SupplierSortBy;
    sortOrder: SortOrder;
  }>({ sortBy: 'createdAt', sortOrder: 'desc' });
  const [refreshing, setRefreshing] = useState(false);

  const search = debouncedSearch.trim();
  const filters: SupplierListFilters = useMemo(
    () => ({
      isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
      ...sort,
    }),
    [statusFilter, sort],
  );
  const suppliersQuery = useSuppliersInfinite(filters, search);
  const statsQuery = useSupplierPurchaseStats(
    undefined,
    canViewStats && !search && statusFilter === 'all',
  );

  const hasCriteria = statusFilter !== 'all' || search.length > 0;

  // Flatten pages while de-duplicating ids so a page fetched during a
  // refresh can never render a supplier twice.
  const suppliers = useMemo(() => {
    const seen = new Set<string>();
    const list: Supplier[] = [];
    for (const page of suppliersQuery.data?.pages ?? []) {
      for (const supplier of page.suppliers) {
        if (!seen.has(supplier.id)) {
          seen.add(supplier.id);
          list.push(supplier);
        }
      }
    }
    return list;
  }, [suppliersQuery.data]);

  const handleRefresh = async () => {
    if (suppliersQuery.isFetching) return; // never race an in-flight request
    setRefreshing(true);
    try {
      await Promise.allSettled([suppliersQuery.refetch(), statsQuery.refetch()]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleEndReached = () => {
    if (suppliersQuery.hasNextPage && !suppliersQuery.isFetching) {
      void suppliersQuery.fetchNextPage();
    }
  };

  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split(':') as [SupplierSortBy, SortOrder];
    setSort({ sortBy, sortOrder });
  };

  const resetCriteria = () => {
    setSearchInput('');
    setStatusFilter('all');
  };

  const header = (
    <AppHeader
      variant="feature"
      title="Suppliers"
      actions={
        canCreate ? (
          <IconButton
            icon="add-outline"
            accessibilityLabel="Add supplier"
            onPress={() => router.push('/suppliers/new')}
          />
        ) : null
      }
    />
  );

  if (!canViewSuppliers) {
    return (
      <Screen>
        {header}
        <ErrorState title="Access denied" message="You don't have permission to view suppliers." />
      </Screen>
    );
  }

  const statsHeader =
    canViewStats && statsQuery.data ? (
      <View style={styles.stats}>
        <SupplierPurchaseSummarySection stats={statsQuery.data} />
      </View>
    ) : null;

  let content: ReactNode;
  if (suppliersQuery.isPending && suppliers.length === 0) {
    content = <SupplierListSkeleton />;
  } else if (suppliersQuery.isError && suppliers.length === 0) {
    content = (
      <ErrorState
        title="Failed to load suppliers"
        message={getErrorMessage(suppliersQuery.error)}
        onRetry={() => void suppliersQuery.refetch()}
        retryLabel="Retry"
      />
    );
  } else {
    content = (
      <FlatList
        data={suppliers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SupplierCard supplier={item} onPress={(id) => router.push(`/suppliers/${id}`)} />
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
        ListHeaderComponent={statsHeader}
        ListEmptyComponent={
          hasCriteria ? (
            <EmptyState
              icon="search-outline"
              title="No suppliers match"
              description="Try a different search or clear the applied filters."
              actionLabel="Clear filters"
              onAction={resetCriteria}
            />
          ) : (
            <EmptyState
              icon="business-outline"
              title="No suppliers yet"
              description="Suppliers appear here as soon as they are added."
              actionLabel={canCreate ? 'Add supplier' : undefined}
              onAction={canCreate ? () => router.push('/suppliers/new') : undefined}
            />
          )
        }
        ListFooterComponent={
          suppliersQuery.hasNextPage && suppliersQuery.isFetchingNextPage ? <LoadingMore /> : null
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
          placeholder="Search name, phone or email"
          accessibilityLabel="Search suppliers by name, phone or email"
        />
        <View style={styles.controlsRow}>
          <View style={styles.control}>
            <Select
              value={statusFilter}
              options={SUPPLIER_STATUS_OPTIONS}
              onChange={(value) => setStatusFilter(value as SupplierStatusFilter)}
            />
          </View>
          <View style={styles.control}>
            <Select
              value={`${filters.sortBy}:${filters.sortOrder}`}
              options={SORT_OPTIONS}
              onChange={handleSortChange}
            />
          </View>
        </View>
      </View>

      <View style={styles.content}>{content}</View>
    </Screen>
  );
}

function LoadingMore() {
  return (
    <View style={styles.loadingMore}>
      <LoadingIndicator label="Loading more suppliers..." />
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
  stats: { marginBottom: spacing.lg },
  listContent: {
    flexGrow: 1, // lets pull-to-refresh work on an empty list
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  loadingMore: { paddingVertical: spacing.sm },
});
