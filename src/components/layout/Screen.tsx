import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/providers/ThemeProvider';
import { spacing } from '@/theme';

export interface ScreenProps {
  children: React.ReactNode;
  /** Wraps children in a ScrollView (default: true). Set false for fixed layouts like lists. */
  scroll?: boolean;
  /** Applies horizontal padding (default: true). */
  padded?: boolean;
  /** Adds safe-area padding at the top (default: true). Usually off inside headers/tabs. */
  safeTop?: boolean;
  /**
   * Keeps content above the software keyboard for form screens (default:
   * false). iOS uses `padding` behavior; Android relies on the window's
   * `adjustResize` mode, so no extra behavior is applied there.
   */
  keyboardAvoiding?: boolean;
  /**
   * Action bar pinned below the content (sticky Save/Cancel, filter bar).
   * Full-bleed with its own padding + bottom safe-area inset; the scroll
   * content automatically ends above it.
   */
  footer?: ReactNode;
  /**
   * Enables pull-to-refresh on the scroll content. Pass an object with
   * `refreshing` and `onRefresh` (same shape as RN's RefreshControl props);
   * ignored when `scroll` is false.
   */
  refreshControl?: { refreshing: boolean; onRefresh: () => void };
  style?: ViewStyle;
}

/**
 * Standard screen container: theme background, safe-area handling and
 * consistent horizontal padding. All route screens should use this.
 */
export function Screen({
  children,
  scroll = true,
  padded = true,
  safeTop = false,
  keyboardAvoiding = false,
  footer,
  refreshControl,
  style,
}: ScreenProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const body = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[styles.content, padded ? styles.padded : null, style]}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        refreshControl ? (
          <RefreshControl
            refreshing={refreshControl.refreshing}
            onRefresh={refreshControl.onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, padded ? styles.padded : null, style]}>{children}</View>
  );

  const tree = (
    <View
      style={[
        styles.root,
        {
          backgroundColor: theme.colors.background,
          paddingTop: safeTop ? insets.top : 0,
        },
      ]}
    >
      {body}
      {footer ? (
        <View
          style={[
            styles.footer,
            {
              backgroundColor: theme.colors.surface,
              borderTopColor: theme.colors.border,
              paddingBottom: insets.bottom + spacing.md,
            },
          ]}
        >
          {footer}
        </View>
      ) : null}
    </View>
  );

  if (!keyboardAvoiding) return tree;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : undefined}
    >
      {tree}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  root: { flex: 1 },
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  padded: {
    paddingHorizontal: spacing.lg,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
});
