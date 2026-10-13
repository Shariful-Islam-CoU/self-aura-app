import { useCallback, useState } from 'react';
import { StyleSheet, ScrollView, Pressable, RefreshControl, View } from 'react-native';
import { ErrorState, LoadingState, Text } from '@/components/ui';
import { Screen } from '@/components/layout';
import { useAuth, useTheme } from '@/providers';
import { useBusinessSettings, useApplicationSettings, usePaymentSettings } from '@/features/settings';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function SettingsScreen() {
  const { theme } = useTheme();
  const { canAccess } = useAuth();
  const canManage = canAccess('settings.manage');
  const [refreshing, setRefreshing] = useState(false);

  const { data: business, isLoading: businessLoading, isError: businessError, refetch: refetchBusiness } = useBusinessSettings();
  const { data: app, isLoading: appLoading, isError: appError, refetch: refetchApp } = useApplicationSettings();
  const { data: payments, isLoading: paymentsLoading, isError: paymentsError, refetch: refetchPayments } = usePaymentSettings();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchBusiness(), refetchApp(), refetchPayments()]);
    setRefreshing(false);
  }, [refetchBusiness, refetchApp, refetchPayments]);

  if (!canManage && !canAccess('settings.view')) {
    return <Screen scroll><ErrorState title="Access denied" description="No permission." /></Screen>;
  }

  const isLoading = businessLoading || appLoading || paymentsLoading;
  const isError = businessError || appError || paymentsError;

  if (isLoading && !business && !app && !payments) return <LoadingState />;
  if (isError && !business && !app && !payments) return <Screen scroll><ErrorState title="Failed to load settings" description="Try again." onRetry={handleRefresh} /></Screen>;

  const settingsCards = [
    { key: 'business', title: 'Business Settings', description: 'Currency, timezone, tax, stock alerts', route: 'business', icon: 'business' as const, canView: canAccess('settings.view') },
    { key: 'app', title: 'Application Settings', description: 'App name, contact info, feature flags', route: 'app', icon: 'settings-outline' as const, canView: canAccess('settings.view') },
    { key: 'payments', title: 'Payment Settings', description: 'bKash, Nagad, COD configuration', route: 'payments', icon: 'card' as const, canView: canAccess('settings.view') },
  ];

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
        <Text style={styles.title}>Settings</Text>
        {settingsCards.map((card) => (
          card.canView && (
            <Pressable key={card.key} style={styles.card} onPress={() => router.push(`/settings/${card.route}` as `/settings/business` | `/settings/app` | `/settings/payments`)}>
              <View style={[styles.cardIcon, { backgroundColor: theme.colors.primarySoft }]}>
                <Ionicons name={card.icon} size={24} color={theme.colors.primaryOnSoft} />
              </View>
              <View style={styles.cardText}>
                <Text variant="bodyMedium" numberOfLines={1}>{card.title}</Text>
                <Text variant="caption" tone="muted" numberOfLines={2}>{card.description}</Text>
              </View>
            </Pressable>
          )
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, backgroundColor: '#fff', borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardText: { flex: 1 },
});