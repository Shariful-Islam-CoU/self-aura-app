import type { ProductListFilters } from '@/features/products/types';

/**
 * Inventory query keys. Kept in their own module (no runtime imports) so the
 * products feature can invalidate the backend-computed inventory totals after
 * a product mutation without importing the inventory query hooks - that would
 * create a cycle (`inventory/queries` -> `products/queries` -> `inventory`).
 *
 * The inventory DETAIL is the product itself and lives under
 * `productsKeys.detail`; it is never duplicated here.
 */
export const inventoryKeys = {
  all: ['inventory'] as const,
  list: (filters: ProductListFilters, search: string) =>
    ['inventory', 'list', search, filters] as const,
  lowStock: () => ['inventory', 'low-stock'] as const,
  totals: () => ['inventory', 'totals'] as const,
  history: (productId: string) => ['inventory', 'history', productId] as const,
};
