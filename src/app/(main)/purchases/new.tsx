import { router } from 'expo-router';

import { ErrorState } from '@/components/feedback';
import { AppHeader, Screen } from '@/components/layout';
import { PurchaseForm } from '@/features/purchases/components';
import { useCreatePurchase } from '@/features/purchases/queries';
import type { CreatePurchaseInput, UpdatePurchaseInput } from '@/features/purchases/types';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/providers';

/**
 * Create-purchase form (static route so it never shadows `[purchaseId]`).
 * Permission is checked before the form appears (`purchases.create`);
 * the backend re-validates everything and its 403/409/400 responses stay
 * authoritative - the form surfaces them instead of faking success.
 */
export default function CreatePurchaseScreen() {
  const { hasPermission } = usePermissions();
  const toast = useToast();
  const createPurchase = useCreatePurchase();
  const canCreate = hasPermission('purchases.create');

  const header = (
    <AppHeader variant="feature" title="Create purchase" onBack={() => router.back()} />
  );

  if (!canCreate) {
    return (
      <Screen>
        {header}
        <ErrorState
          title="Access denied"
          message="You don't have permission to create purchases."
        />
      </Screen>
    );
  }

  const handleSubmit = async (input: CreatePurchaseInput | UpdatePurchaseInput) => {
    await createPurchase.mutateAsync(input as CreatePurchaseInput);
    toast.success('Purchase created.');
    router.back();
  };

  return (
    <Screen scroll keyboardAvoiding>
      {header}
      <PurchaseForm
        mode="create"
        initialValues={null}
        isSubmitting={createPurchase.isPending}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
      />
    </Screen>
  );
}
