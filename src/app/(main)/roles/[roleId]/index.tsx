import { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { View, TextInput, StyleSheet, ScrollView, Text, Alert } from 'react-native';
import { Button, EmptyState, ErrorState } from '@/components/ui';
import { Screen } from '@/components/layout';
import { useAuth } from '@/providers';
import { useRoleDetails, useUpdateRole, useUpdateRolePermissions, useDeleteRole } from '@/features/roles';


export default function RoleDetailsScreen() {
  const { roleId } = useLocalSearchParams<{ roleId: string }>();
  const id = roleId ?? '';
  const { data, isLoading, isError, refetch } = useRoleDetails(id);
  const { canAccess } = useAuth();
  const canManage = canAccess('roles.edit') || canAccess('roles.managePermissions') || canAccess('roles.delete');
  const update = useUpdateRole(id);
  const updatePerms = useUpdateRolePermissions(id);
  const deleteRole = useDeleteRole(id);
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [permissions, setPermissions] = useState<string[]>([]);

  if (!id) return <Screen><ErrorState title="Missing ID" description="Invalid route." /></Screen>;
  if (isLoading) return <Screen><ErrorState title="Loading" description="Fetching role details." /></Screen>;
  if (isError) return <Screen><ErrorState title="Failed to load role" description="Try again." onRetry={() => refetch()} /></Screen>;
  if (!data) return <Screen><EmptyState title="Not found" description="Role not found." /></Screen>;

  const isSystem = data.isSystem;

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 20, fontWeight: '700' }}>{data.name}</Text>
          {isSystem && <Text style={{ fontSize: 11, fontWeight: '700', backgroundColor: '#dbeafe', color: '#1e40af', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 }}>System Role</Text>}
        </View>
        <Text>Active: {data.isActive ? 'Yes' : 'No'}</Text>
        <Text>Created: {new Date(data.createdAt).toLocaleString()}</Text>
        <Text>Updated: {new Date(data.updatedAt).toLocaleString()}</Text>

        {canManage && !isSystem && (
          <View style={{ gap: 8, marginTop: 8, borderTopWidth: 1, borderColor: '#e5e7eb', paddingTop: 8 }}>
            <Text style={{ fontWeight: '600' }}>Edit Role</Text>
            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput style={styles.input} value={description} onChangeText={setDescription} placeholder="Description" multiline numberOfLines={3} defaultValue={data.description} />
            <View style={styles.row}>
              <Text style={styles.fieldLabel}>Active</Text>
              <Button title={isActive ? 'Yes' : 'No'} variant={isActive ? undefined : 'outline'} onPress={() => setIsActive(!isActive)} />
            </View>
            <Button title="Save Changes" onPress={() => update.mutate({ description: description.trim() || undefined, isActive })} disabled={update.isPending} />
          </View>
        )}

        <View style={{ gap: 8, marginTop: 16, borderTopWidth: 1, borderColor: '#e5e7eb', paddingTop: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: '600' }}>Permissions ({data.permissions.length})</Text>
          {data.permissions.map((p:any) => (
            <View key={p} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
              <Text style={{ fontSize: 14 }}>{p}</Text>
            </View>
          ))}
          {canManage && !isSystem && (
            <View style={{ marginTop: 8 }}>
              <Text style={styles.fieldLabel}>Manage Permissions</Text>
              <TextInput
                style={[styles.input, {fontFamily: 'monospace'}]}
                value={JSON.stringify(permissions, null, 2)}
                onChangeText={(t) => { try { setPermissions(JSON.parse(t)); } catch {} }}
                placeholder='JSON array of permission keys'
                multiline
                numberOfLines={5}
                defaultValue={JSON.stringify(data.permissions, null, 2)}
              />
              <Button title="Update Permissions" variant="outline" onPress={() => updatePerms.mutate({ permissions })} disabled={updatePerms.isPending} />
            </View>
          )}
        </View>

        {canManage && !isSystem && (
          <Button title="Delete Role" variant="outline" onPress={() => { Alert.alert('Delete Role', `Delete ${data.name}?`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', onPress: () => deleteRole.mutate(), style: 'destructive' }]); }} disabled={deleteRole.isPending} style={{ marginTop: 16 }} />
        )}
        {isSystem && <Text style={{ color: '#6b7280', marginTop: 16 }}>System roles cannot be deleted or have permissions modified.</Text>}
      </ScrollView>
    </Screen>
  );
}
const styles = StyleSheet.create({ container:{padding:16,gap:12}, row:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}, fieldLabel:{fontSize:14,fontWeight:'500',marginTop:8}, input:{borderWidth:1,borderRadius:8,padding:12,fontSize:16,fontFamily:'monospace'} });