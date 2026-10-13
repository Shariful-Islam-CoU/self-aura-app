import { Stack } from 'expo-router';

import { useTheme } from '@/providers';

/**
 * Categories feature stack (list -> detail). Reached from More -> Operations
 * (the More tile routes here instead of the generic `/module/categories`
 * placeholder). Headerless by design: every screen renders the shared
 * `AppHeader` (Step 3) so root and nested screens speak the same header
 * language. Detail routes take an ID param (`/categories/[categoryId]`).
 */
export default function CategoriesStackLayout() {
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
