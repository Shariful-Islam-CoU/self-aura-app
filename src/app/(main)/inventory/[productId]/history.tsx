import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { getErrorMessage } from '@/api';
import { EmptyState, ErrorState, LoadingIndicator } from '@/components/feedback';
import { AppHeader, Screen } from '@/components/layout';
import { Text } from '@/components/ui';
import { StockMovementListSkeleton, StockMovementRow } from '@/features/inventory/components';
import { useInventoryHistory } from '@/features/inventory/queries';
import { useProductDetails } from '@/features/products/queries';
import { usePermissions } from '@/hooks/usePermissions';
import { useTheme } from '@/providers';
import { spacing } from '@/theme';

/**
 * Full stock-movement history for one product (`inventory.history`-gated).
 * The backend paginates (`page`/`limit`, 1-100) and this screen never loads
 * unbounded history: infinite scroll appends the next page, pull-to-refresh
 * reloads, and the footer spinner only appears while a page is in flight.
 * The product is fetched by ID for the header context (web parity: the
 * table caption reads "Stock movements for {name}") - no object is passed
 * through navigation.
 */
export default function InventoryHistoryScreen() {
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const { hasPermission } = usePermissions();
  const { theme } = useTheme();

  const canView = hasPermission('inventory.history');
  const productQuery = useProductDetails(canView ? productId : undefined);
  const historyQuery = useInventoryHistory(canView ? productId : undefined, canView);
  const [refreshing, setRefreshing] = useState(false);

  const movements = useMemo(
    () => (historyQuery.data?.pages ?? []).flatMap((page) => page.items),
    [historyQuery.data],
  );

  const header = (
    <AppHeader variant="feature" title="Inventory history" onBack={() => router.back()} />
  );

  if (!canView) {
    return (
      <Screen>
        {header}
        <ErrorState
          title="Access denied"
          message="You don't have permission to view stock history."
        />
      </Screen>
    );
  }

  const handleRefresh = async () => {
    if (historyQuery.isFetching) return; // never race an in-flight request
    setRefreshing(true);
    try {
      await historyQuery.refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const handleEndReached = () => {
    if (historyQuery.hasNextPage && !historyQuery.isFetching) {
      void historyQuery.fetchNextPage();
    }
  };

  let content;
  if (historyQuery.isPending && movements.length === 0) {
    content = (
      <View style={styles.padded}>
        <StockMovementListSkeleton count={4} />
      </View>
    );
  } else if (historyQuery.isError && movements.length === 0) {
    content = (
      <View style={styles.padded}>
        <ErrorState
          title="Unable to load stock movements."
          message={getErrorMessage(historyQuery.error)}
          onRetry={() => void historyQuery.refetch()}
          retryLabel="Try again"
        />
      </View>
    );
  } else {
    content = (
      <FlatList
        data={movements}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <StockMovementRow movement={item} />}
        contentContainerStyle={styles.listContent}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void handleRefresh()}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
        ListHeaderComponent={
          productQuery.data ? (
            <Text variant="bodySmall" tone="muted" style={styles.caption}>
              Stock movements for {productQuery.data.name}
            </Text>
          ) : null
        }
        ListEmptyComponent={
          <EmptyState
            icon="time-outline"
            title="No stock movements."
            description="Movements will appear here when stock is added, removed, or adjusted for this product."
          />
        }
        ListFooterComponent={
          historyQuery.hasNextPage && historyQuery.isFetchingNextPage ? (
            <View style={styles.loadingMore}>
              <LoadingIndicator label="Loading more movements..." />
            </View>
          ) : null
        }
      />
    );
  }

  return (
    <Screen scroll={false} padded={false}>
      {header}
      <View style={styles.content}>{content}</View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: spacing.lg },
  padded: { paddingTop: spacing.lg },
  listContent: {
    flexGrow: 1, // lets pull-to-refresh work on an empty list
    gap: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  caption: { marginBottom: spacing.sm },
  loadingMore: { paddingVertical: spacing.sm },
});
