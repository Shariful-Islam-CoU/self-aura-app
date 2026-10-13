import type { StatusTone } from '@/theme';

import {
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  PAYMENT_TYPES,
  type PaymentMethod,
  type PaymentStatus,
  type PaymentType,
} from './types';

/**
 * Display labels for payment methods. Mirrors the backend enum
 * (`self_aura_backend/src/constants/payment.ts`) and the web app's
 * `getPaymentMethodLabel`.
 */
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Cash',
  bank_transfer: 'Bank transfer',
  mobile_banking: 'Mobile banking',
  cash_on_delivery: 'Cash on delivery',
  bkash: 'bKash',
  nagad: 'Nagad',
  other: 'Other',
};

export function paymentMethodLabel(method: PaymentMethod): string {
  return PAYMENT_METHOD_LABELS[method];
}

export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  payment: 'Payment',
  refund: 'Refund',
};

export function paymentTypeLabel(type: PaymentType): string {
  return PAYMENT_TYPE_LABELS[type];
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  submitted: 'Submitted',
  completed: 'Completed',
  pending: 'Pending',
  failed: 'Failed',
  cancelled: 'Cancelled',
  rejected: 'Rejected',
};

export function paymentStatusLabel(status: PaymentStatus): string {
  return PAYMENT_STATUS_LABELS[status];
}

/**
 * Semantic tones for status badges. The label text is always rendered too, so
 * status is never communicated by color alone.
 * Mirrors the web `PaymentStatusBadge` variants.
 */
export const PAYMENT_STATUS_TONES: Record<PaymentStatus, StatusTone> = {
  submitted: 'info',
  completed: 'success',
  pending: 'warning',
  failed: 'danger',
  cancelled: 'neutral',
  rejected: 'danger',
};

export const PAYMENT_TYPE_TONES: Record<PaymentType, StatusTone> = {
  payment: 'primary',
  refund: 'danger',
};

/** Select options for payment-method fields. */
export const PAYMENT_METHOD_OPTIONS: readonly { value: string; label: string }[] =
  PAYMENT_METHODS.map((method) => ({ value: method, label: PAYMENT_METHOD_LABELS[method] }));

export const PAYMENT_TYPE_OPTIONS: readonly { value: string; label: string }[] = PAYMENT_TYPES.map(
  (type) => ({ value: type, label: PAYMENT_TYPE_LABELS[type] }),
);

export const PAYMENT_STATUS_OPTIONS: readonly { value: string; label: string }[] =
  PAYMENT_STATUSES.map((status) => ({ value: status, label: PAYMENT_STATUS_LABELS[status] }));

/** Filter option values (empty string = no filter). */
export const PAYMENT_METHOD_FILTER_OPTIONS: readonly { value: string; label: string }[] = [
  { value: '', label: 'All methods' },
  ...PAYMENT_METHOD_OPTIONS,
];

export const PAYMENT_TYPE_FILTER_OPTIONS: readonly { value: string; label: string }[] = [
  { value: '', label: 'All types' },
  ...PAYMENT_TYPE_OPTIONS,
];

export const PAYMENT_STATUS_FILTER_OPTIONS: readonly { value: string; label: string }[] = [
  { value: '', label: 'All statuses' },
  ...PAYMENT_STATUS_OPTIONS,
];

/** Sort labels for the list toolbar (`sortBy:sortOrder`). */
export const PAYMENT_SORT_LABELS: Record<string, string> = {
  'paymentDate:desc': 'Date newest',
  'paymentDate:asc': 'Date oldest',
  'createdAt:desc': 'Recorded newest',
  'createdAt:asc': 'Recorded oldest',
  'amount:desc': 'Amount high-low',
  'amount:asc': 'Amount low-high',
  'paymentNumber:desc': 'Number high-low',
  'paymentNumber:asc': 'Number low-high',
};

/** Sort options mapped to the backend's `sortBy`/`sortOrder` pair. */
export const PAYMENT_SORT_OPTIONS: readonly { value: string; label: string }[] = Object.entries(
  PAYMENT_SORT_LABELS,
).map(([value, label]) => ({ value, label }));
