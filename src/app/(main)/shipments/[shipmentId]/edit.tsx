import { router, useLocalSearchParams } from 'expo-router';

import { getErrorMessage, isApiError } from '@/api';
import { EmptyState, ErrorState } from '@/components/feedback';
import { AppHeader, Screen } from '@/components/layout';
import { ShipmentDetailsSkeleton, ShipmentForm } from '@/features/shipments/components';
import { useShipmentDetails, useUpdateShipment } from '@/features/shipments/queries';
import type { CreateShipmentData, UpdateShipmentData } from '@/features/shipments/types';
import { EDITABLE_SHIPMENT_STATUSES } from '@/features/shipments/types';
import { SHIPMENT_STATUS_LABELS } from '@/features/shipments/labels';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/providers';

/**
 * Edit-shipment form. Only shipments in backend-editable statuses can be
 * edited (delivered / returned / cancelled are rejected by the server) -
 * anything else renders an explanatory state instead of a doomed form.
 * The linked order is never editable here (backend rule); only courier,
 * tracking number, delivery charge and note are sent, and only when changed.
 */
export default function EditShipmentScreen() {
  const { shipmentId } = useLocalSearchParams<{ shipmentId: string }>();
  const id = shipmentId ?? '';
  const { hasPermission } = usePermissions();
  const toast = useToast();
  const canEdit = hasPermission('shipments.edit');

  const shipmentQuery = useShipmentDetails(canEdit && id ? id : undefined);
  const updateShipment = useUpdateShipment(id);

  const header = <AppHeader variant="feature" title="Edit shipment" onBack={() => router.back()} />;

  if (!id) {
    return (
      <Screen>
        {header}
        <EmptyState
          icon="cube-outline"
          title="Shipment not found"
          description="Open a shipment from the list to edit it."
          actionLabel="Back to shipments"
          onAction={() => router.replace('/shipments')}
        />
      </Screen>
    );
  }

  if (!canEdit) {
    return (
      <Screen>
        {header}
        <ErrorState title="Access denied" message="You don't have permission to edit shipments." />
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

  const shipment = shipmentQuery.data;
  if (!shipment) {
    const error = shipmentQuery.error;
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

  if (!EDITABLE_SHIPMENT_STATUSES.includes(shipment.status)) {
    return (
      <Screen>
        {header}
        <EmptyState
          icon="cube-outline"
          title="Shipment can no longer be edited"
          description={`Shipments with status "${SHIPMENT_STATUS_LABELS[shipment.status]}" are locked by the server. Change its status instead.`}
          actionLabel="Back to shipment"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  const handleSubmit = async (input: CreateShipmentData | UpdateShipmentData) => {
    // Rejections are shown inline by the form with the server's own message.
    await updateShipment.mutateAsync(input as UpdateShipmentData);
    toast.success('Shipment updated.');
    router.back();
  };

  return (
    <Screen scroll keyboardAvoiding>
      {header}
      <ShipmentForm
        mode="edit"
        shipment={shipment}
        isSubmitting={updateShipment.isPending}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
      />
    </Screen>
  );
}
