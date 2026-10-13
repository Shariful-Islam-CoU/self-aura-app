import { Stack } from 'expo-router';
import { useTheme } from '@/providers';

export default function RolesLayout() {
  const { theme } = useTheme();
  return (
    <Stack screenOptions={{ headerStyle: { backgroundColor: theme.colors.surface }, headerTintColor: theme.colors.text, headerTitleStyle: { color: theme.colors.text }, headerShadowVisible: false, contentStyle: { backgroundColor: theme.colors.background } }}>
      <Stack.Screen name="index" options={{ title: "Roles" }} />
      <Stack.Screen name="new" options={{ title: "Create Role" }} />
      <Stack.Screen name="[roleId]" options={{ title: "Role Details" }} />
    </Stack>
  );
}