import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { EmptyState, ErrorState, LoadingState, Text } from '@/components/ui';
import { Screen } from '@/components/layout';
import { useAuth, useTheme } from '@/providers';
import { useReviewsInfinite } from '@/features/reviews';
import type { Review } from '@/features/reviews/types';

export default function ReviewsScreen() {
  const { theme } = useTheme();
  const { canAccess } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const canView = canAccess('reviews.view');
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, refetch } = useReviewsInfinite({});
  const reviews: Review[] = data?.pages.flatMap((p) => p.reviews) ?? [];
  const handleRefresh = useCallback(async () => { setRefreshing(true); await refetch(); setRefreshing(false); }, [refetch]);
  const handleLoadMore = useCallback(() => { if (hasNextPage && !isFetchingNextPage) void fetchNextPage(); }, [fetchNextPage, hasNextPage, isFetchingNextPage]);
  const renderItem = ({ item }: { item: Review }) => (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <View style={styles.cardContent}>
        <View style={styles.header}>
          <View style={styles.stars}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Text key={i} style={[styles.star, { color: i < item.rating ? theme.colors.warning : theme.colors.border }]}>★</Text>
            ))}
          </View>
          <Text style={[styles.status, { color: item.status === 'approved' ? theme.colors.success : item.status === 'rejected' ? theme.colors.danger : theme.colors.warning }]}>{item.status}</Text>
        </View>
        <Text style={[styles.title, { color: theme.colors.text }]}>{item.comment.substring(0, 80)}{item.comment.length > 80 ? '...' : ''}</Text>
        <Text style={[styles.meta, { color: theme.colors.textMuted }]}>{item.product.name ?? 'Product'} · {item.customer.name ?? 'Customer'}</Text>
        <Text style={[styles.meta, { color: theme.colors.textMuted }]}>{new Date(item.createdAt).toLocaleDateString()}</Text>
      </View>
    </View>
  );
  if (!canView) return <Screen scroll><ErrorState title="Access denied" description="No permission." /></Screen>;
  if (isLoading) return <LoadingState />;
  if (isError) return <Screen scroll><ErrorState title="Failed to load reviews" description="Try again." onRetry={() => refetch()} /></Screen>;
  if (reviews.length === 0) return <Screen scroll><EmptyState title="No reviews found" description="No reviews yet." /></Screen>;
  return <Screen><FlatList data={reviews} renderItem={renderItem} keyExtractor={(i) => i.id} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />} onEndReached={handleLoadMore} onEndReachedThreshold={0.4} contentContainerStyle={styles.list} /></Screen>;
}
const styles = StyleSheet.create({ list:{padding:16,gap:12}, card:{borderWidth:1,borderRadius:12,overflow:'hidden'}, cardContent:{padding:16,gap:8}, header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}, stars:{flexDirection:'row',gap:2}, star:{fontSize:16}, status:{fontSize:11,fontWeight:'600',textTransform:'uppercase'}, title:{fontSize:14}, meta:{fontSize:12} });