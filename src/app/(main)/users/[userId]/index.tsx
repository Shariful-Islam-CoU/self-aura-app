import { useLocalSearchParams } from 'expo-router';
import { View, TextInput } from 'react-native';
import { Screen } from '@/components/layout';
import { LoadingState, ErrorState, EmptyState, Text, Button } from '@/components/ui';
import { useUserDetails, useApproveUser, useRejectUser, useEnableUser, useDisableUser, useChangeUserRole, useResetUserPassword } from '@/features/users';
import { useAuth } from '@/providers';
import { useState } from 'react';
import { Alert } from 'react-native';

export default function UserDetailsScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const id = userId ?? '';
  const { data, isLoading, isError, refetch } = useUserDetails(id);
  const { canAccess } = useAuth();
  const canManage = canAccess('users.edit') || canAccess('users.approve') || canAccess('users.reject') || canAccess('users.enable') || canAccess('users.disable') || canAccess('users.changeRole') || canAccess('users.changePassword');
  const approve = useApproveUser(id);
  const reject = useRejectUser(id);
  const enable = useEnableUser(id);
  const disable = useDisableUser(id);
  const changeRole = useChangeUserRole(id);
  const resetPassword = useResetUserPassword(id);
  const [role, setRole] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordReset, setShowPasswordReset] = useState(false);

  if (!id) return <Screen scroll><ErrorState title="Missing ID" description="Invalid route." /></Screen>;
  if (isLoading) return <LoadingState />;
  if (isError) return <Screen scroll><ErrorState title="Failed to load user" description="Try again." onRetry={() => refetch()} /></Screen>;
  if (!data) return <Screen scroll><EmptyState title="Not found" description="User not found." /></Screen>;

  const isOwner = data.isPrincipalOwner;
  const isPending = data.status === 'pending';
  const isActive = data.status === 'active';
  const isDisabled = data.status === 'disabled';

  return (
    <Screen scroll>
      <View style={{ padding: 16, gap: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 20, fontWeight: '700' }}>{data.name}</Text>
          {isOwner && <Text style={{ fontSize: 11, fontWeight: '700', backgroundColor: '#fef3c7', color: '#92400e', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 }}>Owner</Text>}
        </View>
        <Text>@{data.username}</Text>
        <Text>Email: {data.email}</Text>
        <Text>Phone: {data.phone}</Text>
        <Text>Role: {data.role}</Text>
        <Text>Status: <Text style={{ fontWeight: '600', color: data.status === 'active' ? 'green' : data.status === 'pending' ? 'orange' : data.status === 'rejected' ? 'red' : 'gray' }}>{data.status}</Text></Text>
        <Text>Active: {data.isActive ? 'Yes' : 'No'}</Text>
        {data.approvedAt ? <Text>Approved: {new Date(data.approvedAt).toLocaleString()}</Text> : null}
        {data.approvedBy ? <Text>Approved by: {data.approvedBy}</Text> : null}
        <Text>Created: {new Date(data.createdAt).toLocaleString()}</Text>
        <Text>Updated: {new Date(data.updatedAt).toLocaleString()}</Text>

        {canManage && (
          <View style={{ gap: 8, marginTop: 8, borderTopWidth: 1, borderColor: '#e5e7eb', paddingTop: 8 }}>
            <Text style={{ fontWeight: '600' }}>Management Actions</Text>
            {isPending && (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Button title="Approve" variant="primary" onPress={() => approve.mutate()} disabled={approve.isPending || isOwner} />
                <Button title="Reject" variant="danger" onPress={() => reject.mutate()} disabled={reject.isPending || isOwner} />
              </View>
            )}
            {isActive && !isOwner && (
              <Button title="Disable" variant="outline" onPress={() => { Alert.alert("Disable user", "Are you sure?", [{ text: "Cancel", style: "cancel" }, { text: "Disable", onPress: () => disable.mutate(), style: "destructive" }]); }} disabled={disable.isPending} />
            )}
            {isDisabled && !isOwner && (
              <Button title="Enable" variant="primary" onPress={() => enable.mutate()} disabled={enable.isPending} />
            )}
            {!isOwner && (
              <View style={{ gap: 8 }}>
                <Text>Change Role</Text>
                <TextInput
                  style={{ borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 16 }}
                  value={role}
                  onChangeText={setRole}
                  placeholder="Role (owner/manager/staff)"
                  defaultValue={data.role}
                />
                <Button title="Change Role" variant="outline" onPress={() => { if (role.trim()) changeRole.mutate({ role: role.trim() as 'owner' | 'manager' | 'staff' }); }} disabled={changeRole.isPending} />
              </View>
            )}
            {!isOwner && (
              <Button title="Reset Password" variant="outline" onPress={() => setShowPasswordReset(true)} disabled={resetPassword.isPending} />
            )}
          </View>
        )}
        {showPasswordReset && (
          <View style={{ gap: 8, marginTop: 8, borderTopWidth: 1, borderColor: '#e5e7eb', paddingTop: 8 }}>
            <Text style={{ fontWeight: '600' }}>Reset Password</Text>
            <TextInput style={{ borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 16 }} value={newPassword} onChangeText={setNewPassword} placeholder="New password" secureTextEntry />
            <TextInput style={{ borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 16 }} value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Confirm password" secureTextEntry />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button title="Cancel" variant="outline" onPress={() => { setShowPasswordReset(false); setNewPassword(''); setConfirmPassword(''); }} />
              <Button title="Reset" variant="danger" onPress={() => { if (newPassword && newPassword === confirmPassword) { resetPassword.mutate({ newPassword }); setShowPasswordReset(false); setNewPassword(''); setConfirmPassword(''); } else { Alert.alert("Error", "Passwords must match"); } }} disabled={resetPassword.isPending} />
            </View>
          </View>
        )}
      </View>
    </Screen>
  );
}