import { router } from 'expo-router';

import { ErrorState } from '@/components/feedback';
import { AppHeader, Screen } from '@/components/layout';
import { ProductForm } from '@/features/products/components';
import { useCreateProduct } from '@/features/products/queries';
import type { CreateProductInput, UpdateProductInput } from '@/features/products/types';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/providers';

/**
 * Create-product form (static route so it never shadows `[productId]`).
 * Permission is checked before the form appears (`products.create`); the
 * backend re-validates everything and its 403/409/400 responses stay
 * authoritative - the form surfaces them instead of faking success.
 *
 * After a successful save the web app's two-step flow goes straight to
 * media. A role with create-but-not-edit cannot open the media screen, so
 * the app lands on the (products.view-gated) detail screen in that case; a
 * user with products.edit goes straight to the edit screen where the media
 * managers live.
 */
export default function CreateProductScreen() {
  const { hasPermission } = usePermissions();
  const toast = useToast();
  const createProduct = useCreateProduct();
  const canCreate = hasPermission('products.create');
  const canEdit = hasPermission('products.edit');

  const header = <AppHeader variant="feature" title="Add product" onBack={() => router.back()} />;

  if (!canCreate) {
    return (
      <Screen>
        {header}
        <ErrorState title="Access denied" message="You don't have permission to create products." />
      </Screen>
    );
  }

  const handleSubmit = async (input: CreateProductInput | UpdateProductInput) => {
    const saved = await createProduct.mutateAsync(input as CreateProductInput);
    toast.success('Product created.');
    router.replace(canEdit ? `/products/${saved.id}/edit` : `/products/${saved.id}`);
  };

  return (
    <Screen scroll keyboardAvoiding>
      {header}
      <ProductForm
        mode="create"
        initialValues={null}
        isSubmitting={createProduct.isPending}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
      />
    </Screen>
  );
}
