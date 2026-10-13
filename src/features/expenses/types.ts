/**
 * Expense wire contract mirrored from the backend
 * (`self_aura_backend/src/types/expense.ts`,
 * `src/validators/expenseValidators.ts`, `src/constants/expense.ts`,
 * `src/services/expenseService.ts`) - the same approach the web app takes in
 * `self_aura_frontend/src/features/expenses/types.ts`.
 *
 * The backend is the source of truth and re-validates every request. The
 * mobile app never generates expense numbers or recalculates totals locally.
 */

export const EXPENSE_PAYMENT_METHODS = [
  'cash',
  'bank_transfer',
  'mobile_banking',
  'other',
] as const;

export type ExpensePaymentMethod = (typeof EXPENSE_PAYMENT_METHODS)[number];

/** `ExpenseCategoryRef` from backend `types/expense.ts`. */
export interface ExpenseCategoryRef {
  id: string;
  name?: string;
  isActive?: boolean;
}

/** `ExpenseCreatedByRef` from backend `types/expense.ts`. */
export interface ExpenseCreatedByRef {
  id: string;
  username?: string;
  role?: string;
}

/** `ExpenseResponse` from backend `types/expense.ts`. */
export interface Expense {
  id: string;
  expenseNumber: string;
  category: ExpenseCategoryRef;
  title: string;
  description?: string;
  amount: number;
  paymentMethod: ExpensePaymentMethod;
  expenseDate: string;
  reference?: string;
  note?: string;
  createdBy: ExpenseCreatedByRef;
  createdAt: string;
  updatedAt: string;
}

export interface ExpensePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** `ExpenseListData` - what `GET /expenses` returns under `data`. */
export interface ExpenseListData {
  expenses: Expense[];
  pagination: ExpensePagination;
}

/** Sort keys accepted by the backend's `expenseListQuerySchema`. */
export type ExpenseSortBy = 'expenseDate' | 'createdAt' | 'amount' | 'expenseNumber';
export type SortOrder = 'asc' | 'desc';

/** Query parameters supported by `GET /expenses` (validated backend-side). */
export interface ExpenseListParams {
  page?: number;
  limit?: number;
  /** Server-side match on expense number/title/description/reference. */
  search?: string;
  /** Filter by expense category ID. */
  category?: string;
  /** Filter by payment method. */
  paymentMethod?: ExpensePaymentMethod;
  /** Date range filter (expenseDate), `YYYY-MM-DD`. */
  fromDate?: string;
  toDate?: string;
  sortBy?: ExpenseSortBy;
  sortOrder?: SortOrder;
}

/** Ready-made filter/sort state shared between the list UI and query key. */
export interface ExpenseListFilters {
  category?: string;
  paymentMethod?: ExpensePaymentMethod;
  fromDate?: string;
  toDate?: string;
  sortBy: ExpenseSortBy;
  sortOrder: SortOrder;
}

/** `POST /expenses` body (`createExpenseSchema`). */
export interface CreateExpenseInput {
  category: string;
  title: string;
  description?: string;
  amount: number;
  paymentMethod: ExpensePaymentMethod;
  expenseDate: string;
  reference?: string;
  note?: string;
}

/**
 * `PATCH /expenses/:id` body (`updateExpenseSchema`): every field is optional;
 * the backend requires at least one field.
 */
export interface UpdateExpenseInput {
  category?: string;
  title?: string;
  description?: string;
  amount?: number;
  paymentMethod?: ExpensePaymentMethod;
  expenseDate?: string;
  reference?: string;
  note?: string;
}

/** One category bucket from `GET /expenses/summary`. */
export interface ExpenseSummaryEntry {
  categoryId: string;
  categoryName: string;
  total: number;
  count: number;
}

/** `GET /expenses/summary` data (backend-computed totals). */
export interface ExpenseSummaryData {
  summary: {
    total: number;
    count: number;
  };
  byCategory: ExpenseSummaryEntry[];
}

/** Query parameters supported by `GET /expenses/summary`. */
export interface ExpenseSummaryParams {
  fromDate?: string;
  toDate?: string;
  category?: string;
  paymentMethod?: ExpensePaymentMethod;
}

/** `ExpenseCategoryResponse` from backend `types/expenseCategory.ts`. */
export interface ExpenseCategory {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** `ExpenseCategoryListData` - what `GET /expense-categories` returns. */
export interface ExpenseCategoryListData {
  categories: ExpenseCategory[];
  pagination: ExpensePagination;
}

/** Query parameters supported by `GET /expense-categories`. */
export interface ExpenseCategoryListParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: 'createdAt' | 'name';
  sortOrder?: SortOrder;
}

/** `POST /expense-categories` body (`createExpenseCategorySchema`). */
export interface CreateExpenseCategoryInput {
  name: string;
  description?: string;
}

/** `PATCH /expense-categories/:id` body (`updateExpenseCategorySchema`). */
export interface UpdateExpenseCategoryInput {
  name?: string;
  description?: string;
}
