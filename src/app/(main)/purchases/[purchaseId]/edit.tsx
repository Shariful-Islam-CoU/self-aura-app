import { router, useLocalSearchParams } from 'expo-router';

import { ErrorState, LoadingIndicator } from '@/components/feedback';
import { AppHeader, Screen } from '@/components/layout';
import { PurchaseForm } from '@/features/purchases/components';
import { usePurchaseDetails, useUpdatePurchase } from '@/features/purchases/queries';
import type { CreatePurchaseInput, UpdatePurchaseInput } from '@/features/purchases/types';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/providers';

/**
 * Edit-purchase form. The screen loads the purchase first (permission-
 * gated: `purchases.edit`), then mounts the shared form with the loaded
 * data as `initialValues`. The form never submits stale data - it always
 * posts the fresh `purchaseId` from the route.
 * Only draft purchases can be edited (backend rejects non-drafts with 409).
 */
export default function EditPurchaseScreen() {
  const { purchaseId } = useLocalSearchParams<{ purchaseId: string }>();
  const { hasPermission } = usePermissions();
  const toast = useToast();
  const updatePurchase = useUpdatePurchase();
  const canEdit = hasPermission('purchases.edit');

  // Must call hook unconditionally (before any early returns) per React hooks rules.
  const purchaseQuery = usePurchaseDetails(canEdit ? purchaseId : undefined);
  const purchase = purchaseQuery.data;

  const header = <AppHeader variant="feature" title="Edit purchase" onBack={() => router.back()} />;

  if (!canEdit) {
    return (
      <Screen>
        {header}
        <ErrorState title="Access denied" message="You don't have permission to edit purchases." />
      </Screen>
    );
  }

  const handleSubmit = async (input: CreatePurchaseInput | UpdatePurchaseInput) => {
    await updatePurchase.mutateAsync({ id: purchaseId!, input: input as UpdatePurchaseInput });
    toast.success('Purchase updated.');
    router.back();
  };

  if (!purchaseId) {
    return (
      <Screen>
        {header}
        <ErrorState
          title="Purchase not found"
          message="Open a purchase from the list to edit it."
        />
      </Screen>
    );
  }

  if (purchaseQuery.isPending) {
    return (
      <Screen>
        {header}
        <LoadingIndicator label="Loading purchase..." />
      </Screen>
    );
  }

  if (!purchase) {
    return (
      <Screen>
        {header}
        <ErrorState title="Purchase not found" message="This purchase may have been removed." />
      </Screen>
    );
  }

  if (purchase.status !== 'draft') {
    return (
      <Screen>
        {header}
        <ErrorState title="Cannot edit" message="Only draft purchases can be edited." />
      </Screen>
    );
  }

  return (
    <Screen scroll keyboardAvoiding>
      {header}
      <PurchaseForm
        mode="edit"
        initialValues={purchase}
        isSubmitting={updatePurchase.isPending}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
      />
    </Screen>
  );
}
