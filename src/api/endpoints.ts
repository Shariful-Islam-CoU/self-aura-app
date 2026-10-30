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
  notifications: {
    inbox: '/notifications',
    unreadCount: '/notifications/unread-count',
    markRead: (id: string) => `/notifications/${id}/read`,
    markAllRead: '/notifications/read-all',
    deviceTokens: '/notifications/device-tokens',
    registerDeviceToken: '/notifications/device-tokens',
    unregisterDeviceToken: (token: string) =>
      `/notifications/device-tokens/${token}`,
    test: '/notifications/test',
  },
} as const;

export type ApiEndpoint = string;
