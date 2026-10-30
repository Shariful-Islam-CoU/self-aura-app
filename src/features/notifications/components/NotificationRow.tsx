import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { InboxNotification } from '@/api/notifications';
import { Text } from '@/components/ui';
import { useTheme } from '@/providers';
import { radius, spacing, type StatusTone, type ThemeColors } from '@/theme';
import { formatDateTime } from '@/utils/format';
import type { IconName } from '@/types';

const TYPE_UI: Record<string, { icon: IconName; tone: StatusTone }> = {
  'order.created': { icon: 'receipt-outline', tone: 'info' },
  'payment.submitted': { icon: 'card-outline', tone: 'warning' },
  'order.cancelled': { icon: 'close-circle-outline', tone: 'danger' },
};

const TONE_KEYS: Record<
  StatusTone,
  { background: keyof ThemeColors; foreground: keyof ThemeColors }
> = {
  neutral: { background: 'surfaceMuted', foreground: 'textSecondary' },
  primary: { background: 'primarySoft', foreground: 'primaryOnSoft' },
  success: { background: 'successSoft', foreground: 'successOnSoft' },
  warning: { background: 'warningSoft', foreground: 'warningOnSoft' },
  danger: { background: 'dangerSoft', foreground: 'dangerOnSoft' },
  info: { background: 'infoSoft', foreground: 'infoOnSoft' },
};

export interface NotificationRowProps {
  notification: InboxNotification;
  onPress: (notification: InboxNotification) => void;
}

/**
 * One inbox event: type icon, title/body, time and an unread marker. The whole
 * row is a single accessible button; unread state is announced in its label.
 */
export function NotificationRow({ notification, onPress }: NotificationRowProps) {
  const { theme } = useTheme();
  const ui = TYPE_UI[notification.type] ?? {
    icon: 'notifications-outline',
    tone: 'neutral',
  };
  const palette = TONE_KEYS[ui.tone];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[
        notification.isRead ? 'Read' : 'Unread',
        notification.title,
        notification.body,
        formatDateTime(notification.createdAt),
      ].join(', ')}
      onPress={() => onPress(notification)}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: notification.isRead
            ? theme.colors.surface
            : theme.colors.primarySoft,
          borderColor: theme.colors.border,
        },
        { opacity: pressed ? 0.74 : 1 },
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: theme.colors[palette.background] },
        ]}
      >
        <Ionicons
          name={ui.icon}
          size={20}
          color={theme.colors[palette.foreground]}
        />
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text variant="title" numberOfLines={1} style={styles.title}>
            {notification.title}
          </Text>
          <Text variant="caption" tone="muted">
            {formatDateTime(notification.createdAt)}
          </Text>
        </View>
        <Text variant="bodySmall" tone="secondary" numberOfLines={2}>
          {notification.body}
        </Text>
      </View>

      {notification.isRead ? null : (
        <View
          style={[styles.unreadDot, { backgroundColor: theme.colors.primary }]}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
});
