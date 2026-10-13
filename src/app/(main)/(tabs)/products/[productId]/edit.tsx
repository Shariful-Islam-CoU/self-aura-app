import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { getErrorMessage, isApiError } from '@/api';
import { EmptyState, ErrorState } from '@/components/feedback';
import { AppHeader, Screen } from '@/components/layout';
import { SectionHeader } from '@/components/ui';
import {
  ProductDetailsSkeleton,
  ProductForm,
  ProductMediaSection,
} from '@/features/products/components';
import { useProductDetails, useUpdateProduct } from '@/features/products/queries';
import type { CreateProductInput, UpdateProductInput } from '@/features/products/types';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/providers';
import { spacing } from '@/theme';

/**
 * Edit-product form + media managers. Nested under the details segment so
 * the navigation chain is always: Edit -> back -> Product details -> back ->
 * Product list (Android back included). The form only mounts once the product
 * has been fetched BY ID - the product object is never passed through
 * navigation params.
 *
 * Below the form sit the image/video managers (web parity: the edit dialog
 * holds both the fields and the media sections). The form saves the core
 * fields with one PATCH; media edits are staged and committed through their
 * own backend endpoints - exactly like the web app, where "Save changes" and
 * the media "Save" actions are separate.
 */
export default function EditProductScreen() {
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const { hasPermission } = usePermissions();
  const toast = useToast();

  const canEdit = hasPermission('products.edit');
  const productQuery = useProductDetails(canEdit ? productId : undefined);
  const updateProduct = useUpdateProduct();

  const header = <AppHeader variant="feature" title="Edit product" onBack={() => router.back()} />;

  if (!productId) {
    return (
      <Screen>
        {header}
        <EmptyState
          icon="cube-outline"
          title="Product not found"
          description="Open a product from the list to edit it."
          actionLabel="Back to products"
          onAction={() => router.replace('/products')}
        />
      </Screen>
    );
  }

  if (!canEdit) {
    return (
      <Screen>
        {header}
        <ErrorState title="Access denied" message="You don't have permission to edit products." />
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

  const product = productQuery.data;
  if (!product) {
    const error = productQuery.error;
    if (isApiError(error) && error.kind === 'authorization') {
      return (
        <Screen>
          {header}
          <ErrorState
            title="Access denied"
            message="You don't have permission to edit this product."
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

  const handleSubmit = async (input: CreateProductInput | UpdateProductInput) => {
    await updateProduct.mutateAsync({ id: product.id, input: input as UpdateProductInput });
    toast.success('Product updated.');
    router.back();
  };

  return (
    <Screen scroll keyboardAvoiding>
      {header}
      <View style={styles.container}>
        <ProductForm
          mode="edit"
          initialValues={product}
          isSubmitting={updateProduct.isPending}
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
        />

        <SectionHeader
          title="Media"
          subtitle="Images and videos are uploaded through the backend media library - each list saves independently."
        />
        <ProductMediaSection product={product} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg, paddingBottom: spacing.xxl },
});
