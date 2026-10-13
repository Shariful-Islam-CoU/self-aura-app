import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { EmptyState, ErrorState, LoadingState, Text } from '@/components/ui';
import { Screen } from '@/components/layout';
import { useAuth, useTheme } from '@/providers';
import { useUsersInfinite } from '@/features/users';
import type { User } from '@/features/users/types';

export default function UsersScreen() {
  const { theme } = useTheme();
  const { canAccess } = useAuth();
  const [search] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const canView = canAccess('users.view');
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, refetch } = useUsersInfinite({ search });
  const users: User[] = data?.pages.flatMap((p) => p.users) ?? [];
  const handleRefresh = useCallback(async () => { setRefreshing(true); await refetch(); setRefreshing(false); }, [refetch]);
  const handleLoadMore = useCallback(() => { if (hasNextPage && !isFetchingNextPage) void fetchNextPage(); }, [fetchNextPage, hasNextPage, isFetchingNextPage]);
  const renderItem = ({ item }: { item: User }) => (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <View style={styles.cardContent}>
        <Text style={[styles.title, { color: theme.colors.text }]}>{item.name}</Text>
        <Text style={[styles.meta, { color: theme.colors.textMuted }]}>@{item.username}</Text>
        <View style={styles.badges}>
          <Text style={[styles.badge, { backgroundColor: item.status === 'active' ? theme.colors.success + '20' : item.status === 'pending' ? theme.colors.warning + '20' : item.status === 'rejected' ? theme.colors.danger + '20' : theme.colors.textDisabled + '20', color: item.status === 'active' ? theme.colors.success : item.status === 'pending' ? theme.colors.warning : item.status === 'rejected' ? theme.colors.danger : theme.colors.textDisabled }]}>{item.status}</Text>
          <Text style={[styles.badge, { backgroundColor: theme.colors.primary + '20', color: theme.colors.primaryOnSoft }]}>{item.role}</Text>
        </View>
      </View>
    </View>
  );
  if (!canView) return <Screen scroll><ErrorState title="Access denied" description="No permission." /></Screen>;
  if (isLoading) return <LoadingState />;
  if (isError) return <Screen scroll><ErrorState title="Failed to load users" description="Try again." onRetry={() => refetch()} /></Screen>;
  if (users.length === 0) return <Screen scroll><EmptyState title="No users found" description="No users yet." /></Screen>;
  return <Screen><FlatList data={users} renderItem={renderItem} keyExtractor={(i) => i.id} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />} onEndReached={handleLoadMore} onEndReachedThreshold={0.4} contentContainerStyle={styles.list} /></Screen>;
}
const styles = StyleSheet.create({ list:{padding:16,gap:12}, card:{borderWidth:1,borderRadius:12,overflow:'hidden'}, cardContent:{padding:16,gap:8}, title:{fontSize:16,fontWeight:'600'}, meta:{fontSize:13}, badges:{flexDirection:'row',gap:8,flexWrap:'wrap',marginTop:4}, badge:{fontSize:11,fontWeight:'600',paddingHorizontal:8,paddingVertical:2,borderRadius:12,textTransform:'uppercase'} });