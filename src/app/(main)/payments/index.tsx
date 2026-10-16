import { useMemo, useState, type ReactNode } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { getErrorMessage } from '@/api';
import { EmptyState, ErrorState, LoadingIndicator } from '@/components/feedback';
import { AppHeader, Screen } from '@/components/layout';
import { IconButton, SearchInput, Select } from '@/components/ui';
import {
  EMPTY_PAYMENT_FILTERS,
  PaymentCard,
  PaymentFiltersSheet,
  PaymentListSkeleton,
  PaymentSummarySection,
  type PaymentFilterValues,
} from '@/features/payments/components';
import { PAYMENT_SORT_OPTIONS } from '@/features/payments/labels';
import {
  flattenPayments,
  usePaymentsInfinite,
  usePaymentSummary,
} from '@/features/payments/queries';
import type {
  PaymentListFilters,
  PaymentMethod,
  PaymentSortBy,
  PaymentStatus,
  PaymentSummaryParams,
  PaymentType,
  SortOrder,
} from '@/features/payments/types';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { usePermissions } from '@/hooks/usePermissions';
import { useTheme } from '@/providers';
import { spacing } from '@/theme';

/**
 * Payments list (More > Finance): server-side search (payment/reference/order
 * number), method/status/type/date-range filters, sort, infinite pagination and
 * pull-to-refresh, plus the backend-computed ledger summary
 * (`GET /payments/summary`). Every request goes through TanStack Query with the
 * filters baked into the key, so cache entries never mix between filter
 * combinations and all filtering/sorting happens on the server. Navigation
 * passes the payment id only - never a payment object.
 */
