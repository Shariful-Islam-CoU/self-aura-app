import { useMemo, useState, type ReactNode } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { getErrorMessage } from '@/api';
import { EmptyState, ErrorState, LoadingIndicator } from '@/components/feedback';
import { AppHeader, Screen } from '@/components/layout';
import { IconButton, SearchInput, Select, type SelectOption } from '@/components/ui';
import {
  EMPTY_EXPENSE_FILTERS,
  ExpenseCard,
  ExpenseFiltersSheet,
  ExpenseListSkeleton,
  ExpenseSummarySection,
  type ExpenseFilterValues,
} from '@/features/expenses/components';
import { EXPENSE_SORT_LABELS } from '@/features/expenses/labels';
import {
  flattenExpenses,
  useExpenseCategoryLookup,
  useExpensesInfinite,
  useExpenseSummary,
} from '@/features/expenses/queries';
import type {
  ExpenseListFilters,
  ExpensePaymentMethod,
  ExpenseSortBy,
  ExpenseSummaryParams,
  SortOrder,
} from '@/features/expenses/types';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { usePermissions } from '@/hooks/usePermissions';
import { useTheme } from '@/providers';
import { spacing } from '@/theme';

/** Sort options mapped to the backend's `sortBy`/`sortOrder` pair. */
const SORT_OPTIONS: readonly SelectOption[] = [
  { value: 'expenseDate:desc', label: EXPENSE_SORT_LABELS['expenseDate:desc'] },
  { value: 'expenseDate:asc', label: EXPENSE_SORT_LABELS['expenseDate:asc'] },
  { value: 'createdAt:desc', label: EXPENSE_SORT_LABELS['createdAt:desc'] },
  { value: 'createdAt:asc', label: EXPENSE_SORT_LABELS['createdAt:asc'] },
  { value: 'amount:desc', label: EXPENSE_SORT_LABELS['amount:desc'] },
  { value: 'amount:asc', label: EXPENSE_SORT_LABELS['amount:asc'] },
  { value: 'expenseNumber:desc', label: EXPENSE_SORT_LABELS['expenseNumber:desc'] },
  { value: 'expenseNumber:asc', label: EXPENSE_SORT_LABELS['expenseNumber:asc'] },
];

/**
 * Expenses list (More > Operations): server-side search
 * (number/title/description/reference), category/payment-method/date-range
 * filters, sort, infinite pagination and pull-to-refresh, plus the
 * backend-computed expense summary when the user has `reports.expenses`.
 * Every request goes through TanStack Query with the filters baked into the
 * key, so cache entries are never mixed up between filter combinations and
 * all filtering/sorting happens on the server.
 */
