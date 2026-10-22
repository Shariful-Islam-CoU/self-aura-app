import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { getErrorMessage } from '@/api';
import { EmptyState, ErrorState, LoadingIndicator } from '@/components/feedback';
import { BottomSheet, Button, Card, IconButton, Input, SearchInput, Text } from '@/components/ui';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useTheme } from '@/providers';
import { radius, spacing } from '@/theme';
import type { Product } from '@/features/products/types';
import { formatCurrency } from '@/utils/format';

import { useOrderProductLookup } from '../queries';
import type { DraftOrderItem, PublicDeliveryRule } from '../types';

/** The backend's `itemsSchema` limit (`createOrderSchema`). */
const MAX_ITEMS = 50;

let itemKeyCounter = 0;
const nextItemKey = (): string => `order-item-${++itemKeyCounter}`;

export interface OrderItemsEditorProps {
  items: DraftOrderItem[];
  /** Form-level items message (missing items, duplicates, server error). */
  itemsError?: string | null;
  /** Per-line quantity messages, keyed by the draft item key. */
  itemErrors?: Record<string, string | undefined>;
  onItemsChange: (items: DraftOrderItem[]) => void;
  /**
   * The delivery rule currently selected in the form. Its price is added to
   * the items subtotal in the estimate block - a display hint only; the
   * backend recomputes the authoritative charge from the rule at creation.
   */
  deliveryRule?: PublicDeliveryRule | null;
  disabled?: boolean;
}

/**
 * Line-items editor for the create-order form: a searchable product
 * bottom sheet (server-side search over `GET /products`, active only),
 * quantity fields and remove buttons. Prices shown are display hints read
 * from the product record - the backend recomputes authoritative pricing,
 * so nothing here is trusted or sent beyond `{ product, quantity }`.
 */
