import { router } from 'expo-router';

import { ErrorState } from '@/components/feedback';
import { AppHeader, Screen } from '@/components/layout';
import { PaymentForm } from '@/features/payments/components';
import { useCreatePayment } from '@/features/payments/queries';
import type { CreatePaymentInput } from '@/features/payments/types';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/providers';

/**
 * Record-payment form (static route so it never shadows `[paymentId]`).
 * Permission is checked before the form appears (`payments.create`); the
 * backend re-validates everything, generates the `PAY-######` number and its
 * 403/400 responses stay authoritative - the form surfaces them instead of
 * faking success. After recording, the new payment's details replace this
 * screen so Back returns to the list.
 */
export default function CreatePaymentScreen() {
  const { hasPermission } = usePermissions();
  const toast = useToast();
  const createPayment = useCreatePayment();
  const canCreate = hasPermission('payments.create');

  const header = (
    <AppHeader variant="feature" title="Record payment" onBack={() => router.back()} />
  );

  if (!canCreate) {
    return (
      <Screen>
        {header}
        <ErrorState title="Access denied" message="You don't have permission to record payments." />
      </Screen>
    );
  }

  const handleSubmit = async (input: CreatePaymentInput) => {
    const payment = await createPayment.mutateAsync(input);
    toast.success('Payment recorded.');
    router.replace(`/payments/${payment.id}`);
  };

  return (
    <Screen scroll keyboardAvoiding>
      {header}
      <PaymentForm
        mode="create"
        initialValues={null}
        isSubmitting={createPayment.isPending}
        onSubmit={(input) => handleSubmit(input as CreatePaymentInput)}
        onCancel={() => router.back()}
      />
    </Screen>
  );
}
