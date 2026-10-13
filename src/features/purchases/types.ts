/**
 * Purchase wire contract mirrored from the backend
 * (`self_aura_backend/src/types/purchase.ts`, `src/validators/purchaseValidators.ts`,
 * `src/constants/purchase.ts`, `src/services/purchaseService.ts`) - the same approach
 * the web app takes in `self_aura_frontend/src/features/purchases/types.ts`.
 *
 * The backend is the source of truth and re-validates every request.
 * The mobile app never generates purchase numbers or recalculates totals locally.
 */

export const PURCHASE_STATUSES = ['draft', 'received', 'cancelled'] as const;
export type PurchaseStatus = (typeof PURCHASE_STATUSES)[number];

/** Purchase number prefix for display context (not used for generation - backend does that). */
export const PURCHASE_NUMBER_PREFIX = 'PUR';

/** `PurchaseItemResponse` from backend `types/purchase.ts`. */
export interface PurchaseItem {
  id: string;
  product: { id: string };
  productName: string;
  sku: string;
  quantity: number;
  unitCost: number;
  subtotal: number;
}

/** `PurchaseSupplierRef` from backend `types/purchase.ts`. */
export interface PurchaseSupplierRef {
  id: string;
  name?: string;
  phone?: string;
  email?: string;
}

/** `PurchaseCreatedByRef` from backend `types/purchase.ts`. */
export interface PurchaseCreatedByRef {
  id: string;
  username?: string;
  role?: string;
}

/** `PurchaseResponse` from backend `types/purchase.ts`. */
export interface Purchase {
  id: string;
  purchaseNumber: string;
  supplier: PurchaseSupplierRef;
  items: PurchaseItem[];
  subtotal: number;
  additionalCost: number;
  total: number;
  purchaseDate: string;
  status: PurchaseStatus;
  note?: string;
  createdBy: PurchaseCreatedByRef;
  createdAt: string;
  updatedAt: string;
}

export interface PurchasePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** `PurchaseListData` - what `GET /purchases` returns under `data`. */
export interface PurchaseListData {
  purchases: Purchase[];
  pagination: PurchasePagination;
}

/** Sort keys accepted by the backend's `purchaseListQuerySchema`. */
export type PurchaseSortBy = 'createdAt' | 'purchaseDate' | 'total' | 'purchaseNumber';
export type SortOrder = 'asc' | 'desc';

/** Query parameters supported by `GET /purchases` (validated backend-side). */
export interface PurchaseListParams {
  page?: number;
  limit?: number;
  /** Server-side match on purchase number only (backend regex + normalization). */
  search?: string;
  /** Filter by supplier ID. */
  supplier?: string;
  /** Filter by status (`draft`, `received`, `cancelled`). */
  status?: PurchaseStatus;
  /** Date range filter (purchaseDate). */
  from?: string;
  to?: string;
  sortBy?: PurchaseSortBy;
  sortOrder?: SortOrder;
}

/** Ready-made filter/sort state shared between the list UI and query key. */
export interface PurchaseListFilters {
  supplier?: string;
  status?: PurchaseStatus;
  from?: string;
  to?: string;
  sortBy: PurchaseSortBy;
  sortOrder: SortOrder;
}

/** `POST /purchases` body (`createPurchaseSchema`). */
export interface CreatePurchaseInput {
  supplier: string;
  items: {
    product: string;
    quantity: number;
    unitCost: number;
  }[];
  additionalCost?: number;
  purchaseDate: string;
  note?: string;
}

/**
 * `PATCH /purchases/:id` body (`updatePurchaseSchema`): every field is
 * optional; only draft purchases can be updated (backend rejects others).
 */
export interface UpdatePurchaseInput {
  supplier?: string;
  items?: {
    product: string;
    quantity: number;
    unitCost: number;
  }[];
  additionalCost?: number;
  purchaseDate?: string;
  note?: string;
}

/** Backend-computed purchase totals (`GET /reports/purchases`). */
export interface PurchaseStatsTotals {
  purchaseCount: number;
  receivedCount: number;
  draftCount: number;
  cancelledCount: number;
  totalSpent: number;
  supplierCount: number;
}

/** `PurchaseStatsData` - what `GET /reports/purchases` returns. */
export interface PurchaseStatsData {
  fromDate: string;
  toDate: string;
  totals: PurchaseStatsTotals;
}

/** Form-only draft line item. Prices/quantities come from user inputs. */
export interface DraftPurchaseItem {
  key: string;
  productId: string;
  productName: string;
  sku: string;
  unitCost: string;
  quantity: string;
}
