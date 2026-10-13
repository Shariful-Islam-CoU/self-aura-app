import { Stack } from 'expo-router';
import { useTheme } from '@/providers';

export default function SettingsLayout() {
  const { theme } = useTheme();
  return (
    <Stack screenOptions={{ headerStyle: { backgroundColor: theme.colors.surface }, headerTintColor: theme.colors.text, headerTitleStyle: { color: theme.colors.text }, headerShadowVisible: false, contentStyle: { backgroundColor: theme.colors.background } }}>
      <Stack.Screen name="index" options={{ title: "Settings" }} />
      <Stack.Screen name="business" options={{ title: "Business Settings" }} />
      <Stack.Screen name="app" options={{ title: "Application Settings" }} />
      <Stack.Screen name="payments" options={{ title: "Payment Settings" }} />
    </Stack>
  );
}