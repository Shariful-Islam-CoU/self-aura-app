import { StyleSheet, View } from 'react-native';
import { Button } from './Button';
import { Text } from './Text';
import { spacing } from '@/theme';

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  /** Right-aligned quick action ("See all", "Add"). */
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * Heading for a block of content (module groups, list sections, dashboard
 * cards). Deliberately title-only - screens own their copy.
 */
export function SectionHeader({ title, subtitle, actionLabel, onAction }: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <Text variant="title">{title}</Text>
        {subtitle ? (
          <Text variant="bodySmall" tone="muted">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {actionLabel && onAction ? (
        <Button title={actionLabel} variant="ghost" size="sm" onPress={onAction} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  text: {
    flex: 1,
    gap: 2,
  },
});
