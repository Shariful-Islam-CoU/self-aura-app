import { apiClient, type ApiEnvelope } from '@/api';
import type {
  CreateCustomerInput,
  Customer,
  CustomerListData,
  CustomerListParams,
  CustomerStatsData,
  UpdateCustomerInput,
} from '../types';

/**
 * All customer API calls (mirrors `self_aura_frontend`'s customerService).
 *
 * Endpoints (permission enforced backend-side):
 *   GET    /customers           - paginated list (search/status/sort)
 *   GET    /customers/:id       - single customer
 *   POST   /customers           - create (customers.create)
 *   PATCH  /customers/:id       - update, null clears a field (customers.edit)
 *   DELETE /customers/:id       - soft deactivate, isActive=false (customers.delete)
 *   GET    /reports/customers   - backend-computed business totals (reports.customers)
 *
 * This service performs no business math: statistics and validation are
 * the backend's responsibility; the client only mirrors field rules for
 * faster feedback and always treats backend errors as authoritative.
 */
class CustomerService {
  private readonly basePath = '/customers';

  async list(params: CustomerListParams = {}): Promise<CustomerListData> {
    const query: Record<string, string | number | boolean | undefined> = {
      page: params.page,
      limit: params.limit,
      search: params.search || undefined,
      isActive: params.isActive,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    };
    const res = await apiClient.get<ApiEnvelope<CustomerListData>>(this.basePath, {
      params: query,
    });
    return res.data;
  }

  async getById(id: string): Promise<Customer> {
    const res = await apiClient.get<ApiEnvelope<{ customer: Customer }>>(`${this.basePath}/${id}`);
    return res.data.customer;
  }

  async create(input: CreateCustomerInput): Promise<Customer> {
    const res = await apiClient.post<ApiEnvelope<{ customer: Customer }>>(this.basePath, input);
    return res.data.customer;
  }

  async update(id: string, input: UpdateCustomerInput): Promise<Customer> {
    const res = await apiClient.patch<ApiEnvelope<{ customer: Customer }>>(
      `${this.basePath}/${id}`,
      input,
    );
    return res.data.customer;
  }

  /** Soft delete - the backend deactivates the customer (isActive = false). */
  async deactivate(id: string): Promise<Customer> {
    const res = await apiClient.delete<ApiEnvelope<{ customer: Customer }>>(
      `${this.basePath}/${id}`,
    );
    return res.data.customer;
  }

  /**
   * Backend-computed customer statistics (GET /reports/customers). No dates
   * are sent, so the backend defaults the period to the current month -
   * the same call the web dashboard makes.
   */
  async getStats(): Promise<CustomerStatsData> {
    const res = await apiClient.get<ApiEnvelope<CustomerStatsData>>('/reports/customers');
    return res.data;
  }
}

export const customerService = new CustomerService();
