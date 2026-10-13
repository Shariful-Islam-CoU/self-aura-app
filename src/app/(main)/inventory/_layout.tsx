import { Stack } from 'expo-router';

import { useTheme } from '@/providers';

/**
 * Inventory feature stack (list -> details -> history / adjustment).
 * Reached from More -> Operations (the More tile routes here instead of
 * the generic `/module/inventory` placeholder). Headerless by design:
 * every screen renders the shared `AppHeader` (Step 3) so root and nested
 * screens speak the same header language. Detail routes take a
 * `productId` param (`/inventory/[productId]`) - never a product object.
 */
export default function InventoryStackLayout() {
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
