/**
 * Order wire contract mirrored from the backend
 * (`self_aura_backend/src/types/order.ts`, `src/constants/order.ts`,
 * `src/validators/orderValidators.ts`) - the same approach the web app takes
 * in `self_aura_frontend/src/features/orders/types.ts`.
 *
 * These enums/transitions exist so the UI can render labels and offer only
 * the transitions the backend accepts. The backend remains the source of
 * truth and re-validates every request (an invalid transition is rejected
 * with 400, an uncancellable order with 409).
 */

export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'ready_to_ship',
  'shipped',
  'delivered',
  'cancelled',
  'returned',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = ['unpaid', 'partially_paid', 'paid', 'refunded'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_METHODS = [
  'cash_on_delivery',
  'cash',
  'bank_transfer',
  'bkash',
  'nagad',
  'other',
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const ORDER_SOURCES = ['facebook', 'website', 'manual', 'other'] as const;
export type OrderSource = (typeof ORDER_SOURCES)[number];

/**
 * Linear status flow enforced by the backend (`constants/order.ts`).
 * Mirrored for display only - the backend rejects any other transition.
 */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed'],
  confirmed: ['processing'],
  processing: ['ready_to_ship'],
  ready_to_ship: ['shipped'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
  returned: [],
};

/** Statuses the backend's cancel endpoint accepts (CANCELLABLE_ORDER_STATUSES). */
export const CANCELLABLE_ORDER_STATUSES: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'ready_to_ship',
  'shipped',
];

export interface OrderItem {
  id: string;
  product: { id: string };
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  subtotal: number;
}

export interface OrderShippingAddress {
  recipientName?: string;
  phone?: string;
  addressLine: string;
  area?: string;
  district?: string;
  city: string;
  postalCode?: string;
  country?: string;
}

/** Immutable delivery-zone snapshot stored on the order at creation time. */
export interface OrderDeliverySnapshot {
  id: string;
  code: string;
  name: string;
  baseCharge: number;
  charge: number;
  freeDeliveryApplied: boolean;
  freeDeliveryThreshold: number | null;
  estimatedMinDays: number;
  estimatedMaxDays: number;
  matchedBy: string;
  district: string;
  area: string;
  postalCode: string;
}

/** Immutable coupon snapshot stored on the order at creation time. */
export interface OrderCouponSnapshot {
  id: string;
  code: string;
  type: string;
  value: number;
  discountAmount: number;
}

export interface OrderCustomerRef {
  id: string;
  name?: string;
  phone?: string;
  email?: string;
}

export interface OrderCreatedByRef {
  id: string;
  username?: string;
  role?: string;
}

/** `OrderResponse` from `self_aura_backend/src/types/order.ts`. */
export interface Order {
  id: string;
  orderNumber: string;
  customer: OrderCustomerRef;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  deliveryCharge: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  shippingAddress: OrderShippingAddress;
  delivery?: OrderDeliverySnapshot;
  coupon?: OrderCouponSnapshot;
  transactionId?: string;
  senderPhone?: string;
  note?: string;
  source: OrderSource;
  createdBy: OrderCreatedByRef;
  createdAt: string;
  updatedAt: string;
}

export interface OrderListPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** `OrderListData` - what `GET /orders` returns under `data`. */
export interface OrderListData {
  orders: Order[];
  pagination: OrderListPagination;
}

/** Sort keys accepted by the backend's `orderListQuerySchema`. */
export type OrderSortBy = 'createdAt' | 'orderNumber' | 'total';
export type SortOrder = 'asc' | 'desc';

/** Query parameters supported by `GET /orders` (validated backend-side). */
export interface OrderListParams {
  page?: number;
  limit?: number;
  /** Matches order number only (backend regex on `orderNumber`). */
  search?: string;
  /** Management-list filter: return only this customer's orders. */
  customer?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  source?: OrderSource;
  /** ISO/`YYYY-MM-DD` dates bounding `createdAt`. */
  from?: string;
  to?: string;
  sortBy?: OrderSortBy;
  sortOrder?: SortOrder;
}

/**
 * `GET /orders/:id/payment-summary` (`OrderPaymentSummaryData`).
 * Ledger totals are computed by the backend's payment service.
 */
export interface OrderPaymentSummary {
  order: { id: string; orderNumber: string; total: number };
  paymentStatus: PaymentStatus;
  orderTotal: number;
  paidAmount: number;
  refundedAmount: number;
  netReceived: number;
  payableAmount: number;
  outstandingAmount: number;
}

/** Ready-made filter/sort state shared between the list UI and query key. */
export interface OrderListFilters {
  /** Restrict results to one customer (customer order history). */
  customer?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  from?: string;
  to?: string;
  sortBy: OrderSortBy;
  sortOrder: SortOrder;
}
