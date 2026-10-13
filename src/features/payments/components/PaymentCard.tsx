import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { useTheme } from '@/providers';
import { radius, spacing } from '@/theme';
import { formatCurrency, formatDate } from '@/utils/format';

import { paymentMethodLabel } from '../labels';
import type { Payment } from '../types';
import { PaymentMethodBadge, PaymentStatusBadge, PaymentTypeBadge } from './PaymentBadges';

export interface PaymentCardProps {
  payment: Payment;
  onPress: (paymentId: string) => void;
}

/** Builds the accessible summary for a card (mirrors the visible facts). */
export function paymentCardAccessibilityLabel(payment: Payment): string {
  const parts = [
    payment.paymentType === 'refund' ? 'Refund' : 'Payment',
    payment.paymentNumber,
    payment.customer.name ?? 'No customer',
    formatCurrency(payment.amount),
    paymentMethodLabel(payment.paymentMethod),
    payment.paymentStatus,
  ];
  if (payment.order.orderNumber) parts.push(`Order ${payment.order.orderNumber}`);
  if (payment.reference) parts.push(`Reference ${payment.reference}`);
  parts.push(formatDate(payment.paymentDate));
  return parts.join(', ');
}

/**
 * Touch-friendly payment row for the list (never a desktop table): payment
 * number + status, customer/order, type/method, transaction reference, date
 * and a prominent amount. The whole card is one accessible button whose label
 * reads every fact the visual layout shows.
 */
export function PaymentCard({ payment, onPress }: PaymentCardProps) {
  const { theme } = useTheme();

  const customerName = payment.customer.name ?? 'No customer';
  const orderLine = payment.order.orderNumber ?? payment.order.id;

  return (
    <Pressable
      onPress={() => onPress(payment.id)}
      accessibilityRole="button"
      accessibilityLabel={paymentCardAccessibilityLabel(payment)}
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
        <View style={styles.identity}>
          <Text variant="bodyMedium" numberOfLines={1} style={styles.number}>
            {payment.paymentNumber}
          </Text>
          <Text variant="caption" tone="muted" numberOfLines={1}>
            {customerName}
            {orderLine ? ` · ${orderLine}` : ''}
          </Text>
        </View>
        <PaymentStatusBadge status={payment.paymentStatus} />
      </View>

      <View style={styles.metaRow}>
        <PaymentTypeBadge type={payment.paymentType} />
        <PaymentMethodBadge method={payment.paymentMethod} />
      </View>

      {payment.reference ? (
        <Text variant="caption" tone="muted" numberOfLines={1}>
          Ref: {payment.reference}
        </Text>
      ) : null}

      <View style={styles.bottomRow}>
        <Text variant="caption" tone="muted">
          {formatDate(payment.paymentDate)}
        </Text>
        <Text variant="subtitle" numberOfLines={1} style={styles.amount}>
          {formatCurrency(payment.amount)}
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
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  identity: { flex: 1, gap: 2 },
  number: { flexShrink: 1 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  amount: { flexShrink: 1 },
});
