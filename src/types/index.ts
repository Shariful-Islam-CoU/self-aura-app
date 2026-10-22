import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

/**
 * Shared mobile-side types.
 *
 * Type ownership rules (see README "Architecture & Development Rules"):
 * - Business models (orders, products, customers, ...) live NEXT TO their
 *   feature (`src/features/<name>/types.ts`) once that feature is built, so
 *   this module never drifts into guessed fields.
 * - Wire/response shapes have a single source in `src/api/types.ts` and are
 *   re-exported below - never redefine an envelope or pagination shape here.
 * - Only genuinely cross-cutting primitives (icons, permissions, pagination
 *   query params) belong in this file.
 */

/** Ionicons glyph names used across navigation, menus, and feedback states. */
export type IconName = ComponentProps<typeof Ionicons>['name'];

/**
 * A backend permission key such as `"orders.view"`.
 *
 * The literal members mirror the verified catalog in
 * `self_aura_backend/src/constants/permissions.ts` (module.action, keys are
 * immutable). They provide autocomplete and typo-catching for keys the app
 * checks explicitly; the trailing `string & {}` keeps the type assignable
 * from any server-issued key so the mobile app never breaks when the backend
 * adds a new permission - authorization itself is always decided by the
 * backend, these checks are UX-only (see `useAuth().canAccess`).
 */
export type PermissionKey =
  // Categories
  | 'categories.view'
  | 'categories.create'
  | 'categories.edit'
  | 'categories.delete'
  // Products
  | 'products.view'
  | 'products.create'
  | 'products.edit'
  | 'products.delete'
  // Customers
  | 'customers.view'
  | 'customers.create'
  | 'customers.edit'
  | 'customers.delete'
  // Suppliers
  | 'suppliers.view'
  | 'suppliers.create'
  | 'suppliers.edit'
  | 'suppliers.delete'
  // Couriers
  | 'couriers.view'
  | 'couriers.create'
  | 'couriers.edit'
  | 'couriers.delete'
  // Inventory
  | 'inventory.view'
  | 'inventory.adjust'
  | 'inventory.history'
  // Orders
  | 'orders.view'
  | 'orders.create'
  | 'orders.edit'
  | 'orders.cancel'
  | 'orders.overrideDeliveryCharge'
  // Purchases
  | 'purchases.view'
  | 'purchases.create'
  | 'purchases.edit'
  | 'purchases.receive'
  | 'purchases.cancel'
  // Expenses
  | 'expenses.view'
  | 'expenses.create'
  | 'expenses.edit'
  | 'expenses.delete'
  // Payments
  | 'payments.view'
  | 'payments.create'
  | 'payments.edit'
  | 'payments.delete'
  | 'payments.verify'
  | 'payments.reject'
  // Returns
  | 'returns.view'
  | 'returns.create'
  | 'returns.edit'
  | 'returns.approve'
  | 'returns.receive'
  | 'returns.refund'
  | 'returns.cancel'
  // Shipments
  | 'shipments.view'
  | 'shipments.create'
  | 'shipments.edit'
  | 'shipments.cancel'
  // Reports
  | 'reports.dashboard'
  | 'reports.sales'
  | 'reports.purchases'
  | 'reports.expenses'
  | 'reports.payments'
  | 'reports.profitLoss'
  | 'reports.inventory'
  | 'reports.customers'
  | 'reports.returns'
  | 'reports.delivery'
  | 'reports.products'
  | 'reports.categories'
  | 'reports.dailySummary'
  // Settings
  | 'settings.view'
  | 'settings.manage'
  // Users
  | 'users.view'
  | 'users.create'
  | 'users.edit'
  | 'users.approve'
  | 'users.reject'
  | 'users.disable'
  | 'users.enable'
  | 'users.changeRole'
  | 'users.changePassword'
  // Roles
  | 'roles.view'
  | 'roles.create'
  | 'roles.edit'
  | 'roles.delete'
  | 'roles.managePermissions'
  // Permissions
  | 'permissions.view'
  | 'permissions.create'
  | 'permissions.edit'
  | 'permissions.delete'
  // Reviews
  | 'reviews.view'
  | 'reviews.approve'
  | 'reviews.reject'
  | 'reviews.reply'
  | 'reviews.delete'
  // Coupons
  | 'coupons.view'
  | 'coupons.create'
  | 'coupons.edit'
  | 'coupons.delete'
  // Delivery rules
  | 'deliveryRules.view'
  | 'deliveryRules.create'
  | 'deliveryRules.edit'
  | 'deliveryRules.delete'
  // Server may issue keys unknown to this build (never guess, but don't break).
  | (string & {});

/**
 * Pagination query parameters accepted by the backend list endpoints.
 * The matching response shape is `PaginatedResponse` (src/api/types.ts).
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

// API wire types (single source: src/api/types.ts).
export type {
  ApiEnvelope,
  ApiErrorDetail,
  ApiErrorResponse,
  ApiErrorKind,
  ApiResponse,
  PaginatedResponse,
  HttpMethod,
  RequestOptions,
} from '@/api/types';
export { ApiError } from '@/api/types';
export { getErrorMessage, isApiError } from '@/api/errors';

// Session types (single source: src/features/auth/types.ts).
export type { AuthUser, AuthSession, UserStatus } from '@/features/auth/types';
