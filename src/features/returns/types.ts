export const RETURN_STATUSES = ['requested', 'approved', 'rejected', 'received', 'completed', 'cancelled'] as const;
export type ReturnStatus = (typeof RETURN_STATUSES)[number];

export const REFUND_STATUSES = ['not_started', 'pending', 'refunded', 'failed'] as const;
export type RefundStatus = (typeof REFUND_STATUSES)[number];

export const RETURN_REASONS = [
  'damaged',
  'wrong_product',
  'wrong_size',
  'defective',
  'customer_changed_mind',
  'other',
] as const;
export type ReturnReason = (typeof RETURN_REASONS)[number];

export const RETURN_CONDITIONS = [
  'resellable',
  'damaged',
  'defective',
  'opened',
  'other',
] as const;
export type ReturnCondition = (typeof RETURN_CONDITIONS)[number];

export interface ReturnOrderRef {
  id: string;
  orderNumber?: string;
  total?: number;
  orderStatus?: string;
}

export interface ReturnCustomerRef {
  id: string;
  name?: string;
  phone?: string;
  email?: string;
}

export interface ReturnCourierRef {
  id: string;
  name?: string;
  phone?: string;
}

export interface ReturnActorRef {
  id: string;
  username?: string;
  role?: string;
}

export interface ShippingAddressResponse {
  recipientName: string;
  phone: string;
  addressLine: string;
  area: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface ReturnItem {
  id: string;
  product: { id: string; name?: string; sku?: string };
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  refundAmount: number;
  reason: ReturnReason;
  condition: ReturnCondition;
}

export interface Return {
  id: string;
  returnNumber: string;
  order: ReturnOrderRef;
  customer: ReturnCustomerRef;
  items: ReturnItem[];
  subtotal: number;
  refundAmount: number;
  reason: ReturnReason;
  note?: string;
  status: ReturnStatus;
  refundStatus: RefundStatus;
  returnDate: string;
  approvedBy?: { id: string; username?: string; role?: string };
  approvedAt?: string;
  completedAt?: string;
  createdBy: { id: string; username?: string; role?: string };
  createdAt: string;
  updatedAt: string;
}

export interface ReturnPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ReturnListData {
  returns: Return[];
  pagination: ReturnPagination;
}

export interface ReturnListParams {
  page?: number;
  limit?: number;
  search?: string;
  courier?: string;
  customer?: string;
  status?: string;
  refundStatus?: string;
  fromDate?: string;
  toDate?: string;
  shippedFrom?: string;
  shippedTo?: string;
  deliveredFrom?: string;
  deliveredTo?: string;
  sortBy?: 'createdAt' | 'returnNumber' | 'shippedAt' | 'deliveredAt' | 'refundAmount';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateReturnData {
  order: string;
  items: Array<{
    product: string;
    quantity: number;
    reason?: string;
    condition?: string;
  }>;
  reason: string;
  note?: string;
}

export type UpdateReturnData = Partial<Pick<Return, 'note' | 'status'>>;

export interface RejectReturnData {
  note?: string;
}