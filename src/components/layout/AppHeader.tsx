import type { ReactNode } from 'react';
import { Image, ImageSourcePropType, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconButton } from '@/components/ui/IconButton';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/providers/ThemeProvider';
import { spacing } from '@/theme';

export interface AppHeaderProps {
  /**
   * `dashboard` - stacked title with optional greeting above (Home);
   * `feature` - back button + title bar with trailing actions.
   */
  variant?: 'dashboard' | 'feature';
  title: string;
  /** Small line above the title (greeting, module context). */
  subtitle?: string;
  /** Renders the back button (feature variant) - wire it to `router.back()`. */
  onBack?: () => void;
  /** Right-aligned action elements (IconButtons, Avatar, filters...). */
  actions?: ReactNode;
  /** Hairline under the header (default: none - the surface stays clean). */
  divider?: boolean;
  /** Optional logo image source (shown on the left in dashboard variant). */
  logo?: ImageSourcePropType;
}

/**
 * The reusable header pattern. Screens pass their own titles/actions -
 * feature names are never hardcoded here.
 *
 * Applies the TOP safe-area inset itself: render it as the first element of
 * a `Screen` with `safeTop={false}` (the default) to avoid double padding.
 */
export function AppHeader({
  variant = 'feature',
  title,
  subtitle,
  onBack,
  actions,
  divider = false,
  logo,
}: AppHeaderProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.wrap,
        {
          paddingTop: insets.top + spacing.sm,
          backgroundColor: theme.colors.background,
          borderBottomWidth: divider ? StyleSheet.hairlineWidth : 0,
          borderBottomColor: theme.colors.border,
        },
      ]}
    >
      {variant === 'feature' ? (
        <View style={styles.row}>
          {onBack ? (
            <IconButton icon="arrow-back" accessibilityLabel="Go back" onPress={onBack} />
          ) : null}
          <Text variant="title" numberOfLines={1} style={styles.flex}>
            {title}
          </Text>
          {actions ? <View style={styles.actions}>{actions}</View> : null}
        </View>
      ) : (
        <View style={styles.row}>
          {logo ? (
            <Image
              source={logo}
              style={styles.logo}
              resizeMode="contain"
              accessibilityRole="image"
              accessibilityLabel="Self Aura logo"
            />
          ) : null}
          <View style={styles.textColumn}>
            {subtitle ? (
              <Text variant="caption" tone="muted" numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
            <Text  numberOfLines={1} style={styles.displayTitle}>
              {title}
            </Text>
          </View>
          {actions ? <View style={styles.actions}>{actions}</View> : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 44,
  },
  flex: {
    flex: 1,
  },
  textColumn: {
    flex: 1,
    gap: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  logo: {
    width: 52,
    height: 52,
    borderRadius: 8,
  },
  displayTitle: {
    fontSize: 24,
    lineHeight: 28,
    fontFamily: 'BodoniModa-Bold',
  },
});
