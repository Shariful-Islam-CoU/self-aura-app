import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar, Badge, Text } from '@/components/ui';
import { useTheme } from '@/providers';
import { radius, spacing } from '@/theme';
import { formatCurrency, formatDate } from '@/utils/format';
import { purchaseStatusLabel, purchaseStatusTone } from '../labels';
import type { Purchase } from '../types';

export interface PurchaseCardProps {
  purchase: Purchase;
  onPress: (purchaseId: string) => void;
}

/**
 * Touch-friendly purchase row for the list (never a desktop table):
 * avatar + purchase number, supplier, date, total, status.
 * The whole card is one accessible button whose label reads every fact
 * the visual layout shows, so screen readers get the full summary too.
 */
export function PurchaseCard({ purchase, onPress }: PurchaseCardProps) {
  const { theme } = useTheme();

  const label = [
    `Purchase ${purchase.purchaseNumber}`,
    purchase.supplier.name ?? 'Unknown supplier',
    formatCurrency(purchase.total),
    purchaseStatusLabel(purchase.status),
    `Ordered ${formatDate(purchase.purchaseDate)}`,
  ].join(', ');

  return (
    <Pressable
      onPress={() => onPress(purchase.id)}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
        pressed && { opacity: 0.7 },
      ]}
    >
      <View style={styles.topRow}>
        <Avatar name={purchase.purchaseNumber} size="sm" />
        <View style={styles.identity}>
          <Text variant="bodyMedium" numberOfLines={1} style={styles.number}>
            {purchase.purchaseNumber}
          </Text>
          <Text variant="caption" tone="muted" numberOfLines={1}>
            {purchase.supplier.name ?? purchase.supplier.id}
          </Text>
        </View>
        <Badge
          label={purchaseStatusLabel(purchase.status)}
          tone={purchaseStatusTone(purchase.status)}
        />
      </View>

      <View style={styles.bottomRow}>
        <Text variant="caption" tone="muted">
          {purchase.items.length} item{purchase.items.length !== 1 ? 's' : ''}
        </Text>
        <Text variant="bodyMedium" numberOfLines={1} style={styles.total}>
          {formatCurrency(purchase.total)}
        </Text>
        <Text variant="caption" tone="muted">
          {formatDate(purchase.purchaseDate)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
    gap: spacing.sm,
    minHeight: 44,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  identity: { flex: 1, gap: 2 },
  number: { flexShrink: 1 },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  total: { flexShrink: 1 },
});
