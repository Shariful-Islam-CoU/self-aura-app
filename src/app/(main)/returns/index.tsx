import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { EmptyState, ErrorState, LoadingState, Text } from '@/components/ui';
import { Screen } from '@/components/layout';
import { useAuth, useTheme } from '@/providers';
import { useReturnsInfinite } from '@/features/returns';
import type { Return } from '@/features/returns/types';

export default function ReturnsScreen() {
  const { theme } = useTheme();
  const { canAccess } = useAuth();
  const [search] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const canView = canAccess('returns.view');
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, refetch } = useReturnsInfinite({}, search);
  const returns: Return[] = data?.pages.flatMap((p) => p.returns) ?? [];
  const handleRefresh = useCallback(async () => { setRefreshing(true); await refetch(); setRefreshing(false); }, [refetch]);
  const handleLoadMore = useCallback(() => { if (hasNextPage && !isFetchingNextPage) void fetchNextPage(); }, [fetchNextPage, hasNextPage, isFetchingNextPage]);
  const renderItem = ({ item }: { item: Return }) => (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <View style={styles.cardContent}>
        <Text style={[styles.title, { color: theme.colors.text }]}>{item.returnNumber}</Text>
        <Text style={[styles.meta, { color: theme.colors.textMuted }]}>Order: {item.order.orderNumber ?? item.order.id}</Text>
        <Text style={[styles.meta, { color: theme.colors.textMuted }]}>Status: {item.status} | Refund: {item.refundStatus}</Text>
        <Text style={[styles.meta, { color: theme.colors.textMuted }]}>Amount: {item.refundAmount}</Text>
      </View>
    </View>
  );
  if (!canView) return <Screen scroll={true}><ErrorState title="Access denied" description="No permission." /></Screen>;
  if (isLoading) return <LoadingState />;
  if (isError) return <Screen scroll={true}><ErrorState title="Failed to load returns" description="Try again." onRetry={() => refetch()} /></Screen>;
  if (returns.length === 0) return <Screen scroll={true}><EmptyState title="No returns found" description="No returns yet." /></Screen>;
  return <Screen><FlatList data={returns} renderItem={renderItem} keyExtractor={(i) => i.id} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />} onEndReached={handleLoadMore} onEndReachedThreshold={0.4} contentContainerStyle={styles.list} /></Screen>;
}
const styles = StyleSheet.create({ list:{padding:16,gap:12}, card:{borderWidth:1,borderRadius:12,overflow:'hidden'}, cardContent:{padding:16,gap:8}, title:{fontSize:16,fontWeight:'600'}, meta:{fontSize:13}, status:{fontSize:12,fontWeight:'500'} });