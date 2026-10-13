import { router, useLocalSearchParams } from 'expo-router';

import { ErrorState, LoadingIndicator } from '@/components/feedback';
import { AppHeader, Screen } from '@/components/layout';
import { PaymentForm } from '@/features/payments/components';
import { usePaymentDetails, useUpdatePayment } from '@/features/payments/queries';
import type { UpdatePaymentInput } from '@/features/payments/types';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/providers';

/**
 * Edit-payment form. The screen loads the payment first (permission-gated:
 * `payments.edit`), then mounts the shared form with the loaded data as
 * `initialValues`. Only the backend-editable fields are offered (method, date,
 * reference, note) - order, amount and type cannot be changed through PATCH.
 * It always submits the fresh `paymentId` from the route - never stale data.
 */
export default function EditPaymentScreen() {
  const { paymentId } = useLocalSearchParams<{ paymentId: string }>();
  const { hasPermission } = usePermissions();
  const toast = useToast();
  const updatePayment = useUpdatePayment();
  const canEdit = hasPermission('payments.edit');

  // Hook is called unconditionally (before any early return) per the hooks rules.
  const paymentQuery = usePaymentDetails(canEdit ? paymentId : undefined);
  const payment = paymentQuery.data;

  const header = <AppHeader variant="feature" title="Edit payment" onBack={() => router.back()} />;

  if (!canEdit) {
    return (
      <Screen>
        {header}
        <ErrorState title="Access denied" message="You don't have permission to edit payments." />
      </Screen>
    );
  }

  const handleSubmit = async (input: UpdatePaymentInput) => {
    await updatePayment.mutateAsync({ id: paymentId!, input });
    toast.success('Payment updated.');
    router.back();
  };

  if (!paymentId) {
    return (
      <Screen>
        {header}
        <ErrorState title="Payment not found" message="Open a payment from the list to edit it." />
      </Screen>
    );
  }

  if (paymentQuery.isPending) {
    return (
      <Screen>
        {header}
        <LoadingIndicator label="Loading payment..." />
      </Screen>
    );
  }

  if (!payment) {
    return (
      <Screen>
        {header}
        <ErrorState title="Payment not found" message="This payment may have been removed." />
      </Screen>
    );
  }

  return (
    <Screen scroll keyboardAvoiding>
      {header}
      <PaymentForm
        mode="edit"
        initialValues={payment}
        isSubmitting={updatePayment.isPending}
        onSubmit={(input) => handleSubmit(input as UpdatePaymentInput)}
        onCancel={() => router.back()}
      />
    </Screen>
  );
}
