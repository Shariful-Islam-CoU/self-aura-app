import { useState, useCallback } from 'react';
import { ScrollView, TextInput, Text, StyleSheet, Alert, View } from 'react-native';
import { Button, LoadingState, ErrorState, EmptyState } from '@/components/ui';
import { Screen } from '@/components/layout';
import { useApplicationSettings, useUpdateApplicationSetting } from '@/features/settings';
import { useAuth } from '@/providers';

export default function AppSettingsScreen() {
  const { canAccess } = useAuth();
  const canManage = canAccess('settings.manage');
  const { data, isLoading, isError, refetch } = useApplicationSettings();
  const update = useUpdateApplicationSetting();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!canManage && !canAccess('settings.view')) return <Screen scroll><ErrorState title="Access denied" description="No permission." /></Screen>;
  if (isLoading) return <LoadingState />;
  if (isError) return <Screen scroll><ErrorState title="Failed to load settings" description="Try again." onRetry={() => refetch()} /></Screen>;
  if (!data || data.length === 0) return <Screen scroll><EmptyState title="No settings" description="No application settings found." /></Screen>;

  const handleEdit = (setting: typeof data[0]) => {
    setEditingId(setting._id);
    setEditValue(String(setting.value ?? ''));
    setError(null);
  };

  const handleSave = useCallback(async (id: string) => {
    if (!canManage) return;
    setError(null);
    try {
      await update.mutateAsync({ name: id, value: editValue });
      setEditingId(null);
      setEditValue('');
      Alert.alert('Saved', 'Setting updated successfully');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    }
  }, [canManage, editValue, update]);

  const handleCancel = () => {
    setEditingId(null);
    setEditValue('');
    setError(null);
  };

  return (
    <Screen scroll>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Application Settings</Text>
        {data.map((setting) => (
          <View key={setting._id} style={styles.settingCard}>
            <View style={styles.settingHeader}>
              <Text style={styles.settingName}>{setting.name}</Text>
              {setting.description && <Text style={styles.settingDesc}>{setting.description}</Text>}
            </View>
            {editingId === setting._id ? (
              <View style={styles.editForm}>
                <TextInput
                  style={styles.input}
                  value={editValue}
                  onChangeText={setEditValue}
                  placeholder="Value"
                  multiline
                  numberOfLines={3}
                />
                {error && <Text style={styles.error}>{error}</Text>}
                <View style={styles.editActions}>
                  <Button title="Cancel" variant="outline" onPress={handleCancel} />
                  <Button title="Save" onPress={() => handleSave(setting._id)} disabled={update.isPending} />
                </View>
              </View>
            ) : (
              <View style={styles.valueDisplay}>
                <Text style={styles.valueText}>{String(setting.value ?? '')}</Text>
                {canManage && <Button title="Edit" variant="ghost" size="sm" onPress={() => handleEdit(setting)} />}
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  title: { fontSize: 24, fontWeight: '700' },
  settingCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  settingHeader: { gap: 4 },
  settingName: { fontSize: 16, fontWeight: '600' },
  settingDesc: { fontSize: 13, color: '#6b7280' },
  valueDisplay: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTopWidth: 1, borderColor: '#e5e7eb' },
  valueText: { fontSize: 14, color: '#374151', flex: 1 },
  editForm: { gap: 8, paddingTop: 8, borderTopWidth: 1, borderColor: '#e5e7eb' },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 14, backgroundColor: '#fff' },
  error: { fontSize: 13, color: '#dc2626' },
  editActions: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
});