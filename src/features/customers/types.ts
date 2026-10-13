/**
 * Customer wire contract mirrored from the backend
 * (`self_aura_backend/src/types/customer.ts`, `src/validators/customerValidators.ts`,
 * `src/types/report.ts`) - the same approach the web app takes in
 * `self_aura_frontend/src/features/customers/types.ts`.
 *
 * The backend is the source of truth and re-validates every request.
 * Note what is NOT here: the customer model carries no order statistics
 * (no order count, no total spent) - those live only in the orders
 * report, so the UI never invents them client-side.
 */

export interface CustomerAddress {
  id: string;
  label: string;
  recipientName?: string;
  phone?: string;
  addressLine: string;
  area?: string;
  city: string;
  postalCode?: string;
  country?: string;
  isDefault: boolean;
}

/** `CustomerResponse` from `self_aura_backend/src/types/customer.ts`. */
export interface Customer {
  id: string;
  name: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  addresses: CustomerAddress[];
  notes?: string;
  tags: string[];
  isActive: boolean;
  facebookName?: string | null;
  facebookProfileUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** `CustomerListData` - what `GET /customers` returns under `data`. */
export interface CustomerListData {
  customers: Customer[];
  pagination: CustomerPagination;
}

/** Sort keys accepted by the backend's `customerListQuerySchema`. */
export type CustomerSortBy = 'createdAt' | 'name';
export type SortOrder = 'asc' | 'desc';

/** Query parameters supported by `GET /customers` (validated backend-side). */
export interface CustomerListParams {
  page?: number;
  limit?: number;
  /** Server-side match on name, email or phone (backend regex + normalization). */
  search?: string;
  /** `true` = active only, `false` = inactive only, omitted = all. */
  isActive?: boolean;
  sortBy?: CustomerSortBy;
  sortOrder?: SortOrder;
}

/** Ready-made filter/sort state shared between the list UI and query key. */
export interface CustomerListFilters {
  isActive?: boolean;
  sortBy: CustomerSortBy;
  sortOrder: SortOrder;
}

/** Address payload for create/update (`CustomerAddressInput` on the web). */
export interface CustomerAddressInput {
  label: string;
  recipientName?: string;
  phone?: string;
  addressLine: string;
  area?: string;
  city: string;
  postalCode?: string;
  country?: string;
  isDefault: boolean;
}

/** `POST /customers` body (`createCustomerSchema`). */
export interface CreateCustomerInput {
  name: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  addresses?: CustomerAddressInput[];
  notes?: string;
  tags?: string[];
  facebookName?: string | null;
  facebookProfileUrl?: string | null;
}

/**
 * `PATCH /customers/:id` body (`updateCustomerSchema`): every field is
 * optional and `null` clears the stored value (backend contract).
 */
export interface UpdateCustomerInput {
  name?: string;
  phone?: string;
  alternatePhone?: string | null;
  email?: string | null;
  addresses?: CustomerAddressInput[] | null;
  notes?: string | null;
  tags?: string[];
  facebookName?: string | null;
  facebookProfileUrl?: string | null;
}

/**
 * Backend-computed business totals from `GET /reports/customers`
 * (`CustomerTotals`): total/active are all-time counts; newCustomers and
 * the order-based metrics are scoped to the report date range, which
 * defaults to the current month when no dates are sent.
 */
export interface CustomerStatsTotals {
  totalCustomers: number;
  newCustomers: number;
  activeCustomers: number;
  customersWithOrders: number;
  repeatCustomers: number;
  totalCustomerOrders: number;
  totalCustomerSales: number;
}

export interface CustomerStatsData {
  startDate: string;
  endDate: string;
  totals: CustomerStatsTotals;
}
