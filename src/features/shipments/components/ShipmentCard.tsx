import { Pressable, StyleSheet, View } from 'react-native';

import { Badge, Text } from '@/components/ui';
import { useTheme } from '@/providers';
import { radius, spacing } from '@/theme';
import { formatCurrency, formatDate } from '@/utils/format';
import { SHIPMENT_STATUS_LABELS, SHIPMENT_STATUS_TONES } from '../labels';
import type { Shipment } from '../types';

export interface ShipmentCardProps {
  shipment: Shipment;
  onPress: (shipmentId: string) => void;
}

/**
 * Touch-friendly shipment row for the list: shipment number + delivery
 * charge, order + date, then the status badge. The whole card is one
 * accessible button whose label reads every fact the visual layout shows.
 */
export function ShipmentCard({ shipment, onPress }: ShipmentCardProps) {
  const { theme } = useTheme();

  const orderRef = shipment.order.orderNumber ?? `#${shipment.order.id}`;
  const label = [
    `Shipment ${shipment.shipmentNumber}`,
    `Order ${orderRef}`,
    formatCurrency(shipment.deliveryCharge),
    SHIPMENT_STATUS_LABELS[shipment.status],
    formatDate(shipment.createdAt),
  ].join(', ');

  return (
    <Pressable
      onPress={() => onPress(shipment.id)}
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
        <Text variant="bodyMedium" numberOfLines={1} style={styles.number}>
          {shipment.shipmentNumber}
        </Text>
        <Text variant="bodyMedium">{formatCurrency(shipment.deliveryCharge)}</Text>
      </View>

      <Text variant="caption" tone="muted" numberOfLines={1}>
        Order {orderRef} · {formatDate(shipment.createdAt)}
      </Text>

      <View style={styles.badges}>
        <Badge
          label={SHIPMENT_STATUS_LABELS[shipment.status]}
          tone={SHIPMENT_STATUS_TONES[shipment.status]}
        />
        {shipment.trackingNumber ? (
          <Badge label={shipment.trackingNumber} tone="neutral" variant="outline" />
        ) : null}
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
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  number: { flex: 1 },
  badges: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
});
