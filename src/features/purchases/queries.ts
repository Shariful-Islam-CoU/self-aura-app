import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { dashboardKeys } from '@/features/dashboard/queries';
import { inventoryKeys } from '@/features/inventory/queries';
import { productsKeys } from '@/features/products/queries';
import { suppliersKeys } from '@/features/suppliers/queries';
import type {
  CreatePurchaseInput,
  Purchase,
  PurchaseListData,
  PurchaseListFilters,
  UpdatePurchaseInput,
} from './types';
import { purchaseService } from './services/purchaseService';

/** Backend caps `limit` at 100; 20 matches the backend default page size. */
export const PURCHASES_PAGE_SIZE = 20;

/**
 * Query keys. Everything purchase-related lives under 'purchases' so a
 * mutation can invalidate the whole group with a prefix match, and each
 * sub-key carries the state that changes its response (filters/search/id)
 * for automatic dedupe.
 */
export const purchasesKeys = {
  all: ['purchases'] as const,
  list: (filters: PurchaseListFilters, search: string) =>
    ['purchases', 'list', search, filters] as const,
  detail: (id: string) => ['purchases', 'detail', id] as const,
  stats: ['purchases', 'stats'] as const,
};

/**
 * Paginated purchase list (page N + filters + debounced search in the key).
 * `placeholderData` keeps the current page on screen while a filter/search
 * change loads; pull-to-refresh calls `refetch()` which reloads the loaded
 * pages with the same key (filters are preserved because they are part of
 * the key).
 */
export function usePurchasesInfinite(filters: PurchaseListFilters, search: string) {
  return useInfiniteQuery({
    queryKey: purchasesKeys.list(filters, search),
    queryFn: ({ pageParam }) =>
      purchaseService.listPurchases({
        ...filters,
        search: search || undefined,
        page: pageParam,
        limit: PURCHASES_PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined,
    placeholderData: (previous) => previous,
  });
}

/** Authoritative purchase detail - fetched by ID only, never passed around. */
export function usePurchaseDetails(purchaseId: string | undefined) {
  const id = purchaseId ?? '';
  return useQuery({
    queryKey: purchasesKeys.detail(id),
    queryFn: () => purchaseService.getPurchase(id),
    enabled: Boolean(id),
    staleTime: 15_000,
  });
}

/** Backend-computed purchase totals (`GET /reports/purchases`). */
export function usePurchaseStats(enabled: boolean) {
  return useQuery({
    queryKey: purchasesKeys.stats,
    queryFn: () => purchaseService.getPurchaseStats(),
    enabled,
    staleTime: 60_000,
  });
}

/**
 * Create/update/receive/cancel share one behavior: the server returns the
 * updated purchase, so the detail cache is set from that authoritative
 * response immediately (no optimistic guessing), then the whole purchase
 * group (list, detail, stats) and related caches (dashboard, inventory,
 * products, suppliers) are invalidated so every screen converges on the
 * same state. Failures surface through `error` - never faked.
 */
function usePurchaseMutation<TVars>(mutationFn: (vars: TVars) => Promise<Purchase>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (purchase) => {
      queryClient.setQueryData(purchasesKeys.detail(purchase.id), purchase);
      void queryClient.invalidateQueries({ queryKey: purchasesKeys.all });
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
      void queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      void queryClient.invalidateQueries({ queryKey: productsKeys.all });
      void queryClient.invalidateQueries({ queryKey: suppliersKeys.all });
    },
  });
}

export function useCreatePurchase() {
  return usePurchaseMutation<CreatePurchaseInput>((input) => purchaseService.createPurchase(input));
}

export function useUpdatePurchase() {
  return usePurchaseMutation<{ id: string; input: UpdatePurchaseInput }>(({ id, input }) =>
    purchaseService.updatePurchase(id, input),
  );
}

export function useReceivePurchase() {
  return usePurchaseMutation<{ id: string }>(({ id }) => purchaseService.receivePurchase(id));
}

export function useCancelPurchase() {
  return usePurchaseMutation<{ id: string }>(({ id }) => purchaseService.cancelPurchase(id));
}

/** Flattens the purchase pages, de-duplicating ids (refresh-safe). */
export function flattenPurchases(pages: PurchaseListData[] | undefined): Purchase[] {
  const seen = new Set<string>();
  const list: Purchase[] = [];
  for (const page of pages ?? []) {
    for (const purchase of page.purchases) {
      if (!seen.has(purchase.id)) {
        seen.add(purchase.id);
        list.push(purchase);
      }
    }
  }
  return list;
}
