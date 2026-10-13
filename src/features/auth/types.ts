/**
 * Session types matching the `self_aura_backend` auth/user contracts.
 *
 * Source of truth: backend `SafeUser` + `AuthorizedUser` (src/types/user.ts,
 * src/types/auth.ts) as serialized to JSON by POST /auth/login and GET /auth/me.
 * Kept in sync with `self_aura_frontend/src/features/auth/types.ts`.
 */

export type UserStatus = 'active' | 'pending' | 'rejected' | 'disabled';

/**
 * The signed-in user, including the effective permission keys resolved by the
 * backend on every request. `permissions` is a UI snapshot only: the backend
 * remains the authorization source of truth (a stale snapshot produces a 403,
 * never an automatic logout).
 */
export interface AuthUser {
  id: string;
  username: string;
  name: string;
  email: string;
  phone: string;
  /** Built-in role name; custom role names are supported by the backend. */
  role: string;
  status: UserStatus;
  isActive: boolean;
  isPrincipalOwner: boolean;
  approvedAt: string | null;
  approvedBy: string | null;
  createdAt: string;
  updatedAt: string;
  /** Effective permission keys, e.g. `"orders.view"`. */
  permissions: string[];
}

/** What a successful login persists: the JWT plus its user. */
export interface AuthSession {
  user: AuthUser;
  token: string;
}
