import { Stack } from 'expo-router';

import { useTheme } from '@/providers';

/**
 * Expenses feature stack (list -> details -> edit, plus the category
 * manager). Reached from More > Operations. Headerless by design: every
 * screen renders the shared `AppHeader` so root and nested screens speak the
 * same header language. Detail routes take an `expenseId` param
 * (`/expenses/[expenseId]`) - never an expense object.
 */
export default function ExpensesStackLayout() {
  const { theme } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    />
  );
}
