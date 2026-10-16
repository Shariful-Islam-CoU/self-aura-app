import { useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { getErrorMessage, isApiError } from '@/api';
import { EmptyState, ErrorState } from '@/components/feedback';
import { AppHeader, Screen } from '@/components/layout';
import { Badge, Button, Dialog, IconButton, Text } from '@/components/ui';
import { DetailRow, SectionCard } from '@/features/customers/components/SectionCard';
import { useCourierDetails, useDeactivateCourier } from '@/features/couriers';
import { CourierDetailsSkeleton } from '@/features/couriers/components';
import { courierStatusLabel, courierStatusTone } from '@/features/couriers/labels';
import { toWebsiteHref } from '@/features/couriers/utils';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/providers';
import { spacing } from '@/theme';
import { formatDateTime } from '@/utils/format';

/**
 * Courier details. Sections render backend data as-is; Edit and Deactivate are
 * offered only to permitted users. Deactivation is one-way (there is no
 * reactivation endpoint) and the backend rejects it (409) while the courier
 * still has active shipments - its message is surfaced, never faked.
 */
export default function CourierDetailsScreen() {
  const { courierId } = useLocalSearchParams<{ courierId: string }>();
  const id = courierId ?? '';
  const { hasPermission } = usePermissions();
  const toast = useToast();

  const canView = hasPermission('couriers.view');
  const canEdit = hasPermission('couriers.edit');
  const canDeactivate = hasPermission('couriers.delete');

  const courierQuery = useCourierDetails(canView && id ? id : undefined);
  const deactivateCourier = useDeactivateCourier(id);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (courierQuery.isFetching) return;
    setRefreshing(true);
    try {
      await courierQuery.refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const header = (
    <AppHeader variant="feature" title="Courier details" onBack={() => router.back()} />
  );

  if (!id) {
    return (
      <Screen>
        {header}
        <EmptyState
          icon="bicycle-outline"
          title="Courier not found"
          description="Open a courier from the list to see its details."
          actionLabel="Back to couriers"
          onAction={() => router.replace('/couriers')}
        />
      </Screen>
    );
  }

  if (!canView) {
    return (
      <Screen>
        {header}
        <ErrorState title="Access denied" message="You don't have permission to view couriers." />
      </Screen>
    );
  }

  if (courierQuery.isPending) {
    return (
      <Screen scroll>
        {header}
        <CourierDetailsSkeleton />
      </Screen>
    );
  }

  const courier = courierQuery.data;
  if (!courier) {
    const error = courierQuery.error;
    if (isApiError(error) && error.kind === 'notFound') {
      return (
        <Screen>
          {header}
          <EmptyState
            icon="bicycle-outline"
            title="Courier not found"
            description="This courier may have been removed."
            actionLabel="Back to couriers"
            onAction={() => router.replace('/couriers')}
          />
        </Screen>
      );
    }
    return (
      <Screen>
        {header}
        <ErrorState
          title="Failed to load courier"
          message={getErrorMessage(error)}
          onRetry={() => void courierQuery.refetch()}
          retryLabel="Retry"
        />
      </Screen>
    );
  }

  const websiteHref = toWebsiteHref(courier.website);
  const phone = courier.phone?.trim();

  const handleCall = async () => {
    if (!phone) return;
    try {
      await Linking.openURL(`tel:${phone.replace(/[^\d+]/g, '')}`);
    } catch {
      toast.error('Could not open the phone app.');
    }
  };

  const handleDeactivate = () => {
    deactivateCourier.mutate(undefined, {
      onSuccess: () => {
        setDeactivateOpen(false);
        toast.success('Courier deactivated.');
      },
      onError: (error) => {
        setDeactivateOpen(false);
        toast.error(getErrorMessage(error));
        void courierQuery.refetch();
      },
    });
  };

  return (
    <Screen scroll refreshControl={{ refreshing, onRefresh: () => void handleRefresh() }}>
      {header}
      <View style={styles.container}>
        <SectionCard title="Courier">
          <Text variant="subtitle">{courier.name}</Text>
          <Badge
            label={courierStatusLabel(courier.isActive)}
            tone={courierStatusTone(courier.isActive)}
          />
          {courier.contactPerson ? (
            <DetailRow label="Contact person" value={courier.contactPerson} />
          ) : null}
          {phone ? (
            <DetailRow label="Phone">
              <View style={styles.callRow}>
                <Text variant="bodyMedium" numberOfLines={1}>
                  {phone}
                </Text>
                <IconButton
                  icon="call-outline"
                  accessibilityLabel={`Call ${courier.name} at ${phone}`}
                  onPress={() => void handleCall()}
                />
              </View>
            </DetailRow>
          ) : null}
          {courier.website ? (
            <DetailRow label="Website">
              {websiteHref ? (
                <Text
                  variant="bodyMedium"
                  tone="primary"
                  accessibilityRole="link"
                  numberOfLines={2}
                  onPress={() => void Linking.openURL(websiteHref)}
                >
                  {courier.website.trim()}
                </Text>
              ) : (
                <Text variant="bodyMedium" numberOfLines={2}>
                  {courier.website.trim()}
                </Text>
              )}
            </DetailRow>
          ) : null}
          {courier.address ? <DetailRow label="Address" value={courier.address} /> : null}
        </SectionCard>

        {courier.notes ? (
          <SectionCard title="Notes">
            <Text variant="bodyMedium" tone="secondary">
              {courier.notes}
            </Text>
          </SectionCard>
        ) : null}

        <SectionCard title="Record">
          <DetailRow label="Created" value={formatDateTime(courier.createdAt)} />
          <DetailRow label="Last updated" value={formatDateTime(courier.updatedAt)} />
        </SectionCard>

        <SectionCard title="Actions">
          {canEdit ? (
            <Button
              title="Edit courier"
              icon="create-outline"
              variant="outline"
              fullWidth
              onPress={() => router.push(`/couriers/${courier.id}/edit`)}
            />
          ) : null}
          {canDeactivate && courier.isActive ? (
            <Button
              title="Deactivate courier"
              icon="close-circle-outline"
              variant="danger"
              fullWidth
              disabled={deactivateCourier.isPending}
              onPress={() => setDeactivateOpen(true)}
            />
          ) : null}
          {!canEdit && !(canDeactivate && courier.isActive) ? (
            <Text variant="bodySmall" tone="muted">
              No actions are available for this courier with your permissions.
            </Text>
          ) : null}
        </SectionCard>
      </View>

      <Dialog
        visible={deactivateOpen}
        onClose={() => setDeactivateOpen(false)}
        title="Deactivate this courier?"
        message={`${courier.name} will stop receiving new shipments. Deactivation only succeeds while the courier has no active shipments, and cannot be undone from the app.`}
        primaryAction={{
          label: 'Deactivate',
          variant: 'danger',
          loading: deactivateCourier.isPending,
          onPress: handleDeactivate,
        }}
        secondaryAction={{ label: 'Keep active' }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
  callRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 1,
  },
});
