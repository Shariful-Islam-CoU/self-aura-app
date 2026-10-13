import { Linking, StyleSheet, View } from 'react-native';

import { Badge, IconButton, Text } from '@/components/ui';
import { spacing } from '@/theme';
import { formatCurrency, formatDateTime } from '@/utils/format';
import {
  ORDER_SOURCE_LABELS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TONES,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_TONES,
  TERMINAL_STATUS_NOTES,
} from '../labels';
import type { Order } from '../types';
import { DetailRow, SectionCard } from './SectionCard';

/** Header facts: number, total, status/payment badges, order date, source. */
export function OrderSummarySection({ order }: { order: Order }) {
  return (
    <SectionCard title="Order summary">
      <View style={styles.summaryTop}>
        <Text variant="h2">{order.orderNumber}</Text>
        <Text variant="h2">{formatCurrency(order.total)}</Text>
      </View>
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
      <DetailRow label="Order date" value={formatDateTime(order.createdAt)} />
      <DetailRow label="Source" value={ORDER_SOURCE_LABELS[order.source]} />
    </SectionCard>
  );
}

/**
 * Status information in place of a timeline: the backend stores no status
 * history, so only current status + real timestamps are shown - never a
 * fabricated progression.
 */
export function OrderStatusSection({ order }: { order: Order }) {
  const note = TERMINAL_STATUS_NOTES[order.orderStatus];

  return (
    <SectionCard title="Status">
      <DetailRow label="Current status" value={ORDER_STATUS_LABELS[order.orderStatus]} />
      {note ? (
        <Text variant="bodySmall" tone="secondary">
          {note}
        </Text>
      ) : null}
      <DetailRow label="Placed" value={formatDateTime(order.createdAt)} />
      <DetailRow label="Last updated" value={formatDateTime(order.updatedAt)} />
    </SectionCard>
  );
}

function CustomerCallRow({
  order,
  onCallFailed,
}: {
  order: Order;
  onCallFailed: (message: string) => void;
}) {
  const phone = order.customer.phone?.trim() || order.shippingAddress.phone?.trim();
  if (!phone) return null;

  const handleCall = async () => {
    try {
      await Linking.openURL(`tel:${phone.replace(/[^\d+]/g, '')}`);
    } catch {
      onCallFailed('Could not open the phone app.');
    }
  };

  return (
    <DetailRow label="Phone">
      <View style={styles.callRow}>
        <Text variant="bodyMedium" numberOfLines={1}>
          {phone}
        </Text>
        <IconButton
          icon="call-outline"
          accessibilityLabel={`Call ${order.customer.name ?? 'customer'} at ${phone}`}
          onPress={() => void handleCall()}
        />
      </View>
    </DetailRow>
  );
}

/** Customer identity + contact (display only - no customer module here). */
export function OrderCustomerSection({
  order,
  onCallFailed,
}: {
  order: Order;
  onCallFailed: (message: string) => void;
}) {
  return (
    <SectionCard title="Customer">
      <Text variant="subtitle">{order.customer.name || 'Customer unknown'}</Text>
      <CustomerCallRow order={order} onCallFailed={onCallFailed} />
      {order.customer.email ? <DetailRow label="Email" value={order.customer.email} /> : null}
      {!order.customer.phone && !order.customer.email ? (
        <Text variant="bodySmall" tone="muted">
          No contact details on this order.
        </Text>
      ) : null}
    </SectionCard>
  );
}

/**
 * Shipping address + the immutable delivery-zone snapshot stored when the
 * order was placed (later zone edits never alter this order).
 */
export function OrderDeliverySection({ order }: { order: Order }) {
  const address = order.shippingAddress;
  const areaLine = [address.area, address.district, address.city].filter(Boolean).join(', ');
  const postalLine = [address.postalCode, address.country].filter(Boolean).join(', ');
  const delivery = order.delivery;

  return (
    <SectionCard title="Delivery">
      {address.recipientName ? <Text variant="bodyMedium">{address.recipientName}</Text> : null}
      <Text variant="bodySmall" tone="secondary">
        {address.addressLine}
      </Text>
      {areaLine ? (
        <Text variant="bodySmall" tone="secondary">
          {areaLine}
        </Text>
      ) : null}
      {postalLine ? (
        <Text variant="bodySmall" tone="secondary">
          {postalLine}
        </Text>
      ) : null}
      {address.phone ? <DetailRow label="Delivery phone" value={address.phone} /> : null}

      {delivery ? (
        <>
          <DetailRow label="Zone" value={`${delivery.name} (${delivery.code})`} />
          <DetailRow
            label="Delivery charge"
            value={delivery.freeDeliveryApplied ? 'Free' : formatCurrency(delivery.charge)}
          />
          <DetailRow
            label="Estimated delivery"
            value={`${delivery.estimatedMinDays}-${delivery.estimatedMaxDays} days`}
          />
          <Text variant="caption" tone="muted">
            Stored with the order when it was placed. Later zone changes never alter this order.
          </Text>
        </>
      ) : null}
    </SectionCard>
  );
}

/** Optional free-text note captured with the order. */
export function OrderNoteSection({ note }: { note: string }) {
  return (
    <SectionCard title="Note">
      <Text variant="bodySmall" tone="secondary">
        {note}
      </Text>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  summaryTop: { gap: spacing.xs },
  badges: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  callRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexShrink: 1,
    justifyContent: 'flex-end',
  },
});
