import { useState } from 'react';
import { View, TextInput, ScrollView, Text } from 'react-native';
import { Button } from '@/components/ui';
import { useCreateCoupon } from '@/features/coupons';
import { useAuth } from '@/providers';
import { router } from 'expo-router';

export default function NewCouponScreen() {
  const { canAccess } = useAuth();
  const canManage = canAccess('coupons.create');
  const createCoupon = useCreateCoupon();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'percentage' | 'fixed_amount'>('percentage');
  const [value, setValue] = useState('');
  const [minimumOrderAmount, setMinimumOrderAmount] = useState('0');
  const [maximumDiscountAmount, setMaximumDiscountAmount] = useState('');
  const [usageLimit, setUsageLimit] = useState('0');
  const [usageLimitPerCustomer, setUsageLimitPerCustomer] = useState('0');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [scope, setScope] = useState<'all_products' | 'specific_products' | 'specific_categories'>('all_products');
  const [error, setError] = useState<string | null>(null);

  const validate = () => {
    if (!code.trim() || code.length < 2) return 'Coupon code must be at least 2 characters';
    if (!/^[A-Z0-9_-]+$/.test(code.toUpperCase().trim())) return 'Code can only contain uppercase letters, numbers, hyphens, underscores';
    if (!name.trim()) return 'Name is required';
    const val = parseFloat(value);
    if (isNaN(val) || val < 0) return 'Discount value must be a positive number';
    if (type === 'percentage' && (val < 1 || val > 100)) return 'Percentage must be between 1 and 100';
    if (type === 'fixed_amount' && val <= 0) return 'Fixed amount must be greater than 0';
    const minOrder = parseFloat(minimumOrderAmount);
    if (isNaN(minOrder) || minOrder < 0) return 'Minimum order amount cannot be negative';
    if (type === 'percentage' && maximumDiscountAmount) {
      const maxDisc = parseFloat(maximumDiscountAmount);
      if (isNaN(maxDisc) || maxDisc < 0) return 'Maximum discount cannot be negative';
    }
    const usage = parseInt(usageLimit);
    if (isNaN(usage) || usage < 0) return 'Usage limit cannot be negative';
    const perCustomer = parseInt(usageLimitPerCustomer);
    if (isNaN(perCustomer) || perCustomer < 0) return 'Per-customer limit cannot be negative';
    if (!startAt || !endAt) return 'Start and end dates are required';
    if (new Date(endAt) <= new Date(startAt)) return 'End date must be after start date';
    if (scope === 'specific_products') return 'Product selection not yet implemented';
    if (scope === 'specific_categories') return 'Category selection not yet implemented';
    return null;
  };

  const handleSubmit = async () => {
    if (!canManage) return;
    const err = validate();
    if (err) { setError(err); return; }
    setError(null);
    try {
      const payload = {
        code: code.toUpperCase().trim(),
        name: name.trim(),
        description: description.trim() || undefined,
        type,
        value: parseFloat(value),
        minimumOrderAmount: parseFloat(minimumOrderAmount),
        maximumDiscountAmount: maximumDiscountAmount ? parseFloat(maximumDiscountAmount) : undefined,
        usageLimit: parseInt(usageLimit),
        usageLimitPerCustomer: parseInt(usageLimitPerCustomer),
        startAt: new Date(startAt + 'T00:00:00').toISOString(),
        endAt: new Date(endAt + 'T23:59:59').toISOString(),
        isActive,
        scope,
        applicableProducts: [],
        applicableCategories: [],
        excludedProducts: [],
        excludedCategories: [],
      };
      await createCoupon.mutateAsync(payload);
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create coupon');
    }
  };

  if (!canManage) return <ScrollView contentContainerStyle={styles.container}><Text>Access denied</Text></ScrollView>;

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Create Coupon</Text>
      <Text style={styles.fieldLabel}>Code *</Text>
      <TextInput style={styles.input} value={code} onChangeText={setCode} placeholder="e.g. SUMMER20" autoCapitalize="characters" />
      <Text style={styles.fieldLabel}>Name *</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Summer Sale" />
      <Text style={styles.fieldLabel}>Description</Text>
      <TextInput style={styles.input} value={description} onChangeText={setDescription} placeholder="Optional" multiline numberOfLines={3} />
      <Text style={styles.fieldLabel}>Type *</Text>
      <View style={styles.segmented}>
        <Button title="Percentage" variant={type === 'percentage' ? 'primary' : 'outline'} onPress={() => setType('percentage')} />
        <Button title="Fixed Amount" variant={type === 'fixed_amount' ? 'primary' : 'outline'} onPress={() => setType('fixed_amount')} />
      </View>
      <Text style={styles.fieldLabel}>Value * {type === 'percentage' ? '(%)' : ''}</Text>
      <TextInput style={styles.input} value={value} onChangeText={setValue} placeholder={type === 'percentage' ? '10' : '100'} keyboardType="numeric" />
      {type === 'percentage' && (
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Max Discount Amount</Text>
          <TextInput style={styles.input} value={maximumDiscountAmount} onChangeText={setMaximumDiscountAmount} placeholder="Optional" keyboardType="numeric" />
        </View>
      )}
      <Text style={styles.fieldLabel}>Min Order Amount</Text>
      <TextInput style={styles.input} value={minimumOrderAmount} onChangeText={setMinimumOrderAmount} placeholder="0" keyboardType="numeric" />
      <Text style={styles.fieldLabel}>Total Usage Limit (0 = unlimited)</Text>
      <TextInput style={styles.input} value={usageLimit} onChangeText={setUsageLimit} placeholder="0" keyboardType="numeric" />
      <Text style={styles.fieldLabel}>Per Customer Limit (0 = unlimited)</Text>
      <TextInput style={styles.input} value={usageLimitPerCustomer} onChangeText={setUsageLimitPerCustomer} placeholder="0" keyboardType="numeric" />
      <Text style={styles.fieldLabel}>Start Date *</Text>
      <TextInput style={styles.input} value={startAt} onChangeText={setStartAt} placeholder="YYYY-MM-DD" editable={false} />
      <Text style={styles.fieldLabel}>End Date *</Text>
      <TextInput style={styles.input} value={endAt} onChangeText={setEndAt} placeholder="YYYY-MM-DD" editable={false} />
      <Text style={styles.fieldLabel}>Active</Text>
      <Button title={isActive ? 'Yes' : 'No'} variant={isActive ? 'primary' : 'outline'} onPress={() => setIsActive(!isActive)} />
      <Text style={styles.fieldLabel}>Scope</Text>
      <View style={styles.segmented}>
        <Button title="All Products" variant={scope === 'all_products' ? 'primary' : 'outline'} onPress={() => setScope('all_products')} />
        <Button title="Specific Products" variant={scope === 'specific_products' ? 'primary' : 'outline'} onPress={() => setScope('specific_products')} />
        <Button title="Specific Categories" variant={scope === 'specific_categories' ? 'primary' : 'outline'} onPress={() => setScope('specific_categories')} />
      </View>
      {scope !== 'all_products' && <Text style={styles.warning}>Product/Category selection to be implemented via picker modal</Text>}
      {error && <Text style={styles.error}>{error}</Text>}
      <Button title={createCoupon.isPending ? 'Creating...' : 'Create Coupon'} onPress={handleSubmit} disabled={createCoupon.isPending || !canManage} />
    </ScrollView>
  );
}

const styles = {
  container: { padding: 16, gap: 16 },
  title: { fontSize: 24, fontWeight: '700' as const, marginBottom: 8 },
  fieldLabel: { fontSize: 14, fontWeight: '500' as const, marginTop: 8 },
  field: { gap: 8 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 16 },
  segmented: { flexDirection: 'row' as const, gap: 8 },
  warning: { fontSize: 12, color: '#f59e0b' },
  error: { color: '#ef4444', fontSize: 14 },
};