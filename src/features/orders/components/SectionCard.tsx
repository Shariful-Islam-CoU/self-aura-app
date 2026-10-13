import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Card, SectionHeader, Text } from '@/components/ui';
import { spacing } from '@/theme';

/** Section header + card wrapper used by every order-detail block. */
export function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View>
      <SectionHeader title={title} />
      <Card style={styles.card}>{children}</Card>
    </View>
  );
}

/**
 * Label/value row for detail cards: muted label left, value right; pass
 * `children` instead of `value` for rich values (badges, wrapped text).
 * Long values shrink to two lines instead of pushing the layout apart.
 */
export function DetailRow({
  label,
  value,
  children,
  emphasis = false,
}: {
  label: string;
  value?: string;
  children?: ReactNode;
  /** Strong styling for totals and other primary figures. */
  emphasis?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text variant="bodySmall" tone="muted">
        {label}
      </Text>
      {children ?? (
        <Text
          variant={emphasis ? 'subtitle' : 'bodyMedium'}
          style={styles.value}
          numberOfLines={2}
          align="right"
        >
          {value}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    minHeight: 24,
  },
  value: { flexShrink: 1, textAlign: 'right' },
});
