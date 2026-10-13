import { Image, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Badge, Button, Text } from '@/components/ui';
import { useTheme } from '@/providers';
import { radius, spacing } from '@/theme';
import { getPrimaryImage, mediaImageSource } from '@/features/products/lib/media';
import { productStatusLabel, productStatusTone } from '@/features/products/labels';
import { formatCurrency, formatDateTime } from '@/utils/format';
import { stockStatusFromProduct } from '../labels';
import type { Product, StockAdjustmentMode } from '../types';
import { DetailRow, SectionCard } from './SectionCard';

/**
 * Product identity for the inventory details screen: primary image, name,
 * SKU and category - the same context the web `InventoryDetails` dialog
 * shows in its header.
 */
export function InventoryProductSection({ product }: { product: Product }) {
  const { theme } = useTheme();
  const primaryImage = getPrimaryImage(product.images);
  const thumbUri = primaryImage ? mediaImageSource(primaryImage.url, 360) : null;

  return (
    <SectionCard title="Product">
      <View style={styles.identity}>
        {primaryImage && thumbUri ? (
          <Image
            source={{ uri: thumbUri }}
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
            <Ionicons name="cube-outline" size={32} color={theme.colors.iconMuted} />
          </View>
        )}
        <View style={styles.identityText}>
          <Text variant="subtitle" numberOfLines={2}>
            {product.name}
          </Text>
          <Text variant="caption" tone="muted">
            SKU: {product.sku}
          </Text>
          <Text variant="caption" tone="muted">
            {product.category.name ?? 'Uncategorized'}
          </Text>
        </View>
      </View>
      <DetailRow label="Status">
        <Badge
          label={productStatusLabel(product.isActive)}
          tone={productStatusTone(product.isActive)}
        />
      </DetailRow>
    </SectionCard>
  );
}

/**
 * Stock summary: every figure is a backend field displayed as-is (stock,
 * threshold, prices, last-updated) plus the display-only status badge. No
 * available/reserved math exists on this backend, so none is invented.
 */
export function InventoryStockSection({ product }: { product: Product }) {
  const status = stockStatusFromProduct(product.stock, product.lowStockThreshold);
  return (
    <SectionCard title="Stock summary">
      <DetailRow label="Current stock" value={`${product.stock} units`} emphasis />
      <DetailRow label="Stock status">
        <Badge label={status.label} tone={status.tone} />
      </DetailRow>
      <DetailRow label="Low stock threshold" value={`${product.lowStockThreshold} units`} />
      <DetailRow label="Cost price" value={formatCurrency(product.costPrice)} />
      <DetailRow label="Selling price" value={formatCurrency(product.sellingPrice)} />
      <DetailRow label="Last updated" value={formatDateTime(product.updatedAt)} />
    </SectionCard>
  );
}

export interface InventoryActionsSectionProps {
  product: Product;
  /** True when the user may adjust stock (`inventory.adjust`). */
  canAdjust: boolean;
  onAction: (mode: StockAdjustmentMode) => void;
}

/**
 * The three backend stock operations as separate buttons (web parity: the
 * row menu offers add/remove/adjust, the details dialog offers adjust).
 * Nothing here edits `product.stock` directly - each action opens the
 * adjustment screen that submits the backend operation.
 */
export function InventoryActionsSection({
  product,
  canAdjust,
  onAction,
}: InventoryActionsSectionProps) {
  if (!canAdjust) return null;
  return (
    <SectionCard title="Actions">
      <Button
        title="Add stock"
        variant="outline"
        icon="add-circle-outline"
        fullWidth
        onPress={() => onAction('add')}
        accessibilityLabel={`Add stock to ${product.name}`}
      />
      <Button
        title="Remove stock"
        variant="outline"
        icon="remove-circle-outline"
        fullWidth
        onPress={() => onAction('remove')}
        accessibilityLabel={`Remove stock from ${product.name}`}
      />
      <Button
        title="Adjust stock"
        variant="outline"
        icon="options-outline"
        fullWidth
        onPress={() => onAction('adjust')}
        accessibilityLabel={`Set an exact stock level for ${product.name}`}
      />
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  identityText: { flex: 1, gap: 2, minWidth: 0 },
  image: { width: 72, height: 72, borderRadius: radius.md },
  imageFallback: { alignItems: 'center', justifyContent: 'center' },
});
