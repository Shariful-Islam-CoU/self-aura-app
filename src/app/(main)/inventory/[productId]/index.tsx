import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { getErrorMessage, isApiError } from '@/api';
import { EmptyState, ErrorState } from '@/components/feedback';
import { AppHeader, Screen } from '@/components/layout';
import { Button } from '@/components/ui';
import {
  InventoryActionsSection,
  InventoryDetailsSkeleton,
  InventoryProductSection,
  InventoryStockSection,
  SectionCard,
  StockMovementListSkeleton,
  StockMovementRow,
} from '@/features/inventory/components';
import { useInventoryHistory } from '@/features/inventory/queries';
import type { StockAdjustmentMode } from '@/features/inventory/types';
import { useProductDetails } from '@/features/products/queries';
import { usePermissions } from '@/hooks/usePermissions';
import { spacing } from '@/theme';

/**
 * Inventory details for one product - the web `InventoryDetails` dialog as
 * a mobile screen. Fetched by ID only (navigation passes `productId`, never
 * a product object) and shares the `products.detail` cache with Product
 * Management, so the stock figure shown here is the same authoritative
 * value everywhere. Sections: product identity, stock summary (backend
 * numbers + display-only status badge), the three stock actions
 * (`inventory.adjust`-gated, each opening the adjustment screen - stock is
 * never edited locally), and a preview of the movement history
 * (`inventory.history`-gated) with a pass-through to the full screen.
 */
export default function InventoryDetailsScreen() {
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const { hasPermission } = usePermissions();

  const canView = hasPermission('inventory.view');
  const canAdjust = hasPermission('inventory.adjust');
  const canViewHistory = hasPermission('inventory.history');

  const productQuery = useProductDetails(canView ? productId : undefined);
  const historyQuery = useInventoryHistory(canView ? productId : undefined, canView);
  const [refreshing, setRefreshing] = useState(false);

  const product = productQuery.data;

  // Newest movements first (the backend orders the history newest-first);
  // only the first page's head is previewed - the full screen paginates.
  const recentMovements = useMemo(
    () => (historyQuery.data?.pages ?? []).flatMap((page) => page.items).slice(0, 5),
    [historyQuery.data],
  );

  const header = (
    <AppHeader variant="feature" title="Inventory details" onBack={() => router.back()} />
  );

  if (!canView) {
    return (
      <Screen>
        {header}
        <ErrorState title="Access denied" message="You don't have permission to view inventory." />
      </Screen>
    );
  }

  const handleRefresh = async () => {
    if (productQuery.isFetching || historyQuery.isFetching) return; // never race a request
    setRefreshing(true);
    try {
      await productQuery.refetch();
      if (canViewHistory) await historyQuery.refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const openAdjustment = (mode: StockAdjustmentMode) => {
    if (!productId) return;
    router.push({
      pathname: '/inventory/[productId]/adjust',
      params: { productId, mode },
    });
  };

  let content;
  if (productQuery.isPending) {
    content = <InventoryDetailsSkeleton />;
  } else if (productQuery.isError || !product) {
    const notFound = isApiError(productQuery.error) && productQuery.error.kind === 'notFound';
    content = notFound ? (
      <EmptyState
        icon="cube-outline"
        title="Product not found"
        description="This product no longer exists, so its inventory record is unavailable."
        actionLabel="Back to inventory"
        onAction={() => router.replace('/inventory')}
      />
    ) : (
      <ErrorState
        title="Unable to load inventory details."
        message={getErrorMessage(productQuery.error)}
        onRetry={() => void productQuery.refetch()}
        retryLabel="Try again"
      />
    );
  } else {
    content = (
      <View style={styles.sections}>
        <InventoryProductSection product={product} />
        <InventoryStockSection product={product} />
        <InventoryActionsSection
          product={product}
          canAdjust={canAdjust}
          onAction={openAdjustment}
        />
        {canViewHistory ? (
          <SectionCard title="Stock movement history">
            {historyQuery.isPending && recentMovements.length === 0 ? (
              <StockMovementListSkeleton count={2} />
            ) : historyQuery.isError && recentMovements.length === 0 ? (
              <ErrorState
                title="Unable to load stock movements."
                message={getErrorMessage(historyQuery.error)}
                onRetry={() => void historyQuery.refetch()}
                retryLabel="Try again"
              />
            ) : recentMovements.length === 0 ? (
              <EmptyState
                icon="time-outline"
                title="No stock movements."
                description="Movements will appear here when stock is added, removed, or adjusted for this product."
              />
            ) : (
              <View style={styles.movements}>
                {recentMovements.map((movement) => (
                  <StockMovementRow key={movement.id} movement={movement} />
                ))}
                <Button
                  title="View full history"
                  variant="outline"
                  fullWidth
                  onPress={() => {
                    if (!productId) return;
                    router.push({
                      pathname: '/inventory/[productId]/history',
                      params: { productId },
                    });
                  }}
                />
              </View>
            )}
          </SectionCard>
        ) : null}
      </View>
    );
  }

  return (
    <Screen scroll refreshControl={{ refreshing, onRefresh: () => void handleRefresh() }}>
      {header}
      {content}
    </Screen>
  );
}

const styles = StyleSheet.create({
  sections: { gap: spacing.lg },
  movements: { gap: spacing.sm },
});
