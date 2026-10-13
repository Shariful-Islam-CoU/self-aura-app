import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Text } from '@/components/ui';
import { useTheme } from '@/providers/ThemeProvider';
import { spacing } from '@/theme';
import type { IconName } from '@/types';

export interface EmptyStateProps {
  title: string;
  description?: string;
  /** Ionicons glyph for the placeholder illustration. */
  icon?: IconName;
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * "Nothing here yet" state. Wording belongs to the caller so a genuinely
 * empty resource and a filtered-out result read differently (rule 8).
 */
export function EmptyState({
  title,
  description,
  icon = 'file-tray-outline',
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, { backgroundColor: theme.colors.primarySoft }]}>
        <Ionicons name={icon} size={30} color={theme.colors.primaryOnSoft} />
      </View>
      <Text variant="h3" align="center">
        {title}
      </Text>
      {description ? (
        <Text variant="body" tone="secondary" align="center">
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button title={actionLabel} variant="outline" onPress={onAction} />
      ) : null}
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
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
