import { useState, useEffect } from 'react';
import { ScrollView, TextInput, Text, StyleSheet, Alert, View, Switch } from 'react-native';
import { Button, LoadingState, ErrorState, EmptyState } from '@/components/ui';
import { Screen } from '@/components/layout';
import { useBusinessSettings, useUpdateBusinessSettings } from '@/features/settings';
import { useAuth } from '@/providers';

export default function BusinessSettingsScreen() {
  const { canAccess } = useAuth();
  const canManage = canAccess('settings.manage');
  const { data, isLoading, isError, refetch } = useBusinessSettings();
  const update = useUpdateBusinessSettings();
  const [currency, setCurrency] = useState('USD');
  const [timezone, setTimezone] = useState('UTC');
  const [taxRate, setTaxRate] = useState('0');
  const [lowStockThreshold, setLowStockThreshold] = useState('');
  const [allowNegativeStock, setAllowNegativeStock] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (data) {
      setCurrency(data.currency);
      setTimezone(data.timezone);
      setTaxRate(String(data.taxRate));
      setLowStockThreshold(data.lowStockAlertThreshold?.toString() ?? '');
      setAllowNegativeStock(data.allowNegativeStock);
    }
  }, [data]);

  const handleSubmit = async () => {
    if (!canManage) return;
    setError(null);
    try {
      await update.mutateAsync({
        currency: currency.toUpperCase(),
        timezone,
        taxRate: parseFloat(taxRate) || 0,
        lowStockAlertThreshold: lowStockThreshold ? parseInt(lowStockThreshold) : undefined,
        allowNegativeStock,
      });
      Alert.alert('Saved', 'Business settings updated successfully');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    }
  };

  if (!canManage && !canAccess('settings.view')) return <Screen scroll><ErrorState title="Access denied" description="No permission." /></Screen>;
  if (isLoading) return <LoadingState />;
  if (isError) return <Screen scroll><ErrorState title="Failed to load settings" description="Try again." onRetry={() => refetch()} /></Screen>;
  if (!data) return <Screen scroll><EmptyState title="Not found" description="Business settings not found." /></Screen>;

  return (
    <Screen scroll>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Business Settings</Text>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Currency (ISO 4217)</Text>
          <TextInput style={styles.input} value={currency} onChangeText={setCurrency} placeholder="USD" autoCapitalize="characters" maxLength={3} />
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Timezone</Text>
          <TextInput style={styles.input} value={timezone} onChangeText={setTimezone} placeholder="UTC" />
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Tax Rate (%)</Text>
          <TextInput style={styles.input} value={taxRate} onChangeText={setTaxRate} placeholder="0" keyboardType="decimal-pad" />
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Low Stock Alert Threshold</Text>
          <TextInput style={styles.input} value={lowStockThreshold} onChangeText={setLowStockThreshold} placeholder="Optional" keyboardType="numeric" />
        </View>
        <View style={styles.field}>
          <View style={styles.row}>
            <Text style={styles.fieldLabel}>Allow Negative Stock</Text>
            <Switch value={allowNegativeStock} onValueChange={setAllowNegativeStock} />
          </View>
        </View>
        {error && <Text style={styles.error}>{error}</Text>}
        <Button title={update.isPending ? 'Saving...' : 'Save Changes'} onPress={handleSubmit} disabled={update.isPending || !canManage} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  title: { fontSize: 24, fontWeight: '700' },
  field: { gap: 8 },
  fieldLabel: { fontSize: 14, fontWeight: '500' },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: '#fff' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  error: { fontSize: 13, color: '#dc2626' },
});