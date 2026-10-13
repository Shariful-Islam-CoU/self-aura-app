import { useMemo, useState, type ReactNode } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { getErrorMessage } from '@/api';
import { EmptyState, ErrorState, LoadingIndicator } from '@/components/feedback';
import { AppHeader, Screen } from '@/components/layout';
import { IconButton, SearchInput, Select, type SelectOption } from '@/components/ui';
import {
  CustomerCard,
  CustomerListSkeleton,
  CustomerStatsSection,
} from '@/features/customers/components';
import { useCustomersInfinite } from '@/features/customers/queries';
import type {
  Customer,
  CustomerListFilters,
  CustomerSortBy,
  SortOrder,
} from '@/features/customers/types';
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
];

/** The backend's only customer filter: the `isActive` flag. */
const STATUS_OPTIONS: readonly SelectOption[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active only' },
  { value: 'inactive', label: 'Inactive only' },
];

type StatusFilter = 'all' | 'active' | 'inactive';

/**
 * Customers tab root: server-side search (name/phone/email - exactly what
 * the backend matches), status filter, sort, infinite pagination and
 * pull-to-refresh, plus the backend-computed statistics strip. Every
 * request goes through TanStack Query with the filters baked into the key,
 * so cache entries are never mixed up between filter combinations.
 */
export default function CustomersListScreen() {
  const { hasPermission } = usePermissions();
  const { theme } = useTheme();
  const canViewCustomers = hasPermission('customers.view');
  const canCreate = hasPermission('customers.create');
  const canViewStats = hasPermission('reports.customers');

  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 400);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sort, setSort] = useState<{
    sortBy: CustomerSortBy;
    sortOrder: SortOrder;
  }>({ sortBy: 'createdAt', sortOrder: 'desc' });
  const [refreshing, setRefreshing] = useState(false);

  const search = debouncedSearch.trim();
  const filters: CustomerListFilters = useMemo(
    () => ({
      isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
      ...sort,
    }),
    [statusFilter, sort],
  );
  const customersQuery = useCustomersInfinite(filters, search);

  const hasCriteria = statusFilter !== 'all' || search.length > 0;

  // Flatten pages while de-duplicating ids so a page fetched during a
  // refresh can never render a customer twice.
  const customers = useMemo(() => {
    const seen = new Set<string>();
    const list: Customer[] = [];
    for (const page of customersQuery.data?.pages ?? []) {
      for (const customer of page.customers) {
        if (!seen.has(customer.id)) {
          seen.add(customer.id);
          list.push(customer);
        }
      }
    }
    return list;
  }, [customersQuery.data]);

  const handleRefresh = async () => {
    if (customersQuery.isFetching) return; // never race an in-flight request
    setRefreshing(true);
    try {
      await customersQuery.refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const handleEndReached = () => {
    if (customersQuery.hasNextPage && !customersQuery.isFetching) {
      void customersQuery.fetchNextPage();
    }
  };

  const handleSortChange = (value: string) => {
    if (value === 'createdAt:asc') {
      setSort({ sortBy: 'createdAt', sortOrder: 'asc' });
    } else if (value === 'name:asc') {
      setSort({ sortBy: 'name', sortOrder: 'asc' });
    } else if (value === 'name:desc') {
      setSort({ sortBy: 'name', sortOrder: 'desc' });
    } else {
      setSort({ sortBy: 'createdAt', sortOrder: 'desc' });
    }
  };

  const resetCriteria = () => {
    setSearchInput('');
    setStatusFilter('all');
  };

  const header = (
    <AppHeader
      variant="feature"
      title="Customers"
      actions={
        canCreate ? (
          <IconButton
            icon="add-outline"
            accessibilityLabel="Add customer"
            onPress={() => router.push('/customers/new')}
          />
        ) : null
      }
    />
  );

  if (!canViewCustomers) {
    return (
      <Screen>
        {header}
        <ErrorState title="Access denied" message="You don't have permission to view customers." />
      </Screen>
    );
  }

  const statsHeader = canViewStats ? (
    <View style={styles.stats}>
      <CustomerStatsSection />
    </View>
  ) : null;

  let content: ReactNode;
  if (customersQuery.isPending && customers.length === 0) {
    content = <CustomerListSkeleton />;
  } else if (customersQuery.isError && customers.length === 0) {
    content = (
      <ErrorState
        title="Failed to load customers"
        message={getErrorMessage(customersQuery.error)}
        onRetry={() => void customersQuery.refetch()}
        retryLabel="Retry"
      />
    );
  } else {
    content = (
      <FlatList
        data={customers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CustomerCard customer={item} onPress={(id) => router.push(`/customers/${id}`)} />
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
              title="No customers match"
              description="Try a different search or clear the applied filters."
              actionLabel="Clear filters"
              onAction={resetCriteria}
            />
          ) : (
            <EmptyState
              icon="people-outline"
              title="No customers yet"
              description="Customers appear here as soon as they are added."
              actionLabel={canCreate ? 'Add customer' : undefined}
              onAction={canCreate ? () => router.push('/customers/new') : undefined}
            />
          )
        }
        ListFooterComponent={
          customersQuery.hasNextPage && customersQuery.isFetchingNextPage ? <LoadingMore /> : null
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
          accessibilityLabel="Search customers by name, phone or email"
        />
        <View style={styles.controlsRow}>
          <View style={styles.control}>
            <Select
              value={statusFilter}
              options={STATUS_OPTIONS}
              onChange={(value) => setStatusFilter(value as StatusFilter)}
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
      <LoadingIndicator label="Loading more customers..." />
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
