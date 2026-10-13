import { router } from 'expo-router';

import { ErrorState } from '@/components/feedback';
import { AppHeader, Screen } from '@/components/layout';
import { ExpenseForm } from '@/features/expenses/components';
import { useCreateExpense } from '@/features/expenses/queries';
import type { CreateExpenseInput } from '@/features/expenses/types';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/providers';

/**
 * Record-expense form (static route so it never shadows `[expenseId]`).
 * Permission is checked before the form appears (`expenses.create`); the
 * backend re-validates everything, generates the `EXP-######` number and its
 * 403/400 responses stay authoritative - the form surfaces them instead of
 * faking success.
 */
export default function CreateExpenseScreen() {
  const { hasPermission } = usePermissions();
  const toast = useToast();
  const createExpense = useCreateExpense();
  const canCreate = hasPermission('expenses.create');

  const header = <AppHeader variant="feature" title="Add expense" onBack={() => router.back()} />;

  if (!canCreate) {
    return (
      <Screen>
        {header}
        <ErrorState title="Access denied" message="You don't have permission to record expenses." />
      </Screen>
    );
  }

  const handleSubmit = async (input: CreateExpenseInput) => {
    await createExpense.mutateAsync(input);
    toast.success('Expense recorded.');
    router.back();
  };

  return (
    <Screen scroll keyboardAvoiding>
      {header}
      <ExpenseForm
        mode="create"
        initialValues={null}
        isSubmitting={createExpense.isPending}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
      />
    </Screen>
  );
}
