import { router } from 'expo-router';

import { ErrorState } from '@/components/feedback';
import { AppHeader, Screen } from '@/components/layout';
import { CategoryForm } from '@/features/categories/components';
import { useCreateCategory } from '@/features/categories/queries';
import type { CreateCategoryInput } from '@/features/categories/types';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/providers';

/**
 * Create category. Mirrors the web's add flow: the form submits `name` +
 * optional `description` only (the slug is generated server-side and
 * `isActive` is not part of the create payload - new categories start
 * active). On success the user lands on the new category's edit screen,
 * where the thumbnail/banner wait - the same "details, then media" order
 * the web dialog uses. Server field errors propagate through the thrown
 * ApiError back into the form.
 */
export default function NewCategoryScreen() {
  const { hasPermission } = usePermissions();
  const toast = useToast();
  const createCategory = useCreateCategory();

  const canCreate = hasPermission('categories.create');

  const header = <AppHeader variant="feature" title="New category" onBack={() => router.back()} />;

  if (!canCreate) {
    return (
      <Screen>
        {header}
        <ErrorState
          title="Access denied"
          message="You don't have permission to create categories."
        />
      </Screen>
    );
  }

  const handleSubmit = async (input: CreateCategoryInput) => {
    const saved = await createCategory.mutateAsync(input);
    toast.success('Category created.');
    // Details, then media - like the web's two-step dialog: land on the new
    // category's details (works with just `categories.view`), where the
    // thumbnail/banner wait behind Edit for users who also hold
    // `categories.edit`. Routing to the edit screen here would dead-end a
    // create-only user on access denied.
    router.replace(`/categories/${saved.id}`);
  };

  return (
    <Screen scroll keyboardAvoiding>
      {header}
      <CategoryForm
        mode="create"
        isSubmitting={createCategory.isPending}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
      />
    </Screen>
  );
}
