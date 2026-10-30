import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { dashboardKeys } from '@/features/dashboard/queries';
import { productsKeys } from '@/features/products/queries';
import type { ProductListFilters } from '@/features/products/types';
import { inventoryKeys } from './keys';
import { inventoryService } from './services/inventoryService';
import type { AddStockInput, AdjustStockInput, RemoveStockInput, StockChangeResult } from './types';

/** Re-exported so the feature keeps one query/hook entry point. */
export { inventoryKeys };

/** Backend caps `limit` at 100; 20 matches the backend default page size. */
export const INVENTORY_PAGE_SIZE = 20;

/**
 * Paginated inventory list - the shared `GET /products` endpoint (web
 * parity), keyed under `inventory` because this screen owns its own
 * search/filter state. Disabled while the low-stock view is active so the
 * two sources never race. `placeholderData` keeps the current page on
 * screen while a filter/search change loads; pull-to-refresh calls
 * `refetch()` which reloads the loaded pages with the same key.
 */
export function useInventoryList(filters: ProductListFilters, search: string, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: inventoryKeys.list(filters, search),
    queryFn: ({ pageParam }) =>
      inventoryService.list({
        page: pageParam,
        limit: INVENTORY_PAGE_SIZE,
        search: search || undefined,
        category: filters.category,
        isActive: filters.isActive,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined,
    placeholderData: (previous) => previous,
    enabled,
  });
}

/**
 * Low-stock view (`GET /inventory/low-stock`): the backend returns all
 * matches unpaginated, so this is a plain query - exactly how the web
 * inventory page consumes it.
 */
export function useLowStockInventory(enabled: boolean) {
  return useQuery({
    queryKey: inventoryKeys.lowStock(),
    queryFn: () => inventoryService.listLowStock(),
    enabled,
    staleTime: 60_000,
  });
}

/** Backend-computed summary totals (`GET /reports/inventory`). */
export function useInventoryTotals(enabled: boolean) {
  return useQuery({
    queryKey: inventoryKeys.totals(),
    queryFn: () => inventoryService.getInventoryTotals(),
    enabled,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });
}

/**
 * One product's movement history, paginated. Shared between the details
 * preview (first page only) and the full history screen (infinite scroll):
 * both read the same key, so navigating to the history screen reuses the
 * pages the details screen already loaded.
 */
export function useInventoryHistory(productId: string | undefined, enabled = true) {
  const id = productId ?? '';
  return useInfiniteQuery({
    queryKey: inventoryKeys.history(id),
    queryFn: ({ pageParam }) =>
      inventoryService.getHistory(id, { page: pageParam, limit: INVENTORY_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined,
    placeholderData: (previous) => previous,
    enabled: Boolean(id) && enabled,
  });
}

// ---------------------------------------------------------------------------
// Stock mutations
//
// Inventory is never mutated optimistically. Every operation returns the
// authoritative `{ product, transaction }`, so the product detail cache is
// SET from that response immediately, then the inventory group (list,
// low-stock, totals, history), the product group (detail + lists) and the
// dashboard (low-stock widget + summary) are invalidated so every screen
// converges on the backend's state. Failures surface through `error` -
// never faked.
// ---------------------------------------------------------------------------

function useStockMutation<TVars>(mutationFn: (vars: TVars) => Promise<StockChangeResult>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (result) => {
      queryClient.setQueryData(productsKeys.detail(result.product.id), result.product);
      void queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      void queryClient.invalidateQueries({ queryKey: productsKeys.all });
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}

export function useAddStock() {
  return useStockMutation<{ productId: string; input: AddStockInput }>(({ productId, input }) =>
    inventoryService.addStock(productId, input),
  );
}

export function useRemoveStock() {
  return useStockMutation<{ productId: string; input: RemoveStockInput }>(({ productId, input }) =>
    inventoryService.removeStock(productId, input),
  );
}

export function useAdjustStock() {
  return useStockMutation<{ productId: string; input: AdjustStockInput }>(({ productId, input }) =>
    inventoryService.adjustStock(productId, input),
  );
}
