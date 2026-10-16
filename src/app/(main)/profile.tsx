import { useState, useEffect, useCallback } from 'react';
import { Linking, StyleSheet, View, Alert, ScrollView, RefreshControl, Pressable } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { router, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';

import { AppHeader, Screen } from '@/components/layout';
import { Avatar, Badge, Button, Chip, Input, Text, Switch } from '@/components/ui';
import { SectionCard, DetailRow } from '@/features/customers/components';
import { useTheme } from '@/providers/ThemeProvider';
import { useToast } from '@/providers/ToastProvider';
import { spacing, radius } from '@/theme';
import { formatDateTime } from '@/utils/format';
import { customersKeys } from '@/features/customers/queries';
import { useCustomerDetails } from '@/features/customers/queries';
import { useUpdateCustomer, useUploadCustomerAvatar, useDeleteCustomerAvatar } from '@/features/customers/queries';
import type { CustomerAddress, CustomerAddressInput } from '@/features/customers/types';

export default function ProfileScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const customerId = id || '';
  
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
  
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isGoogleAvatar, setIsGoogleAvatar] = useState(false);
  
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    facebookName: '',
    facebookProfileUrl: '',
  });
  
  const [address, setAddress] = useState<CustomerAddressInput>({
    label: 'Home',
    recipientName: '',
    phone: '',
    addressLine: '',
    area: '',
    city: '',
    postalCode: '',
    country: 'Bangladesh',
    isDefault: true,
  });

  const updateCustomerMutation = useUpdateCustomer();
  const uploadAvatarMutation = useUploadCustomerAvatar();
  const deleteAvatarMutation = useDeleteCustomerAvatar();

  const { data: customer, isLoading, error: fetchError } = useCustomerDetails(customerId);

  useEffect(() => {
    if (customer) {
      setForm({
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        facebookName: customer.facebookName || '',
        facebookProfileUrl: customer.facebookProfileUrl || '',
      });
      
      setIsGoogleAvatar(!!customer.avatarUrl && customer.avatarUrl.includes('googleusercontent.com'));
      
      if (customer.addresses?.[0]) {
        const a = customer.addresses[0];
        setAddress({
          label: a.label || 'Home',
          recipientName: a.recipientName || customer.name || '',
          phone: a.phone || customer.phone || '',
          addressLine: a.addressLine || '',
          area: a.area || '',
          city: a.city || '',
          postalCode: a.postalCode || '',
          country: a.country || 'Bangladesh',
          isDefault: a.isDefault ?? true,
        });
      }
    }
  }, [customer]);

  const pickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showError('Permission to access photos is required');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      if (asset.base64) {
        const previewUri = `data:image/jpeg;base64,${asset.base64}`;
        setAvatarPreview(previewUri);
        await uploadAvatar(asset.uri);
      }
    }
  }, [showError]);

  const uploadAvatar = async (uri: string) => {
    if (!customerId) return;
    
    setAvatarUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      const fileName = uri.split('/').pop() || 'avatar.jpg';
      const fileType = fileName.endsWith('.png') ? 'image/png' : 
                       fileName.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
      
      formData.append('avatar', {
        uri,
        name: fileName,
        type: fileType,
      } as any);

      const result = await uploadAvatarMutation.mutateAsync({
        id: customerId,
        formData,
      });

      setAvatarPreview(result.avatarUrl || null);
      setIsGoogleAvatar(false);
      
      queryClient.setQueryData(customersKeys.detail(customerId), result);
      
      success('Profile picture updated');
    } catch (err: any) {
      setError(err.message || 'Failed to upload avatar');
      showError('Failed to upload avatar');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleRemoveAvatar = () => {
    if (!customerId) return;

    Alert.alert(
      'Remove profile picture?',
      'This will delete your current profile picture. You can add a new one later.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAvatarMutation.mutateAsync({ id: customerId });
              setAvatarPreview(null);
              setIsGoogleAvatar(false);
              queryClient.setQueryData(customersKeys.detail(customerId), (old: any) => 
                old ? { ...old, avatarUrl: null } : old
              );
              success('Profile picture removed');
            } catch {
              showError('Failed to remove avatar');
            }
          },
        },
      ]
    );
  };

  const handleSubmit = async () => {
    if (!customerId) return;
    
    setSaving(true);
    setError(null);
    
    try {
      await updateCustomerMutation.mutateAsync({
        id: customerId,
        input: {
          name: form.name,
          email: form.email || undefined,
          phone: form.phone || undefined,
          facebookName: form.facebookName || undefined,
          facebookProfileUrl: form.facebookProfileUrl || undefined,
        },
      });
      
      success('Profile saved');
      setEditing(false);
    } catch (err: any) {
      setError(err.message || 'Failed to save profile');
      showError('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenFacebook = useCallback(async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      showError('Could not open Facebook profile');
    }
  }, [showError]);

  const handleCall = useCallback(async (phone: string) => {
    try {
      await Linking.openURL(`tel:${phone.replace(/[^\d+]/g, '')}`);
    } catch {
      showError('Could not open phone app');
    }
  }, [showError]);

  if (isLoading) {
    return (
      <Screen scroll={false}>
        <AppHeader variant="feature" title="Profile" onBack={() => router.back()} />
        <View style={styles.loading}>
          <Text variant="bodyMedium" tone="muted">Loading...</Text>
        </View>
      </Screen>
    );
  }

  if (fetchError) {
    return (
      <Screen scroll={false}>
        <AppHeader variant="feature" title="Profile" onBack={() => router.back()} />
        <View style={styles.error}>
          <Text variant="bodyMedium" tone="danger">
            Failed to load profile
          </Text>
          <Button
            variant="outline"
            title="Go back"
            onPress={() => router.back()}
          />
        </View>
      </Screen>
    );
  }

  if (!customer) {
    return (
      <Screen scroll={false}>
        <AppHeader variant="feature" title="Profile" onBack={() => router.back()} />
        <View style={styles.empty}>
          <Text variant="bodyMedium" tone="muted">
            No customer selected
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={{ flex: 1 }}>
      <AppHeader variant="feature" title="Profile" onBack={() => router.back()} />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => queryClient.invalidateQueries({ queryKey: customersKeys.detail(customerId || '') })}
          />
        }
      >
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <Avatar
              name={customer.name}
              source={avatarPreview || customer.avatarUrl}
              size="lg"
            />
            {editing && (
              <Button
                style={styles.avatarEditButton}
                variant="primary"
                size="sm"
                title="Change"
                onPress={pickImage}
                disabled={avatarUploading}
              />
            )}
          </View>
          
          <View style={styles.avatarActions}>
            {editing && (
              <>
                {customer.avatarUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    title="Remove"
                    onPress={handleRemoveAvatar}
                    disabled={avatarUploading || saving}
                  />
                )}
                {isGoogleAvatar && (
                  <Text variant="caption" tone="muted">
                    Current: Google profile picture
                  </Text>
                )}
              </>
            )}
          </View>
          
          <View style={styles.nameSection}>
            <Text variant="subtitle">{customer.name}</Text>
            <Text variant="bodyMedium" tone="muted">{customer.email}</Text>
          </View>
        </View>

        {/* Edit Mode Toggle */}
        <View style={styles.editToggle}>
          <Button
            variant={editing ? 'primary' : 'outline'}
            title={editing ? 'Done' : 'Edit Profile'}
            onPress={() => setEditing(!editing)}
            disabled={saving || avatarUploading}
          />
        </View>

        {/* Profile Form */}
        {editing ? (
          <View style={styles.formContainer}>
            <SectionCard title="Personal Details">
              <Input
                label="Full Name"
                value={form.name}
                onChangeText={(value) => setForm({ ...form, name: value })}
                required
                autoCapitalize="words"
                editable={!saving}
              />
              <Input
                label="Email"
                value={form.email}
                onChangeText={(value) => setForm({ ...form, email: value })}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!saving}
              />
              <Input
                label="Phone"
                value={form.phone}
                onChangeText={(value) => setForm({ ...form, phone: value })}
                keyboardType="phone-pad"
                editable={!saving}
              />
              <Input
                label="Facebook Name (Optional)"
                value={form.facebookName}
                onChangeText={(value) => setForm({ ...form, facebookName: value })}
                autoCapitalize="words"
                editable={!saving}
              />
              <Input
                label="Facebook Profile URL (Optional)"
                value={form.facebookProfileUrl}
                onChangeText={(value) => setForm({ ...form, facebookProfileUrl: value })}
                keyboardType="url"
                autoCapitalize="none"
                editable={!saving}
              />
            </SectionCard>

            <SectionCard title="Default Address">
              <Input
                label="Recipient Name"
                value={address.recipientName}
                onChangeText={(value) => setAddress({ ...address, recipientName: value })}
                autoCapitalize="words"
                editable={!saving}
              />
              <Input
                label="Recipient Phone"
                value={address.phone}
                onChangeText={(value) => setAddress({ ...address, phone: value })}
                keyboardType="phone-pad"
                editable={!saving}
              />
              <Input
                label="Address Line"
                multiline
                value={address.addressLine}
                onChangeText={(value) => setAddress({ ...address, addressLine: value })}
                editable={!saving}
              />
              <View style={styles.grid}>
                <Input
                  label="Area/Thana"
                  value={address.area}
                  onChangeText={(value) => setAddress({ ...address, area: value })}
                  autoCapitalize="words"
                  editable={!saving}
                />
                <Input
                  label="City"
                  value={address.city}
                  onChangeText={(value) => setAddress({ ...address, city: value })}
                  autoCapitalize="words"
                  editable={!saving}
                />
              </View>
              <View style={styles.grid}>
                <Input
                  label="Postal Code"
                  value={address.postalCode}
                  onChangeText={(value) => setAddress({ ...address, postalCode: value })}
                  keyboardType="numeric"
                  editable={!saving}
                />
                <Input
                  label="Country"
                  value={address.country}
                  onChangeText={(value) => setAddress({ ...address, country: value })}
                  autoCapitalize="words"
                  editable={!saving}
                />
              </View>
              <View style={styles.toggleRow}>
                <Text variant="bodyMedium">Set as default address</Text>
                <Switch
                  value={address.isDefault}
                  onValueChange={(value) => setAddress({ ...address, isDefault: value })}
                  disabled={saving}
                />
              </View>
            </SectionCard>

            {error && (
              <View style={styles.errorMessage}>
                <Text variant="bodySmall" tone="danger">{error}</Text>
              </View>
            )}

            <View style={styles.formActions}>
              <Button
                variant="primary"
                title="Save Changes"
                onPress={handleSubmit}
                loading={saving}
                disabled={saving || avatarUploading}
              />
              <Button
                variant="outline"
                title="Cancel"
                onPress={() => setEditing(false)}
                disabled={saving || avatarUploading}
              />
            </View>
          </View>
        ) : (
          <View style={styles.readOnlyContainer}>
            <SectionCard title="Personal Details">
              <DetailRow label="Name" value={customer.name} />
              <DetailRow label="Email" value={customer.email} />
              {customer.phone && (
                <DetailRow
                  label="Phone"
                  children={
                    <Pressable onPress={() => handleCall(customer.phone!)}>
                      <Text variant="bodyMedium" style={{ color: '#000' }}>
                        {customer.phone}
                      </Text>
                    </Pressable>
                  }
                />
              )}
              {customer.facebookName && <DetailRow label="Facebook Name" value={customer.facebookName} />}
              {customer.facebookProfileUrl && (
                <DetailRow
                  label="Facebook Profile"
                  children={
                    <View style={styles.callRow}>
                      <Text variant="bodyMedium" numberOfLines={1}>
                        {customer.facebookProfileUrl}
                      </Text>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Open"
                        onPress={() => handleOpenFacebook(customer.facebookProfileUrl!)}
                      />
                    </View>
                  }
                />
              )}
            </SectionCard>

            {customer.addresses.length > 0 && (
              <SectionCard title="Addresses">
                {customer.addresses.map((addr: CustomerAddress) => (
                  <AddressCard key={addr.id} address={addr} onCall={handleCall} />
                ))}
              </SectionCard>
            )}

            {(customer.tags.length > 0 || customer.notes) && (
              <SectionCard title="Notes & Tags">
                {customer.tags.length > 0 && (
                  <View style={styles.tags}>
                    {customer.tags.map((tag: string) => (
                      <Chip key={tag} label={tag} />
                    ))}
                  </View>
                )}
                {customer.notes ? (
                  <Text variant="bodySmall" tone="secondary">{customer.notes}</Text>
                ) : null}
              </SectionCard>
            )}

            <SectionCard title="Account Info">
              <DetailRow label="Customer Since" value={formatDateTime(customer.createdAt)} />
              <DetailRow label="Last Updated" value={formatDateTime(customer.updatedAt)} />
              <DetailRow
                label="Status"
                children={
                  <Badge
                    label={customer.isActive ? 'Active' : 'Inactive'}
                    tone={customer.isActive ? 'success' : 'neutral'}
                  />
                }
              />
            </SectionCard>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

// Helper components for read-only view
function AddressCard({ 
  address, 
  onCall,
}: { 
  address: CustomerAddressInput; 
  onCall?: (phone: string) => void;
}) {
  const { theme } = useTheme();
  const areaLine = [address.area, address.city].filter(Boolean).join(', ');
  const postalLine = [address.postalCode, address.country].filter(Boolean).join(', ');

  return (
    <View
      style={[
        styles.addressCard,
        { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceMuted },
      ]}
    >
      <View style={styles.addressHeader}>
        <Text variant="bodyMedium">{address.label}</Text>
        {address.isDefault && <Badge label="Default" tone="info" />}
      </View>
      {address.recipientName && <Text variant="bodyMedium">{address.recipientName}</Text>}
      <Text variant="bodySmall" tone="secondary">{address.addressLine}</Text>
      {areaLine && <Text variant="bodySmall" tone="muted">{areaLine}</Text>}
      {postalLine && <Text variant="bodySmall" tone="muted">{postalLine}</Text>}
      {address.phone && onCall && (
        <Pressable onPress={() => onCall(address.phone!)} style={styles.phoneRow}>
          <Text variant="bodySmall" tone="muted">{address.phone}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  error: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  scrollContent: {
    flex: 1,
    padding: spacing.md,
    gap: spacing.lg,
  },
  avatarSection: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarEditButton: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    backgroundColor: 'white',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  nameSection: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  editToggle: {
    paddingHorizontal: spacing.md,
  },
  formContainer: {
    gap: spacing.lg,
  },
  readOnlyContainer: {
    gap: spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorMessage: {
    padding: spacing.md,
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderRadius: radius.sm,
    marginHorizontal: spacing.md,
  },
  formActions: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  callRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexShrink: 1,
  },
  addressCard: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  phoneRow: {
    marginTop: spacing.xs,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
});