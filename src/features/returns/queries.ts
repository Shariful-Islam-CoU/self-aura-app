import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { returnService } from './services/returnService';
import type { Return, ReturnListParams, UpdateReturnData, RejectReturnData } from './types';

export const RETURNS_PAGE_SIZE = 20;

export const returnsKeys = {
  all: ['returns'] as const,
  list: (params: ReturnListParams, search: string) => ['returns', 'list', search, params] as const,
  detail: (id: string) => ['returns', 'detail', id] as const,
};

export function useReturnsInfinite(params: ReturnListParams, search: string) {
  return useInfiniteQuery({
    queryKey: returnsKeys.list(params, search),
    queryFn: ({ pageParam }) =>
      returnService.list({
        ...params,
        search: search || undefined,
        page: pageParam,
        limit: RETURNS_PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined,
    placeholderData: (previous) => previous,
  });
}

export function useReturnDetails(returnId: string | undefined) {
  const id = returnId ?? '';
  return useQuery({
    queryKey: returnsKeys.detail(id),
    queryFn: () => returnService.getById(id),
    enabled: Boolean(id),
    staleTime: 15_000,
  });
}

function useReturnMutation<TVars>(mutationFn: (vars: TVars) => Promise<Return>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (returnData) => {
      queryClient.setQueryData(returnsKeys.detail(returnData.id), returnData);
      void queryClient.invalidateQueries({ queryKey: returnsKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useCreateReturn() {
  return useReturnMutation(returnService.create);
}

export function useUpdateReturn(id: string) {
  return useReturnMutation<UpdateReturnData>((input) => returnService.update(id, input));
}

export function useApproveReturn(id: string) {
  return useReturnMutation(() => returnService.approve(id));
}

export function useRejectReturn(id: string) {
  return useReturnMutation<RejectReturnData>((input) => returnService.reject(id, input));
}

export function useReceiveReturn(id: string) {
  return useReturnMutation(() => returnService.receive(id));
}

export function useCancelReturn(id: string) {
  return useReturnMutation(() => returnService.cancel(id));
}