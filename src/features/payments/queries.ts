import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { dashboardKeys } from '@/features/dashboard/queries';
import { ordersKeys } from '@/features/orders/queries';
import { orderService } from '@/features/orders/services/orderService';

import { paymentService } from './services/paymentService';
import type {
  CreatePaymentInput,
  Payment,
  PaymentListData,
  PaymentListFilters,
  PaymentSummaryParams,
  RefundPaymentInput,
  RejectPaymentInput,
  UpdatePaymentInput,
} from './types';

/** Backend caps `limit` at 100; 20 matches the backend default page size. */
export const PAYMENTS_PAGE_SIZE = 20;

/**
 * Query keys. Everything payment-related lives under 'payments' so a mutation
 * can invalidate the whole group with a prefix match (payment lists, details
 * and the summary), and each sub-key carries the state that changes its
 * response (filters/search/params) for automatic dedupe.
 *
 * The order picker used by the create form is keyed under a separate root
 * (it fetches *orders*, not payments) so payment mutations never refetch it.
 */
export const paymentsKeys = {
  all: ['payments'] as const,
  list: (filters: PaymentListFilters, search: string) =>
    ['payments', 'list', search, filters] as const,
  detail: (id: string) => ['payments', 'detail', id] as const,
  summary: (params: PaymentSummaryParams) => ['payments', 'summary', params] as const,
  orderLookup: (search: string) => ['payment-order-lookup', search] as const,
};

/**
 * Paginated payment list (page N + filters + debounced search in the key).
 * `placeholderData` keeps the current page on screen while a filter/search
 * change loads; pull-to-refresh calls `refetch()` which reloads the loaded
 * pages with the same key (filters are preserved because they are part of
 * the key).
 */
export function usePaymentsInfinite(filters: PaymentListFilters, search: string, enabled = true) {
  return useInfiniteQuery({
    queryKey: paymentsKeys.list(filters, search),
    queryFn: ({ pageParam }) =>
      paymentService.listPayments({
        ...filters,
        search: search || undefined,
        page: pageParam,
        limit: PAYMENTS_PAGE_SIZE,
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

/** Authoritative payment detail - fetched by ID only, never passed around. */
export function usePaymentDetails(paymentId: string | undefined) {
  const id = paymentId ?? '';
  return useQuery({
    queryKey: paymentsKeys.detail(id),
    queryFn: () => paymentService.getPayment(id),
    enabled: Boolean(id),
    staleTime: 15_000,
  });
}

/** Backend-computed ledger totals for the active filters (payments.view). */
export function usePaymentSummary(params: PaymentSummaryParams, enabled: boolean) {
  return useQuery({
    queryKey: paymentsKeys.summary(params),
    queryFn: () => paymentService.getPaymentSummary(params),
    enabled,
    staleTime: 60_000,
  });
}

/**
 * Order lookup for the create form. Uses the existing Orders module
 * (`GET /orders`) - search is server-side and debounced by the picker. The
 * returned orders are rendered as-is; no order business logic is duplicated.
 */
export function usePaymentOrderLookup(search: string, enabled = true) {
  const term = search.trim();
  return useQuery({
    queryKey: paymentsKeys.orderLookup(term),
    queryFn: () =>
      orderService.list({
        search: term || undefined,
        limit: 50,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }),
    enabled,
    staleTime: 30_000,
    select: (data) => data.orders,
  });
}

/**
 * Every payment mutation funnels through here. The server returns the updated
 * payment, so the detail cache is set from that authoritative response
 * immediately (no optimistic guessing), then the payment group is invalidated.
 *
 * Ledger-affecting mutations (create/verify/reject/cancel/refund) also
 * invalidate the order group (order detail + list + backend ledger summary)
 * and the dashboard, because the backend recomputes the order's payment
 * status and totals. Editing method/date/reference/note does not move money,
 * so it does not touch orders/dashboard.
 */
function usePaymentMutation<TVars, TResult extends Payment>(
  mutationFn: (vars: TVars) => Promise<TResult>,
  options: { affectsLedger?: boolean } = {},
) {
  const queryClient = useQueryClient();
  const affectsLedger = options.affectsLedger ?? false;

  return useMutation({
    mutationFn,
    onSuccess: (payment) => {
      queryClient.setQueryData(paymentsKeys.detail(payment.id), payment);
      void queryClient.invalidateQueries({ queryKey: paymentsKeys.all });
      if (affectsLedger) {
        void queryClient.invalidateQueries({ queryKey: ordersKeys.all });
        void queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
      }
    },
  });
}

export function useCreatePayment() {
  return usePaymentMutation<CreatePaymentInput, Payment>(
    (input) => paymentService.createPayment(input),
    { affectsLedger: true },
  );
}

export function useUpdatePayment() {
  return usePaymentMutation<{ id: string; input: UpdatePaymentInput }, Payment>(({ id, input }) =>
    paymentService.updatePayment(id, input),
  );
}

export function useCancelPayment() {
  return usePaymentMutation<string, Payment>((id) => paymentService.cancelPayment(id), {
    affectsLedger: true,
  });
}

export function useRefundPayment() {
  return usePaymentMutation<{ id: string; input: RefundPaymentInput }, Payment>(
    ({ id, input }) => paymentService.refundPayment(id, input),
    { affectsLedger: true },
  );
}

export function useVerifyPayment() {
  return usePaymentMutation<string, Payment>((id) => paymentService.verifyPayment(id), {
    affectsLedger: true,
  });
}

export function useRejectPayment() {
  return usePaymentMutation<{ id: string; input: RejectPaymentInput }, Payment>(
    ({ id, input }) => paymentService.rejectPayment(id, input),
    { affectsLedger: true },
  );
}

/** Flattens the payment pages, de-duplicating ids (refresh-safe). */
export function flattenPayments(pages: PaymentListData[] | undefined): Payment[] {
  const seen = new Set<string>();
  const list: Payment[] = [];
  for (const page of pages ?? []) {
    for (const payment of page.payments) {
      if (!seen.has(payment.id)) {
        seen.add(payment.id);
        list.push(payment);
      }
    }
  }
  return list;
}
