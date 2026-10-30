import { apiClient } from './client';
import { API_ENDPOINTS } from './endpoints';
import type { ApiEnvelope } from './types';

export type PushPlatform = 'android' | 'ios';
export type PushProvider = 'expo';

export type NotificationType =
  | 'order.created'
  | 'payment.submitted'
  | 'order.cancelled';

/** Domain data stored on an inbox event and echoed in its push payload. */
export interface NotificationData {
  type?: NotificationType | string;
  orderId?: string;
  orderNumber?: string;
  paymentId?: string;
  paymentMethod?: string;
  url?: string;
  notificationId?: string;
  [key: string]: unknown;
}

export interface InboxNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: NotificationData;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationListData {
  items: InboxNotification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DeviceTokenInput {
  token: string;
  platform: PushPlatform;
  provider?: PushProvider;
  deviceId?: string;
  appVersion?: string;
}

export interface DeviceToken {
  id: string;
  token: string;
  provider: PushProvider;
  platform: PushPlatform;
  deviceId?: string;
  appVersion?: string;
  isActive: boolean;
  lastSeenAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface PushSendResult {
  requested: number;
  accepted: number;
  failed: number;
  skipped: boolean;
  tickets: {
    token: string;
    status: 'ok' | 'error';
    ticketId?: string;
    error?: string;
  }[];
}

export const notificationsApi = {
  register: (body: DeviceTokenInput) =>
    apiClient.post<{
      success: boolean;
      message: string;
      data: { device: DeviceToken };
    }>(API_ENDPOINTS.notifications.registerDeviceToken, body),

  /** Paginated inbox for the signed-in staff member only. */
  listInbox: async (params: {
    page?: number;
    limit?: number;
    unread?: boolean;
  }): Promise<NotificationListData> => {
    const res = await apiClient.get<ApiEnvelope<NotificationListData>>(
      API_ENDPOINTS.notifications.inbox,
      {
        params: {
          page: params.page,
          limit: params.limit,
          unread: params.unread ? 'true' : undefined,
        },
      }
    );
    return res.data;
  },

  /** Backend aggregate used by the Home bell badge. */
  getUnreadCount: async (): Promise<number> => {
    const res = await apiClient.get<ApiEnvelope<{ count: number }>>(
      API_ENDPOINTS.notifications.unreadCount
    );
    return res.data.count;
  },

  markRead: (id: string) =>
    apiClient.patch<ApiEnvelope<{ notification: InboxNotification }>>(
      API_ENDPOINTS.notifications.markRead(id)
    ),

  markAllRead: () =>
    apiClient.post<ApiEnvelope<{ updated: number }>>(
      API_ENDPOINTS.notifications.markAllRead,
      {}
    ),

  list: () =>
    apiClient.get<{
      success: boolean;
      message: string;
      data: { devices: DeviceToken[] };
    }>(API_ENDPOINTS.notifications.deviceTokens),

  unregister: (token: string) =>
    apiClient.delete(
      API_ENDPOINTS.notifications.unregisterDeviceToken(
        encodeURIComponent(token)
      )
    ),

  sendTest: (body?: { title?: string; body?: string; url?: string }) =>
    apiClient.post<{
      success: boolean;
      message: string;
      data: PushSendResult;
    }>(API_ENDPOINTS.notifications.test, body ?? {}),
};
