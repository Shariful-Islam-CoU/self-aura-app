import { router } from 'expo-router';

import { ErrorState } from '@/components/feedback';
import { AppHeader, Screen } from '@/components/layout';
import { useCreateDeliveryRule } from '@/features/deliveryRules';
import type { CreateDeliveryRuleInput } from '@/features/deliveryRules';
import { DeliveryRuleForm } from '@/features/deliveryRules/components';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/providers';

/**
 * Create-delivery-rule form. Permission is checked before the form appears
 * (`deliveryRules.create`); the backend re-validates everything and its
 * 403/400 responses stay authoritative - the form surfaces them instead of
 * faking success.
 */
export default function CreateDeliveryRuleScreen() {
  const { hasPermission } = usePermissions();
  const toast = useToast();
  const createRule = useCreateDeliveryRule();
  const canCreate = hasPermission('deliveryRules.create');

  const header = (
    <AppHeader variant="feature" title="New delivery rule" onBack={() => router.back()} />
  );

  if (!canCreate) {
    return (
      <Screen>
        {header}
        <ErrorState
          title="Access denied"
          message="You don't have permission to create delivery rules."
        />
      </Screen>
    );
  }

  const handleSubmit = async (input: CreateDeliveryRuleInput) => {
    // Rejections are shown inline by the form with the server's own message.
    await createRule.mutateAsync(input);
    toast.success('Delivery rule created.');
    router.back();
  };

  return (
    <Screen scroll keyboardAvoiding>
      {header}
      <DeliveryRuleForm
        mode="create"
        rule={null}
        isSubmitting={createRule.isPending}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
      />
    </Screen>
  );
}
