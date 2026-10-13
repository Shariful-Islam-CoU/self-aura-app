import { StyleSheet, View } from 'react-native';

import { Badge, Card, Skeleton, Text } from '@/components/ui';
import { spacing } from '@/theme';
import { formatDateTime } from '@/utils/format';
import { movementQuantityLabel, movementTypeLabel, movementTypeTone, reasonLabel } from '../labels';
import type { StockMovement } from '../types';

/** Tones for the signed quantity: in = success, out = danger, adjust = default. */
const QUANTITY_TONES: Record<string, 'success' | 'danger' | 'default'> = {
  stock_in: 'success',
  return_in: 'success',
  stock_out: 'danger',
  return_out: 'danger',
};

/**
 * One stock movement, mobile layout (the web table's columns folded into
 * stacked lines): type badge + signed quantity, reason (+ note), previous ->
 * new stock, then date and the user who performed it. Every value comes
 * straight from `InventoryTransactionResponse` - no local stock math.
 */
export function StockMovementRow({ movement }: { movement: StockMovement }) {
  const quantityTone = QUANTITY_TONES[movement.type] ?? 'default';
  const actor = movement.createdBy.username ?? movement.createdBy.id.slice(0, 8);
  const reference = movement.referenceType
    ? `${movement.referenceType} reference ${movement.referenceId?.slice(-8) ?? ''}`.trim()
    : null;

  const label = [
    movementTypeLabel(movement.type),
    movementQuantityLabel(movement),
    `${movement.previousStock} to ${movement.newStock}`,
    reasonLabel(movement.reason),
    formatDateTime(movement.createdAt),
    actor,
  ].join(', ');

  return (
    <Card style={styles.card} accessibilityLabel={label}>
      <View style={styles.topRow}>
        <Badge label={movementTypeLabel(movement.type)} tone={movementTypeTone(movement.type)} />
        <Text variant="subtitle" tone={quantityTone === 'default' ? 'default' : quantityTone}>
          {movementQuantityLabel(movement)}
        </Text>
      </View>

      <Text variant="bodyMedium" numberOfLines={2}>
        {reasonLabel(movement.reason)}
        {movement.note ? (
          <Text variant="bodySmall" tone="muted">
            {' '}
            · {movement.note}
          </Text>
        ) : null}
      </Text>

      <Text variant="caption" tone="muted">
        {movement.previousStock} → {movement.newStock} units
        {reference ? ` · ${reference}` : null}
      </Text>

      <Text variant="caption" tone="muted">
        {formatDateTime(movement.createdAt)} · {actor}
      </Text>
    </Card>
  );
}

/** Initial-load placeholder for a movement list. */
export function StockMovementListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View style={styles.skeletonList}>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} style={styles.skeletonCard}>
          <Skeleton width="45%" height={22} radius={11} />
          <Skeleton width="65%" height={16} />
          <Skeleton width="55%" height={12} />
          <Skeleton width="70%" height={12} />
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.xs },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  skeletonList: { gap: spacing.sm },
  skeletonCard: { gap: spacing.xs },
});
