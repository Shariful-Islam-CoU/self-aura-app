import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { getErrorMessage, isApiError } from '@/api';
import { EmptyState, ErrorState } from '@/components/feedback';
import { AppHeader, Screen } from '@/components/layout';
import { Dialog, Select } from '@/components/ui';
import {
  ShipmentActionsSection,
  ShipmentAddressSection,
  ShipmentCourierSection,
  ShipmentDetailsSkeleton,
  ShipmentHistorySection,
  ShipmentNoteSection,
  ShipmentStatusSection,
  ShipmentSummarySection,
} from '@/features/shipments/components';
import {
  DELIVERY_FAILURE_REASON_LABELS,
  SHIPMENT_STATUS_LABELS,
} from '@/features/shipments/labels';
import {
  useCancelShipment,
  useShipmentDetails,
  useShipmentHistory,
  useUpdateShipmentStatus,
} from '@/features/shipments/queries';
import {
  DELIVERY_FAILURE_REASONS,
  type DeliveryFailureReason,
  type ShipmentStatus,
} from '@/features/shipments/types';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/providers';
import { spacing } from '@/theme';

/**
 * Shipment details: fetched by ID only (navigation passes `shipmentId` -
 * never an object). Sections render backend data as-is, the tracking
 * timeline comes from the real event log, and only the status transitions
 * + cancellation the backend currently accepts are offered. Every action
 * is confirmed, backend-validated and never faked - a rejected request
 * shows the server's own message and reloads the real state.
 */
