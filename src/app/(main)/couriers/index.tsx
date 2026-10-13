import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { EmptyState, ErrorState, LoadingState, Text } from '@/components/ui';
import { Screen } from '@/components/layout';
import { useAuth, useTheme } from '@/providers';
import { useCouriersInfinite } from '@/features/couriers';
import type { Courier } from '@/features/couriers/types';

export default function CouriersScreen() {
  const { theme } = useTheme();
  const { canAccess } = useAuth();
  const [search] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const canView = canAccess('couriers.view');
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, refetch } = useCouriersInfinite({}, search);
  const couriers: Courier[] = data?.pages.flatMap((p) => p.couriers) ?? [];
  const handleRefresh = useCallback(async () => { setRefreshing(true); await refetch(); setRefreshing(false); }, [refetch]);
  const handleLoadMore = useCallback(() => { if (hasNextPage && !isFetchingNextPage) void fetchNextPage(); }, [fetchNextPage, hasNextPage, isFetchingNextPage]);
  const renderItem = ({ item }: { item: Courier }) => (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <View style={styles.cardContent}>
        <Text style={[styles.title, { color: theme.colors.text }]}>{item.name}</Text>
        <Text style={[styles.meta, { color: theme.colors.textMuted }]}>{item.contactPerson ?? ''}</Text>
        {item.phone ? <Text style={[styles.meta, { color: theme.colors.textMuted }]}>Phone: {item.phone}</Text> : null}
        <Text style={[styles.status, { color: item.isActive ? theme.colors.success : theme.colors.textMuted }]}>{item.isActive ? 'Active' : 'Inactive'}</Text>
      </View>
    </View>
  );
  if (!canView) return <Screen scroll={true}><ErrorState title="Access denied" description="No permission." /></Screen>;
  if (isLoading) return <LoadingState />;
  if (isError) return <Screen scroll={true}><ErrorState title="Failed to load couriers" description="Try again." onRetry={() => refetch()} /></Screen>;
  if (couriers.length === 0) return <Screen scroll={true}><EmptyState title="No couriers found" description="No couriers yet." /></Screen>;
  return <Screen><FlatList data={couriers} renderItem={renderItem} keyExtractor={(i) => i.id} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />} onEndReached={handleLoadMore} onEndReachedThreshold={0.4} contentContainerStyle={styles.list} /></Screen>;
}
const styles = StyleSheet.create({ list:{padding:16,gap:12}, card:{borderWidth:1,borderRadius:12,overflow:'hidden'}, cardContent:{padding:16,gap:8}, title:{fontSize:16,fontWeight:'600'}, meta:{fontSize:13}, status:{fontSize:12,fontWeight:'500'} });