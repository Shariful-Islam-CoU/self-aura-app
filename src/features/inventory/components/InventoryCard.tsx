import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Badge, Text } from '@/components/ui';
import { useTheme } from '@/providers';
import { radius, spacing } from '@/theme';
import { getPrimaryImage, mediaImageSource } from '@/features/products/lib/media';
import { getStockStatus, stockStatusLabel, stockStatusTone } from '../labels';
import type { Product } from '../types';

export interface InventoryCardProps {
  product: Product;
  onPress: (productId: string) => void;
}

/**
 * Touch-friendly inventory row (never a desktop table): primary image,
 * name, SKU + category, then the backend-provided stock figure against its
 * threshold and the stock-status badge. Every number shown is straight from
 * the backend - the status badge only applies the documented display rule
 * (`stock <= 0` out, `stock <= lowStockThreshold` low). The whole card is
 * one accessible button whose label reads every fact the visual layout
 * shows, so screen readers get the full summary too.
 */
export function InventoryCard({ product, onPress }: InventoryCardProps) {
  const { theme } = useTheme();

  const primaryImage = getPrimaryImage(product.images);
  // A downscaled derivative for the 56pt slot - a full delivery-width image
  // per list row would make the list needlessly heavy.
  const primaryThumbUri = primaryImage ? mediaImageSource(primaryImage.url, 192) : null;
  const categoryName = product.category.name ?? 'Uncategorized';
  const status = getStockStatus(product.stock, product.lowStockThreshold);

  const label = [
    product.name,
    `${product.sku}, ${categoryName}`,
    `Stock: ${product.stock} units, minimum ${product.lowStockThreshold}`,
    stockStatusLabel(status),
  ].join(', ');

  return (
    <Pressable
      onPress={() => onPress(product.id)}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          ...(pressed && { opacity: 0.72 }),
        },
      ]}
    >
      {primaryImage && primaryThumbUri ? (
        <Image
          source={{ uri: primaryThumbUri }}
          style={[styles.image, { backgroundColor: theme.colors.surfaceMuted }]}
          accessibilityLabel={primaryImage.alt}
        />
      ) : (
        <View
          style={[
            styles.image,
            styles.imageFallback,
            { backgroundColor: theme.colors.surfaceMuted },
          ]}
        >
          <Ionicons name="cube-outline" size={24} color={theme.colors.iconMuted} />
        </View>
      )}

      <View style={styles.body}>
        <Text variant="bodyMedium" numberOfLines={1}>
          {product.name}
        </Text>
        <Text variant="caption" tone="muted" numberOfLines={1}>
          {product.sku} · {categoryName}
        </Text>
        <Text variant="caption" tone="muted" numberOfLines={1}>
          Min {product.lowStockThreshold} units
        </Text>
      </View>

      <View style={styles.side}>
        <Badge label={stockStatusLabel(status)} tone={stockStatusTone(status)} />
        <Text variant="subtitle">{product.stock} units</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  image: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
  },
  imageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  side: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
});
