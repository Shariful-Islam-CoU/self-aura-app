import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { getErrorMessage, isApiError } from '@/api';
import { EmptyState, ErrorState } from '@/components/feedback';
import { AppHeader, Screen } from '@/components/layout';
import { Button } from '@/components/ui';
import {
  PurchaseCancelDialog,
  PurchaseDetailsSkeleton,
  PurchaseFinancialSection,
  PurchaseItemsSection,
  PurchaseNotesSection,
  PurchaseOverviewSection,
  PurchaseReceiveDialog,
  PurchaseSupplierSection,
} from '@/features/purchases/components';
import {
  useCancelPurchase,
  usePurchaseDetails,
  useReceivePurchase,
  useUpdatePurchase,
} from '@/features/purchases/queries';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/providers';
import { spacing } from '@/theme';
import { SectionCard } from '@/features/customers/components/SectionCard';

/**
 * Purchase details: fetched by ID only (navigation passes `purchaseId` -
 * never a purchase object). Sections render backend data as-is: overview,
 * supplier, items, financial summary, notes, then receive/cancel/edit actions.
 * Receiving and cancelling are confirmed first and never faked - a rejected
 * request shows the server's own message.
 */
export default function PurchaseDetailsScreen() {
  const { purchaseId } = useLocalSearchParams<{ purchaseId: string }>();
  const { hasPermission } = usePermissions();
  const toast = useToast();

  const canView = hasPermission('purchases.view');
  const canEdit = hasPermission('purchases.edit');
  const canReceive = hasPermission('purchases.receive');
  const canCancel = hasPermission('purchases.cancel');

  const purchaseQuery = usePurchaseDetails(canView ? purchaseId : undefined);
  const receive = useReceivePurchase();
  const cancel = useCancelPurchase();
  const updatePurchase = useUpdatePurchase();

  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const purchase = purchaseQuery.data;
  const isBusy = receive.isPending || cancel.isPending || updatePurchase.isPending;

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.allSettled([purchaseQuery.refetch()]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleReceive = async () => {
    if (!purchase || isBusy) return;
    await receive.mutateAsync({ id: purchase.id });
    setReceiveDialogOpen(false);
    toast.success(`Purchase ${purchase.purchaseNumber} received.`);
  };

  const handleCancel = async () => {
    if (!purchase || isBusy) return;
    await cancel.mutateAsync({ id: purchase.id });
    setCancelDialogOpen(false);
    toast.success(`Purchase ${purchase.purchaseNumber} cancelled.`);
  };

  const header = (
    <AppHeader variant="feature" title="Purchase details" onBack={() => router.back()} />
  );

  if (!purchaseId) {
    return (
      <Screen>
        {header}
        <EmptyState
          icon="bag-outline"
          title="Purchase not found"
          description="Open a purchase from the list to see its details."
          actionLabel="Back to purchases"
          onAction={() => router.replace('/purchases')}
        />
      </Screen>
    );
  }

  if (!canView) {
    return (
      <Screen>
        {header}
        <ErrorState title="Access denied" message="You don't have permission to view purchases." />
      </Screen>
    );
  }

  if (purchaseQuery.isPending) {
    return (
      <Screen>
        {header}
        <PurchaseDetailsSkeleton />
      </Screen>
    );
  }

  if (!purchase) {
    const error = purchaseQuery.error;
    if (isApiError(error) && error.kind === 'authorization') {
      return (
        <Screen>
          {header}
          <ErrorState
            title="Access denied"
            message="You don't have permission to view this purchase."
          />
        </Screen>
      );
    }
    if (isApiError(error) && error.kind === 'notFound') {
      return (
        <Screen>
          {header}
          <EmptyState
            icon="bag-outline"
            title="Purchase not found"
            description="This purchase may have been removed."
            actionLabel="Back to purchases"
            onAction={() => router.replace('/purchases')}
          />
        </Screen>
      );
    }
    return (
      <Screen>
        {header}
        <ErrorState
          title="Failed to load purchase"
          message={getErrorMessage(error)}
          onRetry={() => void purchaseQuery.refetch()}
          retryLabel="Retry"
        />
      </Screen>
    );
  }

  const isDraft = purchase.status === 'draft';
  const showReceive = canReceive && isDraft;
  const showCancel = canCancel && isDraft;
  const showEdit = canEdit && isDraft;

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
        <PurchaseOverviewSection purchase={purchase} />
        <PurchaseSupplierSection purchase={purchase} />
        <PurchaseItemsSection purchase={purchase} />
        <PurchaseFinancialSection purchase={purchase} />
        <PurchaseNotesSection purchase={purchase} />
        {showReceive || showCancel || showEdit ? (
          <SectionCard title="Actions">
            {showReceive ? (
              <Button
                title="Receive purchase"
                variant="primary"
                icon="archive-outline"
                fullWidth
                onPress={() => {
                  receive.reset();
                  setReceiveDialogOpen(true);
                }}
                accessibilityLabel="Receive this purchase"
              />
            ) : null}
            {showCancel ? (
              <Button
                title="Cancel purchase"
                variant="danger"
                icon="close-outline"
                fullWidth
                onPress={() => {
                  cancel.reset();
                  setCancelDialogOpen(true);
                }}
                accessibilityLabel="Cancel this purchase"
              />
            ) : null}
            {showEdit ? (
              <Button
                title="Edit draft"
                variant="outline"
                icon="create-outline"
                fullWidth
                onPress={() => router.push(`/purchases/${purchase.id}/edit`)}
                accessibilityLabel="Edit this purchase"
              />
            ) : null}
          </SectionCard>
        ) : null}
      </View>

      <PurchaseReceiveDialog
        open={receiveDialogOpen}
        onOpenChange={() => setReceiveDialogOpen(false)}
        purchase={purchase}
        isSubmitting={receive.isPending}
        onConfirm={handleReceive}
      />

      <PurchaseCancelDialog
        open={cancelDialogOpen}
        onOpenChange={() => setCancelDialogOpen(false)}
        purchase={purchase}
        isSubmitting={cancel.isPending}
        onConfirm={handleCancel}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
});
