import { Badge, Button, Text } from '@/components/ui';
import { formatCurrency, formatDate } from '@/utils/format';
import { productStatusLabel, productStatusTone } from '../labels';
import type { Product } from '../types';
import { DetailRow, SectionCard } from './SectionCard';

/** Backend fields for one product, read-only: identity, category, status, dates. */
export function ProductOverviewSection({ product }: { product: Product }) {
  return (
    <SectionCard title="Overview">
      <DetailRow label="Name" value={product.name} />
      <DetailRow label="SKU" value={product.sku} />
      <DetailRow label="Slug" value={`/${product.slug}`} />
      <DetailRow label="Category" value={product.category.name ?? product.category.id} />
      <DetailRow label="Description" value={product.description || '—'} />
      <DetailRow label="Status">
        <Badge
          label={productStatusLabel(product.isActive)}
          tone={productStatusTone(product.isActive)}
        />
      </DetailRow>
      <DetailRow label="Created" value={formatDate(product.createdAt)} />
      <DetailRow label="Last updated" value={formatDate(product.updatedAt)} />
    </SectionCard>
  );
}

/**
 * Money section. Prices use the same centralized formatter as every other
 * screen - no second pricing engine - and the backend supplies both values on
 * every product read, so the management view shows cost + selling exactly as
 * the web table does.
 */
export function ProductPricingSection({ product }: { product: Product }) {
  return (
    <SectionCard title="Pricing">
      <DetailRow label="Cost price" value={formatCurrency(product.costPrice)} />
      <DetailRow label="Selling price" value={formatCurrency(product.sellingPrice)} emphasis />
    </SectionCard>
  );
}

export interface ProductInventorySectionProps {
  product: Product;
  /** True when the user may see the Inventory module (`inventory.view`). */
  canViewInventory: boolean;
  /** Opens the Inventory module (which owns all stock movement). */
  onOpenInventory: () => void;
}

/**
 * Inventory summary. Stock lives on the product and is shown here READ-ONLY
 * (with the backend's low-stock threshold for context) - all stock movement
 * is owned by the Inventory module, so there is no edit control and no
 * client-side stock math on this screen.
 */
export function ProductInventorySection({
  product,
  canViewInventory,
  onOpenInventory,
}: ProductInventorySectionProps) {
  return (
    <SectionCard title="Inventory">
      <DetailRow label="Stock" value={`${product.stock} units`} />
      <DetailRow label="Low stock threshold" value={`${product.lowStockThreshold} units`} />
      <Text variant="caption" tone="muted">
        Stock is managed from the Inventory module and is read-only here.
      </Text>
      {canViewInventory ? (
        <Button
          title="Manage inventory"
          variant="outline"
          icon="archive-outline"
          onPress={onOpenInventory}
          style={styles.action}
        />
      ) : null}
    </SectionCard>
  );
}

const styles = { action: { alignSelf: 'flex-start' as const } };
