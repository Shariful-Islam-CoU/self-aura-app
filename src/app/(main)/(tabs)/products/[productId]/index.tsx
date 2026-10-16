import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { getErrorMessage, isApiError } from '@/api';
import { EmptyState, ErrorState } from '@/components/feedback';
import { AppHeader, Screen } from '@/components/layout';
import { Button, Dialog } from '@/components/ui';
import {
  ProductDetailsSkeleton,
  ProductImagesSection,
  ProductInventorySection,
  ProductOverviewSection,
  ProductPricingSection,
  ProductVideosSection,
  SectionCard,
} from '@/features/products/components';
import { useDeactivateProduct, useProductDetails } from '@/features/products/queries';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/providers';
import { spacing } from '@/theme';

/**
 * Product details: fetched by ID only (navigation passes `productId` - never
 * a product object). Sections render backend data as-is: overview, pricing,
 * the read-only inventory summary (with a pass-through to the Inventory
 * module, which owns every stock movement), then the image
 * gallery. Deactivation is the backend's soft delete (`DELETE
 * /products/:id`), confirmed first and never faked - a rejected request
 * shows the server's own message and the real state is re-fetched.
 * Reactivation is NOT a button here: `DELETE` can only deactivate, so the
 * backend-correct path is the status field on the edit form.
 */
export default function ProductDetailsScreen() {
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const { hasPermission } = usePermissions();
  const toast = useToast();

  const canView = hasPermission('products.view');
  const canEdit = hasPermission('products.edit');
  const canDelete = hasPermission('products.delete');
  const canViewInventory = hasPermission('inventory.view');

  const productQuery = useProductDetails(canView ? productId : undefined);
  const deactivate = useDeactivateProduct();

  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const product = productQuery.data;
  const isBusy = deactivate.isPending;

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await productQuery.refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const handleDeactivate = () => {
    if (!product || isBusy) return;
    deactivate.mutate(
      { id: product.id },
      {
        onSuccess: () => {
          setDeactivateDialogOpen(false);
          toast.success('Product deactivated.');
        },
        onError: (error) => {
          // Backend rejected it (stale state / permission): show its
          // message and reload the real state - never fake success.
          setDeactivateDialogOpen(false);
          toast.error(getErrorMessage(error));
          void productQuery.refetch();
        },
      },
    );
  };

  const header = (
    <AppHeader variant="feature" title="Product details" onBack={() => router.back()} />
  );

  if (!productId) {
    return (
      <Screen>
        {header}
        <EmptyState
          icon="cube-outline"
          title="Product not found"
          description="Open a product from the list to see its details."
          actionLabel="Back to products"
          onAction={() => router.replace('/products')}
        />
      </Screen>
    );
  }

  if (!canView) {
    return (
      <Screen>
        {header}
        <ErrorState title="Access denied" message="You don't have permission to view products." />
      </Screen>
    );
  }

  if (productQuery.isPending) {
    return (
      <Screen>
        {header}
        <ProductDetailsSkeleton />
      </Screen>
    );
  }

  if (!product) {
    const error = productQuery.error;
    if (isApiError(error) && error.kind === 'authorization') {
      return (
        <Screen>
          {header}
          <ErrorState
            title="Access denied"
            message="You don't have permission to view this product."
          />
        </Screen>
      );
    }
    if (isApiError(error) && error.kind === 'notFound') {
      return (
        <Screen>
          {header}
          <EmptyState
            icon="cube-outline"
            title="Product not found"
            description="This product may have been removed."
            actionLabel="Back to products"
            onAction={() => router.replace('/products')}
          />
        </Screen>
      );
    }
    return (
      <Screen>
        {header}
        <ErrorState
          title="Failed to load product"
          message={getErrorMessage(error)}
          onRetry={() => void productQuery.refetch()}
          retryLabel="Retry"
        />
      </Screen>
    );
  }

  const showActions = canEdit || (canDelete && product.isActive);

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
        <ProductOverviewSection product={product} />
        <ProductPricingSection product={product} />
        <ProductInventorySection
          product={product}
          canViewInventory={canViewInventory}
          onOpenInventory={() => router.push('/inventory')}
        />
        <ProductImagesSection product={product} />
        <ProductVideosSection product={product} />
        {showActions ? (
          <SectionCard title="Actions">
            {canEdit ? (
              <Button
                title="Edit product"
                variant="outline"
                icon="create-outline"
                fullWidth
                onPress={() => router.push(`/products/${product.id}/edit`)}
                accessibilityLabel="Edit product details and media"
              />
            ) : null}
            {canDelete && product.isActive ? (
              <Button
                title="Deactivate product"
                variant="danger"
                icon="remove-circle-outline"
                fullWidth
                onPress={() => {
                  deactivate.reset();
                  setDeactivateDialogOpen(true);
                }}
                accessibilityLabel="Deactivate this product"
              />
            ) : null}
          </SectionCard>
        ) : null}
      </View>

      <Dialog
        visible={deactivateDialogOpen}
        onClose={() => setDeactivateDialogOpen(false)}
        title="Deactivate this product?"
        message={`${product.name} will be deactivated and will no longer be available for new orders. This action can be reversed by reactivating the product.`}
        primaryAction={{
          label: 'Deactivate',
          variant: 'danger',
          loading: isBusy,
          onPress: handleDeactivate,
        }}
        secondaryAction={{ label: 'Keep product' }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
});
