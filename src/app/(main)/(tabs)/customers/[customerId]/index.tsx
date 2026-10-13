import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';

import { getErrorMessage, isApiError } from '@/api';
import { EmptyState, ErrorState } from '@/components/feedback';
import { AppHeader, Screen } from '@/components/layout';
import { Button, Dialog } from '@/components/ui';
import {
  CustomerAddressSection,
  CustomerContactSection,
  CustomerDetailsSkeleton,
  CustomerNotesSection,
  CustomerOrderHistory,
  CustomerOverviewSection,
  CustomerSocialSection,
  SectionCard,
} from '@/features/customers/components';
import {
  customerOrdersKey,
  useCustomerDetails,
  useDeactivateCustomer,
} from '@/features/customers/queries';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/providers';
import { spacing } from '@/theme';

/**
 * Customer details: fetched by ID only (navigation passes `customerId` -
 * never a customer object). Sections render backend data as-is: contact,
 * addresses, private social fields, notes/tags, then backend-provided
 * order statistics and the customer's order history (which opens the Step
 * 9 Order Details screen with only an `orderId`). Deactivation is the
 * backend's soft delete (`DELETE /customers/:id`), confirmed first and
 * never faked - a rejected request shows the server's own message.
 */
export default function CustomerDetailsScreen() {
  const { customerId } = useLocalSearchParams<{ customerId: string }>();
  const { hasPermission } = usePermissions();
  const toast = useToast();
  const queryClient = useQueryClient();

  const canView = hasPermission('customers.view');
  const canEdit = hasPermission('customers.edit');
  const canDelete = hasPermission('customers.delete');
  const canViewOrders = hasPermission('orders.view');

  const customerQuery = useCustomerDetails(canView ? customerId : undefined);
  const deactivate = useDeactivateCustomer();

  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const customer = customerQuery.data;
  const isBusy = deactivate.isPending;

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.allSettled([
        customerQuery.refetch(),
        queryClient.invalidateQueries({ queryKey: customerOrdersKey(customerId ?? '') }),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleDeactivate = () => {
    if (!customer || isBusy) return;
    deactivate.mutate(
      { id: customer.id },
      {
        onSuccess: () => {
          setDeactivateDialogOpen(false);
          toast.success('Customer deactivated.');
        },
        onError: (error) => {
          // Backend rejected it (stale state / permission): show its
          // message and reload the real state - never fake success.
          setDeactivateDialogOpen(false);
          toast.error(getErrorMessage(error));
          void customerQuery.refetch();
        },
      },
    );
  };

  const header = (
    <AppHeader variant="feature" title="Customer details" onBack={() => router.back()} />
  );

  if (!customerId) {
    return (
      <Screen>
        {header}
        <EmptyState
          icon="people-outline"
          title="Customer not found"
          description="Open a customer from the list to see their details."
          actionLabel="Back to customers"
          onAction={() => router.replace('/customers')}
        />
      </Screen>
    );
  }

  if (!canView) {
    return (
      <Screen>
        {header}
        <ErrorState title="Access denied" message="You don't have permission to view customers." />
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

  if (!customer) {
    const error = customerQuery.error;
    if (isApiError(error) && error.kind === 'authorization') {
      return (
        <Screen>
          {header}
          <ErrorState
            title="Access denied"
            message="You don't have permission to view this customer."
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

  const showActions = canEdit || (canDelete && customer.isActive);

  return (
    <Screen
      scroll
      refreshControl={{
        refreshing,
        onRefresh: () => void handleRefresh(),
      }}
    >
      {header}
      <View style={styles.container}>
        <CustomerOverviewSection customer={customer} />
        <CustomerContactSection
          customer={customer}
          onActionFailed={(message) => toast.error(message)}
        />
        {customer.facebookName || customer.facebookProfileUrl ? (
          <CustomerSocialSection
            customer={customer}
            onActionFailed={(message) => toast.error(message)}
          />
        ) : null}
        <CustomerAddressSection customer={customer} />
        {customer.notes || customer.tags.length > 0 ? (
          <CustomerNotesSection customer={customer} />
        ) : null}
        <CustomerOrderHistory customerId={customer.id} canViewOrders={canViewOrders} />
        {showActions ? (
          <SectionCard title="Actions">
            {canEdit ? (
              <Button
                title="Edit customer"
                variant="outline"
                icon="create-outline"
                fullWidth
                onPress={() => router.push(`/customers/${customer.id}/edit`)}
                accessibilityLabel="Edit this customer's information"
              />
            ) : null}
            {canDelete && customer.isActive ? (
              <Button
                title="Deactivate customer"
                variant="danger"
                icon="person-remove-outline"
                fullWidth
                onPress={() => {
                  deactivate.reset();
                  setDeactivateDialogOpen(true);
                }}
                accessibilityLabel="Deactivate this customer"
              />
            ) : null}
          </SectionCard>
        ) : null}
      </View>

      <Dialog
        visible={deactivateDialogOpen}
        onClose={() => setDeactivateDialogOpen(false)}
        title="Deactivate this customer?"
        message={`${customer.name} will be marked as inactive. The record and their order history are kept, but the customer will no longer be usable as an active customer.`}
        primaryAction={{
          label: 'Deactivate',
          variant: 'danger',
          loading: isBusy,
          onPress: handleDeactivate,
        }}
        secondaryAction={{ label: 'Keep customer' }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
});
