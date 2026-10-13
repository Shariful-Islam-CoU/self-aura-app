import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { roleService } from './services/roleService';
import type {
  CreateRoleInput,
  Role,
  RoleListParams,
  UpdateRoleInput,
  UpdateRolePermissionsInput,
} from './types';

export const ROLES_PAGE_SIZE = 20;

export const rolesKeys = {
  all: ['roles'] as const,
  list: (params: RoleListParams) => ['roles', 'list', params] as const,
  detail: (id: string) => ['roles', 'detail', id] as const,
};

export function useRolesInfinite(params: RoleListParams = {}) {
  return useInfiniteQuery({
    queryKey: rolesKeys.list(params),
    queryFn: ({ pageParam }) =>
      roleService.list({
        ...params,
        page: pageParam,
        limit: ROLES_PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined,
    placeholderData: (previous) => previous,
  });
}

export function useRoleDetails(roleId: string | undefined) {
  const id = roleId ?? '';
  return useQuery({
    queryKey: rolesKeys.detail(id),
    queryFn: () => roleService.getById(id),
    enabled: Boolean(id),
    staleTime: 15_000,
  });
}

function useRoleMutation<TVars>(mutationFn: (vars: TVars) => Promise<Role>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (role) => {
      queryClient.setQueryData(['roles', 'detail', role.id], role);
      void queryClient.invalidateQueries({ queryKey: ['roles', 'list'] });
    },
  });
}

export function useCreateRole() {
  return useRoleMutation<CreateRoleInput>((input) => roleService.create(input));
}

export function useUpdateRole(id: string) {
  return useRoleMutation<UpdateRoleInput>((input) => roleService.update(id, input));
}

export function useUpdateRolePermissions(id: string) {
  return useRoleMutation<UpdateRolePermissionsInput>((input) => roleService.updatePermissions(id, input));
}

export function useDeleteRole(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => roleService.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['roles', 'list'] });
    },
  });
}