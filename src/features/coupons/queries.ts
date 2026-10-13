import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { dashboardKeys } from '@/features/dashboard/queries';
import { couponService } from './services/couponService';
import type { Coupon, CouponListParams, CreateCouponInput, UpdateCouponInput, ToggleCouponStatusInput } from './types';

export const COUPONS_PAGE_SIZE = 20;

export const couponsKeys = {
  all: ['coupons'] as const,
  list: (params: CouponListParams, search: string) => ['coupons', 'list', search, params] as const,
  detail: (id: string) => ['coupons', 'detail', id] as const,
};

export function useCouponsInfinite(params: CouponListParams, search: string) {
  return useInfiniteQuery({
    queryKey: couponsKeys.list(params, search),
    queryFn: ({ pageParam }) =>
      couponService.list({
        ...params,
        search: search || undefined,
        page: pageParam,
        limit: COUPONS_PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined,
    placeholderData: (previous) => previous,
  });
}

export function useCouponDetails(couponId: string | undefined) {
  const id = couponId ?? '';
  return useQuery({
    queryKey: couponsKeys.detail(id),
    queryFn: () => couponService.getById(id),
    enabled: Boolean(id),
    staleTime: 15_000,
  });
}

function useCouponMutation<TVars>(mutationFn: (vars: TVars) => Promise<Coupon>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (coupon) => {
      queryClient.setQueryData(couponsKeys.detail(coupon.id), coupon);
      void queryClient.invalidateQueries({ queryKey: couponsKeys.all });
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}

export function useCreateCoupon() {
  return useCouponMutation<CreateCouponInput>((input) => couponService.create(input));
}

export function useUpdateCoupon(id: string) {
  return useCouponMutation<UpdateCouponInput>((input) => couponService.update(id, input));
}

export function useDeleteCoupon(id: string) {
  return useCouponMutation(() => couponService.delete(id));
}

export function useToggleCouponStatus(id: string) {
  return useCouponMutation<ToggleCouponStatusInput>((input) => couponService.toggleStatus(id, input));
}