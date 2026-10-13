import { useMemo, useState, type ReactNode } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { getErrorMessage } from '@/api';
import { EmptyState, ErrorState, LoadingIndicator } from '@/components/feedback';
import { AppHeader, Screen } from '@/components/layout';
import { Dialog, IconButton, SearchInput, Select, Text } from '@/components/ui';
import {
  ExpenseCategoryCard,
  ExpenseCategoryDialog,
  ExpenseListSkeleton,
} from '@/features/expenses/components';
import {
  flattenExpenseCategories,
  useCreateExpenseCategory,
  useDeactivateExpenseCategory,
  useExpenseCategoriesInfinite,
  useUpdateExpenseCategory,
} from '@/features/expenses/queries';
import type { CreateExpenseCategoryInput, ExpenseCategory } from '@/features/expenses/types';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast, useTheme } from '@/providers';
import { spacing } from '@/theme';

type ActiveFilter = 'all' | 'active' | 'inactive';

const ACTIVE_FILTER_OPTIONS = [
  { value: 'all', label: 'All categories' },
  { value: 'active', label: 'Active only' },
  { value: 'inactive', label: 'Inactive only' },
] as const;

/**
 * Expense-category manager (`/expense-categories`). Categories are always the
 * backend's - the same records the web app manages inside its Expenses page -
 * so there is never a second category system. New categories need
 * `expenses.create`; edits and deactivation need `expenses.edit`. Deactivation
 * removes a category from the create form but keeps existing expenses intact.
 */
