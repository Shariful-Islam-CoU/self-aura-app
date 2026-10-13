import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from './Avatar';
import { Badge, type BadgeTone } from './Badge';
import { Divider } from './Divider';
import { Text } from './Text';
import { pressFeedback } from './pressable';
import { useTheme } from '@/providers/ThemeProvider';
import { radius, spacing } from '@/theme';
import type { IconName } from '@/types';

export interface ListItemProps {
  title: string;
  subtitle?: string;
  /** Third line for ids/dates (e.g. `#1024 - 07 Oct 2026`). */
  meta?: string;
  /** Leading visual: tinted icon, avatar image, or avatar initials. */
  leading?: { icon?: IconName; image?: string; initials?: string };
  /** Status rendered as a pill next to the trailing content. */
  status?: { label: string; tone?: BadgeTone };
  /** Right-aligned custom content (price, quantity, action button). */
  trailing?: ReactNode;
  /** Navigation chevron; defaults to `onPress` when omitted. */
  showChevron?: boolean;
  /** Hairline under the row (default: false). */
  divider?: boolean;
  onPress?: () => void;
  disabled?: boolean;
}

/**
 * The row language shared by every future list (orders, products,
 * customers, ...). Leading/title/subtitle/meta/status/trailing/chevron are
 * all optional, so one component covers simple and dense rows alike.
 */
export function ListItem({
  title,
  subtitle,
  meta,
  leading,
  status,
  trailing,
  showChevron,
  divider = false,
  onPress,
  disabled = false,
}: ListItemProps) {
  const { theme } = useTheme();
  const chevron = showChevron ?? Boolean(onPress);

  const leadingView = leading?.icon ? (
    <View style={[styles.leadingIcon, { backgroundColor: theme.colors.primarySoft }]}>
      <Ionicons name={leading.icon} size={theme.iconSizes.md} color={theme.colors.primaryOnSoft} />
    </View>
  ) : leading?.image || leading?.initials ? (
    <Avatar source={leading.image} name={leading.initials} />
  ) : null;

  const row = (
    <View style={styles.row}>
      {leadingView}
      <View style={styles.content}>
        <Text variant="bodyMedium" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="bodySmall" tone="secondary" numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
        {meta ? (
          <Text variant="caption" tone="muted" numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
      </View>
      {status || trailing || chevron ? (
        <View style={styles.trailing}>
          {status ? <Badge label={status.label} tone={status.tone} /> : null}
          {trailing}
          {chevron ? (
            <Ionicons
              name="chevron-forward"
              size={theme.iconSizes.md}
              color={theme.colors.iconMuted}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );

  return (
    <View>
      {onPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={title}
          accessibilityState={{ disabled }}
          disabled={disabled}
          onPress={onPress}
          style={({ pressed }) => [
            { opacity: disabled ? 0.5 : 1 },
            pressed ? pressFeedback(true) : null,
          ]}
        >
          {row}
        </Pressable>
      ) : (
        row
      )}
      {divider ? <Divider /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 60,
  },
  leadingIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 2,
  },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
