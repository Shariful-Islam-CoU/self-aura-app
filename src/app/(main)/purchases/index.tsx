import { useMemo, useState, type ReactNode } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { getErrorMessage } from '@/api';
import { EmptyState, ErrorState, LoadingIndicator } from '@/components/feedback';
import { AppHeader, Screen } from '@/components/layout';
import { IconButton, SearchInput, Select, type SelectOption } from '@/components/ui';
import {
  PurchaseCard,
  PurchaseListSkeleton,
  PurchaseStatsSection,
} from '@/features/purchases/components';
import { usePurchasesInfinite, usePurchaseStats } from '@/features/purchases/queries';
import type {
  Purchase,
  PurchaseListFilters,
  PurchaseSortBy,
  SortOrder,
} from '@/features/purchases/types';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { usePermissions } from '@/hooks/usePermissions';
import { useTheme } from '@/providers';
import { spacing } from '@/theme';
import {
  PURCHASE_SORT_LABELS,
  PURCHASE_STATUS_OPTIONS,
  type PurchaseStatusFilter,
} from '@/features/purchases/labels';

/** Sort options mapped to the backend's `sortBy`/`sortOrder` pair. */
const SORT_OPTIONS: readonly SelectOption[] = [
  { value: 'createdAt:desc', label: PURCHASE_SORT_LABELS['createdAt:desc'] },
  { value: 'createdAt:asc', label: PURCHASE_SORT_LABELS['createdAt:asc'] },
  { value: 'purchaseDate:desc', label: PURCHASE_SORT_LABELS['purchaseDate:desc'] },
  { value: 'purchaseDate:asc', label: PURCHASE_SORT_LABELS['purchaseDate:asc'] },
  { value: 'total:desc', label: PURCHASE_SORT_LABELS['total:desc'] },
  { value: 'total:asc', label: PURCHASE_SORT_LABELS['total:asc'] },
  { value: 'purchaseNumber:desc', label: PURCHASE_SORT_LABELS['purchaseNumber:desc'] },
  { value: 'purchaseNumber:asc', label: PURCHASE_SORT_LABELS['purchaseNumber:asc'] },
];

/**
 * Purchases list (More > Operations): server-side search (purchase number),
 * status/supplier/date filters, sort, infinite pagination and
 * pull-to-refresh, plus the backend-computed purchase statistics strip when
 * the user has `reports.purchases` permission. Every request goes through
 * TanStack Query with the filters baked into the key, so cache entries are
 * never mixed up between filter combinations.
 */
export default function PurchasesListScreen() {
  const { hasPermission } = usePermissions();
  const { theme } = useTheme();
  const canViewPurchases = hasPermission('purchases.view');
  const canCreate = hasPermission('purchases.create');
  const canViewStats = hasPermission('reports.purchases');

  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 400);
  const [statusFilter, setStatusFilter] = useState<PurchaseStatusFilter>('all');
  const [supplierFilter, setSupplierFilter] = useState<string>('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sort, setSort] = useState<{
    sortBy: PurchaseSortBy;
    sortOrder: SortOrder;
  }>({ sortBy: 'createdAt', sortOrder: 'desc' });
  const [refreshing, setRefreshing] = useState(false);

  const search = debouncedSearch.trim();
  const filters: PurchaseListFilters = useMemo(
    () => ({
      status: statusFilter === 'all' ? undefined : statusFilter,
      supplier: supplierFilter || undefined,
      from: fromDate || undefined,
      to: toDate || undefined,
      ...sort,
    }),
    [statusFilter, supplierFilter, fromDate, toDate, sort],
  );
  const purchasesQuery = usePurchasesInfinite(filters, search);
  const statsQuery = usePurchaseStats(canViewStats);

  const hasCriteria =
    statusFilter !== 'all' ||
    search.length > 0 ||
    supplierFilter.length > 0 ||
    fromDate.length > 0 ||
    toDate.length > 0;

  // Flatten pages while de-duplicating ids so a page fetched during a
  // refresh can never render a purchase twice.
  const purchases = useMemo(() => {
    const seen = new Set<string>();
    const list: Purchase[] = [];
    for (const page of purchasesQuery.data?.pages ?? []) {
      for (const purchase of page.purchases) {
        if (!seen.has(purchase.id)) {
          seen.add(purchase.id);
          list.push(purchase);
        }
      }
    }
    return list;
  }, [purchasesQuery.data]);

  const handleRefresh = async () => {
    if (purchasesQuery.isFetching) return;
    setRefreshing(true);
    try {
      await Promise.allSettled([purchasesQuery.refetch(), statsQuery.refetch()]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleEndReached = () => {
    if (purchasesQuery.hasNextPage && !purchasesQuery.isFetching) {
      void purchasesQuery.fetchNextPage();
    }
  };

  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split(':') as [PurchaseSortBy, SortOrder];
    setSort({ sortBy, sortOrder });
  };

  const resetCriteria = () => {
    setSearchInput('');
    setStatusFilter('all');
    setSupplierFilter('');
    setFromDate('');
    setToDate('');
  };

  const header = (
    <AppHeader
      variant="feature"
      title="Purchases"
      actions={
        canCreate ? (
          <IconButton
            icon="add-outline"
            accessibilityLabel="Add purchase"
            onPress={() => router.push('/purchases/new')}
          />
        ) : null
      }
    />
  );

  if (!canViewPurchases) {
    return (
      <Screen>
        {header}
        <ErrorState title="Access denied" message="You don't have permission to view purchases." />
      </Screen>
    );
  }

  const statsHeader =
    canViewStats && statsQuery.data ? (
      <View style={styles.stats}>
        <PurchaseStatsSection totals={statsQuery.data.totals} />
      </View>
    ) : null;

  let content: ReactNode;
  if (purchasesQuery.isPending && purchases.length === 0) {
    content = <PurchaseListSkeleton />;
  } else if (purchasesQuery.isError && purchases.length === 0) {
    content = (
      <ErrorState
        title="Failed to load purchases"
        message={getErrorMessage(purchasesQuery.error)}
        onRetry={() => void purchasesQuery.refetch()}
        retryLabel="Retry"
      />
    );
  } else {
    content = (
      <FlatList
        data={purchases}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PurchaseCard purchase={item} onPress={(id) => router.push(`/purchases/${id}`)} />
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
              title="No purchases match"
              description="Try a different search or clear the applied filters."
              actionLabel="Clear filters"
              onAction={resetCriteria}
            />
          ) : (
            <EmptyState
              icon="bag-outline"
              title="No purchases yet"
              description="Purchases appear here as soon as they are recorded."
              actionLabel={canCreate ? 'Create purchase' : undefined}
              onAction={canCreate ? () => router.push('/purchases/new') : undefined}
            />
          )
        }
        ListFooterComponent={
          purchasesQuery.hasNextPage && purchasesQuery.isFetchingNextPage ? <LoadingMore /> : null
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
          placeholder="Search purchase number"
          accessibilityLabel="Search purchases by purchase number"
        />
        <View style={styles.controlsRow}>
          <View style={styles.control}>
            <Select
              value={statusFilter}
              options={PURCHASE_STATUS_OPTIONS}
              onChange={(value) => setStatusFilter(value as PurchaseStatusFilter)}
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
      <LoadingIndicator label="Loading more purchases..." />
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
    flexGrow: 1,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  loadingMore: { paddingVertical: spacing.sm },
});
