import { Stack } from 'expo-router';
import { useTheme } from '@/providers';

export default function CouponsLayout() {
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
      <Stack.Screen name="index" options={{ title: 'Coupons' }} />
      <Stack.Screen name="new" options={{ title: 'Create Coupon' }} />
      <Stack.Screen name="edit/[couponId]" options={{ title: 'Edit Coupon' }} />
      <Stack.Screen name="[couponId]" options={{ title: 'Coupon Details' }} />
    </Stack>
  );
}