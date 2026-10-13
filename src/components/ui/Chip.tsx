import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import { useTheme } from '@/providers/ThemeProvider';
import { radius, spacing, type StatusTone } from '@/theme';
import type { IconName } from '@/types';

export interface ChipProps {
  label: string;
  tone?: StatusTone;
  /** Selected chips fill with the primary color (filter pickers). */
  selected?: boolean;
  /** Makes the chip tappable; without it the chip is a static tag. */
  onPress?: () => void;
  /** Renders a remove (x) button - for removable filter chips. */
  onRemove?: () => void;
  icon?: IconName;
  disabled?: boolean;
}

/**
 * Compact pill for filters, tags, and option sets. Distinct from `Badge`:
 * chips are (optionally) interactive, badges only report status.
 */
export function Chip({
  label,
  tone = 'neutral',
  selected = false,
  onPress,
  onRemove,
  icon,
  disabled = false,
}: ChipProps) {
  const { theme } = useTheme();

  const palette = selected
    ? { background: theme.colors.primary, text: theme.colors.onPrimary }
    : tone === 'neutral'
      ? { background: theme.colors.surfaceMuted, text: theme.colors.textSecondary }
      : {
          background: theme.colors[`${tone}Soft` as const],
          text: theme.colors[`${tone}OnSoft` as const],
        };

  const body = (
    <View
      style={[styles.base, { backgroundColor: palette.background }]}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityState={onPress ? { selected, disabled } : undefined}
    >
      {icon ? <Ionicons name={icon} size={theme.iconSizes.sm} color={palette.text} /> : null}
      <Text variant="label" style={{ color: palette.text }}>
        {label}
      </Text>
      {onRemove ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Remove ${label}`}
          onPress={onRemove}
          hitSlop={6}
        >
          <Ionicons name="close" size={14} color={palette.text} />
        </Pressable>
      ) : null}
    </View>
  );

  if (!onPress) return body;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [{ opacity: disabled ? 0.5 : pressed ? 0.72 : 1 }]}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
    minHeight: 32,
  },
});