export function OrderItemsEditor({
  items,
  itemsError,
  itemErrors,
  onItemsChange,
  deliveryRule = null,
  disabled = false,
}: OrderItemsEditorProps) {
  const { theme } = useTheme();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [limitError, setLimitError] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(search, 400);

  const productsQuery = useOrderProductLookup(debouncedSearch, pickerOpen);
  const products = productsQuery.data ?? [];

  const selectedIds = useMemo(() => new Set(items.map((item) => item.productId)), [items]);

  // Display-only estimate; the server owns the real totals.
  const subtotal = useMemo(
    () =>
      items.reduce((sum, item) => {
        const quantity = Number(item.quantity);
        return sum + (Number.isFinite(quantity) && quantity > 0 ? item.unitPrice * quantity : 0);
      }, 0),
    [items],
  );

  const handleAdd = (product: Product) => {
    if (selectedIds.has(product.id)) return;
    if (items.length >= MAX_ITEMS) {
      setLimitError('An order may have at most 50 line items');
      return;
    }
    setLimitError(null);
    onItemsChange([
      ...items,
      {
        key: nextItemKey(),
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        unitPrice: product.sellingPrice,
        stock: product.stock,
        quantity: '1',
      },
    ]);
    setSearch('');
    setPickerOpen(false);
  };

  const handleRemove = (key: string) => {
    setLimitError(null);
    onItemsChange(items.filter((item) => item.key !== key));
  };

  const handleQuantityChange = (key: string, quantity: string) => {
    onItemsChange(items.map((item) => (item.key === key ? { ...item, quantity } : item)));
  };

  const closePicker = () => {
    setPickerOpen(false);
    setSearch('');
  };

  return (
    <View style={styles.container}>
      <Button
        title="Add product"
        variant="outline"
        icon="add-outline"
        onPress={() => setPickerOpen(true)}
        disabled={disabled}
        fullWidth
      />

      {items.length === 0 && !itemsError ? (
        <Text variant="caption" tone="muted">
          Add at least one product to the order.
        </Text>
      ) : null}

      {items.map((item) => {
        const quantity = Number(item.quantity);
        const lineTotal =
          Number.isFinite(quantity) && quantity > 0 ? item.unitPrice * quantity : null;
        return (
          <Card key={item.key} style={styles.itemCard}>
            <View style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text variant="bodyMedium" numberOfLines={2}>
                  {item.productName}
                </Text>
                <Text variant="caption" tone="muted" numberOfLines={1}>
                  {item.sku} · {formatCurrency(item.unitPrice)}
                </Text>
                <Text
                  variant="caption"
                  tone={item.stock > 0 ? 'muted' : 'danger'}
                  accessibilityLabel={`Stock ${item.stock}`}
                >
                  Stock: {item.stock}
                </Text>
              </View>
              <View style={styles.qtyWrap}>
                <Input
                  label="Qty"
                  required
                  value={item.quantity}
                  onChangeText={(text) => handleQuantityChange(item.key, text)}
                  error={itemErrors?.[item.key]}
                  editable={!disabled}
                  keyboardType="number-pad"
                  maxLength={4}
                  accessibilityLabel={`Quantity for ${item.productName}`}
                />
              </View>
              <IconButton
                icon="trash-outline"
                accessibilityLabel={`Remove ${item.productName}`}
                onPress={() => handleRemove(item.key)}
                color={theme.colors.danger}
                disabled={disabled}
                style={styles.removeButton}
              />
            </View>
            {lineTotal !== null ? (
              <Text variant="caption" tone="muted" align="right">
                Line estimate: {formatCurrency(lineTotal)}
              </Text>
            ) : null}
          </Card>
        );
      })}

      {limitError ? (
        <Text variant="bodySmall" tone="danger" accessibilityLiveRegion="polite">
          {limitError}
        </Text>
      ) : null}
      {itemsError ? (
        <Text variant="bodySmall" tone="danger" accessibilityLiveRegion="polite">
          {itemsError}
        </Text>
      ) : null}

      <View style={[styles.summary, { backgroundColor: theme.colors.surfaceMuted }]}>
        <View style={styles.summaryRow}>
          <Text variant="bodySmall" tone="muted">
            Items subtotal (estimate)
          </Text>
          <Text variant="subtitle">{formatCurrency(subtotal)}</Text>
        </View>
        {deliveryRule ? (
          <>
            <View style={styles.summaryRow}>
              <View style={styles.summaryLabel}>
                <Text variant="bodySmall" tone="muted">
                  Delivery charge
                </Text>
                <Text variant="caption" tone="muted">
                  {deliveryRule.name} · {deliveryRule.estimatedMinDays}–
                  {deliveryRule.estimatedMaxDays} days
                </Text>
              </View>
              <Text
                variant="subtitle"
                tone={deliveryRule.price === 0 ? 'success' : 'default'}
              >
                {deliveryRule.price === 0 ? 'FREE' : formatCurrency(deliveryRule.price)}
              </Text>
            </View>
            <View
              style={[
                styles.summaryRow,
                styles.totalRow,
                { borderTopColor: theme.colors.border },
              ]}
            >
              <Text variant="bodyMedium">Estimated total</Text>
              <Text variant="subtitle">{formatCurrency(subtotal + deliveryRule.price)}</Text>
            </View>
          </>
        ) : null}
        <Text variant="caption" tone="muted">
          {deliveryRule
            ? 'Coupon discount and the final total are recalculated by the server when the order is created.'
            : 'Delivery charge, coupon discount and the final total are calculated by the server when the order is created.'}
        </Text>
      </View>

      <BottomSheet visible={pickerOpen} onClose={closePicker} title="Add product">
        <View style={styles.searchWrap}>
          <SearchInput
            value={search}
            onValueChange={setSearch}
            placeholder="Search name or SKU"
            accessibilityLabel="Search products by name or SKU"
          />
        </View>

        {productsQuery.isPending ? (
          <LoadingIndicator label="Loading products..." />
        ) : productsQuery.isError ? (
          <ErrorState
            title="Failed to load products"
            message={getErrorMessage(productsQuery.error)}
            onRetry={() => void productsQuery.refetch()}
            retryLabel="Retry"
          />
        ) : products.length === 0 ? (
          <EmptyState
            icon="cube-outline"
            title="No active products found"
            description={
              debouncedSearch.trim()
                ? 'No active product matches that search. Try a different term.'
                : 'Add the product in the Products module first.'
            }
          />
        ) : (
          <FlatList
            data={products}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            style={styles.list}
            renderItem={({ item }) => {
              const added = selectedIds.has(item.id);
              return (
                <Pressable
                  onPress={() => handleAdd(item)}
                  disabled={added}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.name}, SKU ${item.sku}, ${formatCurrency(item.sellingPrice)}, stock ${item.stock}${added ? ', already added' : ''}`}
                  style={({ pressed }) => [
                    styles.option,
                    {
                      borderBottomColor: theme.colors.border,
                      backgroundColor: added ? theme.colors.primarySoft : 'transparent',
                    },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <View style={styles.optionBody}>
                    <Text variant="bodyMedium" numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text variant="caption" tone="muted" numberOfLines={1}>
                      {item.sku} · {formatCurrency(item.sellingPrice)} · Stock: {item.stock}
                    </Text>
                  </View>
                  {added ? (
                    <View style={styles.addedTag}>
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={theme.colors.primary}
                      />
                      <Text variant="caption" tone="primary">
                        Added
                      </Text>
                    </View>
                  ) : (
                    <Ionicons name="add-circle-outline" size={22} color={theme.colors.iconMuted} />
                  )}
                </Pressable>
              );
            }}
          />
        )}
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  itemCard: { gap: spacing.sm },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  itemInfo: { flex: 1, gap: 2 },
  qtyWrap: { width: 84 },
  removeButton: { marginTop: 20 },
  summary: {
    gap: spacing.xs,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  summaryLabel: { flex: 1, gap: 2 },
  totalRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.xs,
    marginTop: spacing.xs,
  },
  searchWrap: { paddingBottom: spacing.sm },
  list: { maxHeight: 380 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 48,
  },
  optionBody: { flex: 1, gap: 2 },
  addedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
});
