import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { EmptyState, ErrorState, LoadingState, Text } from '@/components/ui';
import { Screen } from '@/components/layout';
import { useAuth, useTheme } from '@/providers';
import { useRolesInfinite } from '@/features/roles';
import type { Role } from '@/features/roles/types';

export default function RolesScreen() {
  const { theme } = useTheme();
  const { canAccess } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const canView = canAccess('roles.view');
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, refetch } = useRolesInfinite({});
  const roles: Role[] = data?.pages.flatMap((p) => p.roles) ?? [];
  const handleRefresh = useCallback(async () => { setRefreshing(true); await refetch(); setRefreshing(false); }, [refetch]);
  const handleLoadMore = useCallback(() => { if (hasNextPage && !isFetchingNextPage) void fetchNextPage(); }, [fetchNextPage, hasNextPage, isFetchingNextPage]);
  const renderItem = ({ item }: { item: Role }) => (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <View style={styles.cardContent}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>{item.name}</Text>
          {item.isSystem && <Text style={[styles.badge, { backgroundColor: theme.colors.primary + '20', color: theme.colors.primaryOnSoft, fontSize: 10 }]}>System</Text>}
        </View>
        <Text style={[styles.meta, { color: theme.colors.textMuted }]}>{item.description ?? 'No description'}</Text>
        <View style={styles.badges}>
          <Text style={[styles.badge, { backgroundColor: item.isActive ? theme.colors.success + '20' : theme.colors.textDisabled + '20', color: item.isActive ? theme.colors.success : theme.colors.textDisabled }]}>{item.isActive ? 'Active' : 'Inactive'}</Text>
          <Text style={[styles.badge, { backgroundColor: theme.colors.info + '20', color: theme.colors.info }]}>{item.permissions.length} permissions</Text>
        </View>
      </View>
    </View>
  );
  if (!canView) return <Screen scroll><ErrorState title="Access denied" description="No permission." /></Screen>;
  if (isLoading) return <LoadingState />;
  if (isError) return <Screen scroll><ErrorState title="Failed to load roles" description="Try again." onRetry={() => refetch()} /></Screen>;
  if (roles.length === 0) return <Screen scroll><EmptyState title="No roles found" description="No roles yet." /></Screen>;
  return <Screen><FlatList data={roles} renderItem={renderItem} keyExtractor={(i) => i.id} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />} onEndReached={handleLoadMore} onEndReachedThreshold={0.4} contentContainerStyle={styles.list} /></Screen>;
}
const styles = StyleSheet.create({ list:{padding:16,gap:12}, card:{borderWidth:1,borderRadius:12,overflow:'hidden'}, cardContent:{padding:16,gap:8}, header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}, title:{fontSize:16,fontWeight:'600'}, meta:{fontSize:13,marginBottom:8}, badges:{flexDirection:'row',gap:8,flexWrap:'wrap',marginTop:4}, badge:{fontSize:11,fontWeight:'600',paddingHorizontal:8,paddingVertical:2,borderRadius:12,textTransform:'uppercase'} });