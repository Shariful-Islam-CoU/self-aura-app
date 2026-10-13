/**
 * User types mirroring the backend User API contract exactly
 * (models/User.ts + constants/roles.ts + validators/userValidators.ts).
 * Nothing is invented.
 *
 * Backend surface (routes/user.routes.ts):
 *   MANAGEMENT (authenticate + requirePermission):
 *     GET    /management/users                    list users (paginated, filter)
 *     GET    /management/users/:id                get single user
 *     POST   /management/users                    create user
 *     PATCH  /management/users/:id                update user
 *     POST   /management/users/:id/approve        approve user
 *     POST   /management/users/:id/reject         reject user
 *     POST   /management/users/:id/enable         enable user
 *     POST   /management/users/:id/disable        disable user
 *     POST   /management/users/:id/change-role    change role
 *     POST   /management/users/:id/reset-password reset password
 *     DELETE /management/users/:id                disable user (soft delete)
 */

export const USER_STATUSES = ['pending', 'active', 'rejected', 'disabled'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const USER_ROLES = ['owner', 'manager', 'staff'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  isActive: boolean;
  isPrincipalOwner: boolean;
  approvedAt?: string | null;
  approvedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface UserListData {
  users: User[];
  pagination: UserPagination;
}

export interface UserListParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  isActive?: boolean;
}

export interface CreateUserInput {
  username: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  role?: UserRole;
}

export interface UpdateUserInput {
  username?: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface ChangeRoleInput {
  role: UserRole;
}

export interface ResetPasswordInput {
  newPassword: string;
}