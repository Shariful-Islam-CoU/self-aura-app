import { Stack } from 'expo-router';

import { useTheme } from '@/providers';

/**
 * Purchases feature stack (list -> details -> edit).
 * Reached from More > Operations (the More tile routes here instead of
 * the generic `/module/purchases` placeholder). Headerless by design:
 * every screen renders the shared `AppHeader` (Step 3) so root and nested
 * screens speak the same header language. Detail routes take a
 * `purchaseId` param (`/purchases/[purchaseId]`) - never a purchase object.
 */
export default function PurchasesStackLayout() {
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
