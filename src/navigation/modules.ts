import type { IconName, PermissionKey } from '@/types';

/**
 * Catalog of every business module the management app exposes.
 *
 * Permission keys mirror the verified backend catalog
 * (`self_aura_backend/src/constants/permissions.ts`) and the web sidebar
 * (`self_aura_frontend/src/constants/navigation.ts`). The backend remains
 * the authorization source of truth; these keys only decide which
 * navigation entries a user may SEE (UX-only), exactly like
 * `canAccessNavItem` on the web - there is NO role -> permission mapping
 * in the mobile app.
 *
 * Routing: every module resolves to the single dynamic route
 * `/module/[key]` until a dedicated screen replaces the placeholder as
 * each module is implemented. Modules that own a bottom tab (Dashboard,
 * Orders, Products, Customers) omit `group` - they never render in the
 * "More" screen because the tab bar already exposes them.
 */
export type ModuleGroup = 'Operations' | 'Finance' | 'Delivery' | 'Customer' | 'Administration';

export interface ModuleDefinition {
  /** Stable key: used as the `/module/[key]` param and by tab screens. */
  key: string;
  label: string;
  /**
   * "More" screen section. Omitted for tab-owned modules (they are not
   * listed in More - the tab bar is their entry point).
   */
  group?: ModuleGroup;
  /**
   * Dedicated route for implemented modules (e.g. `/categories`). Omitted
   * while a module still renders the generic `/module/[key]` placeholder.
   */
  route?: string;
  /** Ionicons glyph (outline style, used everywhere for consistency). */
  icon: IconName;
  /** Short line shown under the title in the More grid tiles. */
  description?: string;
  /** Permission key(s) required to see the entry; user needs ANY one. */
  permission: PermissionKey | PermissionKey[];
}

export const dashboardModule: ModuleDefinition = {
  key: 'dashboard',
  label: 'Dashboard',
  icon: 'grid-outline',
  permission: 'reports.dashboard',
};

export const productsModule: ModuleDefinition = {
  key: 'products',
  label: 'Products',
  icon: 'cube-outline',
  permission: 'products.view',
};

export const categoriesModule: ModuleDefinition = {
  key: 'categories',
  label: 'Categories',
  group: 'Operations',
  route: '/categories',
  icon: 'albums-outline',
  description: 'Organise products into groups',
  permission: 'categories.view',
};

export const inventoryModule: ModuleDefinition = {
  key: 'inventory',
  label: 'Inventory',
  group: 'Operations',
  route: '/inventory',
  icon: 'archive-outline',
  description: 'Stock levels and adjustments',
  permission: 'inventory.view',
};

export const customersModule: ModuleDefinition = {
  key: 'customers',
  label: 'Customers',
  icon: 'people-outline',
  permission: 'customers.view',
};

export const ordersModule: ModuleDefinition = {
  key: 'orders',
  label: 'Orders',
  icon: 'cart-outline',
  permission: 'orders.view',
};

export const returnsModule: ModuleDefinition = {
  key: 'returns',
  label: 'Returns',
  group: 'Operations',
  icon: 'refresh-outline',
  description: 'Customer returns and refunds',
  permission: 'returns.view',
};

export const suppliersModule: ModuleDefinition = {
  key: 'suppliers',
  label: 'Suppliers',
  group: 'Operations',
  route: '/suppliers',
  icon: 'business-outline',
  description: 'Supplier directory and contacts',
  permission: 'suppliers.view',
};

export const purchasesModule: ModuleDefinition = {
  key: 'purchases',
  label: 'Purchases',
  group: 'Operations',
  route: '/purchases',
  icon: 'bag-outline',
  description: 'Purchase orders and receiving',
  permission: 'purchases.view',
};

export const expensesModule: ModuleDefinition = {
  key: 'expenses',
  label: 'Expenses',
  group: 'Operations',
  route: '/expenses',
  icon: 'document-text-outline',
  description: 'Track business spending',
  permission: 'expenses.view',
};

export const paymentsModule: ModuleDefinition = {
  key: 'payments',
  label: 'Payments',
  group: 'Finance',
  route: '/payments',
  icon: 'card-outline',
  description: 'Record and verify payments',
  permission: 'payments.view',
};

export const ledgerModule: ModuleDefinition = {
  key: 'ledger',
  label: 'Ledger',
  group: 'Finance',
  icon: 'book-outline',
  description: 'Account movement history',
  permission: 'payments.view',
};

