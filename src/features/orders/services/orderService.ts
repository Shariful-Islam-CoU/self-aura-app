import { apiClient, type ApiEnvelope } from '@/api';
import type {
  CreateOrderInput,
  Order,
  OrderListData,
  OrderListParams,
  OrderPaymentSummary,
  OrderStatus,
} from '../types';

/**
 * All order API calls (mirrors `self_aura_frontend`'s orderService).
 *
 * Endpoints (permission enforced backend-side):
 *   POST  /orders                - create an order (orders.create); the
 *                                  backend prices items, coupon and delivery
 *                                  itself, so no money field is ever sent
 *   GET   /orders                - paginated list (search/customer/status/payment/dates/sort)
 *   GET   /orders/:id            - single order
 *   GET   /orders/:id/payment-summary - backend-computed ledger totals
 *   PATCH /orders/:id/status     - advance status (orders.edit)
 *   POST  /orders/:id/cancel     - cancel + stock restore (orders.cancel)
 *   PATCH /orders/:id/delivery-charge - manual delivery-charge override
 *                                    (orders.overrideDeliveryCharge); the
 *                                    backend recomputes the total + audits it
 *
 * This service never touches pricing, stock or transition rules - the
 * backend computes and validates everything.
 */
class OrderService {
  private readonly basePath = '/orders';

  /**
   * Creates an order (`orders.create`). The payload carries no money
   * fields - prices, coupon discount, delivery charge and total are all
   * computed server-side and returned on the created order.
   */
  async create(input: CreateOrderInput): Promise<Order> {
    const res = await apiClient.post<ApiEnvelope<{ order: Order }>>(this.basePath, input);
    return res.data.order;
  }

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

  async overrideDeliveryCharge(id: string, input: { finalCharge: number; reason?: string }): Promise<Order> {
    const res = await apiClient.patch<ApiEnvelope<{ order: Order }>>(
      `${this.basePath}/${id}/delivery-charge`,
      input,
    );
    return res.data.order;
  }
}

export const orderService = new OrderService();
