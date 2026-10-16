import { Stack } from 'expo-router';

import { useTheme } from '@/providers';

/**
 * Delivery Rules feature stack (list -> create/edit forms). Headerless by
 * design: every screen renders the shared `AppHeader` so root and nested
 * screens speak the same header language.
 */
export default function DeliveryRulesLayout() {
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
