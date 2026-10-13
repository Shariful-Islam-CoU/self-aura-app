import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';

import { dashboardKeys } from '@/features/dashboard/queries';

import { expenseCategoryService } from './services/expenseCategoryService';
import { expenseService } from './services/expenseService';
import type {
  CreateExpenseCategoryInput,
  CreateExpenseInput,
  Expense,
  ExpenseCategory,
  ExpenseCategoryListData,
  ExpenseCategoryListParams,
  ExpenseListData,
  ExpenseListFilters,
  ExpenseSummaryParams,
  UpdateExpenseCategoryInput,
  UpdateExpenseInput,
} from './types';

/** Backend caps `limit` at 100; 20 matches the backend default page size. */
export const EXPENSES_PAGE_SIZE = 20;
export const EXPENSE_CATEGORIES_PAGE_SIZE = 20;

/**
 * Query keys. Everything expense-related lives under 'expenses' so a mutation
 * can invalidate the whole group with a prefix match (expense lists, details,
 * summary and the category lookups/manager list), and each sub-key carries the
 * state that changes its response (filters/search/id/params) for automatic
 * dedupe. Category keys nest under 'expenses' so a category rename also
 * refreshes expense cards that render the category name.
 */
export const expensesKeys = {
  all: ['expenses'] as const,
  list: (filters: ExpenseListFilters, search: string) =>
    ['expenses', 'list', search, filters] as const,
  detail: (id: string) => ['expenses', 'detail', id] as const,
  summary: (params: ExpenseSummaryParams) => ['expenses', 'summary', params] as const,
  categories: ['expenses', 'categories'] as const,
  categoriesList: (params: ExpenseCategoryListParams) =>
    ['expenses', 'categories', 'list', params] as const,
  categoryLookup: (isActive: boolean | undefined) =>
    ['expenses', 'categories', 'lookup', isActive ?? 'all'] as const,
};

/**
 * Paginated expense list (page N + filters + debounced search in the key).
 * `placeholderData` keeps the current page on screen while a filter/search
 * change loads; pull-to-refresh calls `refetch()` which reloads the loaded
 * pages with the same key (filters are preserved because they are part of
 * the key).
 */
export function useExpensesInfinite(filters: ExpenseListFilters, search: string) {
  return useInfiniteQuery({
    queryKey: expensesKeys.list(filters, search),
    queryFn: ({ pageParam }) =>
      expenseService.listExpenses({
        ...filters,
        search: search || undefined,
        page: pageParam,
        limit: EXPENSES_PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined,
    placeholderData: (previous) => previous,
  });
}

/** Authoritative expense detail - fetched by ID only, never passed around. */
export function useExpenseDetails(expenseId: string | undefined) {
  const id = expenseId ?? '';
  return useQuery({
    queryKey: expensesKeys.detail(id),
    queryFn: () => expenseService.getExpense(id),
    enabled: Boolean(id),
    staleTime: 15_000,
  });
}

/** Backend-computed expense summary for the active filters (reports.expenses). */
export function useExpenseSummary(params: ExpenseSummaryParams, enabled: boolean) {
  return useQuery({
    queryKey: expensesKeys.summary(params),
    queryFn: () => expenseService.getExpenseSummary(params),
    enabled,
    staleTime: 60_000,
  });
}

/**
 * Create/update share one behavior: the server returns the updated expense, so
 * the detail cache is set from that authoritative response immediately (no
 * optimistic guessing), then the whole expense group and the dashboard are
 * invalidated so every screen converges on the same state. Failures surface
 * through `error` - never faked.
 */
function useExpenseMutation<TVars>(mutationFn: (vars: TVars) => Promise<Expense>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (expense) => {
      queryClient.setQueryData(expensesKeys.detail(expense.id), expense);
      void queryClient.invalidateQueries({ queryKey: expensesKeys.all });
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}

export function useCreateExpense() {
  return useExpenseMutation<CreateExpenseInput>((input) => expenseService.createExpense(input));
}

export function useUpdateExpense() {
  return useExpenseMutation<{ id: string; input: UpdateExpenseInput }>(({ id, input }) =>
    expenseService.updateExpense(id, input),
  );
}

/**
 * Soft delete. The expense disappears from every list, so the detail cache is
 * removed and the whole group + dashboard are invalidated. The server response
 * is authoritative - we never remove the row optimistically.
 */
export function useDeleteExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => expenseService.deleteExpense(id),
    onSuccess: (_expense, id) => {
      queryClient.removeQueries({ queryKey: expensesKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: expensesKeys.all });
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}

/** Flattens the expense pages, de-duplicating ids (refresh-safe). */
export function flattenExpenses(pages: ExpenseListData[] | undefined): Expense[] {
  const seen = new Set<string>();
  const list: Expense[] = [];
  for (const page of pages ?? []) {
    for (const expense of page.expenses) {
      if (!seen.has(expense.id)) {
        seen.add(expense.id);
        list.push(expense);
      }
    }
  }
  return list;
}

// ---------------------------------------------------------------------------
// Expense categories
// ---------------------------------------------------------------------------

/**
 * Lookup for selectors (form category picker, list category filter). Requests
 * up to the backend's max page size, sorted by name; `isActive` selects the
 * active-only set the create form needs or the full set the filter needs.
 */
export function useExpenseCategoryLookup(isActive: boolean | undefined, enabled = true) {
  return useQuery({
    queryKey: expensesKeys.categoryLookup(isActive),
    queryFn: () =>
      expenseCategoryService.listCategories({
        isActive,
        limit: 100,
        sortBy: 'name',
        sortOrder: 'asc',
      }),
    enabled,
    staleTime: 60_000,
    select: (data) => data.categories,
  });
}

/** Paginated category list for the manager screen (search + active filter). */
export function useExpenseCategoriesInfinite(search: string, isActive: boolean | undefined) {
  const params: ExpenseCategoryListParams = { search: search || undefined, isActive };
  return useInfiniteQuery({
    queryKey: expensesKeys.categoriesList(params),
    queryFn: ({ pageParam }) =>
      expenseCategoryService.listCategories({
        ...params,
        page: pageParam,
        limit: EXPENSE_CATEGORIES_PAGE_SIZE,
        sortBy: 'name',
        sortOrder: 'asc',
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined,
    placeholderData: (previous) => previous,
  });
}

/** Flattens category pages, de-duplicating ids (refresh-safe). */
export function flattenExpenseCategories(
  pages: ExpenseCategoryListData[] | undefined,
): ExpenseCategory[] {
  const seen = new Set<string>();
  const list: ExpenseCategory[] = [];
  for (const page of pages ?? []) {
    for (const category of page.categories) {
      if (!seen.has(category.id)) {
        seen.add(category.id);
        list.push(category);
      }
    }
  }
  return list;
}

/**
 * Category create/update/deactivate invalidate the whole expense group:
 * category lookups/manager list refresh, and expense lists refresh because
 * their cards render the category name and the summary groups by category.
 */
function invalidateExpenseGroup(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: expensesKeys.all });
}

export function useCreateExpenseCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateExpenseCategoryInput) => expenseCategoryService.createCategory(input),
    onSuccess: () => invalidateExpenseGroup(queryClient),
  });
}

export function useUpdateExpenseCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateExpenseCategoryInput }) =>
      expenseCategoryService.updateCategory(id, input),
    onSuccess: () => invalidateExpenseGroup(queryClient),
  });
}

export function useDeactivateExpenseCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => expenseCategoryService.deactivateCategory(id),
    onSuccess: () => invalidateExpenseGroup(queryClient),
  });
}
