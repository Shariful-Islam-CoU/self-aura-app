import { Stack } from 'expo-router';

import { useTheme } from '@/providers';

export const unstable_settings = {
  anchor: 'index',
};

/**
 * Orders feature stack (list -> detail -> create form).
 *
 * Headerless by design: every screen renders the shared `AppHeader`
 * (Step 3) so root and nested screens speak the same header language.
 * Detail routes take an ID param (`/orders/[orderId]`) - never objects.
 */
export default function OrdersStackLayout() {
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
