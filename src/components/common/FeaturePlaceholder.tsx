import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui';
import { useTheme } from '@/providers/ThemeProvider';
import { spacing, radius } from '@/theme';
import type { IconName } from '@/types';

export interface FeaturePlaceholderProps {
  /** Ionicons glyph shown in the tinted circle. */
  icon: IconName;
  title: string;
  /** Defaults to a generic "future step" message. */
  description?: string;
  /** Extra line under the description (route info, dev notes). */
  footnote?: string;
}

/**
 * Temporary scaffold for routes that do not map to a catalog module
 * (notifications, profile, feature detail/form screens). Centers itself
 * vertically - render inside a `Screen` with `scroll={false}`.
 * No business logic or mock data.
 */
export function FeaturePlaceholder({
  icon,
  title,
  description = 'This screen will be implemented in a future step.',
  footnote,
}: FeaturePlaceholderProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, { backgroundColor: theme.colors.primarySoft }]}>
        <Ionicons name={icon} size={34} color={theme.colors.primaryOnSoft} />
      </View>
      <Text variant="title" align="center">
        {title}
      </Text>
      <Text variant="body" tone="muted" align="center">
        {description}
      </Text>
      {footnote ? (
        <View
          style={[
            styles.tag,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
        >
          <Text variant="caption" tone="muted" selectable>
            {footnote}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: spacing.sm,
  },
});
