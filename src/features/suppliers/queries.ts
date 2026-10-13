import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { dashboardKeys } from '@/features/dashboard/queries';
import type {
  CreateSupplierInput,
  Supplier,
  SupplierListFilters,
  SupplierPurchaseHistoryData,
  SupplierPurchaseSummary,
  UpdateSupplierInput,
} from './types';
import { supplierService } from './services/supplierService';

/** Backend caps `limit` at 100; 20 matches the backend default page size. */
export const SUPPLIERS_PAGE_SIZE = 20;

/** Page size for the per-supplier purchase history section. */
export const SUPPLIER_HISTORY_PAGE_SIZE = 10;

/**
 * Query keys. Everything supplier-related lives under 'suppliers' so a
 * mutation can invalidate the whole group with a prefix match, and each
 * sub-key carries the state that changes its response (filters/search/id)
 * for automatic dedupe.
 */
export const suppliersKeys = {
  all: ['suppliers'] as const,
  list: (filters: SupplierListFilters, search: string) =>
    ['suppliers', 'list', search, filters] as const,
  detail: (id: string) => ['suppliers', 'detail', id] as const,
  purchaseStats: (supplierId: string) => ['suppliers', 'purchaseStats', supplierId] as const,
  purchaseHistory: (supplierId: string) => ['suppliers', 'purchaseHistory', supplierId] as const,
};

/**
 * Paginated supplier list (page N + filters + debounced search in the key).
 * `placeholderData` keeps the current page on screen while a filter/search
 * change loads; pull-to-refresh calls `refetch()` which reloads the loaded
 * pages with the same key (filters are preserved because they are part of
 * the key).
 */
export function useSuppliersInfinite(filters: SupplierListFilters, search: string) {
  return useInfiniteQuery({
    queryKey: suppliersKeys.list(filters, search),
    queryFn: ({ pageParam }) =>
      supplierService.listSuppliers({
        ...filters,
        search: search || undefined,
        page: pageParam,
        limit: SUPPLIERS_PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined,
    placeholderData: (previous) => previous,
  });
}

/** Authoritative supplier detail - fetched by ID only, never passed around. */
export function useSupplierDetails(supplierId: string | undefined) {
  const id = supplierId ?? '';
  return useQuery({
    queryKey: suppliersKeys.detail(id),
    queryFn: () => supplierService.getSupplier(id),
    enabled: Boolean(id),
    staleTime: 15_000,
  });
}

/** Backend-computed purchase totals (`GET /reports/purchases?supplierId=...`). */
export function useSupplierPurchaseStats(supplierId: string | undefined, enabled: boolean) {
  const id = supplierId ?? '';
  return useQuery({
    queryKey: suppliersKeys.purchaseStats(id),
    queryFn: () => supplierService.getPurchaseStats(id),
    enabled: Boolean(id) && enabled,
    staleTime: 60_000,
  });
}

/** Supplier-scoped purchase history (`GET /purchases?supplier=...`). */
export function useSupplierPurchaseHistory(supplierId: string | undefined, enabled: boolean) {
  const id = supplierId ?? '';
  return useInfiniteQuery({
    queryKey: suppliersKeys.purchaseHistory(id),
    queryFn: ({ pageParam }) =>
      supplierService.getPurchaseHistory(id, {
        page: pageParam,
        limit: SUPPLIER_HISTORY_PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined,
    enabled: Boolean(id) && enabled,
    placeholderData: (previous) => previous,
  });
}

/**
 * Create/update/deactivate share one behavior: the server returns the
 * updated supplier, so the detail cache is set from that authoritative
 * response immediately (no optimistic guessing), then the whole supplier
 * group (list, detail, purchase stats/history) and the dashboard are
 * invalidated so every screen converges on the same state. Failures
 * surface through `error` - never faked.
 */
function useSupplierMutation<TVars>(mutationFn: (vars: TVars) => Promise<Supplier>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (supplier) => {
      queryClient.setQueryData(suppliersKeys.detail(supplier.id), supplier);
      void queryClient.invalidateQueries({ queryKey: suppliersKeys.all });
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}

export function useCreateSupplier() {
  return useSupplierMutation<CreateSupplierInput>((input) => supplierService.createSupplier(input));
}

export function useUpdateSupplier() {
  return useSupplierMutation<{ id: string; input: UpdateSupplierInput }>(({ id, input }) =>
    supplierService.updateSupplier(id, input),
  );
}

export function useDeactivateSupplier() {
  return useSupplierMutation<{ id: string }>(({ id }) => supplierService.deactivateSupplier(id));
}

/** Flattens the purchase history pages, de-duplicating ids (refresh-safe). */
export function flattenSupplierPurchases(
  pages: SupplierPurchaseHistoryData[] | undefined,
): SupplierPurchaseSummary[] {
  const seen = new Set<string>();
  const list: SupplierPurchaseSummary[] = [];
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
