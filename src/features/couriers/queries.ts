import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { dashboardKeys } from '@/features/dashboard/queries';
import { shipmentsKeys } from '@/features/shipments/queries';
import { courierService } from './services/courierService';
import type { Courier, CourierListParams, CreateCourierData, UpdateCourierData } from './types';
import type { CreatePickupData, CourierPickup, PickupStatus } from './pickupTypes';

export const COURIERS_PAGE_SIZE = 20;

export const couriersKeys = {
  all: ['couriers'] as const,
  list: (params: CourierListParams, search: string) => ['couriers', 'list', search, params] as const,
  detail: (id: string) => ['couriers', 'detail', id] as const,
  pickups: (courierId: string, status?: PickupStatus) =>
    ['couriers', 'pickups', courierId, status ?? 'all'] as const,
  pickupStations: (courierId: string) => ['couriers', 'pickup-stations', courierId] as const,
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

// ─── Pickups ────────────────────────────────────────────────────────────

/** Pickups requested for a courier; `requested` ones sort first on the server. */
export function useCourierPickups(courierId: string | undefined, status?: PickupStatus) {
  const id = courierId ?? '';
  return useQuery({
    queryKey: couriersKeys.pickups(id, status),
    queryFn: () => courierService.listPickups(id, { status, limit: 50 }),
    enabled: Boolean(id),
    staleTime: 15_000,
  });
}

/** Thana directory for the pickup form. Large and slow-changing. */
export function usePickupStations(courierId: string | undefined, enabled = true) {
  const id = courierId ?? '';
  return useQuery({
    queryKey: couriersKeys.pickupStations(id),
    queryFn: () => courierService.listPickupStations(id),
    enabled: Boolean(id) && enabled,
    staleTime: 10 * 60_000,
  });
}

/**
 * Every pickup mutation also refreshes shipments: a requested pickup attaches
 * parcels, and that changes their detail view.
 */
function usePickupMutation<TVars>(mutationFn: (vars: TVars) => Promise<CourierPickup>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: couriersKeys.all });
      void queryClient.invalidateQueries({ queryKey: shipmentsKeys.all });
    },
  });
}

export function useRequestPickup(courierId: string) {
  return usePickupMutation((input: CreatePickupData) =>
    courierService.requestPickup(courierId, input),
  );
}

export function useUpdatePickup(courierId: string) {
  return usePickupMutation(
    (vars: { pickupId: string; status: Exclude<PickupStatus, 'requested'>; note?: string }) =>
      courierService.updatePickup(courierId, vars.pickupId, {
        status: vars.status,
        note: vars.note,
      }),
  );
}

export function useAddPickupShipments(courierId: string) {
  return usePickupMutation((vars: { pickupId: string; shipmentIds: string[] }) =>
    courierService.addPickupShipments(courierId, vars.pickupId, vars.shipmentIds),
  );
}
