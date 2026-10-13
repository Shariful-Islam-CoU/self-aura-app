import { useQuery } from '@tanstack/react-query';

import { permissionsService } from './services/permissionsService';

export const permissionsKeys = {
  all: ['permissions'] as const,
  list: () => ['permissions', 'list'] as const,
};

export function usePermissionsList() {
  return useQuery({
    queryKey: permissionsKeys.list(),
    queryFn: () => permissionsService.list(),
    staleTime: 60_000,
  });
}