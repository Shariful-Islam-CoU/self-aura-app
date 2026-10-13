import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui';
import { useTheme } from '@/providers/ThemeProvider';
import { spacing } from '@/theme';

export interface LoadingIndicatorProps {
  label?: string;
  /** Centers the spinner in the remaining space (for full-screen loading). */
  fullScreen?: boolean;
}

export function LoadingIndicator({ label, fullScreen = false }: LoadingIndicatorProps) {
  const { theme } = useTheme();

  const body = (
    <View style={styles.body}>
      <ActivityIndicator size="small" color={theme.colors.primary} />
      {label ? (
        <Text variant="caption" tone="muted">
          {label}
        </Text>
      ) : null}
    </View>
  );

  if (!fullScreen) return body;

  return (
    <View style={[styles.fullScreen, { backgroundColor: theme.colors.background }]}>{body}</View>
  );
}

const styles = StyleSheet.create({
  body: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  fullScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
