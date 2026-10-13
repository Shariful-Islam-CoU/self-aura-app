import { Stack } from 'expo-router';

import { useTheme } from '@/providers';

/**
 * Customers feature stack (list -> detail).
 *
 * Headerless by design: every screen renders the shared `AppHeader`
 * (Step 3) so root and nested screens speak the same header language.
 * Detail routes take an ID param (`/customers/[customerId]`).
 */
export default function CustomersStackLayout() {
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
