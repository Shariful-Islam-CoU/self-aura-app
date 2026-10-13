import { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TextInput } from 'react-native';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui';
import { Screen } from '@/components/layout';
import { useAuth } from '@/providers';
import { usePermissionsList } from '@/features/permissions';
import type { PermissionCategory } from '@/features/permissions/types';

export default function PermissionsScreen() {
  const { canAccess } = useAuth();
  const canView = canAccess('permissions.view');
  const [search, setSearch] = useState('');
  const { data, isLoading, isError, refetch } = usePermissionsList();

  if (!canView) return <Screen scroll={true}><ErrorState title="Access denied" description="No permission." /></Screen>;
  if (isLoading) return <LoadingState />;
  if (isError) return <Screen scroll={true}><ErrorState title="Failed to load permissions" description="Try again." onRetry={() => refetch()} /></Screen>;
  if (!data?.categories?.length) return <Screen scroll={true}><EmptyState title="No permissions found" description="No permissions defined." /></Screen>;

  const filteredCategories = data.categories.filter((cat: PermissionCategory) =>
    cat.module.toLowerCase().includes(search.toLowerCase()) ||
    cat.permissions.some((p) => p.key.toLowerCase().includes(search.toLowerCase()) || (p.description?.toLowerCase().includes(search.toLowerCase())))
  );

  return (
    <Screen scroll={true}>
      <ScrollView contentContainerStyle={styles.container}>
        <TextInput
          style={styles.search}
          placeholder="Search permissions..."
          value={search}
          onChangeText={setSearch}
        />
        {filteredCategories.map((category) => (
          <View key={category.module} style={styles.category}>
            <Text style={styles.categoryTitle}>{category.module}</Text>
            {category.permissions
              .filter((p) => p.key.toLowerCase().includes(search.toLowerCase()) || (p.description?.toLowerCase().includes(search.toLowerCase())))
              .map((perm) => (
                <View key={perm.key} style={styles.permissionRow}>
                  <Text style={styles.permissionKey}>{perm.key}</Text>
                  {perm.description ? <Text style={styles.permissionDesc}>{perm.description}</Text> : null}
                </View>
              ))}
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  search: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 8 },
  category: { gap: 8 },
  categoryTitle: { fontSize: 18, fontWeight: '700' as const, marginBottom: 8 },
  permissionRow: { flexDirection: 'row' as const, justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderColor: '#e5e7eb' },
  permissionKey: { fontSize: 14, fontFamily: 'monospace', fontWeight: '500' as const },
  permissionDesc: { fontSize: 13, color: '#6b7280' },
});