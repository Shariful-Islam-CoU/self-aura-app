import { Stack } from 'expo-router';

import { useTheme } from '@/providers';

/**
 * Authenticated shell stack: the tab navigator plus the global pushed
 * feature routes (dynamic module screens, implemented module stacks such
 * as categories, notifications, profile).
 *
 * Headers: `module/[key]` keeps the native stack header (themed here);
 * every other pushed screen disables it and renders the shared
 * `AppHeader` instead, so all navigation chrome speaks one visual
 * language. Individual screens only set their own title/actions.
 */
export default function MainLayout() {
  const { theme } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.text,
        headerTitleStyle: { color: theme.colors.text },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="module/[key]" options={{ title: 'Module' }} />
      <Stack.Screen name="categories" options={{ headerShown: false }} />
      <Stack.Screen name="inventory" options={{ headerShown: false }} />
      <Stack.Screen name="suppliers" options={{ headerShown: false }} />
      <Stack.Screen name="purchases" options={{ headerShown: false }} />
      <Stack.Screen name="expenses" options={{ headerShown: false }} />
      <Stack.Screen name="payments" options={{ headerShown: false }} />
      <Stack.Screen name="couriers" options={{ headerShown: false }} />
      <Stack.Screen name="shipments" options={{ headerShown: false }} />
      <Stack.Screen name="delivery-rules" options={{ headerShown: false }} />
      <Stack.Screen name="coupons" options={{ headerShown: false }} />
      <Stack.Screen name="returns" options={{ headerShown: false }} />
      <Stack.Screen name="reviews" options={{ headerShown: false }} />
      <Stack.Screen name="reports" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      <Stack.Screen name="users" options={{ headerShown: false }} />
      <Stack.Screen name="roles" options={{ headerShown: false }} />
      <Stack.Screen name="permissions" options={{ headerShown: false }} />
      <Stack.Screen name="notifications" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ headerShown: false }} />
    </Stack>
  );
}
