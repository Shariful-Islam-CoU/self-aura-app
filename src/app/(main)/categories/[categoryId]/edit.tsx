import { router, useLocalSearchParams } from 'expo-router';

import { getErrorMessage, isApiError } from '@/api';
import { EmptyState, ErrorState } from '@/components/feedback';
import { AppHeader, Screen } from '@/components/layout';
import {
  CategoryDetailsSkeleton,
  CategoryForm,
  CategoryMediaSection,
} from '@/features/categories/components';
import { useCategoryDetails, useUpdateCategory } from '@/features/categories/queries';
import type { UpdateCategoryInput } from '@/features/categories/types';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/providers';

/**
 * Edit-category screen. Nested under the details segment so the navigation
 * chain is always: Edit -> back -> Category details -> back -> Category
 * list (Android back included). The form only mounts once the category has
 * been fetched BY ID - the category object is never passed through
 * navigation params - and the image fields below it talk to the
 * `categories.edit` media endpoints. Updating `isActive` here is also how a
 * deactivated category is reactivated (the backend's only reactivation
 * path), matching the web's status control.
 */
export default function EditCategoryScreen() {
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const { hasPermission } = usePermissions();
  const toast = useToast();

  const canEdit = hasPermission('categories.edit');
  const categoryQuery = useCategoryDetails(canEdit ? categoryId : undefined);
  const updateCategory = useUpdateCategory();

  const header = <AppHeader variant="feature" title="Edit category" onBack={() => router.back()} />;

  if (!categoryId) {
    return (
      <Screen>
        {header}
        <EmptyState
          icon="albums-outline"
          title="Category not found"
          description="Open a category from the list to edit its details."
          actionLabel="Back to categories"
          onAction={() => router.replace('/categories')}
        />
      </Screen>
    );
  }

  if (!canEdit) {
    return (
      <Screen>
        {header}
        <ErrorState title="Access denied" message="You don't have permission to edit categories." />
      </Screen>
    );
  }

  if (categoryQuery.isPending) {
    return (
      <Screen>
        {header}
        <CategoryDetailsSkeleton />
      </Screen>
    );
  }

  const category = categoryQuery.data;

  if (!category) {
    const error = categoryQuery.error;
    if (isApiError(error) && error.kind === 'authorization') {
      return (
        <Screen>
          {header}
          <ErrorState
            title="Access denied"
            message="You don't have permission to edit this category."
          />
        </Screen>
      );
    }
    if (isApiError(error) && error.kind === 'notFound') {
      return (
        <Screen>
          {header}
          <EmptyState
            icon="albums-outline"
            title="Category not found"
            description="This category may have been removed."
            actionLabel="Back to categories"
            onAction={() => router.replace('/categories')}
          />
        </Screen>
      );
    }
    return (
      <Screen>
        {header}
        <ErrorState
          title="Failed to load category"
          message={getErrorMessage(error)}
          onRetry={() => void categoryQuery.refetch()}
          retryLabel="Retry"
        />
      </Screen>
    );
  }

  const handleSubmit = async (input: UpdateCategoryInput) => {
    await updateCategory.mutateAsync({ id: category.id, input });
    toast.success('Category updated.');
    router.back();
  };

  return (
    <Screen scroll keyboardAvoiding>
      {header}
      <CategoryForm
        mode="edit"
        initialValues={category}
        isSubmitting={updateCategory.isPending}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
      />
      <CategoryMediaSection category={category} />
    </Screen>
  );
}
