import { StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { useTheme } from '@/providers/ThemeProvider';
import { radius, spacing, type StatusTone } from '@/theme';

export type BadgeTone = StatusTone;
export type BadgeVariant = 'soft' | 'solid' | 'outline';

export interface BadgeProps {
  label: string;
  /** Semantic tone; features map domain statuses onto it. */
  tone?: BadgeTone;
  /**
   * `soft` (default) = tinted pill with tinted dark text (highest contrast),
   * `solid` = filled pill, `outline` = bordered pill.
   */
  variant?: BadgeVariant;
}

/**
 * Generic status pill. It knows tones and variants - never business
 * statuses; features map their own labels onto tones (see
 * `resolveStatusTone` for the loose fallback). The label is always visible
 * text, so status meaning never relies on color alone.
 */
export function Badge({ label, tone = 'neutral', variant = 'soft' }: BadgeProps) {
  const { theme } = useTheme();

  let palette: { background: string; text: string; border: string };

  if (tone === 'neutral') {
    palette =
      variant === 'solid'
        ? { background: theme.colors.textMuted, text: theme.colors.surface, border: 'transparent' }
        : variant === 'outline'
          ? {
              background: 'transparent',
              text: theme.colors.textSecondary,
              border: theme.colors.border,
            }
          : {
              background: theme.colors.surfaceMuted,
              text: theme.colors.textSecondary,
              border: 'transparent',
            };
  } else {
    const base = theme.colors[tone];
    const soft = theme.colors[`${tone}Soft`];
    const onSoft = theme.colors[`${tone}OnSoft`];

    palette =
      variant === 'solid'
        ? {
            background: base,
            text: tone === 'warning' ? theme.colors.onWarning : theme.colors.onPrimary,
            border: 'transparent',
          }
        : variant === 'outline'
          ? { background: 'transparent', text: onSoft, border: base }
          : { background: soft, text: onSoft, border: 'transparent' };
  }

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: palette.background,
          borderColor: palette.border,
          borderWidth: palette.border === 'transparent' ? 0 : StyleSheet.hairlineWidth,
        },
      ]}
      accessibilityRole="text"
    >
      <Text variant="label" style={{ color: palette.text }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
});
