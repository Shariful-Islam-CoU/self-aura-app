import { Stack } from 'expo-router';

import { useTheme } from '@/providers';

/**
 * Payments feature stack (list -> create -> details -> edit). Reached from
 * More > Finance. Headerless by design: every screen renders the shared
 * `AppHeader` so root and nested screens speak the same header language.
 * Detail routes take a `paymentId` param (`/payments/[paymentId]`) - never a
 * payment object.
 */
export default function PaymentsStackLayout() {
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
