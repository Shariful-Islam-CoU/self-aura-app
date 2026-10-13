import { useState } from 'react';
import { TextInput, StyleSheet, ScrollView, Text } from 'react-native';
import { Button } from '@/components/ui';
import { useCreateUser } from '@/features/users';
import { useAuth } from '@/providers';
import { router } from 'expo-router';

export default function NewUserScreen() {
  const { canAccess } = useAuth();
  const canManage = canAccess('users.create');
  const createUser = useCreateUser();
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('staff');
  const [error, setError] = useState<string | null>(null);

  const validate = () => {
    if (!username.trim() || username.length < 3) return 'Username must be at least 3 characters';
    if (!name.trim()) return 'Name is required';
    if (!email.trim() || !email.includes('@')) return 'Valid email required';
    if (!phone.trim()) return 'Phone is required';
    if (!password || password.length < 8) return 'Password must be at least 8 characters';
    return null;
  };

  const handleSubmit = async () => {
    if (!canManage) return;
    const err = validate();
    if (err) { setError(err); return; }
    setError(null);
    try {
      await createUser.mutateAsync({ username: username.toLowerCase().trim(), name: name.trim(), email: email.toLowerCase().trim(), phone: phone.trim(), password, role: role.trim() as 'owner' | 'manager' | 'staff' | undefined });
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create user');
    }
  };

  if (!canManage) return <ScrollView contentContainerStyle={styles.container}><Text>Access denied</Text></ScrollView>;

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Create User</Text>
      <Text style={styles.fieldLabel}>Username *</Text>
      <TextInput style={styles.input} value={username} onChangeText={setUsername} placeholder="min 3 characters" autoCapitalize="none" autoCorrect={false} />
      <Text style={styles.fieldLabel}>Name *</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Full name" />
      <Text style={styles.fieldLabel}>Email *</Text>
      <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="email@example.com" keyboardType="email-address" autoCapitalize="none" />
      <Text style={styles.fieldLabel}>Phone *</Text>
      <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="01XXXXXXXXX" keyboardType="phone-pad" />
      <Text style={styles.fieldLabel}>Password *</Text>
      <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="min 8 characters" secureTextEntry />
      <Text style={styles.fieldLabel}>Role</Text>
      <TextInput style={styles.input} value={role} onChangeText={setRole} placeholder="owner/manager/staff" />
      {error && <Text style={styles.error}>{error}</Text>}
      <Button title={createUser.isPending ? "Creating..." : "Create User"} onPress={handleSubmit} disabled={createUser.isPending} />
    </ScrollView>
  );
}
const styles = StyleSheet.create({ container:{padding:16,gap:16}, title:{fontSize:24,fontWeight:'700',marginBottom:8}, fieldLabel:{fontSize:14,fontWeight:'500',marginTop:8}, input:{borderWidth:1,borderRadius:8,padding:12,fontSize:16}, error:{color:'#ef4444',fontSize:14} });