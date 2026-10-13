import { Stack } from 'expo-router';
import { useTheme } from '@/providers';

export default function ReviewsLayout() {
  const { theme } = useTheme();
  return (
    <Stack screenOptions={{ headerStyle: { backgroundColor: theme.colors.surface }, headerTintColor: theme.colors.text, headerTitleStyle: { color: theme.colors.text }, headerShadowVisible: false, contentStyle: { backgroundColor: theme.colors.background } }}>
      <Stack.Screen name="index" options={{ title: "Reviews" }} />
      <Stack.Screen name="[reviewId]" options={{ title: "Review Details" }} />
    </Stack>
  );
}