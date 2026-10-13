import { useState, type ReactNode } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { getErrorMessage } from '@/api';
import { EmptyState, ErrorState } from '@/components/feedback';
import { AppHeader, Screen } from '@/components/layout';
import { IconButton } from '@/components/ui';
import { CategoryCard, CategoryListSkeleton } from '@/features/categories/components';
import { useCategoriesList } from '@/features/categories/queries';
import { usePermissions } from '@/hooks/usePermissions';
import { useTheme } from '@/providers';
import { spacing } from '@/theme';

/**
 * Categories list (More -> Operations -> Categories). Backed by
 * `GET /categories`, which returns the full list server-sorted by name -
 * the backend exposes no search/filter/sort/pagination for categories, so
 * this screen deliberately stays a clean alphabetical list (same as the
 * web app). Pull-to-refresh refetches the one query with no parameter
 * juggling; the add action is permission-gated (backend stays the
 * authority and rejects unauthorized writes with its own 403).
 */
export default function CategoriesListScreen() {
  const { hasPermission } = usePermissions();
  const { theme } = useTheme();
  const canView = hasPermission('categories.view');
  const canCreate = hasPermission('categories.create');

  const [refreshing, setRefreshing] = useState(false);

  const categoriesQuery = useCategoriesList();
  const categories = categoriesQuery.data ?? [];

  const handleRefresh = async () => {
    if (categoriesQuery.isFetching) return; // never race an in-flight request
    setRefreshing(true);
    try {
      await categoriesQuery.refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const header = (
    <AppHeader
      variant="feature"
      title="Categories"
      subtitle="Manage your product categories"
      actions={
        canCreate ? (
          <IconButton
            icon="add-outline"
            accessibilityLabel="Add category"
            onPress={() => router.push('/categories/new')}
          />
        ) : null
      }
    />
  );

  if (!canView) {
    return (
      <Screen>
        {header}
        <ErrorState title="Access denied" message="You don't have permission to view categories." />
      </Screen>
    );
  }

  let content: ReactNode;
  if (categoriesQuery.isPending && categories.length === 0) {
    content = <CategoryListSkeleton />;
  } else if (categoriesQuery.isError && categories.length === 0) {
    content = (
      <ErrorState
        title="Failed to load categories"
        message={getErrorMessage(categoriesQuery.error)}
        onRetry={() => void categoriesQuery.refetch()}
        retryLabel="Retry"
      />
    );
  } else {
    content = (
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CategoryCard category={item} onPress={(id) => router.push(`/categories/${id}`)} />
        )}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void handleRefresh()}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="albums-outline"
            title="No categories found"
            description="Create your first category to organize your products."
            actionLabel={canCreate ? 'Add category' : undefined}
            onAction={canCreate ? () => router.push('/categories/new') : undefined}
          />
        }
      />
    );
  }

  return (
    <Screen scroll={false} padded={false}>
      {header}
      <View style={styles.content}>{content}</View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  listContent: {
    flexGrow: 1, // lets pull-to-refresh work on an empty list
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
});
