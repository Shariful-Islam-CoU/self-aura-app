// Purchase service - all purchase-related API calls live here.
// Endpoints (all require authentication):
//   GET    /purchases                - paginated list (search / supplier / status / date range / sort)
//   POST   /purchases                - create (purchases.create)
//   GET    /purchases/:id            - single purchase (purchases.view)
//   PATCH  /purchases/:id            - update draft (purchases.edit)
//   POST   /purchases/:id/receive    - receive draft (purchases.receive)
//   POST   /purchases/:id/cancel     - cancel draft (purchases.cancel)
//   GET    /reports/purchases        - backend-computed purchase totals (reports.purchases)

import { apiClient, type ApiEnvelope } from '@/api';
import type {
  CreatePurchaseInput,
  Purchase,
  PurchaseListData,
  PurchaseListParams,
  PurchaseStatsData,
  UpdatePurchaseInput,
} from '../types';

class PurchaseService {
  private readonly basePath = '/purchases';

  async listPurchases(params: PurchaseListParams = {}): Promise<PurchaseListData> {
    const query: Record<string, string | number | boolean | undefined> = {
      page: params.page,
      limit: params.limit,
      search: params.search || undefined,
      supplier: params.supplier || undefined,
      status: params.status || undefined,
      from: params.from || undefined,
      to: params.to || undefined,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    };
    const response = await apiClient.get<ApiEnvelope<PurchaseListData>>(this.basePath, {
      params: query,
    });
    return response.data;
  }

  async getPurchase(id: string): Promise<Purchase> {
    const response = await apiClient.get<ApiEnvelope<{ purchase: Purchase }>>(
      `${this.basePath}/${id}`,
    );
    return response.data.purchase;
  }

  async createPurchase(input: CreatePurchaseInput): Promise<Purchase> {
    const response = await apiClient.post<ApiEnvelope<{ purchase: Purchase }>>(
      this.basePath,
      input,
    );
    return response.data.purchase;
  }

  async updatePurchase(id: string, input: UpdatePurchaseInput): Promise<Purchase> {
    const response = await apiClient.patch<ApiEnvelope<{ purchase: Purchase }>>(
      `${this.basePath}/${id}`,
      input,
    );
    return response.data.purchase;
  }

  /** Receives a draft purchase. The backend marks it received and increases inventory. */
  async receivePurchase(id: string): Promise<Purchase> {
    const response = await apiClient.post<ApiEnvelope<{ purchase: Purchase }>>(
      `${this.basePath}/${id}/receive`,
      null,
    );
    return response.data.purchase;
  }

  /** Cancels a draft purchase (no stock effect - drafts never touched stock). */
  async cancelPurchase(id: string): Promise<Purchase> {
    const response = await apiClient.post<ApiEnvelope<{ purchase: Purchase }>>(
      `${this.basePath}/${id}/cancel`,
      null,
    );
    return response.data.purchase;
  }

  /** Backend-computed purchase totals (`GET /reports/purchases`). */
  async getPurchaseStats(
    params: {
      supplierId?: string;
      from?: string;
      to?: string;
    } = {},
  ): Promise<PurchaseStatsData> {
    const response = await apiClient.get<ApiEnvelope<PurchaseStatsData>>('/reports/purchases', {
      params,
    });
    return response.data;
  }
}

export const purchaseService = new PurchaseService();
