import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { dashboardKeys } from '@/features/dashboard/queries';
import { shipmentService } from './services/shipmentService';
import type {
  CreateShipmentData,
  Shipment,
  ShipmentListParams,
  UpdateShipmentData,
  UpdateShipmentStatusData,
} from './types';

export const SHIPMENTS_PAGE_SIZE = 20;

export const shipmentsKeys = {
  all: ['shipments'] as const,
  list: (params: ShipmentListParams, search: string) =>
    ['shipments', 'list', search, params] as const,
  detail: (id: string) => ['shipments', 'detail', id] as const,
  history: (id: string) => ['shipments', 'history', id] as const,
};

export function useShipmentsInfinite(params: ShipmentListParams, search: string) {
  return useInfiniteQuery({
    queryKey: shipmentsKeys.list(params, search),
    queryFn: ({ pageParam }) =>
      shipmentService.list({
        ...params,
        search: search || undefined,
        page: pageParam,
        limit: SHIPMENTS_PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined,
    placeholderData: (previous) => previous,
  });
}

export function useShipmentDetails(shipmentId: string | undefined) {
  const id = shipmentId ?? '';
  return useQuery({
    queryKey: shipmentsKeys.detail(id),
    queryFn: () => shipmentService.getById(id),
    enabled: Boolean(id),
    staleTime: 15_000,
  });
}

export function useShipmentHistory(shipmentId: string | undefined) {
  const id = shipmentId ?? '';
  return useQuery({
    queryKey: shipmentsKeys.history(id),
    queryFn: () => shipmentService.getHistory(id),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

function useShipmentMutation<TVars>(mutationFn: (vars: TVars) => Promise<Shipment>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (shipment) => {
      queryClient.setQueryData(shipmentsKeys.detail(shipment.id), shipment);
      void queryClient.invalidateQueries({ queryKey: shipmentsKeys.all });
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}

export function useCreateShipment() {
  return useShipmentMutation((input: CreateShipmentData) => shipmentService.create(input));
}

export function useUpdateShipment(id: string) {
  return useShipmentMutation<UpdateShipmentData>((input) => shipmentService.update(id, input));
}

export function useUpdateShipmentStatus(id: string) {
  return useShipmentMutation<UpdateShipmentStatusData>((input) =>
    shipmentService.updateStatus(id, input),
  );
}

export function useCancelShipment(id: string) {
  return useShipmentMutation(() => shipmentService.cancel(id));
}
