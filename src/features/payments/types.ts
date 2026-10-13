/**
 * Payment wire contract mirrored from the backend
 * (`self_aura_backend/src/types/payment.ts`,
 * `src/constants/payment.ts`, `src/validators/paymentValidators.ts`,
 * `src/services/paymentService.ts`) - the same approach the web app takes in
 * `self_aura_frontend/src/features/payments/types.ts`.
 *
 * The backend is the source of truth for payment records, status, ledger
 * math, verification and refunds. The mobile app never generates payment
 * numbers, derives payment status, or recalculates financial totals locally.
 */

export const PAYMENT_METHODS = [
  'cash',
  'bank_transfer',
  'mobile_banking',
  'cash_on_delivery',
  'bkash',
  'nagad',
  'other',
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_TYPES = ['payment', 'refund'] as const;
export type PaymentType = (typeof PAYMENT_TYPES)[number];

/**
 * Manual payment lifecycle (`constants/payment.ts`):
 * - `submitted`: a customer submitted manual payment info (transaction id)
 *   with an order; not yet confirmed income.
 * - `completed`: verified by an authorized management user, therefore
 *   counted as received income by the ledger and reports.
 * - `rejected`: a submitted manual payment an authorized user rejected;
 *   never counted as income.
 * `pending`, `failed` and `cancelled` keep their management-side meanings.
 */
export const PAYMENT_STATUSES = [
  'completed',
  'pending',
  'submitted',
  'failed',
  'cancelled',
  'rejected',
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

/** bKash/Nagad payments whose records await management verification. */
export const MANUAL_PAYMENT_METHODS = ['bkash', 'nagad'] as const;
export type ManualPaymentMethod = (typeof MANUAL_PAYMENT_METHODS)[number];

export function isManualPaymentMethod(method: PaymentMethod): method is ManualPaymentMethod {
  return (MANUAL_PAYMENT_METHODS as readonly string[]).includes(method);
}

/** Statuses the backend still allows to be cancelled (`CANCELLABLE_PAYMENT_STATUSES`). */
export const CANCELLABLE_PAYMENT_STATUSES: readonly PaymentStatus[] = [
  'completed',
  'pending',
  'failed',
];

/** Sort keys accepted by the backend's `paymentListQuerySchema`. */
export const PAYMENT_SORT_FIELDS = ['paymentDate', 'createdAt', 'amount', 'paymentNumber'] as const;
export type PaymentSortBy = (typeof PAYMENT_SORT_FIELDS)[number];
export type SortOrder = 'asc' | 'desc';

/** `PaymentOrderRef` from backend `types/payment.ts`. */
export interface PaymentOrderRef {
  id: string;
  orderNumber?: string;
  total?: number;
}

/** `PaymentCustomerRef` from backend `types/payment.ts`. */
export interface PaymentCustomerRef {
  id: string;
  name?: string;
  phone?: string;
  email?: string;
}

/** `PaymentParentRef` - the original payment a refund was issued against. */
export interface PaymentParentRef {
  id: string;
  paymentNumber?: string;
  amount?: number;
}

/** `PaymentCreatedByRef` - also used for verified/rejected actors. */
export interface PaymentCreatedByRef {
  id: string;
  username?: string;
  role?: string;
}

/** `PaymentResponse` from backend `types/payment.ts`. */
export interface Payment {
  id: string;
  paymentNumber: string;
  order: PaymentOrderRef;
  customer: PaymentCustomerRef;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentType: PaymentType;
  paymentStatus: PaymentStatus;
  paymentDate: string;
  reference?: string;
  note?: string;
  parentPayment?: PaymentParentRef;
  cancelledAt?: string;
  cancelledBy?: { id: string };
  /** Set when a manual bKash/Nagad payment is verified (completed). */
  verifiedAt?: string;
  verifiedBy?: PaymentCreatedByRef;
  /** Set when a manual bKash/Nagad payment is rejected. */
  rejectedAt?: string;
  rejectedBy?: PaymentCreatedByRef;
  rejectionReason?: string;
  createdBy: PaymentCreatedByRef;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** `PaymentListData` - what `GET /payments` returns under `data`. */
export interface PaymentListData {
  payments: Payment[];
  pagination: PaymentPagination;
}

/** Query parameters supported by `GET /payments` (validated backend-side). */
export interface PaymentListParams {
  page?: number;
  limit?: number;
  /** Server-side match on payment number, reference and order number. */
  search?: string;
  /** Filter by related order ID. */
  order?: string;
  /** Filter by related customer ID. */
  customer?: string;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  paymentType?: PaymentType;
  /** Date range filter (paymentDate), `YYYY-MM-DD`. */
  fromDate?: string;
  toDate?: string;
  sortBy?: PaymentSortBy;
  sortOrder?: SortOrder;
}

/** Ready-made filter/sort state shared between the list UI and query key. */
export interface PaymentListFilters {
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  paymentType?: PaymentType;
  fromDate?: string;
  toDate?: string;
  sortBy: PaymentSortBy;
  sortOrder: SortOrder;
}

/** `POST /payments` body (`createPaymentSchema`). */
export interface CreatePaymentInput {
  order: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  reference?: string;
  note?: string;
}

/**
 * `PATCH /payments/:id` body (`updatePaymentSchema`): every field is optional;
 * the backend requires at least one field. Amount and type are not editable.
 */
export interface UpdatePaymentInput {
  paymentMethod?: PaymentMethod;
  paymentDate?: string;
  reference?: string;
  note?: string;
}

/** `POST /payments/:id/refund` body (`refundPaymentSchema`). */
export interface RefundPaymentInput {
  amount: number;
  paymentMethod?: PaymentMethod;
  paymentDate?: string;
  reference?: string;
  note?: string;
}

/** `POST /payments/:id/reject` body (`rejectPaymentSchema`) - reason optional. */
export interface RejectPaymentInput {
  rejectionReason?: string;
}

/** `LedgerSummaryTotals` from backend `types/payment.ts` (backend-computed). */
export interface LedgerSummaryTotals {
  totalPayments: number;
  totalRefunds: number;
  netReceived: number;
  paymentCount: number;
  refundCount: number;
}

/** `GET /payments/summary` data (backend-computed totals). */
export interface PaymentSummaryData {
  fromDate?: string;
  toDate?: string;
  paymentMethod?: PaymentMethod;
  customer?: string;
  order?: string;
  paymentType?: PaymentType;
  paymentStatus?: PaymentStatus;
  summary: LedgerSummaryTotals;
}

/** Query parameters supported by `GET /payments/summary`. */
export interface PaymentSummaryParams {
  fromDate?: string;
  toDate?: string;
  paymentMethod?: PaymentMethod;
  customer?: string;
  order?: string;
  paymentType?: PaymentType;
  paymentStatus?: PaymentStatus;
}
