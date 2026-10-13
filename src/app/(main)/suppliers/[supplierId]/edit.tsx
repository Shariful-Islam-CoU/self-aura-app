import { router, useLocalSearchParams } from 'expo-router';

import { ErrorState, LoadingIndicator } from '@/components/feedback';
import { AppHeader, Screen } from '@/components/layout';
import { SupplierForm } from '@/features/suppliers/components';
import { useSupplierDetails, useUpdateSupplier } from '@/features/suppliers/queries';
import type { CreateSupplierInput, UpdateSupplierInput } from '@/features/suppliers/types';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/providers';

/**
 * Edit-supplier form. The screen loads the supplier first (permission-
 * gated: `suppliers.edit`), then mounts the shared form with the loaded
 * data as `initialValues`. The form never submits stale data - it always
 * posts the fresh `supplierId` from the route.
 */
export default function EditSupplierScreen() {
  const { supplierId } = useLocalSearchParams<{ supplierId: string }>();
  const { hasPermission } = usePermissions();
  const toast = useToast();
  const updateSupplier = useUpdateSupplier();
  const canEdit = hasPermission('suppliers.edit');

  // Must call hook unconditionally (before any early returns) per React hooks rules.
  const supplierQuery = useSupplierDetails(supplierId);
  const supplier = supplierQuery.data;

  const header = <AppHeader variant="feature" title="Edit supplier" onBack={() => router.back()} />;

  if (!canEdit) {
    return (
      <Screen>
        {header}
        <ErrorState title="Access denied" message="You don't have permission to edit suppliers." />
      </Screen>
    );
  }

  const handleSubmit = async (input: CreateSupplierInput | UpdateSupplierInput) => {
    await updateSupplier.mutateAsync({ id: supplierId!, input: input as UpdateSupplierInput });
    toast.success('Supplier updated.');
    router.back();
  };

  if (!supplierId) {
    return (
      <Screen>
        {header}
        <ErrorState
          title="Supplier not found"
          message="Open a supplier from the list to edit it."
        />
      </Screen>
    );
  }

  if (supplierQuery.isPending) {
    return (
      <Screen>
        {header}
        <LoadingIndicator label="Loading supplier..." />
      </Screen>
    );
  }

  if (!supplier) {
    return (
      <Screen>
        {header}
        <ErrorState title="Supplier not found" message="This supplier may have been removed." />
      </Screen>
    );
  }

  return (
    <Screen scroll keyboardAvoiding>
      {header}
      <SupplierForm
        mode="edit"
        initialValues={supplier}
        isSubmitting={updateSupplier.isPending}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
      />
    </Screen>
  );
}
