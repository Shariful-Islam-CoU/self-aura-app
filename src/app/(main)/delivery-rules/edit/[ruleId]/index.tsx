import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { getErrorMessage, isApiError } from '@/api';
import { EmptyState, ErrorState } from '@/components/feedback';
import { AppHeader, Screen } from '@/components/layout';
import { Button, Dialog, Text } from '@/components/ui';
import {
  useDeleteDeliveryRule,
  useDeliveryRuleDetails,
  useUpdateDeliveryRule,
} from '@/features/deliveryRules';
import type { CreateDeliveryRuleInput, UpdateDeliveryRuleInput } from '@/features/deliveryRules';
import {
  DeliveryRuleForm,
  DeliveryRuleFormSkeleton,
} from '@/features/deliveryRules/components';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/providers';
import { spacing } from '@/theme';

/**
 * Edit-delivery-rule form with an optional delete. Deletion is refused by the
 * backend whenever a historical order references the rule (409) - the server's
 * message is shown and the rule stays; deactivating is the supported
 * alternative, so the dialog wording points there.
 */
export default function EditDeliveryRuleScreen() {
  const { ruleId } = useLocalSearchParams<{ ruleId: string }>();
  const id = ruleId ?? '';
  const { hasPermission } = usePermissions();
  const toast = useToast();

  const canEdit = hasPermission('deliveryRules.edit');
  const canDelete = hasPermission('deliveryRules.delete');

  const ruleQuery = useDeliveryRuleDetails(canEdit && id ? id : undefined);
  const updateRule = useUpdateDeliveryRule(id);
  const deleteRule = useDeleteDeliveryRule();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const header = (
    <AppHeader variant="feature" title="Edit delivery rule" onBack={() => router.back()} />
  );

  if (!id) {
    return (
      <Screen>
        {header}
        <EmptyState
          icon="options-outline"
          title="Delivery rule not found"
          description="Open a rule from the list to edit it."
          actionLabel="Back to delivery rules"
          onAction={() => router.replace('/delivery-rules')}
        />
      </Screen>
    );
  }

  if (!canEdit) {
    return (
      <Screen>
        {header}
        <ErrorState
          title="Access denied"
          message="You don't have permission to edit delivery rules."
        />
      </Screen>
    );
  }

  if (ruleQuery.isPending) {
    return (
      <Screen scroll>
        {header}
        <DeliveryRuleFormSkeleton />
      </Screen>
    );
  }

  const rule = ruleQuery.data;
  if (!rule) {
    const error = ruleQuery.error;
    if (isApiError(error) && error.kind === 'notFound') {
      return (
        <Screen>
          {header}
          <EmptyState
            icon="options-outline"
            title="Delivery rule not found"
            description="This rule may have been removed."
            actionLabel="Back to delivery rules"
            onAction={() => router.replace('/delivery-rules')}
          />
        </Screen>
      );
    }
    return (
      <Screen>
        {header}
        <ErrorState
          title="Failed to load delivery rule"
          message={getErrorMessage(error)}
          onRetry={() => void ruleQuery.refetch()}
          retryLabel="Retry"
        />
      </Screen>
    );
  }

  const handleSubmit = async (input: CreateDeliveryRuleInput) => {
    // Rejections are shown inline by the form with the server's own message.
    await updateRule.mutateAsync(input as UpdateDeliveryRuleInput);
    toast.success('Delivery rule updated.');
    router.back();
  };

  const handleDelete = () => {
    deleteRule.mutate(id, {
      onSuccess: () => {
        setDeleteOpen(false);
        toast.success('Delivery rule deleted.');
        router.back();
      },
      onError: (error) => {
        setDeleteOpen(false);
        toast.error(getErrorMessage(error));
      },
    });
  };

  return (
    <Screen scroll keyboardAvoiding>
      {header}
      <DeliveryRuleForm
        mode="edit"
        rule={rule}
        isSubmitting={updateRule.isPending}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
      />

      {canDelete ? (
        <View style={styles.dangerZone}>
          <Text variant="bodySmall" tone="muted">
            Deleting only succeeds while no order has ever used this rule. Otherwise deactivate it.
          </Text>
          <Button
            title="Delete delivery rule"
            variant="danger"
            icon="trash-outline"
            fullWidth
            disabled={deleteRule.isPending}
            onPress={() => setDeleteOpen(true)}
          />
        </View>
      ) : null}

      <Dialog
        visible={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete this delivery rule?"
        message={`"${rule.name}" will be removed. This only succeeds if no order has ever used it; if orders reference it, deactivate it instead so history stays explainable.`}
        primaryAction={{
          label: 'Delete rule',
          variant: 'danger',
          loading: deleteRule.isPending,
          onPress: handleDelete,
        }}
        secondaryAction={{ label: 'Keep rule' }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  dangerZone: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
});
