import { router } from 'expo-router';

import { ErrorState } from '@/components/feedback';
import { AppHeader, Screen } from '@/components/layout';
import { OrderForm } from '@/features/orders/components';
import { useCreateOrder } from '@/features/orders/queries';
import type { CreateOrderInput } from '@/features/orders/types';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/providers';

/**
 * Create-order form (static route so it never shadows `[orderId]`).
 * Permission is checked before the form appears (`orders.create`); the
 * backend re-validates everything and its 403/400/409 responses stay
 * authoritative - the form surfaces them instead of faking success.
 *
 * The server returns the fully priced order, so after a successful save
 * the screen lands on its detail screen (the list, dashboard and customer
 * history caches were already invalidated by the mutation).
 */
export default function CreateOrderScreen() {
  const { hasPermission } = usePermissions();
  const toast = useToast();
  const createOrder = useCreateOrder();
  const canCreate = hasPermission('orders.create');

  const header = (
    <AppHeader variant="feature" title="Create order" onBack={() => router.back()} />
  );

  if (!canCreate) {
    return (
      <Screen>
        {header}
        <ErrorState title="Access denied" message="You don't have permission to create orders." />
      </Screen>
    );
  }

  const handleSubmit = async (input: CreateOrderInput) => {
    const saved = await createOrder.mutateAsync(input);
    toast.success('Order created.');
    router.replace(`/orders/${saved.id}`);
  };

  return (
    <Screen scroll keyboardAvoiding>
      {header}
      <OrderForm
        isSubmitting={createOrder.isPending}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
      />
    </Screen>
  );
}
