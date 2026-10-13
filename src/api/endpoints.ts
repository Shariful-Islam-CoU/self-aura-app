/**
 * API endpoint organization foundation.
 * No business endpoints are implemented yet; this is a scaffold so future modules
 * can add feature-scoped endpoint definitions consistently.
 */
export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    me: '/auth/me',
    register: '/auth/register',
    logout: '/auth/logout',
    changePassword: '/auth/change-password',
    bootstrapOwner: '/auth/bootstrap-owner',
    bootstrapStatus: '/auth/bootstrap-status',
  },
  health: {
    root: '/health',
    ready: '/health/ready',
  },
} as const;

export type ApiEndpoint = string;
