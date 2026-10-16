import { router } from 'expo-router';

import { ErrorState } from '@/components/feedback';
import { AppHeader, Screen } from '@/components/layout';
import { useCreateCourier } from '@/features/couriers';
import type { CreateCourierData, UpdateCourierData } from '@/features/couriers';
import { CourierForm } from '@/features/couriers/components';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/providers';

/**
 * Create-courier form (static route so it never shadows `[courierId]`).
 * Permission is checked before the form appears (`couriers.create`); the
 * backend re-validates and its responses stay authoritative.
 */
export default function CreateCourierScreen() {
  const { hasPermission } = usePermissions();
  const toast = useToast();
  const createCourier = useCreateCourier();
  const canCreate = hasPermission('couriers.create');

  const header = <AppHeader variant="feature" title="New courier" onBack={() => router.back()} />;

  if (!canCreate) {
    return (
      <Screen>
        {header}
        <ErrorState
          title="Access denied"
          message="You don't have permission to create couriers."
        />
      </Screen>
    );
  }

  const handleSubmit = async (input: CreateCourierData | UpdateCourierData) => {
    // Rejections are shown inline by the form with the server's own message.
    await createCourier.mutateAsync(input as CreateCourierData);
    toast.success('Courier created.');
    router.back();
  };

  return (
    <Screen scroll keyboardAvoiding>
      {header}
      <CourierForm
        mode="create"
        courier={null}
        isSubmitting={createCourier.isPending}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
      />
    </Screen>
  );
}
