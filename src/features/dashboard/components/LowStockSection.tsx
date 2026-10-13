import { StyleSheet, View } from 'react-native';

import { Badge, Card, SectionHeader, Skeleton, Text } from '@/components/ui';
import { EmptyState, ErrorState } from '@/components/feedback';
import { useTheme } from '@/providers';
import { spacing } from '@/theme';
import { formatNumber } from '@/utils/format';
import type { LowStockProduct } from '../types';

/**
 * Low-stock preview list (inventory.view-gated in the dashboard screen).
 * Purely presentational - data comes from the dashboard query.
 */
export function LowStockSection({
  products,
  isLoading,
  error,
  onRetry,
}: {
  products: LowStockProduct[] | undefined;
  isLoading: boolean;
  error?: string | null;
  onRetry?: () => void;
}) {
  const { theme } = useTheme();

  return (
    <View>
      <SectionHeader title="Low stock" subtitle="Needs attention" />
      <Card style={styles.card}>
        {error && !products ? (
          <ErrorState message={error} onRetry={onRetry} />
        ) : isLoading && !products ? (
          <Skeleton height={72} />
        ) : !products || products.length === 0 ? (
          <EmptyState
            title="Stock levels look good"
            description="No products are below their stock threshold."
          />
        ) : (
          products.slice(0, 8).map((product, index) => (
            <View
              key={product.id}
              style={[
                styles.row,
                index > 0 && {
                  borderTopWidth: StyleSheet.hairlineWidth,
                  borderTopColor: theme.colors.border,
                },
              ]}
              accessibilityLabel={`${product.name}, stock ${product.currentStock}, minimum ${product.minStockLevel}`}
            >
              <View style={styles.info}>
                <Text variant="bodyMedium" numberOfLines={1}>
                  {product.name}
                </Text>
                <Text variant="caption" tone="muted" numberOfLines={1}>
                  {product.sku}
                </Text>
              </View>
              <View style={styles.meta}>
                <Badge
                  label={
                    product.currentStock === 0
                      ? 'Out of stock'
                      : `${formatNumber(product.currentStock)} left`
                  }
                  tone={product.currentStock === 0 ? 'danger' : 'warning'}
                />
                <Text variant="caption" tone="muted">
                  min {formatNumber(product.minStockLevel)}
                </Text>
              </View>
            </View>
          ))
        )}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  info: { flex: 1, gap: 2 },
  meta: { alignItems: 'flex-end', gap: spacing.xs },
});