export default function ShipmentDetailsScreen() {
  const { shipmentId } = useLocalSearchParams<{ shipmentId: string }>();
  const { hasPermission } = usePermissions();
  const toast = useToast();

  const canView = hasPermission('shipments.view');
  const canEdit = hasPermission('shipments.edit');
  const canCancel = hasPermission('shipments.cancel');
  const canViewOrder = hasPermission('orders.view');

  const shipmentQuery = useShipmentDetails(canView ? shipmentId : undefined);
  const historyQuery = useShipmentHistory(canView ? shipmentId : undefined);
  // Mutation hooks take the id at creation; they only fire from the action
  // buttons below, which are unreachable until a real shipment has loaded.
  const updateStatus = useUpdateShipmentStatus(shipmentId ?? '');
  const cancelShipment = useCancelShipment(shipmentId ?? '');

  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [pendingTarget, setPendingTarget] = useState<ShipmentStatus | null>(null);
  const [failureReason, setFailureReason] = useState<DeliveryFailureReason | ''>('');
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const shipment = shipmentQuery.data;
  const isBusy = updateStatus.isPending || cancelShipment.isPending;
  const needsFailureReason = pendingTarget === 'delivery_failed';

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.allSettled([shipmentQuery.refetch(), historyQuery.refetch()]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleAdvance = () => {
    if (!shipment || !pendingTarget || isBusy) return;
    // The backend rejects delivery_failed without a reason (400) - block it
    // here with an inline message instead of firing a doomed request.
    if (needsFailureReason && !failureReason) return;
    const targetLabel = SHIPMENT_STATUS_LABELS[pendingTarget];
    updateStatus.mutate(
      {
        status: pendingTarget,
        ...(failureReason ? { failureReason } : {}),
      },
      {
        onSuccess: () => {
          setStatusDialogOpen(false);
          toast.success(`Shipment marked as ${targetLabel}.`);
        },
        onError: (error) => {
          // Backend rejected the transition (stale state / permission):
          // show its message and reload the real state - never fake success.
          setStatusDialogOpen(false);
          toast.error(getErrorMessage(error));
          void shipmentQuery.refetch();
        },
      },
    );
  };

  const handleCancel = () => {
    if (!shipment || isBusy) return;
    cancelShipment.mutate(undefined, {
      onSuccess: () => {
        setCancelDialogOpen(false);
        toast.success('Shipment cancelled successfully.');
      },
      onError: (error) => {
        setCancelDialogOpen(false);
        toast.error(getErrorMessage(error));
        void shipmentQuery.refetch();
      },
    });
  };

  const header = (
    <AppHeader variant="feature" title="Shipment details" onBack={() => router.back()} />
  );

  if (!shipmentId) {
    return (
      <Screen>
        {header}
        <EmptyState
          icon="cube-outline"
          title="Shipment not found"
          description="Open a shipment from the list to see its details."
          actionLabel="Back to shipments"
          onAction={() => router.replace('/shipments')}
        />
      </Screen>
    );
  }

  if (!canView) {
    return (
      <Screen>
        {header}
        <ErrorState
          title="Access denied"
          message="You don't have permission to view this shipment."
        />
      </Screen>
    );
  }

  if (shipmentQuery.isPending) {
    return (
      <Screen>
        {header}
        <ShipmentDetailsSkeleton />
      </Screen>
    );
  }

  if (!shipment) {
    const error = shipmentQuery.error;
    if (isApiError(error) && error.kind === 'authorization') {
      return (
        <Screen>
          {header}
          <ErrorState
            title="Access denied"
            message="You don't have permission to view this shipment."
          />
        </Screen>
      );
    }
    if (isApiError(error) && error.kind === 'notFound') {
      return (
        <Screen>
          {header}
          <EmptyState
            icon="cube-outline"
            title="Shipment not found"
            description="This shipment may have been removed."
            actionLabel="Back to shipments"
            onAction={() => router.replace('/shipments')}
          />
        </Screen>
      );
    }
    return (
      <Screen>
        {header}
        <ErrorState
          title="Failed to load shipment"
          message={getErrorMessage(error)}
          onRetry={() => void shipmentQuery.refetch()}
          retryLabel="Retry"
        />
      </Screen>
    );
  }

  return (
    <Screen
      scroll
      refreshControl={{
        refreshing,
        onRefresh: () => void handleRefresh(),
      }}
    >
      {header}
      <View style={styles.container}>
        <ShipmentSummarySection
          shipment={shipment}
          canViewOrder={canViewOrder}
          onViewOrder={() => router.push(`/orders/${shipment.order.id}`)}
        />
        <ShipmentStatusSection shipment={shipment} />
        <ShipmentCourierSection
          shipment={shipment}
          onCallFailed={(message) => toast.error(message)}
        />
        <ShipmentAddressSection shipment={shipment} />
        {shipment.note ? <ShipmentNoteSection note={shipment.note} /> : null}
        <ShipmentHistorySection events={historyQuery.data} isLoading={historyQuery.isPending} />
        <ShipmentActionsSection
          shipment={shipment}
          canEdit={canEdit}
          canCancel={canCancel}
          isBusy={isBusy}
          onAdvance={(next) => {
            updateStatus.reset();
            setPendingTarget(next);
            setFailureReason('');
            setStatusDialogOpen(true);
          }}
          onRequestCancel={() => {
            cancelShipment.reset();
            setCancelDialogOpen(true);
          }}
          onRequestEdit={() => router.push(`/shipments/${shipment.id}/edit`)}
        />
      </View>

      <Dialog
        visible={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
        title={
          pendingTarget ? `Mark as ${SHIPMENT_STATUS_LABELS[pendingTarget]}?` : 'Shipment status'
        }
        message={
          pendingTarget
            ? `Shipment ${shipment.shipmentNumber} will move from ${SHIPMENT_STATUS_LABELS[shipment.status]} to ${SHIPMENT_STATUS_LABELS[pendingTarget]}. The server validates every status change.`
            : undefined
        }
        primaryAction={{
          label: pendingTarget ? `Mark as ${SHIPMENT_STATUS_LABELS[pendingTarget]}` : 'Confirm',
          loading: updateStatus.isPending,
          onPress: handleAdvance,
        }}
        secondaryAction={{ label: 'Not now' }}
      >
        {needsFailureReason ? (
          <Select
            label="Failure reason"
            required
            placeholder="Select a reason"
            value={failureReason || null}
            options={DELIVERY_FAILURE_REASONS.map((reason) => ({
              value: reason,
              label: DELIVERY_FAILURE_REASON_LABELS[reason],
            }))}
            onChange={(value) => setFailureReason(value as DeliveryFailureReason)}
            error={failureReason ? undefined : 'A reason is required to mark delivery as failed.'}
          />
        ) : null}
      </Dialog>

      <Dialog
        visible={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        title="Cancel this shipment?"
        message={`Shipment ${shipment.shipmentNumber} will be cancelled. This cannot be undone.`}
        primaryAction={{
          label: 'Cancel shipment',
          variant: 'danger',
          loading: cancelShipment.isPending,
          onPress: handleCancel,
        }}
        secondaryAction={{ label: 'Keep shipment' }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
});
