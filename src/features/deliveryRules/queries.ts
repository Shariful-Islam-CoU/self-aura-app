import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { deliveryRuleService } from './services/deliveryRuleService';
import type {
  CreateDeliveryRuleInput,
  DeliveryRule,
  DeliveryRuleListParams,
  UpdateDeliveryRuleInput,
} from './types';

export const DELIVERY_RULES_PAGE_SIZE = 20;

export const deliveryRulesKeys = {
  all: ['deliveryRules'] as const,
  list: (params: DeliveryRuleListParams, search: string) =>
    ['deliveryRules', 'list', search, params] as const,
  detail: (id: string) => ['deliveryRules', 'detail', id] as const,
};

export function useDeliveryRulesInfinite(params: DeliveryRuleListParams, search: string) {
  return useInfiniteQuery({
    queryKey: deliveryRulesKeys.list(params, search),
    queryFn: ({ pageParam }) =>
      deliveryRuleService.list({
        ...params,
        search: search || undefined,
        page: pageParam,
        limit: DELIVERY_RULES_PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined,
    placeholderData: (previous) => previous,
  });
}

export function useDeliveryRuleDetails(ruleId: string | undefined) {
  const id = ruleId ?? '';
  return useQuery({
    queryKey: deliveryRulesKeys.detail(id),
    queryFn: () => deliveryRuleService.getById(id),
    enabled: Boolean(id),
    staleTime: 15_000,
  });
}

function useDeliveryRuleMutation<TVars>(mutationFn: (vars: TVars) => Promise<DeliveryRule>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (rule) => {
      queryClient.setQueryData(deliveryRulesKeys.detail(rule._id), rule);
      void queryClient.invalidateQueries({ queryKey: deliveryRulesKeys.all });
    },
  });
}

export function useCreateDeliveryRule() {
  return useDeliveryRuleMutation<CreateDeliveryRuleInput>((input) =>
    deliveryRuleService.create(input),
  );
}

export function useUpdateDeliveryRule(id: string) {
  return useDeliveryRuleMutation<UpdateDeliveryRuleInput>((input) =>
    deliveryRuleService.update(id, input),
  );
}

/** Toggle is id-driven so a whole list can share one mutation instance. */
export function useToggleDeliveryRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; isActive: boolean }) =>
      deliveryRuleService.toggle(vars.id, { isActive: vars.isActive }),
    onSuccess: (rule) => {
      queryClient.setQueryData(deliveryRulesKeys.detail(rule._id), rule);
      void queryClient.invalidateQueries({ queryKey: deliveryRulesKeys.all });
    },
  });
}

export function useDeleteDeliveryRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deliveryRuleService.delete(id),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: deliveryRulesKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: deliveryRulesKeys.all });
    },
  });
}
