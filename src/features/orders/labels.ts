import type { StatusTone } from '@/theme';
import {
  ORDER_SOURCES,
  PAYMENT_METHODS,
  type OrderSource,
  type OrderStatus,
  type PaymentMethod,
  type PaymentStatus,
} from './types';

/**
 * Display labels and precise tone mappings for order domain statuses.
 *
 * Defined here (not in the UI layer) per the design system rule: generic
 * components only know HOW to render a tone, features map their own statuses.
 * Labels mirror `self_aura_frontend`'s OrderStatusBadge so both clients
 * render identical text for the same data.
 */

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  ready_to_ship: 'Ready to ship',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Returned',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  unpaid: 'Unpaid',
  partially_paid: 'Partially paid',
  paid: 'Paid',
  refunded: 'Refunded',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash_on_delivery: 'Cash on delivery',
  cash: 'Cash',
  bank_transfer: 'Bank transfer',
  bkash: 'bKash',
  nagad: 'Nagad',
  other: 'Other',
};

export const ORDER_SOURCE_LABELS: Record<OrderSource, string> = {
  facebook: 'Facebook',
  website: 'Website',
  manual: 'Manual',
  other: 'Other',
};

/**
 * Select options for the create-order form, derived from the same
 * constants + label maps the detail screens render, so a label can never
 * drift between display and selection.
 */
export const ORDER_PAYMENT_METHOD_OPTIONS: readonly { value: string; label: string }[] =
  PAYMENT_METHODS.map((method) => ({ value: method, label: PAYMENT_METHOD_LABELS[method] }));

export const ORDER_SOURCE_OPTIONS: readonly { value: string; label: string }[] =
  ORDER_SOURCES.map((source) => ({ value: source, label: ORDER_SOURCE_LABELS[source] }));

/** Explicit status -> tone mapping (never relies on keyword guessing). */
export const ORDER_STATUS_TONES: Record<OrderStatus, StatusTone> = {
  pending: 'warning',
  confirmed: 'info',
  processing: 'info',
  ready_to_ship: 'info',
  shipped: 'info',
  delivered: 'success',
  cancelled: 'danger',
  returned: 'neutral',
};

export const PAYMENT_STATUS_TONES: Record<PaymentStatus, StatusTone> = {
  unpaid: 'warning',
  partially_paid: 'info',
  paid: 'success',
  refunded: 'neutral',
};

/**
 * Short consequence note for terminal statuses - shown instead of a
 * fabricated timeline (the backend stores no status history).
 */
export const TERMINAL_STATUS_NOTES: Partial<Record<OrderStatus, string>> = {
  delivered: 'This order has been delivered.',
  cancelled: 'This order was cancelled. Stock was restored by the server.',
  returned: 'This order was returned.',
};