export default function ExpensesListScreen() {
  const { hasPermission, hasAnyPermission } = usePermissions();
  const { theme } = useTheme();
  const canViewExpenses = hasPermission('expenses.view');
  const canCreate = hasPermission('expenses.create');
  const canManageCategories = hasAnyPermission(['expenses.create', 'expenses.edit']);
  const canViewSummary = hasPermission('reports.expenses');

  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 400);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<ExpensePaymentMethod | ''>('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sort, setSort] = useState<{ sortBy: ExpenseSortBy; sortOrder: SortOrder }>({
    sortBy: 'expenseDate',
    sortOrder: 'desc',
  });
  const [refreshing, setRefreshing] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState<ExpenseFilterValues>(EMPTY_EXPENSE_FILTERS);

  const search = debouncedSearch.trim();

  const filters: ExpenseListFilters = useMemo(
    () => ({
      category: categoryFilter || undefined,
      paymentMethod: paymentMethodFilter || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      ...sort,
    }),
    [categoryFilter, paymentMethodFilter, fromDate, toDate, sort],
  );

  const summaryParams: ExpenseSummaryParams = useMemo(
    () => ({
      category: categoryFilter || undefined,
      paymentMethod: paymentMethodFilter || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
    }),
    [categoryFilter, paymentMethodFilter, fromDate, toDate],
  );

  const expensesQuery = useExpensesInfinite(filters, search);
  const summaryQuery = useExpenseSummary(summaryParams, canViewSummary);
  const categoryQuery = useExpenseCategoryLookup(undefined, canViewExpenses);

  const expenses = useMemo(() => flattenExpenses(expensesQuery.data?.pages), [expensesQuery.data]);

  const categoryFilterOptions = useMemo(() => {
    const options = (categoryQuery.data ?? []).map((category) => ({
      value: category.id,
      label: category.name,
    }));
    return [{ value: '', label: 'All categories' }, ...options];
  }, [categoryQuery.data]);

  const activeFilterCount = [categoryFilter, paymentMethodFilter, fromDate, toDate].filter(
    Boolean,
  ).length;
  const hasCriteria = search.length > 0 || activeFilterCount > 0;

  const handleRefresh = async () => {
    if (expensesQuery.isFetching) return;
    setRefreshing(true);
    try {
      await Promise.allSettled([
        expensesQuery.refetch(),
        canViewSummary ? summaryQuery.refetch() : Promise.resolve(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleEndReached = () => {
    if (expensesQuery.hasNextPage && !expensesQuery.isFetching) {
      void expensesQuery.fetchNextPage();
    }
  };

  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split(':') as [ExpenseSortBy, SortOrder];
    setSort({ sortBy, sortOrder });
  };

  const openFilters = () => {
    setDraftFilters({
      category: categoryFilter,
      paymentMethod: paymentMethodFilter,
      fromDate,
      toDate,
    });
    setFiltersOpen(true);
  };

  const applyFilters = (next: ExpenseFilterValues) => {
    setCategoryFilter(next.category);
    setPaymentMethodFilter(next.paymentMethod);
    setFromDate(next.fromDate);
    setToDate(next.toDate);
    setFiltersOpen(false);
  };

  const resetCriteria = () => {
    setSearchInput('');
    setCategoryFilter('');
    setPaymentMethodFilter('');
    setFromDate('');
    setToDate('');
  };

  const header = (
    <AppHeader
      variant="feature"
      title="Expenses"
      actions={
        <>
          {canManageCategories ? (
            <IconButton
              icon="pricetags-outline"
              accessibilityLabel="Manage expense categories"
              onPress={() => router.push('/expenses/categories')}
            />
          ) : null}
          {canCreate ? (
            <IconButton
              icon="add-outline"
              accessibilityLabel="Add expense"
              onPress={() => router.push('/expenses/new')}
            />
          ) : null}
        </>
      }
    />
  );

  if (!canViewExpenses) {
    return (
      <Screen>
        {header}
        <ErrorState title="Access denied" message="You don't have permission to view expenses." />
      </Screen>
    );
  }

  const summaryHeader =
    canViewSummary && summaryQuery.data ? (
      <View style={styles.stats}>
        <ExpenseSummarySection summary={summaryQuery.data} />
      </View>
    ) : null;

  let content: ReactNode;
  if (expensesQuery.isPending && expenses.length === 0) {
    content = <ExpenseListSkeleton />;
  } else if (expensesQuery.isError && expenses.length === 0) {
    content = (
      <ErrorState
        title="Failed to load expenses"
        message={getErrorMessage(expensesQuery.error)}
        onRetry={() => void expensesQuery.refetch()}
        retryLabel="Retry"
      />
    );
  } else {
    content = (
      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ExpenseCard expense={item} onPress={(id) => router.push(`/expenses/${id}`)} />
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
              title="No expenses match"
              description="Try a different search or clear the applied filters."
              actionLabel="Clear filters"
              onAction={resetCriteria}
            />
          ) : (
            <EmptyState
              icon="document-text-outline"
              title="No expenses yet"
              description="Recorded expenses appear here with backend-computed totals."
              actionLabel={canCreate ? 'Add expense' : undefined}
              onAction={canCreate ? () => router.push('/expenses/new') : undefined}
            />
          )
        }
        ListFooterComponent={
          expensesQuery.hasNextPage && expensesQuery.isFetchingNextPage ? <LoadingMore /> : null
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
          placeholder="Search number, title or reference"
          accessibilityLabel="Search expenses by number, title or reference"
        />
        <View style={styles.controlsRow}>
          <View style={styles.control}>
            <Select
              value={`${filters.sortBy}:${filters.sortOrder}`}
              options={SORT_OPTIONS}
              onChange={handleSortChange}
            />
          </View>
          <IconButton
            icon="options-outline"
            accessibilityLabel={
              activeFilterCount > 0
                ? `Filter expenses (${activeFilterCount} active)`
                : 'Filter expenses'
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

      <ExpenseFiltersSheet
        visible={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        value={draftFilters}
        onValueChange={setDraftFilters}
        onApply={applyFilters}
        categoryOptions={categoryFilterOptions}
        categoriesLoading={categoryQuery.isPending}
      />
    </Screen>
  );
}

function LoadingMore() {
  return (
    <View style={styles.loadingMore}>
      <LoadingIndicator label="Loading more expenses..." />
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
