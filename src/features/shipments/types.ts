import type { OrderStatus } from '@/features/orders/types';

export const SHIPMENT_STATUSES = [
  'pending',
  'ready_to_ship',
  'shipped',
  'in_transit',
  'delivered',
  'delivery_failed',
  'returned_to_seller',
  'cancelled',
] as const;
export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];

export const DELIVERY_FAILURE_REASONS = [
  'customer_unavailable',
  'wrong_address',
  'customer_refused',
  'phone_unreachable',
  'courier_issue',
  'other',
] as const;
export type DeliveryFailureReason = (typeof DELIVERY_FAILURE_REASONS)[number];

/**
 * Status flow enforced by the backend (`constants/shipment.ts`).
 * Mirrored for display only - the backend rejects any other transition.
 * Unlike orders (linear), a shipment branches: shipped/in_transit can fail
 * delivery, and a failed delivery ends at returned_to_seller.
 */
export const SHIPMENT_STATUS_TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
  pending: ['ready_to_ship', 'cancelled'],
  ready_to_ship: ['shipped', 'cancelled'],
  shipped: ['in_transit', 'delivery_failed'],
  in_transit: ['delivered', 'delivery_failed'],
  delivery_failed: ['returned_to_seller'],
  delivered: [],
  returned_to_seller: [],
  cancelled: [],
};

/** Statuses the backend's cancel endpoint accepts (CANCELLABLE_SHIPMENT_STATUSES). */
export const CANCELLABLE_SHIPMENT_STATUSES: ShipmentStatus[] = ['pending', 'ready_to_ship'];

/** Statuses the backend's update endpoint accepts (EDITABLE_SHIPMENT_STATUSES). */
export const EDITABLE_SHIPMENT_STATUSES: ShipmentStatus[] = [
  'pending',
  'ready_to_ship',
  'shipped',
  'in_transit',
  'delivery_failed',
];

/**
 * Order statuses the backend allows to be shipped (SHIPPABLE_ORDER_STATUSES).
 * Only narrows the create-form order picker - the server re-validates.
 */
export const SHIPPABLE_ORDER_STATUSES: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'ready_to_ship',
];

export interface ShipmentOrderRef {
  id: string;
  orderNumber?: string;
  total?: number;
  orderStatus?: string;
}

export interface ShipmentCustomerRef {
  id: string;
  name?: string;
  phone?: string;
  email?: string;
}

export interface ShipmentCourierRef {
  id: string;
  name?: string;
  phone?: string;
}

export interface ShipmentActorRef {
  id: string;
  username?: string;
  role?: string;
}

export interface ShippingAddressResponse {
  recipientName: string;
  phone: string;
  addressLine: string;
  area: string;
  district: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface Shipment {
  id: string;
  shipmentNumber: string;
  order: ShipmentOrderRef;
  customer: ShipmentCustomerRef;
  courier: ShipmentCourierRef;
  trackingNumber?: string;
  deliveryCharge: number;
  shippingAddress: ShippingAddressResponse;
  status: ShipmentStatus;
  shippedAt?: string;
  deliveredAt?: string;
  failedAt?: string;
  returnedAt?: string;
  failureReason?: DeliveryFailureReason;
  note?: string;
  createdBy: ShipmentActorRef;
  createdAt: string;
  updatedAt: string;
}

export type ShipmentResponse = Shipment;

export interface ShipmentEvent {
  id: string;
  shipment: string;
  fromStatus: ShipmentStatus;
  toStatus: ShipmentStatus;
  note?: string;
  createdBy: ShipmentActorRef;
  createdAt: string;
}

export type ShipmentEventResponse = ShipmentEvent;

export interface ShipmentPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ShipmentListData {
  shipments: Shipment[];
  pagination: ShipmentPagination;
}

/** Query parameters supported by `GET /shipments` (validated backend-side). */
export interface ShipmentListParams {
  page?: number;
  limit?: number;
  /** Matches shipment number, tracking number, order number and customer. */
  search?: string;
  /** Management-list filter: return only this courier's shipments. */
  courier?: string;
  /** Management-list filter: return only this customer's shipments. */
  customer?: string;
  status?: ShipmentStatus;
  fromDate?: string;
  toDate?: string;
  shippedFrom?: string;
  shippedTo?: string;
  deliveredFrom?: string;
  deliveredTo?: string;
  sortBy?: 'createdAt' | 'shipmentNumber' | 'shippedAt' | 'deliveredAt' | 'deliveryCharge';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateShipmentData {
  order: string;
  courier: string;
  trackingNumber?: string;
  deliveryCharge?: number;
  note?: string;
}

export interface UpdateShipmentData {
  courier?: string;
  trackingNumber?: string;
  deliveryCharge?: number;
  note?: string;
}

export interface UpdateShipmentStatusData {
  status: ShipmentStatus;
  failureReason?: DeliveryFailureReason;
  note?: string;
}

/** Sort keys the list toolbar offers (a subset of the backend's `sortBy`). */
export type ShipmentSortBy = 'createdAt' | 'deliveryCharge';
export type ShipmentSortOrder = 'asc' | 'desc';

/** Ready-made filter/sort state shared between the list UI and query key. */
export interface ShipmentListFilters {
  status?: ShipmentStatus;
  fromDate?: string;
  toDate?: string;
  sortBy: ShipmentSortBy;
  sortOrder: ShipmentSortOrder;
}
