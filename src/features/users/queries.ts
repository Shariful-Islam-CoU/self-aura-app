import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { userService } from './services/userService';
import type {
  ChangeRoleInput,
  CreateUserInput,
  ResetPasswordInput,
  UpdateUserInput,
  User,
  UserListParams,
} from './types';

export const USERS_PAGE_SIZE = 20;

export const usersKeys = {
  all: ['users'] as const,
  list: (params: UserListParams) => ['users', 'list', params] as const,
  detail: (id: string) => ['users', 'detail', id] as const,
};

export function useUsersInfinite(params: UserListParams = {}) {
  return useInfiniteQuery({
    queryKey: usersKeys.list(params),
    queryFn: ({ pageParam }) =>
      userService.list({
        ...params,
        page: pageParam,
        limit: USERS_PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined,
    placeholderData: (previous) => previous,
  });
}

export function useUserDetails(userId: string | undefined) {
  const id = userId ?? '';
  return useQuery({
    queryKey: usersKeys.detail(id),
    queryFn: () => userService.getById(id),
    enabled: Boolean(id),
    staleTime: 15_000,
  });
}

function useUserMutation<TVars>(mutationFn: (vars: TVars) => Promise<User>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (user) => {
      queryClient.setQueryData(['users', 'detail', user.id], user);
      void queryClient.invalidateQueries({ queryKey: ['users', 'list'] });
    },
  });
}

export function useCreateUser() {
  return useUserMutation<CreateUserInput>((input) => userService.create(input));
}

export function useUpdateUser(id: string) {
  return useUserMutation<UpdateUserInput>((input) => userService.update(id, input));
}

export function useApproveUser(id: string) {
  return useUserMutation(() => userService.approve(id));
}

export function useRejectUser(id: string) {
  return useUserMutation(() => userService.reject(id));
}

export function useEnableUser(id: string) {
  return useUserMutation(() => userService.enable(id));
}

export function useDisableUser(id: string) {
  return useUserMutation(() => userService.disable(id));
}

export function useChangeUserRole(id: string) {
  return useUserMutation<ChangeRoleInput>((input) => userService.changeRole(id, input));
}

export function useResetUserPassword(id: string) {
  return useUserMutation<ResetPasswordInput>((input) => userService.resetPassword(id, input));
}