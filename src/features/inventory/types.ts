/**
 * Inventory feature types.
 *
 * Mirrors the backend contract exactly as verified against
 * `self_aura_backend`:
 *   - `types/inventory.ts` -> `InventoryTransactionResponse` /
 *     `StockChangeResult` / `InventoryHistoryData`
 *   - `constants/inventory.ts` -> transaction types, reasons, references
 *   - `types/report.ts` -> `InventoryTotals` (GET /reports/inventory)
 *   - `routes/inventory.routes.ts` + `validators/inventoryValidators.ts`
 *     (endpoints, bodies, pagination)
 *
 * The inventory LIST is the shared `GET /products` endpoint (web parity -
 * see `inventoryService.list`), so the list shapes are re-exported from the
 * products feature rather than duplicated. Stock quantities are always the
 * backend's numbers: this module performs no stock math beyond the display-
 * only status rule (`stock <= 0` out, `stock <= lowStockThreshold` low) that
 * the web badge documents from `reportRepository.getInventoryTotals`.
 */

import type {
  Product,
  ProductListData,
  ProductListFilters,
  ProductListParams,
  ProductSortBy,
  SortOrder,
} from '../products/types';

/** `InventoryTransactionType` from `constants/inventory.ts`. */
export type StockTransactionType =
  'stock_in' | 'stock_out' | 'adjustment' | 'return_in' | 'return_out';

/** `InventoryReason` from `constants/inventory.ts` (system + manual reasons). */
export type InventoryReason =
  | 'initial_stock'
  | 'restock'
  | 'removal'
  | 'manual_adjustment'
  | 'damaged'
  | 'lost'
  | 'returned'
  | 'correction'
  | 'purchase';

/** `InventoryReferenceType` from `constants/inventory.ts`. */
export type InventoryReferenceType = 'purchase' | 'order' | 'return';

/** `InventoryCreatedByRef` - the user recorded on every movement. */
export interface InventoryCreatedByRef {
  id: string;
  username?: string;
  role?: string;
}

/** `InventoryTransactionResponse` - one stock movement. */
export interface StockMovement {
  id: string;
  product: { id: string };
  type: StockTransactionType;
  quantity: number;
  previousStock: number;
  newStock: number;
  /** Free-form on manual adjustments; system movements use the enum reasons. */
  reason: string;
  referenceType?: InventoryReferenceType;
  referenceId?: string;
  note?: string;
  createdBy: InventoryCreatedByRef;
  createdAt: string;
  updatedAt: string;
}

/** Offset pagination block returned with the history list. */
export interface MovementPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** `InventoryHistoryData` - `GET /inventory/:productId/history`. */
export interface StockMovementListData {
  items: StockMovement[];
  pagination: MovementPagination;
}

/** `StockChangeResult` - the response of add/remove/adjust: authoritative. */
export interface StockChangeResult {
  product: Product;
  transaction: StockMovement;
}

/** `POST /inventory/:productId/add` body. */
export interface AddStockInput {
  quantity: number;
  note?: string;
}

/** `POST /inventory/:productId/remove` body. */
export interface RemoveStockInput {
  quantity: number;
  note?: string;
}

/** `POST /inventory/:productId/adjust` body (`newStock` is a SET, not a delta). */
export interface AdjustStockInput {
  newStock: number;
  reason: string;
  note?: string;
}

/** `InventoryTotals` from `types/report.ts` (GET /reports/inventory). */
export interface InventoryTotals {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalStockUnits: number;
  costValue: number;
  sellingValue: number;
}

/** `InventoryReportData` - the `GET /reports/inventory` payload. */
export interface InventoryReportData {
  categoryId?: string;
  totals: InventoryTotals;
}

/** Display-only stock status (backend stays authoritative for every number). */
export type InventoryStockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

/**
 * List status filter. `all`/`active`/`inactive` map to the products list's
 * `isActive`; `low_stock` switches to `GET /inventory/low-stock` (web parity
 * with `InventoryListStatusFilter`).
 */
export type InventoryListStatusFilter = 'all' | 'active' | 'inactive' | 'low_stock';

/** The three backend stock operations (web parity: add / remove / adjust). */
export type StockAdjustmentMode = 'add' | 'remove' | 'adjust';

// The inventory list IS the products list, so its shapes are re-exported
// here (same as the web inventory feature) instead of being redefined.
export type {
  Product,
  ProductListData,
  ProductListFilters,
  ProductListParams,
  ProductSortBy,
  SortOrder,
};
