import { Pressable, StyleSheet, View } from 'react-native';

import { Badge, Text } from '@/components/ui';
import { useTheme } from '@/providers';
import { radius, spacing } from '@/theme';
import { formatCurrency, formatDate } from '@/utils/format';
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TONES,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_TONES,
} from '../labels';
import type { Order } from '../types';

export interface OrderCardProps {
  order: Order;
  onPress: (orderId: string) => void;
}

/**
 * Touch-friendly order row for the list (never a desktop table): order
 * number + total, customer + date, then status and payment badges. The
 * whole card is one accessible button whose label reads every fact the
 * visual layout shows, so screen readers get the full summary too.
 */
export function OrderCard({ order, onPress }: OrderCardProps) {
  const { theme } = useTheme();

  const label = [
    `Order ${order.orderNumber}`,
    order.customer.name ?? 'Customer unknown',
    formatCurrency(order.total),
    ORDER_STATUS_LABELS[order.orderStatus],
    PAYMENT_STATUS_LABELS[order.paymentStatus],
    formatDate(order.createdAt),
  ].join(', ');

  return (
    <Pressable
      onPress={() => onPress(order.id)}
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
          {order.orderNumber}
        </Text>
        <Text variant="bodyMedium">{formatCurrency(order.total)}</Text>
      </View>

      <Text variant="caption" tone="muted" numberOfLines={1}>
        {order.customer.name ?? 'Customer unknown'} · {formatDate(order.createdAt)}
      </Text>

      <View style={styles.badges}>
        <Badge
          label={ORDER_STATUS_LABELS[order.orderStatus]}
          tone={ORDER_STATUS_TONES[order.orderStatus]}
        />
        <Badge
          label={PAYMENT_STATUS_LABELS[order.paymentStatus]}
          tone={PAYMENT_STATUS_TONES[order.paymentStatus]}
          variant="outline"
        />
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
