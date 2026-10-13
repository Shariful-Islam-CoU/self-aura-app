import { useCallback, useMemo } from 'react';

import { useAuth } from '@/providers';
import type { PermissionKey } from '@/types';

export interface UsePermissionsReturn {
  permissions: string[];
  role: string | undefined;
  hasPermission: (permission: PermissionKey) => boolean;
  hasAnyPermission: (permissions: (PermissionKey | string)[]) => boolean;
  hasAllPermissions: (permissions: (PermissionKey | string)[]) => boolean;
}

export function usePermissions(): UsePermissionsReturn {
  const { user, permissions, canAccess } = useAuth();

  const hasPermission = useCallback(
    (permission: PermissionKey) => canAccess(permission),
    [canAccess],
  );

  const hasAnyPermission = useCallback(
    (keys: (PermissionKey | string)[]) => {
      if (keys.length === 0) return true;
      return keys.some((key) => canAccess(key as PermissionKey));
    },
    [canAccess],
  );

  const hasAllPermissions = useCallback(
    (keys: (PermissionKey | string)[]) => {
      if (keys.length === 0) return true;
      return keys.every((key) => canAccess(key as PermissionKey));
    },
    [canAccess],
  );

  return useMemo(
    () => ({
      permissions,
      role: user?.role,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
    }),
    [permissions, user?.role, hasPermission, hasAnyPermission, hasAllPermissions],
  );
}

export function useHasPermission(permission: PermissionKey): boolean {
  const { canAccess } = useAuth();
  return useMemo(() => canAccess(permission), [canAccess, permission]);
}
