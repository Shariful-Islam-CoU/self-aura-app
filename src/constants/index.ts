/**
 * App-wide constants that are NOT feature-specific.
 *
 * Endpoint paths deliberately live NEXT TO the feature that calls them
 * (e.g. `features/auth/api/authApi.ts`), never in one giant central list -
 * see the "Architecture & Development Rules" section of the README.
 */

/** Backend built-in role names (`self_aura_backend/src/constants/roles.ts`). */
export const ROLES = {
  OWNER: 'owner',
  MANAGER: 'manager',
  STAFF: 'staff',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/** List pagination defaults, aligned with the web app. */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
} as const;
