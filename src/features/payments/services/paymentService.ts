// Payment service - every payment API call lives here (mirrors
// `self_aura_frontend`'s paymentService). Endpoints (permission enforced
// backend-side):
//   GET    /payments                  - paginated list (payments.view)
//   POST   /payments                  - record a payment (payments.create)
//   GET    /payments/:id              - single payment (payments.view)
//   PATCH  /payments/:id              - update method/date/reference/note (payments.edit)
//   POST   /payments/:id/cancel       - cancel (payments.delete)
//   POST   /payments/:id/refund       - refund (payments.edit)
//   POST   /payments/:id/verify       - verify a manual bKash/Nagad payment (payments.verify)
//   POST   /payments/:id/reject       - reject a submitted manual payment (payments.reject)
//   GET    /payments/summary          - backend-computed ledger totals (payments.view)
//
// There is no DELETE route: payments are cancelled, never removed. This
// service never computes statuses, ledgers or totals - the backend owns all
// financial behavior and re-validates every request.

import { apiClient, type ApiEnvelope } from '@/api';

import type {
  CreatePaymentInput,
  Payment,
  PaymentListData,
  PaymentListParams,
  PaymentSummaryData,
  PaymentSummaryParams,
  RefundPaymentInput,
  RejectPaymentInput,
  UpdatePaymentInput,
} from '../types';

class PaymentService {
  private readonly basePath = '/payments';

  async listPayments(params: PaymentListParams = {}): Promise<PaymentListData> {
    const query: Record<string, string | number | undefined> = {
      page: params.page,
      limit: params.limit,
      search: params.search || undefined,
      order: params.order || undefined,
      customer: params.customer || undefined,
      paymentMethod: params.paymentMethod || undefined,
      paymentStatus: params.paymentStatus || undefined,
      paymentType: params.paymentType || undefined,
      fromDate: params.fromDate || undefined,
      toDate: params.toDate || undefined,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    };
    const response = await apiClient.get<ApiEnvelope<PaymentListData>>(this.basePath, {
      params: query,
    });
    return response.data;
  }

  async getPayment(id: string): Promise<Payment> {
    const response = await apiClient.get<ApiEnvelope<{ payment: Payment }>>(
      `${this.basePath}/${id}`,
    );
    return response.data.payment;
  }

  /** Records a staff payment against an order; the server assigns `PAY-######`. */
  async createPayment(input: CreatePaymentInput): Promise<Payment> {
    const response = await apiClient.post<ApiEnvelope<{ payment: Payment }>>(this.basePath, input);
    return response.data.payment;
  }

  async updatePayment(id: string, input: UpdatePaymentInput): Promise<Payment> {
    const response = await apiClient.patch<ApiEnvelope<{ payment: Payment }>>(
      `${this.basePath}/${id}`,
      input,
    );
    return response.data.payment;
  }

  /** Cancels a payment; the backend recomputes the order's payment status. */
  async cancelPayment(id: string): Promise<Payment> {
    const response = await apiClient.post<ApiEnvelope<{ payment: Payment }>>(
      `${this.basePath}/${id}/cancel`,
    );
    return response.data.payment;
  }

  /**
   * Refunds a completed payment. The backend creates a new refund record and
   * enforces the refundable limits - the client never derives them.
   */
  async refundPayment(id: string, input: RefundPaymentInput): Promise<Payment> {
    const response = await apiClient.post<ApiEnvelope<{ payment: Payment }>>(
      `${this.basePath}/${id}/refund`,
      input,
    );
    return response.data.payment;
  }

  /**
   * Verifies a submitted manual bKash/Nagad payment. Only the backend may
   * confirm this - a transaction id alone is never treated as verified.
   */
  async verifyPayment(id: string): Promise<Payment> {
    const response = await apiClient.post<ApiEnvelope<{ payment: Payment }>>(
      `${this.basePath}/${id}/verify`,
    );
    return response.data.payment;
  }

  /** Rejects a submitted manual payment, optionally recording a reason. */
  async rejectPayment(id: string, input: RejectPaymentInput): Promise<Payment> {
    const response = await apiClient.post<ApiEnvelope<{ payment: Payment }>>(
      `${this.basePath}/${id}/reject`,
      input,
    );
    return response.data.payment;
  }

  /** Backend-computed ledger totals for the given filters (payments.view). */
  async getPaymentSummary(params: PaymentSummaryParams = {}): Promise<PaymentSummaryData> {
    const query: Record<string, string | undefined> = {
      fromDate: params.fromDate || undefined,
      toDate: params.toDate || undefined,
      paymentMethod: params.paymentMethod || undefined,
      customer: params.customer || undefined,
      order: params.order || undefined,
      paymentType: params.paymentType || undefined,
      paymentStatus: params.paymentStatus || undefined,
    };
    const response = await apiClient.get<ApiEnvelope<PaymentSummaryData>>(
      `${this.basePath}/summary`,
      { params: query },
    );
    return response.data;
  }
}

export const paymentService = new PaymentService();
export { PaymentService };
