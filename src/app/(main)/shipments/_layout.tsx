import { Stack } from 'expo-router';

import { useTheme } from '@/providers';

/**
 * Shipments feature stack (list -> details -> create/edit forms).
 *
 * Headerless by design: every screen renders the shared `AppHeader`
 * so root and nested screens speak the same header language.
 * Detail routes take an ID param (`/shipments/[shipmentId]`), forms are
 * static siblings (`/shipments/new`, `/shipments/[shipmentId]/edit`).
 */
export default function ShipmentsLayout() {
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
