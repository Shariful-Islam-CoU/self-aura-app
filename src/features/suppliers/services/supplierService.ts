// Supplier service - all supplier-related API calls live here.
// Endpoints (all require authentication):
//   GET    /suppliers                - paginated list (search / isActive / sort)
//   POST   /suppliers                - create (suppliers.create)
//   GET    /suppliers/:id            - single supplier (suppliers.view)
//   PATCH  /suppliers/:id            - update, null clears a field (suppliers.edit)
//   DELETE /suppliers/:id            - deactivate, isActive=false (suppliers.delete)
//   GET    /reports/purchases        - backend-computed purchase totals (reports.purchases)
//   GET    /purchases?supplier=...   - supplier-scoped purchase history (purchases.view)

import { apiClient, type ApiEnvelope } from '@/api';
import type {
  CreateSupplierInput,
  Supplier,
  SupplierListData,
  SupplierListParams,
  SupplierPurchaseHistoryData,
  SupplierPurchaseStats,
  UpdateSupplierInput,
} from '../types';

class SupplierService {
  private readonly basePath = '/suppliers';

  async listSuppliers(params: SupplierListParams = {}): Promise<SupplierListData> {
    const query: Record<string, string | number | boolean | undefined> = {
      page: params.page,
      limit: params.limit,
      search: params.search || undefined,
      isActive: params.isActive,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    };
    const response = await apiClient.get<ApiEnvelope<SupplierListData>>(this.basePath, {
      params: query,
    });
    return response.data;
  }

  async getSupplier(id: string): Promise<Supplier> {
    const response = await apiClient.get<ApiEnvelope<{ supplier: Supplier }>>(
      `${this.basePath}/${id}`,
    );
    return response.data.supplier;
  }

  async createSupplier(input: CreateSupplierInput): Promise<Supplier> {
    const response = await apiClient.post<ApiEnvelope<{ supplier: Supplier }>>(
      this.basePath,
      input,
    );
    return response.data.supplier;
  }

  async updateSupplier(id: string, input: UpdateSupplierInput): Promise<Supplier> {
    const response = await apiClient.patch<ApiEnvelope<{ supplier: Supplier }>>(
      `${this.basePath}/${id}`,
      input,
    );
    return response.data.supplier;
  }

  async deactivateSupplier(id: string): Promise<Supplier> {
    const response = await apiClient.delete<ApiEnvelope<{ supplier: Supplier }>>(
      `${this.basePath}/${id}`,
    );
    return response.data.supplier;
  }

  /** Backend-computed purchase totals (`GET /reports/purchases?supplierId=...`). */
  async getPurchaseStats(supplierId: string): Promise<SupplierPurchaseStats> {
    const response = await apiClient.get<ApiEnvelope<{ totals: SupplierPurchaseStats }>>(
      '/reports/purchases',
      { params: { supplierId } },
    );
    return response.data.totals;
  }

  /** Supplier-scoped purchase history (`GET /purchases?supplier=...`). */
  async getPurchaseHistory(
    supplierId: string,
    params: { page?: number; limit?: number; sortBy?: string; sortOrder?: string } = {},
  ): Promise<SupplierPurchaseHistoryData> {
    const query: Record<string, string | number | boolean | undefined> = {
      supplier: supplierId,
      page: params.page,
      limit: params.limit,
      sortBy: params.sortBy ?? 'purchaseDate',
      sortOrder: params.sortOrder ?? 'desc',
    };
    const response = await apiClient.get<ApiEnvelope<SupplierPurchaseHistoryData>>('/purchases', {
      params: query,
    });
    return response.data;
  }
}

export const supplierService = new SupplierService();
