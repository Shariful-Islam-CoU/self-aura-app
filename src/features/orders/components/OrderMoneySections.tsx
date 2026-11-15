import { Image, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Badge, Skeleton, Text } from '@/components/ui';
import { useTheme } from '@/providers';
import { radius, spacing } from '@/theme';
import { formatCurrency, formatNumber } from '@/utils/format';
import { mediaImageSource } from '@/features/products/lib/media';
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS, PAYMENT_STATUS_TONES } from '../labels';
import { useOrderItemImageUrls } from '../queries';
import type { Order, OrderPaymentSummary } from '../types';
import { DetailRow, SectionCard } from './SectionCard';

/**
 * Order items from the order's own snapshot - historical unit prices come
 * from the stored item data and are NEVER re-fetched from today's products.
 * Only the thumbnail is resolved from the current product record (the order
 * stores a product id, not a media snapshot).
 */
export function OrderItemsSection({ order }: { order: Order }) {
  const { theme } = useTheme();
  const imageUrls = useOrderItemImageUrls(order.items.map((item) => item.product.id));

  return (
    <SectionCard title="Items">
      {order.items.map((item, index) => {
        const imageUri = mediaImageSource(imageUrls[item.product.id], 160);
        return (
          <View
            key={item.id}
            style={[
              styles.item,
              index > 0 && {
                borderTopWidth: StyleSheet.hairlineWidth,
                borderTopColor: theme.colors.border,
              },
            ]}
            accessibilityLabel={`${item.productName}, quantity ${item.quantity}, subtotal ${formatCurrency(item.subtotal)}`}
          >
            {imageUri ? (
              <Image
                source={{ uri: imageUri }}
                style={[styles.itemThumb, { backgroundColor: theme.colors.surfaceMuted }]}
                accessible={false}
              />
            ) : (
              <View
                style={[
                  styles.itemThumb,
                  styles.imageFallback,
                  { backgroundColor: theme.colors.surfaceMuted },
                ]}
              >
                <Ionicons name="cube-outline" size={20} color={theme.colors.iconMuted} />
              </View>
            )}
            <View style={styles.itemInfo}>
              <Text variant="bodyMedium" numberOfLines={2}>
                {item.productName}
              </Text>
              <Text variant="caption" tone="muted">
                {item.sku} · {formatCurrency(item.unitPrice)} × {formatNumber(item.quantity)}
              </Text>
            </View>
            <Text variant="bodyMedium">{formatCurrency(item.subtotal)}</Text>
          </View>
        );
      })}
    </SectionCard>
  );
}

/**
 * Backend-calculated pricing breakdown - every figure is read from the
 * order; nothing is recalculated on the client. `order.deliveryCharge` is
 * the billed (possibly overridden) fee, so `total` always reconciles with it.
 */
export function OrderPricingSection({ order }: { order: Order }) {
  return (
    <SectionCard title="Pricing">
      <DetailRow label="Subtotal" value={formatCurrency(order.subtotal)} />
      {order.discount > 0 ? (
        <DetailRow label="Discount" value={`- ${formatCurrency(order.discount)}`} />
      ) : null}
      {order.coupon ? (
        <DetailRow
          label={`Coupon (${order.coupon.code})`}
          value={`- ${formatCurrency(order.coupon.discountAmount)}`}
        />
      ) : null}
      <DetailRow label="Delivery charge" value={formatCurrency(order.deliveryCharge)} />
      <DetailRow label="Total" value={formatCurrency(order.total)} emphasis />
    </SectionCard>
  );
}

/**
 * Payment facts from the order plus the backend's ledger summary
 * (GET /orders/:id/payment-summary). The ledger block is optional: if the
 * summary query fails, order-level payment info still renders - no
 * verification workflow lives here (Payments module territory).
 */
export function OrderPaymentSection({
  order,
  summary,
  summaryLoading,
}: {
  order: Order;
  summary?: OrderPaymentSummary;
  summaryLoading: boolean;
}) {
  return (
    <SectionCard title="Payment">
      <DetailRow label="Method" value={PAYMENT_METHOD_LABELS[order.paymentMethod]} />
      <DetailRow label="Status">
        <Badge
          label={PAYMENT_STATUS_LABELS[order.paymentStatus]}
          tone={PAYMENT_STATUS_TONES[order.paymentStatus]}
        />
      </DetailRow>

      {order.transactionId ? (
        <DetailRow label="Transaction ID" value={order.transactionId} />
      ) : null}
      {order.senderPhone ? <DetailRow label="Sender phone" value={order.senderPhone} /> : null}

      {summaryLoading && !summary ? (
        <Skeleton height={16} width="70%" />
      ) : summary ? (
        <>
          <DetailRow label="Paid" value={formatCurrency(summary.paidAmount)} />
          {summary.refundedAmount > 0 ? (
            <DetailRow label="Refunded" value={formatCurrency(summary.refundedAmount)} />
          ) : null}
          <DetailRow
            label="Outstanding"
            value={formatCurrency(summary.outstandingAmount)}
            emphasis={summary.outstandingAmount > 0}
          />
        </>
      ) : null}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
  },
  itemInfo: { flex: 1, gap: 2 },
  itemThumb: { width: 44, height: 44, borderRadius: radius.md },
  imageFallback: { alignItems: 'center', justifyContent: 'center' },
});
