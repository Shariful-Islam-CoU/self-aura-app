import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Text } from '@/components/ui';
import { useTheme } from '@/providers/ThemeProvider';
import { spacing } from '@/theme';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

/**
 * Generic error display for queries/screens. Deliberately avoids
 * business terminology so it can be reused across all modules. Soft tinted
 * icon (not a red slab) keeps failures calm but unmistakable.
 */
export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Try again',
}: ErrorStateProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.container} accessibilityRole="alert">
      <View style={[styles.iconWrap, { backgroundColor: theme.colors.dangerSoft }]}>
        <Ionicons name="alert-outline" size={28} color={theme.colors.dangerOnSoft} />
      </View>
      <Text variant="h3" align="center">
        {title}
      </Text>
      {message ? (
        <Text variant="body" tone="secondary" align="center">
          {message}
        </Text>
      ) : null}
      {onRetry ? <Button title={retryLabel} variant="outline" onPress={onRetry} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xl,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
