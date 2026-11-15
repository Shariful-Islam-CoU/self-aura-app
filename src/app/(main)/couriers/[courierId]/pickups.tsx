import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { getErrorMessage } from '@/api';
import { EmptyState, ErrorState, LoadingIndicator } from '@/components/feedback';
import { AppHeader, Screen } from '@/components/layout';
import { Button, Dialog, Input, Select, Text, type SelectOption } from '@/components/ui';
import { SectionCard } from '@/features/customers/components/SectionCard';
import {
  useCourierDetails,
  useCourierPickups,
  usePickupStations,
  useRequestPickup,
  useUpdatePickup,
} from '@/features/couriers/queries';
import type { PickupStatus } from '@/features/couriers/pickupTypes';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/providers';
import { spacing } from '@/theme';

const STATUS_LABEL: Record<PickupStatus, string> = {
  requested: 'Requested',
  collected: 'Collected',
  cancelled: 'Cancelled',
};

/**
 * Pickup requests for one courier.
 *
 * A pickup is how a rider is asked to collect parcels that are already booked.
 * "Requested" is the only state the courier confirms — it publishes no endpoint
 * to read a pickup's progress — so collection is confirmed here by staff.
 */
export default function CourierPickupsScreen() {
  const { courierId } = useLocalSearchParams<{ courierId: string }>();
  const { hasPermission } = usePermissions();
  const toast = useToast();

  const canRequest = hasPermission('shipments.edit');
  const courierQuery = useCourierDetails(courierId);
  const pickupsQuery = useCourierPickups(courierId);
  const stationsQuery = usePickupStations(courierId);
  const requestPickup = useRequestPickup(courierId ?? '');
  const updatePickup = useUpdatePickup(courierId ?? '');

  const [formOpen, setFormOpen] = useState(false);
  const [stationId, setStationId] = useState('');
  const [note, setNote] = useState('');
  const [quantity, setQuantity] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [closing, setClosing] = useState<{ id: string; status: 'collected' | 'cancelled' } | null>(
    null,
  );

  const courier = courierQuery.data;
  const saved = courier?.pickup;

  const stationOptions: SelectOption[] = useMemo(
    () =>
      (stationsQuery.data ?? []).map((station) => ({
        value: station.id,
        label: station.district ? `${station.name} · ${station.district}` : station.name,
      })),
    [stationsQuery.data],
  );

  const openForm = () => {
    setError(null);
    setStationId(saved?.policeStationId ?? '');
    setNote('');
    setQuantity('');
    setFormOpen(true);
  };

  const handleRequest = () => {
    if (!stationId) {
      setError('Select the police station (thana) the rider should go to.');
      return;
    }
    const parsedQuantity = quantity.trim() ? Number(quantity.trim()) : undefined;
    if (parsedQuantity !== undefined && (!Number.isFinite(parsedQuantity) || parsedQuantity < 1)) {
      setError('Estimated quantity must be a whole number of at least 1.');
      return;
    }

    setError(null);
    requestPickup.mutate(
      {
        policeStationId: stationId,
        note: note.trim() || undefined,
        estimatedQuantity: parsedQuantity,
      },
      {
        onSuccess: (pickup) => {
          setFormOpen(false);
          toast.success(
            pickup.pickupId
              ? `Pickup requested (#${pickup.pickupId}).`
              : 'Pickup requested.',
          );
        },
        onError: (err) => setError(getErrorMessage(err)),
      },
    );
  };

  const handleClose = () => {
    if (!closing) return;
    const { id, status } = closing;
    updatePickup.mutate(
      { pickupId: id, status },
      {
        onSuccess: () => {
          setClosing(null);
          toast.success(status === 'collected' ? 'Pickup marked collected.' : 'Pickup request closed.');
        },
        // Keep the dialog open so the server's message is visible and the
        // action can be retried - never claim success it did not confirm.
        onError: (err) => toast.error(getErrorMessage(err)),
      },
    );
  };

  const header = (
    <AppHeader variant="feature" title="Pickups" onBack={() => router.back()} />
  );

  if (!courierId) {
    return (
      <Screen>
        {header}
        <EmptyState icon="cube-outline" title="Courier not found" description="Open a courier first." />
      </Screen>
    );
  }

  if (courierQuery.isPending) {
    return (
      <Screen>
        {header}
        <LoadingIndicator label="Loading courier..." />
      </Screen>
    );
  }

  if (!courier) {
    return (
      <Screen>
        {header}
        <ErrorState
          title="Failed to load courier"
          message={getErrorMessage(courierQuery.error)}
          onRetry={() => void courierQuery.refetch()}
          retryLabel="Retry"
        />
      </Screen>
    );
  }

  const pickups = pickupsQuery.data?.pickups ?? [];

  return (
    <Screen
      scroll
      refreshControl={{
        refreshing: pickupsQuery.isFetching,
        onRefresh: () => void pickupsQuery.refetch(),
      }}
    >
      {header}
      <View style={styles.container}>
        <SectionCard title="Pickup address">
          {saved ? (
            <>
              <Text variant="bodyMedium">{saved.address}</Text>
              <Text variant="caption" tone="muted">
                Contact {saved.contactNumber} · address #{saved.addressId} · thana #
                {saved.policeStationId}
              </Text>
            </>
          ) : (
            <Text variant="bodySmall" tone="danger">
              No pickup address is configured for this courier. Add the pickup address id, thana
              id, address and contact number to the courier first.
            </Text>
          )}
          {canRequest && saved ? (
            <Button title="Request pickup" icon="bicycle-outline" fullWidth onPress={openForm} />
          ) : null}
        </SectionCard>

        <SectionCard title="Pickup requests">
          {pickupsQuery.isPending ? (
            <LoadingIndicator label="Loading pickups..." />
          ) : pickupsQuery.isError ? (
            <ErrorState
              title="Failed to load pickups"
              message={getErrorMessage(pickupsQuery.error)}
              onRetry={() => void pickupsQuery.refetch()}
              retryLabel="Retry"
            />
          ) : pickups.length === 0 ? (
            <Text variant="bodySmall" tone="muted">
              No pickup requests yet. Requesting one asks the courier to send a rider for your
              booked parcels.
            </Text>
          ) : (
            pickups.map((pickup) => (
              <View key={pickup.id} style={styles.pickupRow}>
                <Text variant="bodyMedium">
                  {pickup.pickupId ? `Pickup #${pickup.pickupId}` : 'Pickup request'} ·{' '}
                  {STATUS_LABEL[pickup.status]}
                </Text>
                <Text variant="caption" tone="muted">
                  {pickup.parcelCount} parcel{pickup.parcelCount === 1 ? '' : 's'} ·{' '}
                  {pickup.requestedAt.slice(0, 10)}
                  {pickup.error ? ` · ${pickup.error}` : ''}
                </Text>
                {pickup.status === 'requested' && canRequest ? (
                  <View style={styles.rowActions}>
                    <Button
                      title="Mark collected"
                      variant="outline"
                      size="sm"
                      onPress={() => setClosing({ id: pickup.id, status: 'collected' })}
                    />
                    <Button
                      title="Cancel request"
                      variant="ghost"
                      size="sm"
                      onPress={() => setClosing({ id: pickup.id, status: 'cancelled' })}
                    />
                  </View>
                ) : null}
              </View>
            ))
          )}
          <Text variant="caption" tone="muted">
            The courier confirms a request as Received. It does not expose rider progress, so
            “Collected” is your own confirmation that the parcels left the shop.
          </Text>
        </SectionCard>
      </View>

      <Dialog
        visible={formOpen}
        onClose={() => setFormOpen(false)}
        title="Request a pickup?"
        message="The courier sends a rider to your saved pickup address. Parcels must already be booked."
        primaryAction={{ label: 'Request pickup', loading: requestPickup.isPending, onPress: handleRequest }}
        secondaryAction={{ label: 'Not now' }}
      >
        <View style={styles.form}>
          {stationsQuery.isError ? (
            <Text variant="bodySmall" tone="danger">
              Could not load the thana list. You can still request using the saved thana.
            </Text>
          ) : null}
          <Select
            label="Police station (thana)"
            required
            placeholder={stationsQuery.isPending ? 'Loading thanas...' : 'Select thana'}
            value={stationId || null}
            options={stationOptions}
            onChange={setStationId}
            disabled={requestPickup.isPending}
          />
          <Input
            label="Estimated parcels (optional)"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="number-pad"
            editable={!requestPickup.isPending}
          />
          <Input
            label="Note for the rider (optional)"
            value={note}
            onChangeText={setNote}
            maxLength={500}
            multiline
            editable={!requestPickup.isPending}
          />
          {error ? (
            <Text variant="bodySmall" tone="danger" accessibilityRole="alert">
              {error}
            </Text>
          ) : null}
        </View>
      </Dialog>

      <Dialog
        visible={Boolean(closing)}
        onClose={() => setClosing(null)}
        title={closing?.status === 'collected' ? 'Mark pickup collected?' : 'Cancel this request?'}
        message={
          closing?.status === 'collected'
            ? 'Confirm the rider took these parcels. This is your own record; the courier does not report it.'
            : 'This closes the request here. It does not recall a rider who may already be on the way.'
        }
        primaryAction={{
          label: closing?.status === 'collected' ? 'Mark collected' : 'Cancel request',
          variant: closing?.status === 'cancelled' ? 'danger' : 'primary',
          loading: updatePickup.isPending,
          onPress: handleClose,
        }}
        secondaryAction={{ label: 'Back' }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
  pickupRow: { gap: spacing.xs, paddingVertical: spacing.sm },
  rowActions: { flexDirection: 'row', gap: spacing.sm },
  form: { gap: spacing.md },
});
