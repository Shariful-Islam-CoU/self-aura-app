import { apiClient, type ApiEnvelope } from '@/api';
import type {
  Order,
  OrderListData,
  OrderListParams,
  OrderPaymentSummary,
  OrderStatus,
} from '../types';

/**
 * All order API calls (mirrors `self_aura_frontend`'s orderService, minus
 * order creation which is not part of this module's step).
 *
 * Endpoints (permission enforced backend-side):
 *   GET   /orders                - paginated list (search/customer/status/payment/dates/sort)
 *   GET   /orders/:id            - single order
 *   GET   /orders/:id/payment-summary - backend-computed ledger totals
 *   PATCH /orders/:id/status     - advance status (orders.edit)
 *   POST  /orders/:id/cancel     - cancel + stock restore (orders.cancel)
 *
 * This service never touches pricing, stock or transition rules - the
 * backend computes and validates everything.
 */
class OrderService {
  private readonly basePath = '/orders';

  async list(params: OrderListParams = {}): Promise<OrderListData> {
    const query: Record<string, string | number | undefined> = {
      page: params.page,
      limit: params.limit,
      search: params.search || undefined,
      customer: params.customer,
      status: params.status,
      paymentStatus: params.paymentStatus,
      paymentMethod: params.paymentMethod,
      source: params.source,
      from: params.from,
      to: params.to,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    };
    const res = await apiClient.get<ApiEnvelope<OrderListData>>(this.basePath, {
      params: query,
    });
    return res.data;
  }

  async getById(id: string): Promise<Order> {
    const res = await apiClient.get<ApiEnvelope<{ order: Order }>>(`${this.basePath}/${id}`);
    return res.data.order;
  }

  /** Backend-computed paid/refunded/outstanding totals for one order. */
  async getPaymentSummary(id: string): Promise<OrderPaymentSummary> {
    const res = await apiClient.get<ApiEnvelope<OrderPaymentSummary>>(
      `${this.basePath}/${id}/payment-summary`,
    );
    return res.data;
  }

  /** Advances through the backend-defined transitions; rejects others. */
  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const res = await apiClient.patch<ApiEnvelope<{ order: Order }>>(
      `${this.basePath}/${id}/status`,
      { status },
    );
    return res.data.order;
  }

  /** Cancels the order; the backend restores stock and releases the coupon. */
  async cancel(id: string): Promise<Order> {
    const res = await apiClient.post<ApiEnvelope<{ order: Order }>>(
      `${this.basePath}/${id}/cancel`,
      {},
    );
    return res.data.order;
  }
}

export const orderService = new OrderService();
