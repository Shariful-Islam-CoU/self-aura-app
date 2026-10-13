import { router } from 'expo-router';

import { ErrorState } from '@/components/feedback';
import { AppHeader, Screen } from '@/components/layout';
import { SupplierForm } from '@/features/suppliers/components';
import { useCreateSupplier } from '@/features/suppliers/queries';
import type { CreateSupplierInput, UpdateSupplierInput } from '@/features/suppliers/types';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/providers';

/**
 * Create-supplier form (static route so it never shadows `[supplierId]`).
 * Permission is checked before the form appears (`suppliers.create`);
 * the backend re-validates everything and its 403/409/400 responses stay
 * authoritative - the form surfaces them instead of faking success.
 */
export default function CreateSupplierScreen() {
  const { hasPermission } = usePermissions();
  const toast = useToast();
  const createSupplier = useCreateSupplier();
  const canCreate = hasPermission('suppliers.create');

  const header = <AppHeader variant="feature" title="Add supplier" onBack={() => router.back()} />;

  if (!canCreate) {
    return (
      <Screen>
        {header}
        <ErrorState
          title="Access denied"
          message="You don't have permission to create suppliers."
        />
      </Screen>
    );
  }

  const handleSubmit = async (input: CreateSupplierInput | UpdateSupplierInput) => {
    await createSupplier.mutateAsync(input as CreateSupplierInput);
    toast.success('Supplier created.');
    router.back();
  };

  return (
    <Screen scroll keyboardAvoiding>
      {header}
      <SupplierForm
        mode="create"
        initialValues={null}
        isSubmitting={createSupplier.isPending}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
      />
    </Screen>
  );
}
