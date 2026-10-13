import { Stack } from 'expo-router';
import { useTheme } from '@/providers';

export default function UsersLayout() {
  const { theme } = useTheme();
  return (
    <Stack screenOptions={{ headerStyle: { backgroundColor: theme.colors.surface }, headerTintColor: theme.colors.text, headerTitleStyle: { color: theme.colors.text }, headerShadowVisible: false, contentStyle: { backgroundColor: theme.colors.background } }}>
      <Stack.Screen name="index" options={{ title: "Users" }} />
      <Stack.Screen name="new" options={{ title: "Create User" }} />
      <Stack.Screen name="[userId]" options={{ title: "User Details" }} />
    </Stack>
  );
}