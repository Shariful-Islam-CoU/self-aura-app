import { Stack } from 'expo-router';

import { useTheme } from '@/providers';

/**
 * Products feature stack (list -> details -> create/edit forms).
 *
 * Headerless by design: every screen renders the shared `AppHeader`
 * (Step 3) so root and nested screens speak the same header language.
 * Detail routes take an ID param (`/products/[productId]`), forms are
 * static siblings (`/products/new`, `/products/[productId]/edit`).
 */
export default function ProductsStackLayout() {
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
