import { router, useLocalSearchParams } from 'expo-router';

import { getErrorMessage, isApiError } from '@/api';
import { EmptyState, ErrorState } from '@/components/feedback';
import { AppHeader, Screen } from '@/components/layout';
import { CustomerDetailsSkeleton, CustomerForm } from '@/features/customers/components';
import { useCustomerDetails, useUpdateCustomer } from '@/features/customers/queries';
import type { CreateCustomerInput, UpdateCustomerInput } from '@/features/customers/types';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/providers';

/**
 * Edit-customer form. Nested under the details segment so the navigation
 * chain is always: Edit -> back -> Customer details -> back -> Customer
 * list (Android back included). The form only mounts once the customer
 * has been fetched BY ID - the customer object is never passed through
 * navigation params.
 */
export default function EditCustomerScreen() {
  const { customerId } = useLocalSearchParams<{ customerId: string }>();
  const { hasPermission } = usePermissions();
  const toast = useToast();

  const canEdit = hasPermission('customers.edit');
  const customerQuery = useCustomerDetails(canEdit ? customerId : undefined);
  const updateCustomer = useUpdateCustomer();

  const header = <AppHeader variant="feature" title="Edit customer" onBack={() => router.back()} />;

  if (!customerId) {
    return (
      <Screen>
        {header}
        <EmptyState
          icon="people-outline"
          title="Customer not found"
          description="Open a customer from the list to edit their details."
          actionLabel="Back to customers"
          onAction={() => router.replace('/customers')}
        />
      </Screen>
    );
  }

  if (!canEdit) {
    return (
      <Screen>
        {header}
        <ErrorState title="Access denied" message="You don't have permission to edit customers." />
      </Screen>
    );
  }

  if (customerQuery.isPending) {
    return (
      <Screen>
        {header}
        <CustomerDetailsSkeleton />
      </Screen>
    );
  }

  const customer = customerQuery.data;

  if (!customer) {
    const error = customerQuery.error;
    if (isApiError(error) && error.kind === 'authorization') {
      return (
        <Screen>
          {header}
          <ErrorState
            title="Access denied"
            message="You don't have permission to edit this customer."
          />
        </Screen>
      );
    }
    if (isApiError(error) && error.kind === 'notFound') {
      return (
        <Screen>
          {header}
          <EmptyState
            icon="people-outline"
            title="Customer not found"
            description="This customer may have been removed."
            actionLabel="Back to customers"
            onAction={() => router.replace('/customers')}
          />
        </Screen>
      );
    }
    return (
      <Screen>
        {header}
        <ErrorState
          title="Failed to load customer"
          message={getErrorMessage(error)}
          onRetry={() => void customerQuery.refetch()}
          retryLabel="Retry"
        />
      </Screen>
    );
  }

  const handleSubmit = async (input: CreateCustomerInput | UpdateCustomerInput) => {
    await updateCustomer.mutateAsync({
      id: customer.id,
      input: input as UpdateCustomerInput,
    });
    toast.success('Customer updated.');
    router.back();
  };

  return (
    <Screen scroll keyboardAvoiding>
      {header}
      <CustomerForm
        mode="edit"
        initialValues={customer}
        isSubmitting={updateCustomer.isPending}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
      />
    </Screen>
  );
}