export default function PaymentsListScreen() {
  const { hasPermission } = usePermissions();
  const { theme } = useTheme();
  const canViewPayments = hasPermission('payments.view');
  const canCreate = hasPermission('payments.create');

  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 400);
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | ''>('');
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<PaymentType | ''>('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sort, setSort] = useState<{ sortBy: PaymentSortBy; sortOrder: SortOrder }>({
    sortBy: 'paymentDate',
    sortOrder: 'desc',
  });
  const [refreshing, setRefreshing] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState<PaymentFilterValues>(EMPTY_PAYMENT_FILTERS);

  const search = debouncedSearch.trim();

  const filters: PaymentListFilters = useMemo(
    () => ({
      paymentMethod: methodFilter || undefined,
      paymentStatus: statusFilter || undefined,
      paymentType: typeFilter || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      ...sort,
    }),
    [methodFilter, statusFilter, typeFilter, fromDate, toDate, sort],
  );

  const summaryParams: PaymentSummaryParams = useMemo(
    () => ({
      paymentMethod: methodFilter || undefined,
      paymentStatus: statusFilter || undefined,
      paymentType: typeFilter || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
    }),
    [methodFilter, statusFilter, typeFilter, fromDate, toDate],
  );

  const paymentsQuery = usePaymentsInfinite(filters, search, canViewPayments);
  const summaryQuery = usePaymentSummary(summaryParams, canViewPayments);

  const payments = useMemo(() => flattenPayments(paymentsQuery.data?.pages), [paymentsQuery.data]);

  const activeFilterCount = [methodFilter, statusFilter, typeFilter, fromDate, toDate].filter(
    Boolean,
  ).length;
  const hasCriteria = search.length > 0 || activeFilterCount > 0;

  const handleRefresh = async () => {
    if (paymentsQuery.isFetching) return;
    setRefreshing(true);
    try {
      await Promise.allSettled([paymentsQuery.refetch(), summaryQuery.refetch()]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleEndReached = () => {
    if (paymentsQuery.hasNextPage && !paymentsQuery.isFetching) {
      void paymentsQuery.fetchNextPage();
    }
  };

  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split(':') as [PaymentSortBy, SortOrder];
    setSort({ sortBy, sortOrder });
  };

  const openFilters = () => {
    setDraftFilters({
      paymentMethod: methodFilter,
      paymentStatus: statusFilter,
      paymentType: typeFilter,
      fromDate,
      toDate,
    });
    setFiltersOpen(true);
  };

  const applyFilters = (next: PaymentFilterValues) => {
    setMethodFilter(next.paymentMethod);
    setStatusFilter(next.paymentStatus);
    setTypeFilter(next.paymentType);
    setFromDate(next.fromDate);
    setToDate(next.toDate);
    setFiltersOpen(false);
  };

  const resetCriteria = () => {
    setSearchInput('');
    setMethodFilter('');
    setStatusFilter('');
    setTypeFilter('');
    setFromDate('');
    setToDate('');
  };

  const header = (
    <AppHeader
      variant="feature"
      title="Payments"
      actions={
        canCreate ? (
          <IconButton
            icon="add-outline"
            accessibilityLabel="Record payment"
            onPress={() => router.push('/payments/new')}
          />
        ) : null
      }
    />
  );

  if (!canViewPayments) {
    return (
      <Screen>
        {header}
        <ErrorState title="Access denied" message="You don't have permission to view payments." />
      </Screen>
    );
  }

  const summaryHeader = summaryQuery.data ? (
    <View style={styles.stats}>
      <PaymentSummarySection summary={summaryQuery.data} />
    </View>
  ) : null;

  let content: ReactNode;
  if (paymentsQuery.isPending && payments.length === 0) {
    content = <PaymentListSkeleton />;
  } else if (paymentsQuery.isError && payments.length === 0) {
    content = (
      <ErrorState
        title="Failed to load payments"
        message={getErrorMessage(paymentsQuery.error)}
        onRetry={() => void paymentsQuery.refetch()}
        retryLabel="Retry"
      />
    );
  } else {
    content = (
      <FlatList
        data={payments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PaymentCard payment={item} onPress={(id) => router.push(`/payments/${id}`)} />
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
        ListHeaderComponent={summaryHeader}
        ListEmptyComponent={
          hasCriteria ? (
            <EmptyState
              icon="search-outline"
              title="No payments match"
              description="Try a different search or clear the applied filters."
              actionLabel="Clear filters"
              onAction={resetCriteria}
            />
          ) : (
            <EmptyState
              icon="card-outline"
              title="No payments yet"
              description="Payments appear here with backend-computed ledger totals."
              actionLabel={canCreate ? 'Record payment' : undefined}
              onAction={canCreate ? () => router.push('/payments/new') : undefined}
            />
          )
        }
        ListFooterComponent={
          paymentsQuery.hasNextPage && paymentsQuery.isFetchingNextPage ? <LoadingMore /> : null
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
          placeholder="Search payment, reference or order"
          accessibilityLabel="Search payments by payment number, reference or order number"
        />
        <View style={styles.controlsRow}>
          <View style={styles.control}>
            <Select
              value={`${filters.sortBy}:${filters.sortOrder}`}
              options={PAYMENT_SORT_OPTIONS}
              onChange={handleSortChange}
            />
          </View>
          <IconButton
            icon="options-outline"
            accessibilityLabel={
              activeFilterCount > 0
                ? `Filter payments (${activeFilterCount} active)`
                : 'Filter payments'
            }
            onPress={openFilters}
          />
          {hasCriteria ? (
            <IconButton
              icon="close-circle-outline"
              accessibilityLabel="Clear search and filters"
              onPress={resetCriteria}
            />
          ) : null}
        </View>
      </View>

      <View style={styles.content}>{content}</View>

      <PaymentFiltersSheet
        visible={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        value={draftFilters}
        onValueChange={setDraftFilters}
        onApply={applyFilters}
      />
    </Screen>
  );
}

function LoadingMore() {
  return (
    <View style={styles.loadingMore}>
      <LoadingIndicator label="Loading more payments..." />
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