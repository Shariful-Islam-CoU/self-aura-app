import { Linking, StyleSheet, View } from 'react-native';

import { Badge, Button, IconButton, Text } from '@/components/ui';
import { SectionCard, DetailRow } from '@/features/customers/components/SectionCard';
import { useTheme } from '@/providers';
import { spacing } from '@/theme';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format';
import {
  DELIVERY_FAILURE_REASON_LABELS,
  SHIPMENT_STATUS_LABELS,
  SHIPMENT_STATUS_TONES,
  TERMINAL_STATUS_NOTES,
} from '../labels';
import type { Shipment, ShipmentEvent } from '../types';

/** Shipment number + charge + status + relations (display only). */
export function ShipmentSummarySection({
  shipment,
  canViewOrder = false,
  onViewOrder,
}: {
  shipment: Shipment;
  canViewOrder?: boolean;
  onViewOrder?: () => void;
}) {
  return (
    <SectionCard title="Shipment summary">
      <Text variant="subtitle">{shipment.shipmentNumber}</Text>
      <Text variant="bodyMedium" tone="secondary">
        {formatCurrency(shipment.deliveryCharge)}
      </Text>
      <Badge
        label={SHIPMENT_STATUS_LABELS[shipment.status]}
        tone={SHIPMENT_STATUS_TONES[shipment.status]}
      />
      <DetailRow label="Order" value={shipment.order.orderNumber ?? `#${shipment.order.id}`} />
      <DetailRow label="Customer" value={shipment.customer.name || 'Customer unknown'} />
      {canViewOrder && onViewOrder && shipment.order.id ? (
        <Button
          title="View order"
          variant="outline"
          icon="receipt-outline"
          fullWidth
          onPress={onViewOrder}
          accessibilityLabel={`View order ${shipment.order.orderNumber ?? shipment.order.id}`}
        />
      ) : null}
      {shipment.trackingNumber ? (
        <DetailRow label="Tracking number" value={shipment.trackingNumber} />
      ) : null}
      <DetailRow
        label="Shipped"
        value={shipment.shippedAt ? formatDate(shipment.shippedAt) : '—'}
      />
      <DetailRow
        label="Delivered"
        value={shipment.deliveredAt ? formatDate(shipment.deliveredAt) : '—'}
      />
    </SectionCard>
  );
}

/** Current status + terminal note + timestamps. */
export function ShipmentStatusSection({ shipment }: { shipment: Shipment }) {
  const note = TERMINAL_STATUS_NOTES[shipment.status];
  return (
    <SectionCard title="Status">
      <DetailRow label="Current status">
        <Badge
          label={SHIPMENT_STATUS_LABELS[shipment.status]}
          tone={SHIPMENT_STATUS_TONES[shipment.status]}
        />
      </DetailRow>
      {shipment.failureReason ? (
        <DetailRow
          label="Failure reason"
          value={DELIVERY_FAILURE_REASON_LABELS[shipment.failureReason]}
        />
      ) : null}
      {note ? (
        <Text variant="bodySmall" tone="muted">
          {note}
        </Text>
      ) : null}
      <DetailRow label="Created" value={formatDateTime(shipment.createdAt)} />
      <DetailRow label="Last updated" value={formatDateTime(shipment.updatedAt)} />
    </SectionCard>
  );
}

function CourierCallRow({
  shipment,
  onCallFailed,
}: {
  shipment: Shipment;
  onCallFailed: (message: string) => void;
}) {
  const phone = shipment.courier.phone?.trim();
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
          accessibilityLabel={`Call ${shipment.courier.name ?? 'courier'} at ${phone}`}
          onPress={() => void handleCall()}
        />
      </View>
    </DetailRow>
  );
}

/** Courier identity + contact (display only - no courier module here). */
export function ShipmentCourierSection({
  shipment,
  onCallFailed,
}: {
  shipment: Shipment;
  onCallFailed: (message: string) => void;
}) {
  return (
    <SectionCard title="Courier">
      <Text variant="subtitle">{shipment.courier.name || 'Courier unknown'}</Text>
      <CourierCallRow shipment={shipment} onCallFailed={onCallFailed} />
    </SectionCard>
  );
}

/** Delivery address the parcel goes to (display only - never altered here). */
export function ShipmentAddressSection({ shipment }: { shipment: Shipment }) {
  const address = shipment.shippingAddress;
  return (
    <SectionCard title="Delivery address">
      <Text variant="subtitle">{address.recipientName}</Text>
      <Text variant="bodyMedium">{address.addressLine}</Text>
      <Text variant="bodyMedium" tone="secondary">
        {[address.district, address.area, address.city].filter(Boolean).join(', ')}
      </Text>
      <Text variant="bodyMedium" tone="secondary">
        {[address.postalCode, address.country].filter(Boolean).join(', ')}
      </Text>
      <DetailRow label="Recipient phone" value={address.phone} />
    </SectionCard>
  );
}

export function ShipmentNoteSection({ note }: { note: string }) {
  return (
    <SectionCard title="Note">
      <Text variant="bodyMedium" tone="secondary">
        {note}
      </Text>
    </SectionCard>
  );
}

/**
 * Real status history from the backend event log (`GET /shipments/:id/history`).
 * Newest first; every row shows the transition, when it happened and who made
 * it. Nothing here is invented - an empty log renders its own empty state.
 */
export function ShipmentHistorySection({
  events,
  isLoading,
}: {
  events: ShipmentEvent[] | undefined;
  isLoading: boolean;
}) {
  const { theme } = useTheme();

  return (
    <SectionCard title="Tracking history">
      {isLoading && !events ? (
        <Text variant="bodySmall" tone="muted">
          Loading history...
        </Text>
      ) : !events || events.length === 0 ? (
        <Text variant="bodySmall" tone="muted">
          No tracking events yet.
        </Text>
      ) : (
        <View style={styles.timeline}>
          {events.map((event, index) => (
            <View
              key={event.id}
              style={styles.eventRow}
              accessibilityLabel={`${SHIPMENT_STATUS_LABELS[event.fromStatus]} to ${SHIPMENT_STATUS_LABELS[event.toStatus]}, ${formatDateTime(event.createdAt)}`}
            >
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.primary,
                  },
                ]}
              />
              {index < events.length - 1 ? (
                <View style={[styles.line, { backgroundColor: theme.colors.border }]} />
              ) : null}
              <View style={styles.eventBody}>
                <Text variant="bodyMedium">
                  {SHIPMENT_STATUS_LABELS[event.fromStatus]} →{' '}
                  {SHIPMENT_STATUS_LABELS[event.toStatus]}
                </Text>
                <Text variant="caption" tone="muted">
                  {formatDateTime(event.createdAt)}
                  {event.createdBy.username ? ` · ${event.createdBy.username}` : ''}
                </Text>
                {event.note ? (
                  <Text variant="bodySmall" tone="secondary">
                    {event.note}
                  </Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      )}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  callRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 1,
  },
  timeline: {
    gap: 0,
  },
  eventRow: {
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 56,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    marginTop: 4,
  },
  line: {
    position: 'absolute',
    left: 5,
    top: 22,
    bottom: 0,
    width: 2,
  },
  eventBody: {
    flex: 1,
    gap: spacing.xs,
    paddingBottom: spacing.md,
  },
});
