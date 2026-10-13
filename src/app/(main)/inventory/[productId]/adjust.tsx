import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { getErrorMessage, isApiError } from '@/api';
import { EmptyState, ErrorState } from '@/components/feedback';
import { AppHeader, Screen } from '@/components/layout';
import {
  InventoryDetailsSkeleton,
  InventoryProductSection,
  MODE_CONFIG,
  StockAdjustmentForm,
  type AdjustmentPayload,
} from '@/features/inventory/components';
import { useAdjustStock, useAddStock, useRemoveStock } from '@/features/inventory/queries';
import type { StockAdjustmentMode } from '@/features/inventory/types';
import { useProductDetails } from '@/features/products/queries';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/providers';
import { spacing } from '@/theme';

/**
 * Stock adjustment screen (`inventory.adjust`-gated): one screen for the
 * three backend operations, selected by the strongly typed `mode` param
 * (`add` | `remove` | `adjust`) - same copy and fields as the web
 * `StockAdjustmentDialog`.
 *
 * Stock is NEVER edited locally: the form validates, a confirmation dialog
 * shows the exact operation, then the mutation submits and the screen waits
 * for the backend's `{ product, transaction }` response before toasting and
 * navigating back. Rejections (400 no-change, 409 insufficient, 403
 * permission, 404 missing) surface through the form - success is never
 * faked. A rejected operation re-fetches the product when the failure could
 * mean the displayed stock was stale (409/400), so the user re-validates
 * against the real number.
 */
export default function StockAdjustmentScreen() {
  const { productId, mode } = useLocalSearchParams<{ productId: string; mode?: string }>();
  const { hasPermission } = usePermissions();
  const toast = useToast();

  // Strongly typed route params: an unknown/missing mode is a broken link,
  // not a default we silently pick.
  const adjustmentMode: StockAdjustmentMode | null =
    mode === 'add' || mode === 'remove' || mode === 'adjust' ? mode : null;
  const canAdjust = hasPermission('inventory.adjust');
  const validRoute = Boolean(productId) && adjustmentMode !== null && canAdjust;

  const productQuery = useProductDetails(validRoute ? productId : undefined);
  const addStock = useAddStock();
  const removeStock = useRemoveStock();
  const adjustStock = useAdjustStock();

  const activeMutation =
    adjustmentMode === 'add' ? addStock : adjustmentMode === 'remove' ? removeStock : adjustStock;

  const header = (
    <AppHeader
      variant="feature"
      title={adjustmentMode ? MODE_CONFIG[adjustmentMode].title : 'Adjust stock'}
      onBack={() => router.back()}
    />
  );

  if (!canAdjust) {
    return (
      <Screen>
        {header}
        <ErrorState title="Access denied" message="You don't have permission to adjust stock." />
      </Screen>
    );
  }

  if (!productId || !adjustmentMode) {
    return (
      <Screen>
        {header}
        <EmptyState
          icon="options-outline"
          title="Adjustment not found"
          description="This stock adjustment could not be opened. Go back and pick an action from the product's inventory."
          actionLabel="Back to inventory"
          onAction={() => router.replace('/inventory')}
        />
      </Screen>
    );
  }

  const handleSubmit = async (payload: AdjustmentPayload) => {
    try {
      if (payload.mode === 'add') {
        await addStock.mutateAsync({ productId, input: payload.input });
      } else if (payload.mode === 'remove') {
        await removeStock.mutateAsync({ productId, input: payload.input });
      } else {
        await adjustStock.mutateAsync({ productId, input: payload.input });
      }
    } catch (error) {
      // 409 (insufficient) and 400 (no change) mean the stock figure the
      // form validated against may be stale - refresh the authoritative
      // product so the retry starts from the real state. The error is then
      // re-thrown for the form to map onto its fields (never swallowed).
      if (isApiError(error) && (error.status === 409 || error.status === 400)) {
        void productQuery.refetch();
      }
      throw error;
    }
    // Success only after the backend confirmed the mutation (web copy).
    toast.success(
      adjustmentMode === 'add'
        ? 'Stock added successfully.'
        : adjustmentMode === 'remove'
          ? 'Stock removed successfully.'
          : 'Stock adjusted successfully.',
    );
    router.back(); // details refetches from the invalidated queries
  };

  let content;
  if (productQuery.isPending) {
    content = <InventoryDetailsSkeleton />;
  } else if (productQuery.isError || !productQuery.data) {
    const notFound = isApiError(productQuery.error) && productQuery.error.kind === 'notFound';
    content = notFound ? (
      <EmptyState
        icon="cube-outline"
        title="Product not found"
        description="This product no longer exists, so its stock cannot be adjusted."
        actionLabel="Back to inventory"
        onAction={() => router.replace('/inventory')}
      />
    ) : (
      <ErrorState
        title="Unable to load the product."
        message={getErrorMessage(productQuery.error)}
        onRetry={() => void productQuery.refetch()}
        retryLabel="Try again"
      />
    );
  } else {
    content = (
      <View style={styles.sections}>
        <InventoryProductSection product={productQuery.data} />
        <StockAdjustmentForm
          product={productQuery.data}
          mode={adjustmentMode}
          isSubmitting={activeMutation.isPending}
          onSubmit={handleSubmit}
        />
      </View>
    );
  }

  return (
    <Screen scroll keyboardAvoiding>
      {header}
      {content}
    </Screen>
  );
}

const styles = StyleSheet.create({
  sections: { gap: spacing.lg },
});
