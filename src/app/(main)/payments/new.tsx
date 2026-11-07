import { router, useLocalSearchParams } from 'expo-router';

import { ErrorState, LoadingIndicator } from '@/components/feedback';
import { AppHeader, Screen } from '@/components/layout';
import { PaymentForm } from '@/features/payments/components';
import { useCreatePayment } from '@/features/payments/queries';
import type { CreatePaymentInput } from '@/features/payments/types';
import { useOrderDetails } from '@/features/orders/queries';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/providers';

/**
 * Record-payment form (static route so it never shadows `[paymentId]`).
 * Permission is checked before the form appears (`payments.create`); the
 * backend re-validates everything, generates the `PAY-######` number and its
 * 403/400 responses stay authoritative - the form surfaces them instead of
 * faking success.
 *
 * Two entry points, with different exit paths:
 *
 * - **Payments list** (`/payments/new`, no params): after saving, the new
 *   payment's details replace this screen so Back returns to the list.
 * - **An order** (`/payments/new?orderId=..&amount=..`, from the post-delivery
 *   "Add Payment?" prompt): the order and amount arrive prefilled, and both a
 *   successful save and Back land on the **Payments list**. This screen was
 *   pushed from a different navigator (the orders tab), so leaving via
 *   `replace('/payments')` is what keeps the stack sane - going back to the
 *   order detail here would leave a payments screen whose Back re-enters the
 *   order, and leaving it as-is would render the order twice in history.
 */
export default function CreatePaymentScreen() {
  const { hasPermission } = usePermissions();
  const toast = useToast();
  const createPayment = useCreatePayment();

  const params = useLocalSearchParams<{ orderId?: string; amount?: string }>();
  const orderId = typeof params.orderId === 'string' ? params.orderId : '';
  const parsedAmount = Number(params.amount);
  const amount = Number.isFinite(parsedAmount) && parsedAmount > 0 ? parsedAmount : null;
  const fromOrder = Boolean(orderId);

  // Cached detail when the order screen already loaded it; enabled-by-id, so
  // opening the form standalone never fetches anything extra.
  const orderQuery = useOrderDetails(fromOrder ? orderId : undefined);
  const orderLabel = orderQuery.data?.orderNumber ?? (orderId || undefined);

  const canCreate = hasPermission('payments.create');

  const leave = () => {
    if (fromOrder) {
      router.replace('/payments');
      return;
    }
    router.back();
  };

  const header = <AppHeader variant="feature" title="Record payment" onBack={leave} />;

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
    if (fromOrder) {
      // Land on the payments list, not the order: the delivery step is done and
      // the payment ledger is what staff need next.
      router.replace('/payments');
      return;
    }
    router.replace(`/payments/${payment.id}`);
  };

  // Arriving from an order, wait for its number before mounting the form: the
  // form seeds its label once at mount, so mounting with the raw ObjectId would
  // leave that id on screen. The order screen has usually cached the detail
  // already, so this resolves without a visible spinner.
  if (fromOrder && orderQuery.isPending && !orderQuery.data) {
    return (
      <Screen>
        {header}
        <LoadingIndicator label="Preparing payment..." />
      </Screen>
    );
  }

  return (
    <Screen scroll keyboardAvoiding>
      {header}
      <PaymentForm
        // Remount when the prefill changes so a second order never inherits the
        // first one's values from the previous mount's initial state.
        key={`create-${orderId || 'standalone'}-${amount ?? ''}`}
        mode="create"
        initialValues={null}
        initialOrderId={fromOrder ? orderId : undefined}
        initialOrderLabel={orderLabel}
        initialAmount={amount}
        isSubmitting={createPayment.isPending}
        onSubmit={(input) => handleSubmit(input as CreatePaymentInput)}
        onCancel={leave}
      />
    </Screen>
  );
}
