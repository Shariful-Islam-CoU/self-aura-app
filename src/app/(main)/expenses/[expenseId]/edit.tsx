import { router, useLocalSearchParams } from 'expo-router';

import { ErrorState, LoadingIndicator } from '@/components/feedback';
import { AppHeader, Screen } from '@/components/layout';
import { ExpenseForm } from '@/features/expenses/components';
import { useExpenseDetails, useUpdateExpense } from '@/features/expenses/queries';
import type { CreateExpenseInput } from '@/features/expenses/types';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/providers';

/**
 * Edit-expense form. The screen loads the expense first (permission-gated:
 * `expenses.edit`), then mounts the shared form with the loaded data as
 * `initialValues`, so editing other fields can keep the rest unchanged. It
 * always submits the fresh `expenseId` from the route - never stale data.
 */
export default function EditExpenseScreen() {
  const { expenseId } = useLocalSearchParams<{ expenseId: string }>();
  const { hasPermission } = usePermissions();
  const toast = useToast();
  const updateExpense = useUpdateExpense();
  const canEdit = hasPermission('expenses.edit');

  // Hook is called unconditionally (before any early return) per the hooks rules.
  const expenseQuery = useExpenseDetails(canEdit ? expenseId : undefined);
  const expense = expenseQuery.data;

  const header = <AppHeader variant="feature" title="Edit expense" onBack={() => router.back()} />;

  if (!canEdit) {
    return (
      <Screen>
        {header}
        <ErrorState title="Access denied" message="You don't have permission to edit expenses." />
      </Screen>
    );
  }

  const handleSubmit = async (input: CreateExpenseInput) => {
    await updateExpense.mutateAsync({ id: expenseId!, input });
    toast.success('Expense updated.');
    router.back();
  };

  if (!expenseId) {
    return (
      <Screen>
        {header}
        <ErrorState title="Expense not found" message="Open an expense from the list to edit it." />
      </Screen>
    );
  }

  if (expenseQuery.isPending) {
    return (
      <Screen>
        {header}
        <LoadingIndicator label="Loading expense..." />
      </Screen>
    );
  }

  if (!expense) {
    return (
      <Screen>
        {header}
        <ErrorState title="Expense not found" message="This expense may have been removed." />
      </Screen>
    );
  }

  return (
    <Screen scroll keyboardAvoiding>
      {header}
      <ExpenseForm
        mode="edit"
        initialValues={expense}
        isSubmitting={updateExpense.isPending}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
      />
    </Screen>
  );
}
