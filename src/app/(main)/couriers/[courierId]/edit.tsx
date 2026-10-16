import { router, useLocalSearchParams } from 'expo-router';

import { getErrorMessage, isApiError } from '@/api';
import { EmptyState, ErrorState } from '@/components/feedback';
import { AppHeader, Screen } from '@/components/layout';
import { useCourierDetails, useUpdateCourier } from '@/features/couriers';
import type { CreateCourierData, UpdateCourierData } from '@/features/couriers';
import { CourierDetailsSkeleton, CourierForm } from '@/features/couriers/components';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/providers';

/**
 * Edit-courier form. Permission is checked before the form appears
 * (`couriers.edit`); the linked record is fetched by ID and the backend
 * re-validates on save.
 */
export default function EditCourierScreen() {
  const { courierId } = useLocalSearchParams<{ courierId: string }>();
  const id = courierId ?? '';
  const { hasPermission } = usePermissions();
  const toast = useToast();
  const canEdit = hasPermission('couriers.edit');

  const courierQuery = useCourierDetails(canEdit && id ? id : undefined);
  const updateCourier = useUpdateCourier(id);

  const header = <AppHeader variant="feature" title="Edit courier" onBack={() => router.back()} />;

  if (!id) {
    return (
      <Screen>
        {header}
        <EmptyState
          icon="bicycle-outline"
          title="Courier not found"
          description="Open a courier from the list to edit it."
          actionLabel="Back to couriers"
          onAction={() => router.replace('/couriers')}
        />
      </Screen>
    );
  }

  if (!canEdit) {
    return (
      <Screen>
        {header}
        <ErrorState title="Access denied" message="You don't have permission to edit couriers." />
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

  const handleSubmit = async (input: CreateCourierData | UpdateCourierData) => {
    // Rejections are shown inline by the form with the server's own message.
    await updateCourier.mutateAsync(input as UpdateCourierData);
    toast.success('Courier updated.');
    router.back();
  };

  return (
    <Screen scroll keyboardAvoiding>
      {header}
      <CourierForm
        mode="edit"
        courier={courier}
        isSubmitting={updateCourier.isPending}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
      />
    </Screen>
  );
}