export default function ExpenseCategoriesScreen() {
  const { hasPermission } = usePermissions();
  const { theme } = useTheme();
  const toast = useToast();

  const canView = hasPermission('expenses.view');
  const canCreate = hasPermission('expenses.create');
  const canEdit = hasPermission('expenses.edit');

  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 400);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ExpenseCategory | null>(null);
  const [deactivating, setDeactivating] = useState<ExpenseCategory | null>(null);

  const search = debouncedSearch.trim();
  const isActive = activeFilter === 'all' ? undefined : activeFilter === 'active';

  const categoriesQuery = useExpenseCategoriesInfinite(search, isActive);
  const categories = useMemo(
    () => flattenExpenseCategories(categoriesQuery.data?.pages),
    [categoriesQuery.data],
  );

  const createCategory = useCreateExpenseCategory();
  const updateCategory = useUpdateExpenseCategory();
  const deactivateCategory = useDeactivateExpenseCategory();

  const hasCriteria = search.length > 0 || activeFilter !== 'all';

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (category: ExpenseCategory) => {
    setEditing(category);
    setDialogOpen(true);
  };

  const handleCategorySubmit = async (input: CreateExpenseCategoryInput) => {
    if (editing) {
      await updateCategory.mutateAsync({ id: editing.id, input });
      toast.success('Category updated.');
    } else {
      await createCategory.mutateAsync(input);
      toast.success('Category created.');
    }
  };

  const handleRefresh = async () => {
    if (categoriesQuery.isFetching) return;
    setRefreshing(true);
    try {
      await categoriesQuery.refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const handleEndReached = () => {
    if (categoriesQuery.hasNextPage && !categoriesQuery.isFetching) {
      void categoriesQuery.fetchNextPage();
    }
  };

  const resetCriteria = () => {
    setSearchInput('');
    setActiveFilter('all');
  };

  const header = (
    <AppHeader
      variant="feature"
      title="Expense categories"
      onBack={() => router.back()}
      actions={
        canCreate ? (
          <IconButton
            icon="add-outline"
            accessibilityLabel="Add expense category"
            onPress={openCreate}
          />
        ) : null
      }
    />
  );

  if (!canView) {
    return (
      <Screen>
        {header}
        <ErrorState
          title="Access denied"
          message="You don't have permission to view expense categories."
        />
      </Screen>
    );
  }

  let content: ReactNode;
  if (categoriesQuery.isPending && categories.length === 0) {
    content = <ExpenseListSkeleton />;
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
          <ExpenseCategoryCard
            category={item}
            onPress={canEdit ? openEdit : undefined}
            action={
              canEdit && item.isActive ? (
                <IconButton
                  icon="ban-outline"
                  accessibilityLabel={`Deactivate ${item.name}`}
                  onPress={() => setDeactivating(item)}
                />
              ) : undefined
            }
          />
        )}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void handleRefresh()}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
        ListEmptyComponent={
          hasCriteria ? (
            <EmptyState
              icon="search-outline"
              title="No categories match"
              description="Try a different search or clear the applied filter."
              actionLabel="Clear filter"
              onAction={resetCriteria}
            />
          ) : (
            <EmptyState
              icon="pricetags-outline"
              title="No categories yet"
              description="Add a category so expenses can be grouped."
              actionLabel={canCreate ? 'Add category' : undefined}
              onAction={canCreate ? openCreate : undefined}
            />
          )
        }
        ListFooterComponent={
          categoriesQuery.hasNextPage && categoriesQuery.isFetchingNextPage ? (
            <View style={styles.loadingMore}>
              <LoadingIndicator label="Loading more categories..." />
            </View>
          ) : null
        }
      />
    );
  }

  return (
    <Screen scroll={false} padded={false}>
      {header}
      <View style={styles.toolbar}>
        <SearchInput
          value={searchInput}
          onValueChange={setSearchInput}
          placeholder="Search categories"
          accessibilityLabel="Search expense categories"
        />
        <Select
          value={activeFilter}
          options={ACTIVE_FILTER_OPTIONS}
          onChange={(value) => setActiveFilter(value as ActiveFilter)}
        />
      </View>

      <View style={styles.content}>{content}</View>

      {dialogOpen ? (
        <ExpenseCategoryDialog
          key={editing?.id ?? 'new'}
          category={editing}
          isSubmitting={createCategory.isPending || updateCategory.isPending}
          onSubmit={handleCategorySubmit}
          onClose={() => setDialogOpen(false)}
        />
      ) : null}

      {deactivating ? (
        <DeactivateCategoryDialog
          category={deactivating}
          isSubmitting={deactivateCategory.isPending}
          onConfirm={async () => {
            await deactivateCategory.mutateAsync(deactivating.id);
            toast.success(`"${deactivating.name}" deactivated.`);
          }}
          onClose={() => setDeactivating(null)}
        />
      ) : null}
    </Screen>
  );
}

interface DeactivateCategoryDialogProps {
  category: ExpenseCategory;
  isSubmitting: boolean;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

/** Confirm + run the category deactivation; stays open and shows the server's message on failure. */
function DeactivateCategoryDialog({
  category,
  isSubmitting,
  onConfirm,
  onClose,
}: DeactivateCategoryDialogProps) {
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <Dialog
      visible
      onClose={onClose}
      title="Deactivate category?"
      message="Inactive categories can no longer be selected when recording an expense. Existing expenses keep their category."
      primaryAction={{
        label: isSubmitting ? 'Deactivating...' : 'Deactivate',
        variant: 'danger',
        loading: isSubmitting,
        onPress: () => void handleConfirm(),
      }}
      secondaryAction={{ label: 'Keep active', onPress: onClose }}
      dismissOnBackdrop={!isSubmitting}
    >
      <View style={styles.dialogBody}>
        <Text variant="bodyMedium" numberOfLines={2}>
          {category.name}
        </Text>
        {error ? (
          <Text variant="bodySmall" tone="danger" accessibilityLiveRegion="polite">
            {error}
          </Text>
        ) : null}
      </View>
    </Dialog>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  listContent: {
    flexGrow: 1,
    gap: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  loadingMore: { paddingVertical: spacing.sm },
  dialogBody: { gap: spacing.sm, paddingVertical: spacing.sm },
});
