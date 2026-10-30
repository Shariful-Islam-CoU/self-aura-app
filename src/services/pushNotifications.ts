import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { notificationsApi } from '@/api/notifications';
import { clearStoredPushToken, getStoredPushToken, setStoredPushToken } from '@/features/auth/pushTokenStorage';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const ANDROID_CHANNEL_ID = 'general';
const ANDROID_CHANNELS = [
  {
    id: 'general',
    name: 'General',
    importance: Notifications.AndroidImportance.DEFAULT,
  },
  {
    id: 'orders',
    name: 'Orders',
    importance: Notifications.AndroidImportance.HIGH,
  },
  {
    id: 'inventory',
    name: 'Inventory',
    importance: Notifications.AndroidImportance.DEFAULT,
  },
] as const;

let lastToken: string | null = null;
let registered = false;
let unregistering = false;

function getProjectId(): string | undefined {
  const expoConfig: any = (Constants as any).expoConfig;
  const easConfig: any = (Constants as any).easConfig;
  return (
    expoConfig?.extra?.eas?.projectId ||
    easConfig?.projectId ||
    expoConfig?.eas?.projectId
  );
}

export async function ensureAndroidChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;
  for (const channel of ANDROID_CHANNELS) {
    await Notifications.setNotificationChannelAsync(channel.id, channel);
  }
}

export async function getExpoPushToken(): Promise<string | null> {
  if (!Device.isDevice) {
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  await ensureAndroidChannels();

  const projectId = getProjectId();
  const token = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined
  );

  return token.data;
}

export async function registerDeviceForPush(): Promise<string | null> {
  try {
    const token = await getExpoPushToken();
    if (!token) return null;

    lastToken = token;
    await setStoredPushToken(token);

    if (registered) return token;

    await notificationsApi.register({
      token,
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
      deviceId: Device.modelId || Device.deviceName || undefined,
      appVersion: Constants.expoConfig?.version || undefined,
    });
    registered = true;
    return token;
  } catch {
    return null;
  }
}

export async function unregisterDeviceForPush(): Promise<void> {
  if (unregistering) return;
  unregistering = true;
  try {
    let token = lastToken;
    if (!token) {
      token = await getStoredPushToken();
    }
    if (token) {
      await notificationsApi.unregister(token);
    }
  } catch {
    // Best effort: logout should not fail because push cleanup failed.
  } finally {
    lastToken = null;
    registered = false;
    unregistering = false;
    await clearStoredPushToken();
  }
}

export function addNotificationReceivedListener(
  handler: (notification: Notifications.Notification) => void
) {
  return Notifications.addNotificationReceivedListener(handler);
}

export function addNotificationResponseListener(
  handler: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(handler);
}

export { ANDROID_CHANNEL_ID };
