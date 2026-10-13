import type { StatusTone } from '@/theme';

import { EXPENSE_PAYMENT_METHODS, type ExpensePaymentMethod } from './types';

/**
 * Display labels for expense payment methods. Mirrors the backend enum
 * (`src/constants/expense.ts`) and the web app's
 * `EXPENSE_PAYMENT_METHOD_LABELS`.
 */
export const EXPENSE_PAYMENT_METHOD_LABELS: Record<ExpensePaymentMethod, string> = {
  cash: 'Cash',
  bank_transfer: 'Bank transfer',
  mobile_banking: 'Mobile banking',
  other: 'Other',
};

export function expensePaymentMethodLabel(method: ExpensePaymentMethod): string {
  return EXPENSE_PAYMENT_METHOD_LABELS[method];
}

/** Select options for the payment-method field (create/edit form). */
export const EXPENSE_PAYMENT_METHOD_OPTIONS: readonly { value: string; label: string }[] =
  EXPENSE_PAYMENT_METHODS.map((method) => ({
    value: method,
    label: EXPENSE_PAYMENT_METHOD_LABELS[method],
  }));

/** Sort labels for the list toolbar (`sortBy:sortOrder`). */
export const EXPENSE_SORT_LABELS: Record<string, string> = {
  'expenseDate:desc': 'Date newest',
  'expenseDate:asc': 'Date oldest',
  'createdAt:desc': 'Recorded newest',
  'createdAt:asc': 'Recorded oldest',
  'amount:desc': 'Amount high-low',
  'amount:asc': 'Amount low-high',
  'expenseNumber:desc': 'Number high-low',
  'expenseNumber:asc': 'Number low-high',
};

/** Sort options mapped to the backend's `sortBy`/`sortOrder` pair. */
export const EXPENSE_SORT_OPTIONS: readonly { value: string; label: string }[] = Object.entries(
  EXPENSE_SORT_LABELS,
).map(([value, label]) => ({ value, label }));

/** Active/inactive tone used by the category manager badge. */
export const EXPENSE_CATEGORY_STATUS_TONES: Record<'active' | 'inactive', StatusTone> = {
  active: 'success',
  inactive: 'neutral',
};

/** Filter option values (empty string = no filter). */
export const EXPENSE_PAYMENT_METHOD_FILTER_OPTIONS: readonly { value: string; label: string }[] = [
  { value: '', label: 'All methods' },
  ...EXPENSE_PAYMENT_METHOD_OPTIONS,
];
