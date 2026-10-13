import { router } from 'expo-router';

import { ErrorState } from '@/components/feedback';
import { AppHeader, Screen } from '@/components/layout';
import { CustomerForm } from '@/features/customers/components';
import { useCreateCustomer } from '@/features/customers/queries';
import type { CreateCustomerInput, UpdateCustomerInput } from '@/features/customers/types';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/providers';

/**
 * Create-customer form (static route so it never shadows `[customerId]`).
 * Permission is checked before the form appears (`customers.create`);
 * the backend re-validates everything and its 403/409/400 responses stay
 * authoritative - the form surfaces them instead of faking success.
 */
export default function CreateCustomerScreen() {
  const { hasPermission } = usePermissions();
  const toast = useToast();
  const createCustomer = useCreateCustomer();
  const canCreate = hasPermission('customers.create');

  const header = <AppHeader variant="feature" title="Add customer" onBack={() => router.back()} />;

  if (!canCreate) {
    return (
      <Screen>
        {header}
        <ErrorState
          title="Access denied"
          message="You don't have permission to create customers."
        />
      </Screen>
    );
  }

  const handleSubmit = async (input: CreateCustomerInput | UpdateCustomerInput) => {
    await createCustomer.mutateAsync(input as CreateCustomerInput);
    toast.success('Customer created.');
    router.back();
  };

  return (
    <Screen scroll keyboardAvoiding>
      {header}
      <CustomerForm
        mode="create"
        initialValues={null}
        isSubmitting={createCustomer.isPending}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
      />
    </Screen>
  );
}
