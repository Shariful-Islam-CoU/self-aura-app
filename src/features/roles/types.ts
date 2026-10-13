/**
 * Role types mirroring the backend Role API contract exactly
 * (models/Role.ts + validators/roleValidators.ts).
 * Nothing is invented.
 *
 * Backend surface (routes/role.routes.ts):
 *   MANAGEMENT (authenticate + requirePermission):
 *     GET    /management/roles           list roles (paginated, filter)
 *     GET    /management/roles/:id       get single role
 *     POST   /management/roles           create role
 *     PATCH  /management/roles/:id       update role
 *     PUT    /management/roles/:id/permissions update permissions
 *     DELETE /management/roles/:id       delete role (not system roles)
 */

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RolePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface RoleListData {
  roles: Role[];
  pagination: RolePagination;
}

export interface RoleListParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  isSystem?: boolean;
}

export interface CreateRoleInput {
  name: string;
  description?: string;
  permissions?: string[];
  isActive?: boolean;
}

export interface UpdateRoleInput {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateRolePermissionsInput {
  permissions: string[];
}