export const reportsModule: ModuleDefinition = {
  key: 'reports',
  label: 'Reports',
  group: 'Finance',
  icon: 'bar-chart-outline',
  description: 'Sales, stock and financial reports',
  // Same any-of set as the web sidebar: seeing ANY report opens the module.
  permission: [
    'reports.sales',
    'reports.purchases',
    'reports.expenses',
    'reports.payments',
    'reports.profitLoss',
    'reports.inventory',
    'reports.customers',
    'reports.returns',
    'reports.delivery',
    'reports.products',
    'reports.categories',
    'reports.dailySummary',
    'reports.dashboard',
  ],
};

export const couriersModule: ModuleDefinition = {
  key: 'couriers',
  label: 'Couriers',
  group: 'Delivery',
  route: '/couriers',
  icon: 'bicycle-outline',
  description: 'Delivery partner profiles',
  permission: 'couriers.view',
};

export const shipmentsModule: ModuleDefinition = {
  key: 'shipments',
  label: 'Shipments',
  group: 'Delivery',
  route: '/shipments',
  icon: 'boat-outline', // this Ionicons set has no ship/truck glyphs
  description: 'Outgoing shipment tracking',
  permission: 'shipments.view',
};

export const deliveryRulesModule: ModuleDefinition = {
  key: 'deliveryRules',
  label: 'Delivery Rules',
  group: 'Delivery',
  route: '/delivery-rules',
  icon: 'options-outline',
  description: 'Checkout delivery charges',
  permission: 'deliveryRules.view',
};

export const reviewsModule: ModuleDefinition = {
  key: 'reviews',
  label: 'Reviews',
  group: 'Customer',
  icon: 'star-outline',
  description: 'Moderate customer reviews',
  permission: 'reviews.view',
};

export const couponsModule: ModuleDefinition = {
  key: 'coupons',
  label: 'Coupons',
  group: 'Customer',
  icon: 'pricetag-outline',
  description: 'Discount codes and campaigns',
  permission: 'coupons.view',
};

export const usersModule: ModuleDefinition = {
  key: 'users',
  label: 'Users',
  group: 'Administration',
  icon: 'person-outline',
  description: 'Team accounts and status',
  permission: 'users.view',
};

export const rolesModule: ModuleDefinition = {
  key: 'roles',
  label: 'Roles',
  group: 'Administration',
  icon: 'shield-outline',
  description: 'Role-based access levels',
  permission: 'roles.view',
};

export const permissionsModule: ModuleDefinition = {
  key: 'permissions',
  label: 'Permissions',
  group: 'Administration',
  icon: 'key-outline',
  description: 'Granular permission catalog',
  permission: 'permissions.view',
};

export const settingsModule: ModuleDefinition = {
  key: 'settings',
  label: 'Settings',
  group: 'Administration',
  icon: 'settings-outline',
  description: 'App and business configuration',
  permission: 'settings.view',
};

/** Every module, ordered like the web sidebar. */
export const MODULES: readonly ModuleDefinition[] = [
  dashboardModule,
  productsModule,
  categoriesModule,
  inventoryModule,
  customersModule,
  ordersModule,
  returnsModule,
  suppliersModule,
  purchasesModule,
  expensesModule,
  paymentsModule,
  ledgerModule,
  reportsModule,
  couriersModule,
  shipmentsModule,
  deliveryRulesModule,
  reviewsModule,
  couponsModule,
  usersModule,
  rolesModule,
  permissionsModule,
  settingsModule,
];

/** "More" screen section order (tab-owned modules have no group). */
export const MODULE_GROUPS: readonly ModuleGroup[] = [
  'Operations',
  'Finance',
  'Delivery',
  'Customer',
  'Administration',
];

export function findModule(key: string): ModuleDefinition | undefined {
  return MODULES.find((module) => module.key === key);
}

export function modulesInGroup(group: ModuleGroup): ModuleDefinition[] {
  return MODULES.filter((module) => module.group === group);
}

/** True when the item has no permission requirement or any declared one matches. */
export function canAccessModule(
  module: ModuleDefinition,
  canAccess: (permission: PermissionKey) => boolean,
): boolean {
  if (!module.permission) return true;
  const keys = Array.isArray(module.permission) ? module.permission : [module.permission];
  return keys.some((key) => canAccess(key));
}
