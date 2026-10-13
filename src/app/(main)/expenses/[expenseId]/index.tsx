import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { getErrorMessage, isApiError } from '@/api';
import { EmptyState, ErrorState } from '@/components/feedback';
import { AppHeader, Screen } from '@/components/layout';
import { Button } from '@/components/ui';
import { SectionCard } from '@/features/customers/components/SectionCard';
import {
  ExpenseAuditSection,
  ExpenseDeleteDialog,
  ExpenseDescriptionSection,
  ExpenseDetailsSkeleton,
  ExpenseNotesSection,
  ExpenseOverviewSection,
} from '@/features/expenses/components';
import { useDeleteExpense, useExpenseDetails } from '@/features/expenses/queries';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/providers';
import { spacing } from '@/theme';

/**
 * Expense details: fetched by ID only (navigation passes `expenseId` - never an
 * expense object). Sections render backend data as-is. Deleting is a soft
 * delete and is confirmed first - a rejected request shows the server's own
 * message and never fakes success.
 */
export default function ExpenseDetailsScreen() {
  const { expenseId } = useLocalSearchParams<{ expenseId: string }>();
  const { hasPermission } = usePermissions();
  const toast = useToast();

  const canView = hasPermission('expenses.view');
  const canEdit = hasPermission('expenses.edit');
  const canDelete = hasPermission('expenses.delete');

  const expenseQuery = useExpenseDetails(canView ? expenseId : undefined);
  const deleteExpense = useDeleteExpense();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const expense = expenseQuery.data;

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.allSettled([expenseQuery.refetch()]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleDelete = async () => {
    if (!expense) return;
    await deleteExpense.mutateAsync(expense.id);
    toast.success(`Expense ${expense.expenseNumber} deleted.`);
    router.back();
  };

  const header = (
    <AppHeader variant="feature" title="Expense details" onBack={() => router.back()} />
  );

  if (!expenseId) {
    return (
      <Screen>
        {header}
        <EmptyState
          icon="document-text-outline"
          title="Expense not found"
          description="Open an expense from the list to see its details."
          actionLabel="Back to expenses"
          onAction={() => router.replace('/expenses')}
        />
      </Screen>
    );
  }

  if (!canView) {
    return (
      <Screen>
        {header}
        <ErrorState title="Access denied" message="You don't have permission to view expenses." />
      </Screen>
    );
  }

  if (expenseQuery.isPending) {
    return (
      <Screen>
        {header}
        <ExpenseDetailsSkeleton />
      </Screen>
    );
  }

  if (!expense) {
    const error = expenseQuery.error;
    if (isApiError(error) && error.kind === 'authorization') {
      return (
        <Screen>
          {header}
          <ErrorState
            title="Access denied"
            message="You don't have permission to view this expense."
          />
        </Screen>
      );
    }
    if (isApiError(error) && error.kind === 'notFound') {
      return (
        <Screen>
          {header}
          <EmptyState
            icon="document-text-outline"
            title="Expense not found"
            description="This expense may have been removed."
            actionLabel="Back to expenses"
            onAction={() => router.replace('/expenses')}
          />
        </Screen>
      );
    }
    return (
      <Screen>
        {header}
        <ErrorState
          title="Failed to load expense"
          message={getErrorMessage(error)}
          onRetry={() => void expenseQuery.refetch()}
          retryLabel="Retry"
        />
      </Screen>
    );
  }

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
        <ExpenseOverviewSection expense={expense} />
        <ExpenseDescriptionSection expense={expense} />
        <ExpenseNotesSection expense={expense} />
        <ExpenseAuditSection expense={expense} />
        {canEdit || canDelete ? (
          <SectionCard title="Actions">
            {canEdit ? (
              <Button
                title="Edit expense"
                variant="outline"
                icon="create-outline"
                fullWidth
                onPress={() => router.push(`/expenses/${expense.id}/edit`)}
                accessibilityLabel="Edit this expense"
              />
            ) : null}
            {canDelete ? (
              <Button
                title="Delete expense"
                variant="danger"
                icon="trash-outline"
                fullWidth
                onPress={() => {
                  deleteExpense.reset();
                  setDeleteDialogOpen(true);
                }}
                accessibilityLabel="Delete this expense"
              />
            ) : null}
          </SectionCard>
        ) : null}
      </View>

      <ExpenseDeleteDialog
        open={deleteDialogOpen}
        expense={expense}
        isSubmitting={deleteExpense.isPending}
        onConfirm={handleDelete}
        onOpenChange={() => setDeleteDialogOpen(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
});
