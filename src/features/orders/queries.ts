import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { dashboardKeys } from '@/features/dashboard/queries';
import { orderService } from './services/orderService';
import type { Order, OrderListFilters, OrderStatus } from './types';

/** Backend caps `limit` at 100; 20 matches the backend default page size. */
export const ORDERS_PAGE_SIZE = 20;

/**
 * Query keys. Everything lives under 'orders' so a mutation can invalidate
 * the whole group with a prefix match, and each sub-key carries the state
 * that changes its response (filters/search/id) for automatic dedupe.
 */
export const ordersKeys = {
  all: ['orders'] as const,
  list: (filters: OrderListFilters, search: string) => ['orders', 'list', search, filters] as const,
  detail: (id: string) => ['orders', 'detail', id] as const,
  paymentSummary: (id: string) => ['orders', 'detail', id, 'payment-summary'] as const,
};

/**
 * Paginated order list (page N + filters + debounced search in the key).
 * `placeholderData` keeps the current page on screen while a filter/search
 * change loads, so typing never blanks the list; pull-to-refresh calls
 * `refetch()` which reloads the loaded pages with the same key (filters
 * are preserved automatically because they are part of the key).
 */
export function useOrdersInfinite(filters: OrderListFilters, search: string) {
  return useInfiniteQuery({
    queryKey: ordersKeys.list(filters, search),
    queryFn: ({ pageParam }) =>
      orderService.list({
        ...filters,
        search: search || undefined,
        page: pageParam,
        limit: ORDERS_PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined,
    placeholderData: (previous) => previous,
  });
}

/** Authoritative order detail - fetched by ID only, never passed around. */
export function useOrderDetails(orderId: string | undefined) {
  const id = orderId ?? '';
  return useQuery({
    queryKey: ordersKeys.detail(id),
    queryFn: () => orderService.getById(id),
    enabled: Boolean(id),
    staleTime: 15_000,
  });
}

/** Backend ledger totals; screens degrade to order fields if this fails. */
export function useOrderPaymentSummary(orderId: string | undefined) {
  const id = orderId ?? '';
  return useQuery({
    queryKey: ordersKeys.paymentSummary(id),
    queryFn: () => orderService.getPaymentSummary(id),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

/**
 * Status-change and cancel share one behavior: the server returns the
 * updated order, so the detail cache is set from that authoritative
 * response immediately (no optimistic guessing), then the affected order
 * detail, the order list and the dashboard (recent orders + KPIs) are
 * invalidated so Dashboard / Orders List / Order Details all converge on
 * the same state. Failures surface through `error` - never faked.
 */
function useOrderMutation<TVars>(
  mutationFn: (vars: TVars) => Promise<Order>,
  detailKey: (order: Order) => readonly unknown[],
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (order) => {
      queryClient.setQueryData(detailKey(order), order);
      void queryClient.invalidateQueries({ queryKey: ['orders', 'detail'] });
      void queryClient.invalidateQueries({ queryKey: ['orders', 'list'] });
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}

export function useUpdateOrderStatus() {
  return useOrderMutation<{ id: string; status: OrderStatus }>(
    ({ id, status }) => orderService.updateStatus(id, status),
    (order) => ordersKeys.detail(order.id),
  );
}

export function useCancelOrder() {
  return useOrderMutation<{ id: string }>(
    ({ id }) => orderService.cancel(id),
    (order) => ordersKeys.detail(order.id),
  );
}
