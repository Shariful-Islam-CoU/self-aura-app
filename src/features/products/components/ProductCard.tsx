import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Badge, Text } from '@/components/ui';
import { useTheme } from '@/providers';
import { radius, spacing } from '@/theme';
import { formatCurrency } from '@/utils/format';
import { productStatusLabel, productStatusTone } from '../labels';
import { getPrimaryImage, mediaImageSource } from '../lib/media';
import type { Product } from '../types';

export interface ProductCardProps {
  product: Product;
  onPress: (productId: string) => void;
}

/**
 * Touch-friendly product row for the list (never a desktop table): primary
 * image, name, SKU + category, the backend-provided stock figure and then
 * cost/selling prices beside the status badge. Only backend fields are shown
 * - the product model has no margin or discount, so none are invented here.
 * The whole card is one accessible button whose label reads every fact the
 * visual layout shows, so screen readers get the full summary too.
 */
export function ProductCard({ product, onPress }: ProductCardProps) {
  const { theme } = useTheme();

  const primaryImage = getPrimaryImage(product.images);
  // A downscaled derivative for the 56pt slot - a full delivery-width image
  // per list row would make the list needlessly heavy (and a legacy relative
  // URL is reconciled against the API origin rather than rendered broken).
  const primaryThumbUri = primaryImage ? mediaImageSource(primaryImage.url, 192) : null;
  const categoryName = product.category.name ?? 'Uncategorized';

  const label = [
    product.name,
    `${product.sku}, ${categoryName}`,
    `Cost ${formatCurrency(product.costPrice)}`,
    `Selling price ${formatCurrency(product.sellingPrice)}`,
    `In stock: ${product.stock}`,
    productStatusLabel(product.isActive),
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
          In stock: {product.stock}
        </Text>
      </View>

      <View style={styles.side}>
        <Badge
          label={productStatusLabel(product.isActive)}
          tone={productStatusTone(product.isActive)}
        />
        <Text variant="subtitle">{formatCurrency(product.sellingPrice)}</Text>
        <Text variant="caption" tone="muted">
          Cost {formatCurrency(product.costPrice)}
        </Text>
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
    gap: 2,
  },
});
