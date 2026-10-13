import { useState, useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { getErrorMessage, isApiError } from '@/api';
import { Button, Input, SearchInput, Select, Text, type SelectOption } from '@/components/ui';
import { useTheme } from '@/providers';
import { radius, spacing } from '@/theme';
import type {
  CreatePurchaseInput,
  DraftPurchaseItem,
  Purchase,
  UpdatePurchaseInput,
} from '../types';
import { productService } from '@/features/products/services/productService';
import { supplierService } from '@/features/suppliers/services/supplierService';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { usePermissions } from '@/hooks/usePermissions';
import { nextDraftKey, toDraftPurchaseItem, calcDraftTotals } from '../utils/purchaseDraft';
import type { Product } from '@/features/products/types';
import { Trash2Icon } from '@/components/ui/Trash2Icon';

/**
 * Shared create/edit purchase form.
 *
 * Field rules mirror the backend's `createPurchaseSchema` /
 * `updatePurchaseSchema` (and the web app's PurchaseForm) for fast local
 * feedback - the backend re-validates everything and its response stays
 * authoritative: server field errors (`ApiError.errors`) are mapped back
 * onto the fields, anything else surfaces as a form-level message.
 * No purchase data leaves this component except through `onSubmit`.
 */

const SUPPLIER_PAGE_SIZE = 8;
const PRODUCT_PAGE_SIZE = 8;

interface PurchaseFormValues {
  supplierId: string;
  supplierLabel: string;
  items: DraftPurchaseItem[];
  additionalCost: string;
  purchaseDate: string;
  note: string;
}

interface FieldErrors {
  supplierId?: string;
  items?: string;
  additionalCost?: string;
  purchaseDate?: string;
  note?: string;
  [key: string]: string | undefined;
}

export interface PurchaseFormProps {
  mode: 'create' | 'edit';
  /** Preloaded purchase for edit - the screen only mounts the form once it is loaded. */
  initialValues?: Purchase | null;
  isSubmitting: boolean;
  onSubmit: (values: CreatePurchaseInput | UpdatePurchaseInput) => Promise<void>;
  onCancel: () => void;
}

export function PurchaseForm({
  mode,
  initialValues,
  isSubmitting,
  onSubmit,
  onCancel,
}: PurchaseFormProps) {
  const { theme } = useTheme();
  const { hasPermission } = usePermissions();
  const isEdit = mode === 'edit';

  const [supplierId] = useState(initialValues?.supplier.id ?? '');
  const [supplierLabel] = useState(initialValues?.supplier.name ?? '');
  const [supplierSearch, setSupplierSearch] = useState('');
  const debouncedSupplierSearch = useDebouncedValue(supplierSearch, 350);
  const [suppliers, setSuppliers] = useState<Array<{ id: string; name: string; phone?: string }>>(
    [],
  );
  const [supplierLoading, setSupplierLoading] = useState(false);

  const [productSearch, setProductSearch] = useState('');
  const debouncedProductSearch = useDebouncedValue(productSearch, 350);
  const [products, setProducts] = useState<Product[]>([]);
  const [productLoading, setProductLoading] = useState(false);

  const [items, setItems] = useState<DraftPurchaseItem[]>(() =>
    initialValues
      ? initialValues.items.map((item, index) => toDraftPurchaseItem(item, `edit-${index}`))
      : [],
  );
  const [additionalCost] = useState(initialValues ? String(initialValues.additionalCost) : '0');
  const [purchaseDate] = useState(
    initialValues
      ? initialValues.purchaseDate.split('T')[0]
      : new Date().toISOString().split('T')[0],
  );
  const [note] = useState(initialValues?.note ?? '');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  // Supplier search
  useEffect(() => {
    if (!debouncedSupplierSearch.trim() || !hasPermission('suppliers.view')) {
      return;
    }

    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupplierLoading(true);
    supplierService
      .listSuppliers({
        search: debouncedSupplierSearch.trim(),
        isActive: true,
        limit: SUPPLIER_PAGE_SIZE,
      })
      .then((data) => {
        if (!cancelled) setSuppliers(data.suppliers);
      })
      .catch(() => {
        if (!cancelled) setSuppliers([]);
      })
      .finally(() => {
        if (!cancelled) setSupplierLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedSupplierSearch, hasPermission]);

  // Product search (active only)
  useEffect(() => {
    if (!debouncedProductSearch.trim() || !hasPermission('products.view')) {
      return;
    }

    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProductLoading(true);
    productService
      .list({
        search: debouncedProductSearch.trim(),
        isActive: true,
        limit: PRODUCT_PAGE_SIZE,
      })
      .then((data) => {
        if (!cancelled) setProducts(data.items);
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      })
      .finally(() => {
        if (!cancelled) setProductLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedProductSearch, hasPermission]);

  const totals = useMemo(() => calcDraftTotals(items, additionalCost), [items, additionalCost]);

  const updateField = <K extends keyof PurchaseFormValues>(
    field: K,
    value: PurchaseFormValues[K],
  ) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    setFormError(null);
  };

  const [values, setValues] = useState<PurchaseFormValues>({
    supplierId,
    supplierLabel,
    items,
    additionalCost,
    purchaseDate,
    note,
  });

  // Keep values in sync with individual states
  useEffect(() => setValues((v) => ({ ...v, supplierId })), [supplierId]);
  useEffect(() => setValues((v) => ({ ...v, supplierLabel })), [supplierLabel]);
  useEffect(() => setValues((v) => ({ ...v, items })), [items]);
  useEffect(() => setValues((v) => ({ ...v, additionalCost })), [additionalCost]);
  useEffect(() => setValues((v) => ({ ...v, purchaseDate })), [purchaseDate]);
  useEffect(() => setValues((v) => ({ ...v, note })), [note]);

  const supplierOptions: SelectOption[] = useMemo(
    () => suppliers.map((s) => ({ value: s.id, label: s.name })),
    [suppliers],
  );

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};

    if (!values.supplierId) {
      errors.supplierId = 'Supplier is required';
    }

    if (values.items.length === 0) {
      errors.items = 'At least one purchase item is required';
    }

    if (values.additionalCost && Number(values.additionalCost) < 0) {
      errors.additionalCost = 'Additional cost cannot be negative';
    }

    if (!values.purchaseDate) {
      errors.purchaseDate = 'Purchase date is required';
    }

    if (values.note && values.note.length > 2000) {
      errors.note = 'Note must be at most 2000 characters';
    }

    return errors;
  };

  const handleSubmit = async () => {
    const errors = validate();
    if (
      errors.supplierId ||
      errors.items ||
      errors.additionalCost ||
      errors.purchaseDate ||
      errors.note
    ) {
      setFieldErrors(errors);
      setFormError(null);
      return;
    }

    // Build payload matching backend schema
    const payload: CreatePurchaseInput | UpdatePurchaseInput = {
      supplier: values.supplierId,
      items: values.items.map((item) => ({
        product: item.productId,
        quantity: Number(item.quantity) || 0,
        unitCost: Number(item.unitCost) || 0,
      })),
      additionalCost: Number(values.additionalCost) || 0,
      purchaseDate: values.purchaseDate,
      note: values.note.trim() || undefined,
    };

    setFormError(null);
    try {
      await onSubmit(payload);
    } catch (error) {
      if (isApiError(error) && error.errors) {
        const serverErrors = error.errors;
        const next: FieldErrors = {};
        if (serverErrors.supplier) next.supplierId = serverErrors.supplier[0];
        if (serverErrors.items) next.items = serverErrors.items[0];
        if (serverErrors.additionalCost) next.additionalCost = serverErrors.additionalCost[0];
        if (serverErrors.purchaseDate) next.purchaseDate = serverErrors.purchaseDate[0];
        if (serverErrors.note) next.note = serverErrors.note[0];
        setFieldErrors(next);
        setFormError(null);
        return;
      }
      setFormError(getErrorMessage(error));
    }
  };

  const handleAddProduct = (product: Product) => {
    setItems((prev) => [
      ...prev,
      {
        key: nextDraftKey('purchase'),
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        unitCost: product.costPrice > 0 ? String(product.costPrice) : '0',
        quantity: '1',
      },
    ]);
    setFieldErrors((prev) => ({ ...prev, items: undefined }));
  };

  const handleRemoveItem = (key: string) => {
    setItems((prev) => prev.filter((item) => item.key !== key));
  };

  const handleUnitCostChange = (key: string, value: string) => {
    setItems((prev) =>
      prev.map((item) => (item.key === key ? { ...item, unitCost: value } : item)),
    );
  };

  const handleQuantityChange = (key: string, value: string) => {
    setItems((prev) =>
      prev.map((item) => (item.key === key ? { ...item, quantity: value } : item)),
    );
  };

  return (
    <View style={styles.form}>
      <Text variant="label" tone="secondary">
        Supplier
      </Text>
      <Select
        value={supplierId}
        options={supplierOptions}
        onChange={(value) => {
          const selected = suppliers.find((s) => s.id === value);
          updateField('supplierId', value);
          updateField('supplierLabel', selected?.name ?? '');
        }}
        placeholder="Select supplier"
        error={fieldErrors.supplierId}
        disabled={isSubmitting || supplierLoading}
      />
      <SearchInput
        value={supplierSearch}
        onValueChange={setSupplierSearch}
        placeholder="Search suppliers by name or phone..."
        editable={!(isSubmitting || supplierLoading)}
        accessibilityLabel="Search active suppliers"
      />

      <Text variant="label" tone="secondary">
        Purchase Items
      </Text>
      {fieldErrors.items ? (
        <Text variant="bodySmall" tone="danger">
          {fieldErrors.items}
        </Text>
      ) : null}

      {items.length === 0 ? (
        <Text variant="bodySmall" tone="muted" style={styles.emptyItems}>
          No items yet. Search for a product below to add it.
        </Text>
      ) : (
        <View style={styles.itemsList}>
          {items.map((item) => {
            const cost = Number(item.unitCost) || 0;
            const quantity = Number(item.quantity) || 0;
            const lineTotal = cost > 0 && quantity > 0 ? cost * quantity : 0;
            return (
              <View key={item.key} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text variant="bodyMedium" numberOfLines={1}>
                    {item.productName}
                  </Text>
                  <Text variant="caption" tone="muted">
                    {item.sku}
                  </Text>
                </View>
                <View style={styles.itemInputs}>
                  <Input
                    label="Unit cost"
                    value={item.unitCost}
                    onChangeText={(text) => handleUnitCostChange(item.key, text)}
                    editable={!isSubmitting}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                  />
                  <Input
                    label="Qty"
                    value={item.quantity}
                    onChangeText={(text) => handleQuantityChange(item.key, text)}
                    editable={!isSubmitting}
                    keyboardType="numeric"
                  />
                  <Text variant="bodySmall" tone="muted" style={styles.lineTotal}>
                    {lineTotal > 0 ? `Line: ${lineTotal.toFixed(2)}` : 'Line: —'}
                  </Text>
                  <Button
                    variant="ghost"
                    size="sm"
                    title="Remove"
                    onPress={() => handleRemoveItem(item.key)}
                    disabled={isSubmitting}
                    accessibilityLabel={`Remove ${item.productName}`}
                  >
                    <Trash2Icon />
                  </Button>
                </View>
              </View>
            );
          })}
        </View>
      )}

      <View style={styles.addProductSection}>
        <SearchInput
          value={productSearch}
          onValueChange={setProductSearch}
          placeholder="Search products by name or SKU..."
          editable={!(isSubmitting || productLoading)}
          accessibilityLabel="Search active products"
          helperText="Only active products can be purchased."
        />
        {products.length > 0 && (
          <View style={styles.productResults}>
            {products
              .filter((p) => !items.some((item) => item.productId === p.id))
              .slice(0, 5)
              .map((product) => (
                <Pressable
                  key={product.id}
                  onPress={() => handleAddProduct(product)}
                  style={styles.productResultItem}
                  accessibilityLabel={`Add ${product.name}`}
                >
                  <View style={styles.productResultInfo}>
                    <Text variant="bodySmall" numberOfLines={1}>
                      {product.name}
                    </Text>
                    <Text variant="caption" tone="muted">
                      {product.sku} · Stock: {product.stock}
                    </Text>
                  </View>
                  <Text variant="bodySmall" tone="muted">
                    Cost: {product.costPrice > 0 ? product.costPrice.toFixed(2) : '—'}
                  </Text>
                </Pressable>
              ))}
            {items.some((item) => item.productId) &&
              products.every((p) => items.some((item) => item.productId === p.id)) && (
                <Text variant="caption" tone="muted" style={styles.emptyItems}>
                  All matching products are already in the purchase.
                </Text>
              )}
          </View>
        )}
      </View>

      <View style={styles.grid}>
        <Input
          label="Additional cost"
          value={additionalCost}
          onChangeText={(text) => updateField('additionalCost', text)}
          error={fieldErrors.additionalCost}
          editable={!isSubmitting}
          placeholder="0.00"
          keyboardType="decimal-pad"
        />
        <Input
          label="Purchase date"
          value={purchaseDate}
          onChangeText={(text) => updateField('purchaseDate', text)}
          error={fieldErrors.purchaseDate}
          editable={!isSubmitting}
          required
        />
      </View>

      <View style={styles.estimateSection}>
        <Text variant="label" tone="secondary">
          Estimate (backend assigns authoritative totals)
        </Text>
        <View style={styles.estimateRow}>
          <Text variant="bodySmall" tone="muted">
            Subtotal
          </Text>
          <Text variant="bodyMedium" numberOfLines={1}>
            {totals.subtotal.toFixed(2)}
          </Text>
        </View>
        <View style={styles.estimateRow}>
          <Text variant="bodySmall" tone="muted">
            Additional cost
          </Text>
          <Text variant="bodyMedium" numberOfLines={1}>
            {totals.additionalCost.toFixed(2)}
          </Text>
        </View>
        <View style={styles.estimateRowTotal}>
          <Text variant="subtitle">Total</Text>
          <Text variant="subtitle" numberOfLines={1}>
            {totals.total.toFixed(2)}
          </Text>
        </View>
      </View>

      <Input
        label="Note"
        value={note}
        onChangeText={(text) => updateField('note', text)}
        error={fieldErrors.note}
        editable={!isSubmitting}
        multiline
        numberOfLines={3}
        placeholder="Optional note (max 2000 characters)"
      />

      {formError ? (
        <View style={[styles.formError, { borderColor: theme.colors.danger }]}>
          <Text variant="bodySmall" tone="danger">
            {formError}
          </Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        <Button
          title={isEdit ? 'Save changes' : 'Create purchase'}
          fullWidth
          loading={isSubmitting}
          onPress={() => void handleSubmit()}
          accessibilityLabel={isEdit ? 'Save purchase changes' : 'Create purchase'}
        />
        <Button
          title="Cancel"
          variant="ghost"
          fullWidth
          disabled={isSubmitting}
          onPress={onCancel}
          accessibilityLabel="Discard and go back"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md, paddingBottom: spacing.xxl },
  emptyItems: { textAlign: 'center', paddingVertical: spacing.lg },
  itemsList: { gap: spacing.sm },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    gap: spacing.md,
  },
  itemInfo: { flex: 1, gap: 2 },
  itemInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  compactInput: { width: 80 },
  lineTotal: { minWidth: 80, textAlign: 'right' },
  addProductSection: { gap: spacing.sm },
  productResults: { gap: spacing.xs, maxHeight: 200 },
  productResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.sm,
  },
  productResultInfo: { flex: 1, gap: 2 },
  grid: { flexDirection: 'row', gap: spacing.sm },
  estimateSection: {
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: radius.md,
  },
  estimateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  estimateRowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.xs,
    marginTop: spacing.xs,
  },
  formError: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  actions: { gap: spacing.sm, marginTop: spacing.md },
});
