import { Stack } from 'expo-router';

import { useTheme } from '@/providers';

/**
 * Unauthenticated stack - Login screen.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.text,
        headerTitleStyle: { color: theme.colors.text },
        headerShadowVisible: false,
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      {children}
    </Stack>
  );
}
