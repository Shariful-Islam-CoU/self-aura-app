import { Stack } from 'expo-router';

import { useTheme } from '@/providers';

/**
 * Couriers feature stack (list -> details -> create/edit forms). Headerless by
 * design: every screen renders the shared `AppHeader` so root and nested
 * screens speak the same header language.
 */
export default function CouriersLayout() {
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
