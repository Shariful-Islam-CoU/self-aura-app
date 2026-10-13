import type { IconName, PermissionKey } from '@/types';

import {
  customersModule,
  dashboardModule,
  ordersModule,
  productsModule,
  type ModuleDefinition,
} from './modules';

/**
 * Bottom tab bar definition.
 *
 * Mobile-first choice: 5 tabs max (iOS/Android platform guidance). The four
 * most frequent destinations get a tab; everything else (inventory included)
 * lives behind the always-visible "More" tab, which lists the full module
 * catalog. Tab visibility is permission-filtered exactly like the web
 * sidebar - backend stays authoritative.
 */
export type TabRoute = 'index' | 'orders' | 'customers' | 'products' | 'more';

export interface TabDefinition {
  /** Route file name inside `(tabs)/`. */
  route: TabRoute;
  label: string;
  /** Active-state Ionicons glyph. */
  icon: IconName;
  /** Inactive-state Ionicons glyph. */
  iconOutline: IconName;
  /** Permission required to show the tab; omit for always-visible tabs. */
  permission?: PermissionKey | PermissionKey[];
  /** Module rendered by the tab screen (undefined for "More"). */
  module?: ModuleDefinition;
}

export const TABS: readonly TabDefinition[] = [
  {
    route: 'index',
    label: 'Home',
    icon: 'home',
    iconOutline: 'home-outline',
    // Always visible: primary entry point even if dashboard permission is missing.
    module: dashboardModule,
  },
  {
    route: 'orders',
    label: 'Orders',
    icon: 'receipt',
    iconOutline: 'receipt-outline',
    permission: ordersModule.permission,
    module: ordersModule,
  },
  {
    route: 'products',
    label: 'Products',
    icon: 'cube',
    iconOutline: 'cube-outline',
    permission: productsModule.permission,
    module: productsModule,
  },
  {
    route: 'customers',
    label: 'Customers',
    icon: 'people',
    iconOutline: 'people-outline',
    permission: customersModule.permission,
    module: customersModule,
  },
  {
    route: 'more',
    label: 'More',
    icon: 'menu',
    iconOutline: 'menu-outline',
    // Always visible: entry point to every module the user can access.
  },
];

/** True when the tab has no permission requirement or any declared one matches. */
export function canAccessTab(
  tab: TabDefinition,
  canAccess: (permission: PermissionKey) => boolean,
): boolean {
  if (!tab.permission) return true;
  const keys = Array.isArray(tab.permission) ? tab.permission : [tab.permission];
  return keys.some((key) => canAccess(key));
}
