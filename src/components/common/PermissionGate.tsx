import { type ReactNode } from 'react';

import { usePermissions } from '@/hooks/usePermissions';
import type { PermissionKey } from '@/types';

interface PermissionGateProps {
  permission: PermissionKey | PermissionKey[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGate({ permission, children, fallback = null }: PermissionGateProps) {
  const { hasAnyPermission } = usePermissions();
  const allowed = Array.isArray(permission)
    ? hasAnyPermission(permission)
    : hasAnyPermission([permission]);

  if (!allowed) return fallback;
  return <>{children}</>;
}

interface AnyPermissionGateProps {
  permissions: PermissionKey[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function AnyPermissionGate({
  permissions,
  children,
  fallback = null,
}: AnyPermissionGateProps) {
  const { hasAnyPermission } = usePermissions();
  if (!hasAnyPermission(permissions)) return fallback;
  return <>{children}</>;
}

interface AllPermissionGateProps {
  permissions: PermissionKey[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function AllPermissionGate({
  permissions,
  children,
  fallback = null,
}: AllPermissionGateProps) {
  const { hasAllPermissions } = usePermissions();
  if (!hasAllPermissions(permissions)) return fallback;
  return <>{children}</>;
}
