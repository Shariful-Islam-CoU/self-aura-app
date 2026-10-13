import { useState } from 'react';
import { TextInput, StyleSheet, ScrollView, Text } from 'react-native';
import { Button } from '@/components/ui';
import { useCreateRole } from '@/features/roles';
import { useAuth } from '@/providers';
import { router } from 'expo-router';

export default function NewRoleScreen() {
  const { canAccess } = useAuth();
  const canManage = canAccess('roles.create');
  const createRole = useCreateRole();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [permissions, setPermissions] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const validate = () => {
    if (!name.trim()) return 'Role name is required';
    if (!/^[a-z_]+$/.test(name.trim().toLowerCase())) return 'Role name must be lowercase with underscores only';
    return null;
  };

  const handleSubmit = async () => {
    if (!canManage) return;
    const err = validate();
    if (err) { setError(err); return; }
    setError(null);
    let perms: string[] = [];
    try { perms = JSON.parse(permissions); } catch { perms = []; }
    try {
      await createRole.mutateAsync({ name: name.trim().toLowerCase(), description: description.trim() || undefined, permissions: perms, isActive });
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create role');
    }
  };

  if (!canManage) return <ScrollView contentContainerStyle={styles.container}><Text>Access denied</Text></ScrollView>;

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Create Role</Text>
      <Text style={styles.fieldLabel}>Name *</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. custom_manager" autoCapitalize="none" autoCorrect={false} />
      <Text style={styles.fieldLabel}>Description</Text>
      <TextInput style={styles.input} value={description} onChangeText={setDescription} placeholder="Optional" multiline numberOfLines={3} />
      <Text style={styles.fieldLabel}>Permissions (JSON array)</Text>
      <TextInput style={[styles.input, {fontFamily: 'monospace'}]} value={permissions} onChangeText={setPermissions} placeholder='["products.view", "orders.edit"]' multiline numberOfLines={5} />
      <Text style={styles.fieldLabel}>Active</Text>
      <Button title={isActive ? 'Yes' : 'No'} variant={isActive ? undefined : 'outline'} onPress={() => setIsActive(!isActive)} />
      {error && <Text style={styles.error}>{error}</Text>}
      <Button title={createRole.isPending ? 'Creating...' : 'Create Role'} onPress={handleSubmit} disabled={createRole.isPending || !canManage} />
    </ScrollView>
  );
}
const styles = StyleSheet.create({ container:{padding:16,gap:16}, title:{fontSize:24,fontWeight:'700',marginBottom:8}, fieldLabel:{fontSize:14,fontWeight:'500',marginTop:8}, input:{borderWidth:1,borderRadius:8,padding:12,fontSize:16}, error:{color:'#ef4444',fontSize:14} });