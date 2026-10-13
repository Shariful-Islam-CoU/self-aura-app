import { useLocalSearchParams } from 'expo-router';
import { View, TextInput, Alert, StyleSheet } from 'react-native';
import { Screen } from '@/components/layout';
import { LoadingState, ErrorState, EmptyState, Text, Button } from '@/components/ui';
import { useCouponDetails, useToggleCouponStatus, useDeleteCoupon } from '@/features/coupons';
import { useAuth } from '@/providers';

export default function CouponDetailsScreen() {
  const { couponId } = useLocalSearchParams<{ couponId: string }>();
  const id = couponId ?? '';
  const { data, isLoading, isError, refetch } = useCouponDetails(id);
  const { canAccess } = useAuth();
  const canManage = canAccess('coupons.edit') || canAccess('coupons.delete');

  const toggle = useToggleCouponStatus(id);
  const deleteCoupon = useDeleteCoupon(id);

  if (!id) return <Screen scroll={true}><ErrorState title="Missing ID" description="Invalid route." /></Screen>;
  if (isLoading) return <LoadingState />;
  if (isError) return <Screen scroll={true}><ErrorState title="Failed to load coupon" description="Try again." onRetry={() => refetch()} /></Screen>;
  if (!data) return <Screen scroll={true}><EmptyState title="Not found" description="Coupon not found." /></Screen>;

  return (
    <Screen scroll={true}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={{ fontSize: 20, fontWeight: '700' }}>{data.code}</Text>
          {data.isSystem && <Text style={styles.systemBadge}>System Coupon</Text>}
        </View>
        <Text>Active: {data.isActive ? 'Yes' : 'No'}</Text>
        <Text>Created: {new Date(data.createdAt).toLocaleString()}</Text>
        <Text>Updated: {new Date(data.updatedAt).toLocaleString()}</Text>

        {canManage && !data.isSystem && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Edit Coupon</Text>
            <TextInput
              style={styles.input}
              value={data.description}
              onChangeText={(_) => {}}
              placeholder="Description"
              multiline
              numberOfLines={3}
              defaultValue={data.description}
            />
            <View style={styles.row}>
              <Text style={styles.fieldLabel}>Active</Text>
              <Button title={data.isActive ? 'Yes' : 'No'} variant={data.isActive ? 'primary' : 'outline'} onPress={() => toggle.mutate({ isActive: !data.isActive })} disabled={toggle.isPending} />
            </View>
            <Button title="Update" variant="primary" onPress={() => {}} disabled />
          </View>
        )}

        {canManage && !data.isSystem && (
          <View style={styles.section}>
            <Text style={{ fontWeight: '600' }}>Permissions</Text>
            <TextInput
              style={[styles.input, {fontFamily: 'monospace'}]}
              value={JSON.stringify(data.permissions, null, 2)}
              onChangeText={(_) => { try { } catch {} }}
              placeholder='JSON array of permission keys'
              multiline
              numberOfLines={5}
              defaultValue={JSON.stringify(data.permissions, null, 2)}
            />
            <Button title='Update Permissions' variant='outline' onPress={() => {}} disabled />
          </View>
        )}

        {canManage && !data.isSystem && (
          <Button title="Delete Coupon" variant="danger" onPress={() => { Alert.alert("Delete Coupon", `Delete ${data.code}?`, [{ text: "Cancel", style: "cancel" }, { text: "Delete", onPress: () => deleteCoupon.mutate(), style: "destructive" }]); }} disabled={deleteCoupon.isPending} style={{ marginTop: 16 }} />
        )}
        {data.isSystem && <Text style={{ color: '#6b7280', marginTop: 16 }}>System coupons cannot be deleted or have permissions modified.</Text>}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  systemBadge: { fontSize: 11, fontWeight: '700', backgroundColor: '#dbeafe', color: '#1e40af', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  section: { gap: 8, marginTop: 8, borderTopWidth: 1, borderColor: '#e5e7eb', paddingTop: 8 },
  sectionTitle: { fontWeight: '600', marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fieldLabel: { fontSize: 14, fontWeight: '500', marginTop: 8 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 16 },
});