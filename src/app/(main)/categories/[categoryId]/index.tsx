import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { getErrorMessage, isApiError } from '@/api';
import { EmptyState, ErrorState } from '@/components/feedback';
import { AppHeader, Screen } from '@/components/layout';
import { Button, Dialog } from '@/components/ui';
import {
  CategoryDetailsSkeleton,
  CategoryMediaPreviewSection,
  CategoryOverviewSection,
  SectionCard,
} from '@/features/categories/components';
import { useCategoryDetails, useDeactivateCategory } from '@/features/categories/queries';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/providers';
import { spacing } from '@/theme';

/**
 * Category details: fetched by ID only (navigation passes `categoryId` -
 * never a category object). Shows the backend fields (overview), a
 * read-only thumbnail/banner preview, and the actions: Edit (opens the
 * edit screen where images are managed) and Deactivate. Deactivation is
 * the backend's soft delete (`DELETE /categories/:id`), confirmed first
 * and never faked - a rejected request (e.g. 409 category in use) shows
 * the server's own message.
 */
export default function CategoryDetailsScreen() {
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const { hasPermission } = usePermissions();
  const toast = useToast();

  const canView = hasPermission('categories.view');
  const canEdit = hasPermission('categories.edit');
  const canDelete = hasPermission('categories.delete');

  const categoryQuery = useCategoryDetails(canView ? categoryId : undefined);
  const deactivate = useDeactivateCategory();

  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const category = categoryQuery.data;
  const isBusy = deactivate.isPending;

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await categoryQuery.refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const handleDeactivate = () => {
    if (!category || isBusy) return;
    deactivate.mutate(category.id, {
      onSuccess: () => {
        setDeactivateDialogOpen(false);
        toast.success('Category deactivated.');
      },
      onError: (error) => {
        // Backend rejected it (e.g. the category is in use by active
        // products): show its message and reload the real state.
        setDeactivateDialogOpen(false);
        toast.error(getErrorMessage(error));
        void categoryQuery.refetch();
      },
    });
  };

  const header = (
    <AppHeader variant="feature" title="Category details" onBack={() => router.back()} />
  );

  if (!categoryId) {
    return (
      <Screen>
        {header}
        <EmptyState
          icon="albums-outline"
          title="Category not found"
          description="Open a category from the list to see its details."
          actionLabel="Back to categories"
          onAction={() => router.replace('/categories')}
        />
      </Screen>
    );
  }

  if (!canView) {
    return (
      <Screen>
        {header}
        <ErrorState title="Access denied" message="You don't have permission to view categories." />
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

  if (!category) {
    const error = categoryQuery.error;
    if (isApiError(error) && error.kind === 'authorization') {
      return (
        <Screen>
          {header}
          <ErrorState
            title="Access denied"
            message="You don't have permission to view this category."
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

  const showActions = canEdit || (canDelete && category.isActive);

  return (
    <Screen scroll refreshControl={{ refreshing, onRefresh: () => void handleRefresh() }}>
      {header}
      <View style={styles.container}>
        <CategoryOverviewSection category={category} />
        <CategoryMediaPreviewSection category={category} />
        {showActions ? (
          <SectionCard title="Actions">
            {canEdit ? (
              <Button
                title="Edit category"
                variant="outline"
                icon="create-outline"
                fullWidth
                onPress={() => router.push(`/categories/${category.id}/edit`)}
                accessibilityLabel="Edit this category's information and images"
              />
            ) : null}
            {canDelete && category.isActive ? (
              <Button
                title="Deactivate category"
                variant="danger"
                icon="eye-off-outline"
                fullWidth
                onPress={() => {
                  deactivate.reset();
                  setDeactivateDialogOpen(true);
                }}
                accessibilityLabel="Deactivate this category"
              />
            ) : null}
          </SectionCard>
        ) : null}
      </View>

      <Dialog
        visible={deactivateDialogOpen}
        onClose={() => setDeactivateDialogOpen(false)}
        title="Deactivate category?"
        message={`This will deactivate "${category.name}". It will no longer appear in category lists or be usable for new products. This action can be reversed by reactivating the category.`}
        primaryAction={{
          label: 'Deactivate',
          variant: 'danger',
          loading: isBusy,
          onPress: handleDeactivate,
        }}
        secondaryAction={{ label: 'Keep category' }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
});
