import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { getErrorMessage, isApiError } from '@/api';
import { EmptyState, ErrorState } from '@/components/feedback';
import { AppHeader, Screen } from '@/components/layout';
import { Button, Dialog } from '@/components/ui';
import {
  SupplierAddressSection,
  SupplierContactSection,
  SupplierDetailsSkeleton,
  SupplierNotesSection,
  SupplierOverviewSection,
  SupplierPurchaseHistory,
  SupplierPurchaseSummarySection,
} from '@/features/suppliers/components';
import { SectionCard } from '@/features/customers/components/SectionCard';
import {
  useDeactivateSupplier,
  useSupplierDetails,
  useSupplierPurchaseHistory,
  useSupplierPurchaseStats,
} from '@/features/suppliers/queries';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/providers';
import { spacing } from '@/theme';

/**
 * Supplier details: fetched by ID only (navigation passes `supplierId` -
 * never a supplier object). Sections render backend data as-is: overview,
 * contact, address, notes, then backend-provided purchase summary and the
 * supplier's recent purchase history (which uses the existing purchases
 * API - no purchasing UI here). Deactivation is the backend's soft delete
 * (`DELETE /suppliers/:id`), confirmed first and never faked - a rejected
 * request shows the server's own message.
 */
export default function SupplierDetailsScreen() {
  const { supplierId } = useLocalSearchParams<{ supplierId: string }>();
  const { hasPermission } = usePermissions();
  const toast = useToast();

  const canView = hasPermission('suppliers.view');
  const canEdit = hasPermission('suppliers.edit');
  const canDelete = hasPermission('suppliers.delete');
  const canViewPurchases = hasPermission('purchases.view');
  const canViewStats = hasPermission('reports.purchases');

  const supplierQuery = useSupplierDetails(canView ? supplierId : undefined);
  const statsQuery = useSupplierPurchaseStats(supplierId, canViewStats);
  const historyQuery = useSupplierPurchaseHistory(supplierId, canViewPurchases);
  const deactivate = useDeactivateSupplier();

  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const supplier = supplierQuery.data;
  const isBusy = deactivate.isPending;

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.allSettled([
        supplierQuery.refetch(),
        statsQuery.refetch(),
        historyQuery.refetch(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleDeactivate = () => {
    if (!supplier || isBusy) return;
    deactivate.mutate(
      { id: supplier.id },
      {
        onSuccess: () => {
          setDeactivateDialogOpen(false);
          toast.success('Supplier deactivated.');
        },
        onError: (error) => {
          // Backend rejected it (stale state / permission): show its
          // message and reload the real state - never fake success.
          setDeactivateDialogOpen(false);
          toast.error(getErrorMessage(error));
          void supplierQuery.refetch();
        },
      },
    );
  };

  const header = (
    <AppHeader variant="feature" title="Supplier details" onBack={() => router.back()} />
  );

  if (!supplierId) {
    return (
      <Screen>
        {header}
        <EmptyState
          icon="person-remove-outline"
          title="Supplier not found"
          description="Open a supplier from the list to see their details."
          actionLabel="Back to suppliers"
          onAction={() => router.replace('/suppliers')}
        />
      </Screen>
    );
  }

  if (!canView) {
    return (
      <Screen>
        {header}
        <ErrorState title="Access denied" message="You don't have permission to view suppliers." />
      </Screen>
    );
  }

  if (supplierQuery.isPending) {
    return (
      <Screen>
        {header}
        <SupplierDetailsSkeleton />
      </Screen>
    );
  }

  if (!supplier) {
    const error = supplierQuery.error;
    if (isApiError(error) && error.kind === 'authorization') {
      return (
        <Screen>
          {header}
          <ErrorState
            title="Access denied"
            message="You don't have permission to view this supplier."
          />
        </Screen>
      );
    }
    if (isApiError(error) && error.kind === 'notFound') {
      return (
        <Screen>
          {header}
          <EmptyState
            icon="person-remove-outline"
            title="Supplier not found"
            description="This supplier may have been removed."
            actionLabel="Back to suppliers"
            onAction={() => router.replace('/suppliers')}
          />
        </Screen>
      );
    }
    return (
      <Screen>
        {header}
        <ErrorState
          title="Failed to load supplier"
          message={getErrorMessage(error)}
          onRetry={() => void supplierQuery.refetch()}
          retryLabel="Retry"
        />
      </Screen>
    );
  }

  const showActions = canEdit || (canDelete && supplier.isActive);

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
        <SupplierOverviewSection supplier={supplier} />
        <SupplierContactSection supplier={supplier} />
        <SupplierAddressSection supplier={supplier} />
        <SupplierNotesSection supplier={supplier} />
        {canViewStats && statsQuery.data ? (
          <SupplierPurchaseSummarySection stats={statsQuery.data} />
        ) : null}
        <SupplierPurchaseHistory supplierId={supplier.id} canViewPurchases={canViewPurchases} />
        {showActions ? (
          <SectionCard title="Actions">
            {canEdit ? (
              <Button
                title="Edit supplier"
                variant="outline"
                icon="create-outline"
                fullWidth
                onPress={() => router.push(`/suppliers/${supplier.id}/edit`)}
                accessibilityLabel="Edit this supplier's information"
              />
            ) : null}
            {canDelete && supplier.isActive ? (
              <Button
                title="Deactivate supplier"
                variant="danger"
                icon="person-remove-outline"
                fullWidth
                onPress={() => {
                  deactivate.reset();
                  setDeactivateDialogOpen(true);
                }}
                accessibilityLabel="Deactivate this supplier"
              />
            ) : null}
          </SectionCard>
        ) : null}
      </View>

      <Dialog
        visible={deactivateDialogOpen}
        onClose={() => setDeactivateDialogOpen(false)}
        title="Deactivate this supplier?"
        message={`${supplier.name} will be marked as inactive and hidden from new purchases, but existing records are kept. This action cannot be undone from the management app.`}
        primaryAction={{
          label: 'Deactivate',
          variant: 'danger',
          loading: isBusy,
          onPress: handleDeactivate,
        }}
        secondaryAction={{ label: 'Keep supplier' }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
});
