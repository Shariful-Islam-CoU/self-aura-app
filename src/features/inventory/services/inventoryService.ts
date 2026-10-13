import { apiClient, type ApiEnvelope } from '@/api';
import { productService } from '@/features/products/services/productService';
import type { Product, ProductListData, ProductListParams } from '@/features/products/types';
import type {
  AddStockInput,
  AdjustStockInput,
  InventoryReportData,
  InventoryTotals,
  RemoveStockInput,
  StockChangeResult,
  StockMovementListData,
} from '../types';

/**
 * All inventory API calls (mirrors `self_aura_frontend`'s inventoryService).
 *
 * Endpoints (authorization enforced backend-side):
 *   GET  /products                     - the inventory LIST itself (products.view);
 *                                        reuses productService so there is one
 *                                        source of envelope-unwrapping (web parity)
 *   GET  /inventory/low-stock          - active products at/below threshold (inventory.view)
 *   GET  /inventory/:productId/history - paginated movements (inventory.history)
 *   POST /inventory/:productId/add     - +quantity stock_in (inventory.adjust)
 *   POST /inventory/:productId/remove  - -quantity stock_out, 409 when short (inventory.adjust)
 *   POST /inventory/:productId/adjust  - SET newStock + reason (inventory.adjust)
 *   GET  /reports/inventory            - backend-computed totals (reports.inventory)
 *
 * This service performs NO stock business math. Quantities, thresholds,
 * sufficiency, atomicity and movement bookkeeping are entirely the
 * backend's job - the app submits an operation and treats the response
 * (`{ product, transaction }`) as the source of truth.
 */
class InventoryService {
  private readonly basePath = '/inventory';

  /** Paginated inventory list - the shared `GET /products` listing. */
  async list(params: ProductListParams = {}): Promise<ProductListData> {
    return productService.list(params);
  }

  /**
   * Low-stock products (`stock <= lowStockThreshold`, active only).
   * The backend returns ALL matches without pagination - same as the web.
   */
  async listLowStock(): Promise<Product[]> {
    const res = await apiClient.get<ApiEnvelope<{ items: Product[] }>>(
      `${this.basePath}/low-stock`,
    );
    return res.data.items ?? [];
  }

  /** Backend-computed totals from `GET /reports/inventory` (optional category). */
  async getInventoryTotals(categoryId?: string): Promise<InventoryTotals> {
    const res = await apiClient.get<ApiEnvelope<InventoryReportData>>('/reports/inventory', {
      params: { categoryId },
    });
    return res.data.totals;
  }

  /** One product's movement history - offset pagination, backend-validated. */
  async getHistory(
    productId: string,
    params: { page: number; limit: number },
  ): Promise<StockMovementListData> {
    const res = await apiClient.get<ApiEnvelope<StockMovementListData>>(
      `${this.basePath}/${productId}/history`,
      { params },
    );
    return res.data;
  }

  /** Add stock (backend records `stock_in` / reason `restock`). */
  async addStock(productId: string, input: AddStockInput): Promise<StockChangeResult> {
    const res = await apiClient.post<ApiEnvelope<StockChangeResult>>(
      `${this.basePath}/${productId}/add`,
      input,
    );
    return res.data;
  }

  /** Remove stock (backend records `stock_out`; 409 when insufficient). */
  async removeStock(productId: string, input: RemoveStockInput): Promise<StockChangeResult> {
    const res = await apiClient.post<ApiEnvelope<StockChangeResult>>(
      `${this.basePath}/${productId}/remove`,
      input,
    );
    return res.data;
  }

  /** Set an exact stock level (backend records `adjustment` + the reason). */
  async adjustStock(productId: string, input: AdjustStockInput): Promise<StockChangeResult> {
    const res = await apiClient.post<ApiEnvelope<StockChangeResult>>(
      `${this.basePath}/${productId}/adjust`,
      input,
    );
    return res.data;
  }
}

export const inventoryService = new InventoryService();
export { InventoryService };
