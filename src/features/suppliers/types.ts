/**
 * Supplier wire contract mirrored from the backend
 * (`self_aura_backend/src/types/supplier.ts`, `src/validators/supplierValidators.ts`,
 * `src/types/report.ts`, `src/types/purchase.ts`) - the same approach the web app takes
 * in `self_aura_frontend/src/features/suppliers/types.ts`.
 *
 * The backend is the source of truth and re-validates every request.
 * Note what is NOT here: the supplier model carries no purchase statistics
 * (no purchase count, no total spent) - those live only in the purchases
 * report, so the UI never invents them client-side.
 */

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  address?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** `SupplierListData` - what `GET /suppliers` returns under `data`. */
export interface SupplierListData {
  suppliers: Supplier[];
  pagination: SupplierPagination;
}

/** Sort keys accepted by the backend's `supplierListQuerySchema`. */
export type SupplierSortBy = 'createdAt' | 'name' | 'phone';
export type SortOrder = 'asc' | 'desc';

/** Query parameters supported by `GET /suppliers` (validated backend-side). */
export interface SupplierListParams {
  page?: number;
  limit?: number;
  /** Server-side match on name, phone or email (when search contains @). */
  search?: string;
  /** `true` = active only, `false` = inactive only, omitted = all. */
  isActive?: boolean;
  sortBy?: SupplierSortBy;
  sortOrder?: SortOrder;
}

/** Ready-made filter/sort state shared between the list UI and query key. */
export interface SupplierListFilters {
  isActive?: boolean;
  sortBy: SupplierSortBy;
  sortOrder: SortOrder;
}

/** `POST /suppliers` body (`createSupplierSchema`). */
export interface CreateSupplierInput {
  name: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  address?: string;
  notes?: string;
}

/**
 * `PATCH /suppliers/:id` body (`updateSupplierSchema`): every field is
 * optional and `null` clears the stored value (backend contract).
 */
export interface UpdateSupplierInput {
  name?: string;
  phone?: string;
  alternatePhone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
}

/**
 * Backend-computed purchase totals from `GET /reports/purchases?supplierId=...`
 * (`PurchaseTotals`): scoped to the report date range, which defaults to the
 * current month when no dates are sent.
 */
export interface SupplierPurchaseStats {
  purchaseCount: number;
  receivedCount: number;
  draftCount: number;
  cancelledCount: number;
  totalSpent: number;
  supplierCount: number;
}

/** Minimal purchase summary for the supplier detail screen. */
export interface SupplierPurchaseSummary {
  id: string;
  purchaseNumber: string;
  purchaseDate: string;
  status: 'draft' | 'received' | 'cancelled';
  total: number;
  itemsCount: number;
}

/** Paginated response shape for supplier-scoped purchase history. */
export interface SupplierPurchaseHistoryData {
  purchases: SupplierPurchaseSummary[];
  pagination: SupplierPagination;
}
