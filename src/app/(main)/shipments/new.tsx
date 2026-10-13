import { router } from 'expo-router';

import { ErrorState } from '@/components/feedback';
import { AppHeader, Screen } from '@/components/layout';
import { ShipmentForm } from '@/features/shipments/components';
import { useCreateShipment } from '@/features/shipments/queries';
import type { CreateShipmentData, UpdateShipmentData } from '@/features/shipments/types';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/providers';

/**
 * Create-shipment form (static route so it never shadows `[shipmentId]`).
 * Permission is checked before the form appears (`shipments.create`);
 * the backend re-validates everything (shippable order, active courier, no
 * duplicate active shipment) and its 403/409/400 responses stay
 * authoritative - the form surfaces them instead of faking success.
 */
export default function CreateShipmentScreen() {
  const { hasPermission } = usePermissions();
  const toast = useToast();
  const createShipment = useCreateShipment();
  const canCreate = hasPermission('shipments.create');

  const header = (
    <AppHeader variant="feature" title="Create shipment" onBack={() => router.back()} />
  );

  if (!canCreate) {
    return (
      <Screen>
        {header}
        <ErrorState
          title="Access denied"
          message="You don't have permission to create shipments."
        />
      </Screen>
    );
  }

  const handleSubmit = async (input: CreateShipmentData | UpdateShipmentData) => {
    // Rejections are shown inline by the form with the server's own message.
    await createShipment.mutateAsync(input as CreateShipmentData);
    toast.success('Shipment created.');
    router.back();
  };

  return (
    <Screen scroll keyboardAvoiding>
      {header}
      <ShipmentForm
        mode="create"
        shipment={null}
        isSubmitting={createShipment.isPending}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
      />
    </Screen>
  );
}
