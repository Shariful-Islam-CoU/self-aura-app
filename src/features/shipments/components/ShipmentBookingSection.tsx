import { Linking, StyleSheet, View } from 'react-native';

import { Badge, Button, Text, type BadgeTone } from '@/components/ui';
import { DetailRow, SectionCard } from '@/features/customers/components/SectionCard';
import { spacing } from '@/theme';
import { formatCurrency, formatDateTime } from '@/utils/format';
import type { Shipment } from '../types';

const BOOKING_LABELS: Record<
  NonNullable<Shipment['bookingStatus']>,
  { label: string; tone: BadgeTone }
> = {
  booked: { label: 'Booked', tone: 'success' },
  pending: { label: 'Booking…', tone: 'warning' },
  failed: { label: 'Booking failed', tone: 'danger' },
  unbooked: { label: 'Not booked', tone: 'neutral' },
};

/**
 * Courier-provider state for one shipment: whether the parcel is booked, the
 * consignment id, the courier's own status, the COD amount and any booking
 * error. Renders nothing for a manual courier.
 *
 * `canBook` / `canSync` are capability flags from the caller; the backend
 * re-checks `shipments.create` / `shipments.edit` on every call.
 */
export function ShipmentBookingSection({
  shipment,
  canBook,
  canSync,
  isBusy,
  onBook,
  onSync,
}: {
  shipment: Shipment;
  canBook: boolean;
  canSync: boolean;
  isBusy: boolean;
  onBook: () => void;
  onSync: () => void;
}) {
  if (shipment.provider !== 'steadfast') return null;

  const booking = BOOKING_LABELS[shipment.bookingStatus ?? 'unbooked'];
  const isBooked = shipment.bookingStatus === 'booked';

  const handleOpenTracking = async () => {
    if (!shipment.trackingUrl) return;
    await Linking.openURL(shipment.trackingUrl);
  };

  return (
    <SectionCard title="Courier booking">
      <DetailRow label="Booking">
        <Badge label={booking.label} tone={booking.tone} />
      </DetailRow>
      {shipment.providerConsignmentId ? (
        <DetailRow label="Consignment" value={shipment.providerConsignmentId} />
      ) : null}
      {shipment.providerStatus ? (
        <DetailRow label="Courier status" value={shipment.providerStatus} />
      ) : null}
      {typeof shipment.codAmount === 'number' ? (
        <DetailRow label="Cash on delivery" value={formatCurrency(shipment.codAmount)} />
      ) : null}
      {shipment.bookedAt ? (
        <DetailRow label="Booked at" value={formatDateTime(shipment.bookedAt)} />
      ) : null}
      {shipment.lastSyncedAt ? (
        <DetailRow label="Last synced" value={formatDateTime(shipment.lastSyncedAt)} />
      ) : null}
      {shipment.bookingError ? (
        <DetailRow label="Booking error" value={shipment.bookingError} />
      ) : null}

      {shipment.trackingUrl ? (
        <Button
          title="Open courier tracking"
          icon="open-outline"
          variant="outline"
          fullWidth
          onPress={() => void handleOpenTracking()}
          accessibilityLabel={`Open courier tracking for ${shipment.shipmentNumber}`}
        />
      ) : null}

      <View style={styles.actions}>
        {!isBooked && canBook ? (
          <Button
            title={shipment.bookingStatus === 'failed' ? 'Retry booking' : 'Book with courier'}
            icon="cloud-upload-outline"
            fullWidth
            loading={isBusy}
            disabled={isBusy}
            onPress={onBook}
          />
        ) : null}
        {isBooked && canSync ? (
          <Button
            title="Sync with courier"
            icon="refresh-outline"
            variant="outline"
            fullWidth
            loading={isBusy}
            disabled={isBusy}
            onPress={onSync}
          />
        ) : null}
      </View>
      {!isBooked && !canBook ? (
        <Text variant="bodySmall" tone="muted">
          Booking this parcel needs shipment creation permission.
        </Text>
      ) : null}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  actions: { gap: spacing.sm },
});
