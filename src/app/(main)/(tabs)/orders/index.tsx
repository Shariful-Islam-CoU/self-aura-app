import { useMemo, useState, type ReactNode } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { getErrorMessage } from '@/api';
import { EmptyState, ErrorState, LoadingIndicator } from '@/components/feedback';
import { AppHeader, Screen } from '@/components/layout';
import { Button, IconButton, SearchInput, Select, type SelectOption } from '@/components/ui';
import {
  OrderCard,
  OrderFiltersSheet,
  OrderListSkeleton,
  type OrderFilterValues,
} from '@/features/orders/components';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useOrdersInfinite } from '@/features/orders/queries';
import type { Order, OrderListFilters, OrderSortBy, SortOrder } from '@/features/orders/types';
import { usePermissions } from '@/hooks/usePermissions';
import { useTheme } from '@/providers';
import { spacing } from '@/theme';

/** Sort options mapped to the backend's `sortBy`/`sortOrder` pair. */
const SORT_OPTIONS: readonly SelectOption[] = [
  { value: 'createdAt:desc', label: 'Newest first' },
  { value: 'createdAt:asc', label: 'Oldest first' },
  { value: 'total:desc', label: 'Highest amount' },
  { value: 'total:asc', label: 'Lowest amount' },
];

/**
 * Orders tab root: server-side search (order number only - that is what the
 * backend matches), filter bottom sheet, sort, infinite pagination and
 * pull-to-refresh. Every request goes through TanStack Query with the
 * filters baked into the key, so cache entries are never mixed up between
 * filter combinations and switching filters keeps the old page visible
 * while the new one loads.
 */
export default function OrdersListScreen() {
  const { hasPermission } = usePermissions();
  const { theme } = useTheme();
  const canViewOrders = hasPermission('orders.view');
  const canCreateOrder = hasPermission('orders.create');

  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 400);
  const [filterValues, setFilterValues] = useState<OrderFilterValues>({});
  // Sheet working copy: reset from the applied filters on every open so it
  // can never hold stale state between visits.
  const [draftFilters, setDraftFilters] = useState<OrderFilterValues>({});
  const [sort, setSort] = useState<{
    sortBy: OrderSortBy;
    sortOrder: SortOrder;
  }>({ sortBy: 'createdAt', sortOrder: 'desc' });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const search = debouncedSearch.trim();
  const filters: OrderListFilters = useMemo(
    () => ({ ...filterValues, ...sort }),
    [filterValues, sort],
  );
  const ordersQuery = useOrdersInfinite(filters, search);

  const activeFilterCount = [
    filterValues.status,
    filterValues.paymentStatus,
    filterValues.paymentMethod,
    filterValues.from,
    filterValues.to,
  ].filter(Boolean).length;
  const hasCriteria = activeFilterCount > 0 || search.length > 0;

  // Flatten pages while de-duplicating ids so a page fetched during a
  // refresh can never render an order twice.
  const orders = useMemo(() => {
    const seen = new Set<string>();
    const list: Order[] = [];
    for (const page of ordersQuery.data?.pages ?? []) {
      for (const order of page.orders) {
        if (!seen.has(order.id)) {
          seen.add(order.id);
          list.push(order);
        }
      }
    }
    return list;
  }, [ordersQuery.data]);

  const handleRefresh = async () => {
    if (ordersQuery.isFetching) return; // never race an in-flight request
    setRefreshing(true);
    try {
      await ordersQuery.refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const handleEndReached = () => {
    if (ordersQuery.hasNextPage && !ordersQuery.isFetching) {
      void ordersQuery.fetchNextPage();
    }
  };

  const handleSortChange = (value: string) => {
    if (value === 'createdAt:asc') {
      setSort({ sortBy: 'createdAt', sortOrder: 'asc' });
    } else if (value === 'total:desc') {
      setSort({ sortBy: 'total', sortOrder: 'desc' });
    } else if (value === 'total:asc') {
      setSort({ sortBy: 'total', sortOrder: 'asc' });
    } else {
      setSort({ sortBy: 'createdAt', sortOrder: 'desc' });
    }
  };

  const resetCriteria = () => {
    setSearchInput('');
    setFilterValues({});
  };

  const openFilters = () => {
    setDraftFilters(filterValues);
    setFiltersOpen(true);
  };

  const applyFilters = (next: OrderFilterValues) => {
    setFilterValues(next);
    setFiltersOpen(false);
  };

  const header = (
    <AppHeader
      variant="feature"
      title="Orders"
      actions={
        canCreateOrder ? (
          <IconButton
            icon="add-outline"
            accessibilityLabel="Create order"
            onPress={() => router.push('/orders/new')}
          />
        ) : null
      }
    />
  );

  if (!canViewOrders) {
    return (
      <Screen>
        {header}
        <ErrorState title="Access denied" message="You don't have permission to view orders." />
      </Screen>
    );
  }

  let content: ReactNode;
  if (ordersQuery.isPending && orders.length === 0) {
    content = <OrderListSkeleton />;
  } else if (ordersQuery.isError && orders.length === 0) {
    content = (
      <ErrorState
        title="Failed to load orders"
        message={getErrorMessage(ordersQuery.error)}
        onRetry={() => void ordersQuery.refetch()}
        retryLabel="Retry"
      />
    );
  } else {
    content = (
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <OrderCard order={item} onPress={(id) => router.push(`/orders/${id}`)} />
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
              title="No orders match"
              description="Try a different search or clear the applied filters."
              actionLabel="Clear filters"
              onAction={resetCriteria}
            />
          ) : (
            <EmptyState
              icon="receipt-outline"
              title="No orders yet"
              description="Orders will appear here as soon as they are placed."
              actionLabel={canCreateOrder ? 'Create order' : undefined}
              onAction={canCreateOrder ? () => router.push('/orders/new') : undefined}
            />
          )
        }
        ListFooterComponent={
          ordersQuery.hasNextPage && ordersQuery.isFetchingNextPage ? (
            <LoadingIndicator label="Loading more orders..." />
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
          onValueChange={setSearchInput}
          placeholder="Search order number"
          accessibilityLabel="Search orders by order number"
        />
        <View style={styles.filterRow}>
          <Button
            title={activeFilterCount > 0 ? `Filters (${activeFilterCount})` : 'Filters'}
            variant="outline"
            icon="options-outline"
            onPress={openFilters}
            accessibilityLabel={
              activeFilterCount > 0 ? `Open filters, ${activeFilterCount} applied` : 'Open filters'
            }
          />
          <View style={styles.sortWrap}>
            <Select
              value={`${filters.sortBy}:${filters.sortOrder}`}
              options={SORT_OPTIONS}
              onChange={handleSortChange}
            />
          </View>
        </View>
      </View>

      <View style={styles.content}>{content}</View>

      <OrderFiltersSheet
        visible={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        value={draftFilters}
        onValueChange={setDraftFilters}
        onApply={applyFilters}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sortWrap: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  listContent: {
    flexGrow: 1, // lets pull-to-refresh work on an empty list
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
});
