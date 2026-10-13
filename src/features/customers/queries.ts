import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { dashboardKeys } from '@/features/dashboard/queries';
import { ordersKeys } from '@/features/orders/queries';
import { orderService } from '@/features/orders/services/orderService';
import type { Order, OrderListFilters } from '@/features/orders/types';
import { customerService } from './services/customerService';
import type {
  CreateCustomerInput,
  Customer,
  CustomerListFilters,
  UpdateCustomerInput,
} from './types';

/** Backend caps `limit` at 100; 20 matches the backend default page size. */
export const CUSTOMERS_PAGE_SIZE = 20;

/** Page size for the per-customer order history section. */
export const CUSTOMER_HISTORY_PAGE_SIZE = 10;

/**
 * Query keys. Everything customer-related lives under 'customers' so a
 * mutation can invalidate the whole group with a prefix match, and each
 * sub-key carries the state that changes its response (filters/search/id)
 * for automatic dedupe.
 */
export const customersKeys = {
  all: ['customers'] as const,
  list: (filters: CustomerListFilters, search: string) =>
    ['customers', 'list', search, filters] as const,
  detail: (id: string) => ['customers', 'detail', id] as const,
  stats: ['customers', 'stats'] as const,
};

/**
 * Customer order history reuses the Orders API (`GET /orders?customer=…`)
 * instead of a second order system. The key is built with `ordersKeys`
 * so it lives in the orders cache namespace: Step 9 mutations that
 * invalidate `['orders', 'list']` refresh this history automatically,
 * and nothing here can drift from the Orders module's cache shape.
 */
export const customerHistoryFilters = (customerId: string): OrderListFilters => ({
  customer: customerId,
  sortBy: 'createdAt',
  sortOrder: 'desc',
});

export const customerOrdersKey = (customerId: string) =>
  ordersKeys.list(customerHistoryFilters(customerId), '');

/**
 * Paginated customer list (page N + filters + debounced search in the key).
 * `placeholderData` keeps the current page on screen while a filter/search
 * change loads; pull-to-refresh calls `refetch()` which reloads the loaded
 * pages with the same key (filters are preserved because they are part of
 * the key).
 */
export function useCustomersInfinite(filters: CustomerListFilters, search: string) {
  return useInfiniteQuery({
    queryKey: customersKeys.list(filters, search),
    queryFn: ({ pageParam }) =>
      customerService.list({
        ...filters,
        search: search || undefined,
        page: pageParam,
        limit: CUSTOMERS_PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined,
    placeholderData: (previous) => previous,
  });
}

/** Authoritative customer detail - fetched by ID only, never passed around. */
export function useCustomerDetails(customerId: string | undefined) {
  const id = customerId ?? '';
  return useQuery({
    queryKey: customersKeys.detail(id),
    queryFn: () => customerService.getById(id),
    enabled: Boolean(id),
    staleTime: 15_000,
  });
}

/** Backend-computed business totals (`GET /reports/customers`). */
export function useCustomerStats() {
  return useQuery({
    queryKey: customersKeys.stats,
    queryFn: () => customerService.getStats(),
    staleTime: 60_000,
  });
}

/**
 * A customer's order history - first page plus manual "load more"
 * pagination (the detail screen renders a plain list, not a VirtualizedList,
 * so infinite scroll is button-driven to stay inside a ScrollView).
 */
export function useCustomerOrderHistory(customerId: string | undefined, enabled: boolean) {
  const id = customerId ?? '';
  return useInfiniteQuery({
    queryKey: customerOrdersKey(id),
    queryFn: ({ pageParam }) =>
      orderService.list({
        ...customerHistoryFilters(id),
        page: pageParam,
        limit: CUSTOMER_HISTORY_PAGE_SIZE,
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
 * updated customer, so the detail cache is set from that authoritative
 * response immediately (no optimistic guessing), then the whole customer
 * group (list, detail, stats) and the dashboard (customer KPIs) are
 * invalidated so every screen converges on the same state. Failures
 * surface through `error` - never faked.
 */
function useCustomerMutation<TVars>(mutationFn: (vars: TVars) => Promise<Customer>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (customer) => {
      queryClient.setQueryData(customersKeys.detail(customer.id), customer);
      void queryClient.invalidateQueries({ queryKey: customersKeys.all });
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}

export function useCreateCustomer() {
  return useCustomerMutation<CreateCustomerInput>((input) => customerService.create(input));
}

export function useUpdateCustomer() {
  return useCustomerMutation<{ id: string; input: UpdateCustomerInput }>(({ id, input }) =>
    customerService.update(id, input),
  );
}

export function useDeactivateCustomer() {
  return useCustomerMutation<{ id: string }>(({ id }) => customerService.deactivate(id));
}

/** Flattens the history pages, de-duplicating ids (refresh-safe). */
export function flattenCustomerOrders(pages: { orders: Order[] }[] | undefined): Order[] {
  const seen = new Set<string>();
  const list: Order[] = [];
  for (const page of pages ?? []) {
    for (const order of page.orders) {
      if (!seen.has(order.id)) {
        seen.add(order.id);
        list.push(order);
      }
    }
  }
  return list;
}
