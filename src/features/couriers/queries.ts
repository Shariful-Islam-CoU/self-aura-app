import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { dashboardKeys } from '@/features/dashboard/queries';
import { courierService } from './services/courierService';
import type { Courier, CourierListParams, CreateCourierData, UpdateCourierData } from './types';

export const COURIERS_PAGE_SIZE = 20;

export const couriersKeys = {
  all: ['couriers'] as const,
  list: (params: CourierListParams, search: string) => ['couriers', 'list', search, params] as const,
  detail: (id: string) => ['couriers', 'detail', id] as const,
};

export function useCouriersInfinite(params: CourierListParams, search: string) {
  return useInfiniteQuery({
    queryKey: couriersKeys.list(params, search),
    queryFn: ({ pageParam }) =>
      courierService.list({
        ...params,
        search: search || undefined,
        page: pageParam,
        limit: COURIERS_PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined,
    placeholderData: (previous) => previous,
  });
}

export function useCourierDetails(courierId: string | undefined) {
  const id = courierId ?? '';
  return useQuery({
    queryKey: couriersKeys.detail(id),
    queryFn: () => courierService.getById(id),
    enabled: Boolean(id),
    staleTime: 15_000,
  });
}

function useCourierMutation<TVars>(mutationFn: (vars: TVars) => Promise<Courier>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (courier) => {
      queryClient.setQueryData(couriersKeys.detail(courier.id), courier);
      void queryClient.invalidateQueries({ queryKey: couriersKeys.all });
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}

export function useCreateCourier() {
  return useCourierMutation<CreateCourierData>((input) => courierService.create(input));
}

export function useUpdateCourier(id: string) {
  return useCourierMutation<UpdateCourierData>((input) => courierService.update(id, input));
}

export function useDeactivateCourier(id: string) {
  return useCourierMutation(() => courierService.deactivate(id));
}
