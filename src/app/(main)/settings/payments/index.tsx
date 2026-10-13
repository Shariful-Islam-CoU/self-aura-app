import { useState, useEffect } from 'react';
import { ScrollView, TextInput, Text, StyleSheet, Alert, View, Switch } from 'react-native';
import { Button, LoadingState, ErrorState, EmptyState } from '@/components/ui';
import { Screen } from '@/components/layout';
import { usePaymentSettings, useUpdatePaymentSettings } from '@/features/settings';
import { useAuth } from '@/providers';

export default function PaymentSettingsScreen() {
  const { canAccess } = useAuth();
  const canManage = canAccess('settings.manage');
  const { data, isLoading, isError, refetch } = usePaymentSettings();
  const update = useUpdatePaymentSettings();
  const [bkashEnabled, setBkashEnabled] = useState(false);
  const [bkashNumber, setBkashNumber] = useState('');
  const [nagadEnabled, setNagadEnabled] = useState(false);
  const [nagadNumber, setNagadNumber] = useState('');
  const [codEnabled, setCodEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (data) {
      setBkashEnabled(data.bkash?.enabled ?? false);
      setBkashNumber(data.bkash?.number ?? '');
      setNagadEnabled(data.nagad?.enabled ?? false);
      setNagadNumber(data.nagad?.number ?? '');
      setCodEnabled(data.cod?.enabled ?? false);
    }
  }, [data]);

  const handleSubmit = async () => {
    if (!canManage) return;
    setError(null);
    try {
      await update.mutateAsync({
        bkash: { enabled: bkashEnabled, number: bkashNumber || undefined },
        nagad: { enabled: nagadEnabled, number: nagadNumber || undefined },
        cod: { enabled: codEnabled },
      });
      Alert.alert('Saved', 'Payment settings updated successfully');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    }
  };

  if (!canManage && !canAccess('settings.view')) return <Screen scroll><ErrorState title="Access denied" description="No permission." /></Screen>;
  if (isLoading) return <LoadingState />;
  if (isError) return <Screen scroll><ErrorState title="Failed to load settings" description="Try again." onRetry={() => refetch()} /></Screen>;
  if (!data) return <Screen scroll><EmptyState title="Not found" description="Payment settings not found." /></Screen>;

  return (
    <Screen scroll>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Payment Settings</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>bKash</Text>
          <View style={styles.field}>
            <View style={styles.row}>
              <Text style={styles.fieldLabel}>Enabled</Text>
              <Switch value={bkashEnabled} onValueChange={setBkashEnabled} />
            </View>
            <Text style={styles.fieldLabel}>Merchant Number</Text>
            <TextInput style={styles.input} value={bkashNumber} onChangeText={setBkashNumber} placeholder="Merchant number" />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nagad</Text>
          <View style={styles.field}>
            <View style={styles.row}>
              <Text style={styles.fieldLabel}>Enabled</Text>
              <Switch value={nagadEnabled} onValueChange={setNagadEnabled} />
            </View>
            <Text style={styles.fieldLabel}>Merchant Number</Text>
            <TextInput style={styles.input} value={nagadNumber} onChangeText={setNagadNumber} placeholder="Merchant number" />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cash on Delivery</Text>
          <View style={styles.field}>
            <View style={styles.row}>
              <Text style={styles.fieldLabel}>Enabled</Text>
              <Switch value={codEnabled} onValueChange={setCodEnabled} />
            </View>
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
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 16, gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  field: { gap: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fieldLabel: { fontSize: 14, fontWeight: '500' },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: '#fff' },
  error: { fontSize: 13, color: '#dc2626' },
});