import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { getErrorMessage, isApiError } from '@/api';
import { Button, Input, Select, type SelectOption, Text } from '@/components/ui';
import { useCategoriesList } from '@/features/categories/queries';
import { useTheme } from '@/providers';
import { spacing } from '@/theme';
import type { CreateProductInput, Product, UpdateProductInput } from '../types';

/**
 * Shared create/edit product form.
 *
 * Only fields the backend actually accepts are present: name, SKU, category,
 * description and the two prices; on edit `isActive` (the status select the
 * web app shows) joins them. Missing by design: the slug (server-generated),
 * stock / lowStockThreshold (inventory-owned, read-only on the detail
 * screen) and media (managed in its own section below the form). Validation
 * mirrors the backend zod rules + the web form's messages for fast local
 * feedback - the backend re-validates everything, and server field errors
 * (`ApiError.errors`) are mapped back onto the fields; a 409 duplicate SKU
 * (which arrives without a field map) is sniffed onto the SKU field exactly
 * like the web form.
 */
interface ProductFormValues {
  name: string;
  sku: string;
  /** Category object id ('' until chosen). */
  category: string;
  description: string;
  /** Prices stay strings while typing; parsed on submit so a trailing
   *  decimal point never blocks editing. */
  costPrice: string;
  sellingPrice: string;
  /** 'true' | 'false' - only meaningful on edit (status select). */
  isActive: 'true' | 'false';
}

interface FieldErrors {
  name?: string;
  sku?: string;
  category?: string;
  description?: string;
  costPrice?: string;
  sellingPrice?: string;
}

export interface ProductFormProps {
  mode: 'create' | 'edit';
  /** Preloaded product for edit - the screen only mounts the form once it is loaded. */
  initialValues?: Product | null;
  isSubmitting: boolean;
  onSubmit: (values: CreateProductInput | UpdateProductInput) => Promise<void>;
  onCancel: () => void;
}

const SKU_PATTERN = /^[A-Za-z0-9-]+$/;

/** Mirrors the backend price rules: valid number >= 0; '' and NaN are invalid. */
function parsePrice(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === '') return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

const STATUS_OPTIONS: readonly SelectOption[] = [
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
];

export function ProductForm({
  mode,
  initialValues,
  isSubmitting,
  onSubmit,
  onCancel,
}: ProductFormProps) {
  const { theme } = useTheme();
  const isEdit = mode === 'edit';

  const [values, setValues] = useState<ProductFormValues>(() => ({
    name: initialValues?.name ?? '',
    sku: initialValues?.sku ?? '',
    category: initialValues?.category.id ?? '',
    description: initialValues?.description ?? '',
    costPrice: initialValues ? String(initialValues.costPrice) : '',
    sellingPrice: initialValues ? String(initialValues.sellingPrice) : '',
    isActive: initialValues?.isActive === false ? 'false' : 'true',
  }));
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const categoriesQuery = useCategoriesList();

  /**
   * Category options come from the Step 11 Categories API (never hardcoded),
   * filtered to ACTIVE categories exactly like the web form's dropdown. On
   * edit, the current category is always offered even if it was deactivated
   * meanwhile, so the form never shows a silently-emptied value.
   */
  const categoryOptions = useMemo<SelectOption[]>(() => {
    const active = (categoriesQuery.data ?? []).filter((category) => category.isActive);
    const options = active.map((category) => ({ value: category.id, label: category.name }));
    const currentId = initialValues?.category.id;
    if (isEdit && currentId && !options.some((option) => option.value === currentId)) {
      options.unshift({
        value: currentId,
        label: initialValues?.category.name ?? 'Current category',
      });
    }
    return options;
  }, [categoriesQuery.data, initialValues, isEdit]);

  const categoriesLoading = categoriesQuery.isPending || categoriesQuery.isLoading;
  const noCategories = categoriesQuery.isSuccess && categoryOptions.length === 0;

  const updateField = <K extends keyof ProductFormValues>(
    field: K,
    value: ProductFormValues[K],
  ) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    setFormError(null);
  };

  /** Client-side mirror of the backend zod rules (fast feedback only). */
  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};
    const name = values.name.trim();
    const sku = values.sku.trim();

    if (!name) {
      errors.name = 'Product name is required';
    } else if (name.length > 200) {
      errors.name = 'Product name must be at most 200 characters';
    }

    if (!sku) {
      errors.sku = 'SKU is required';
    } else if (sku.length > 50) {
      errors.sku = 'SKU must be at most 50 characters';
    } else if (!SKU_PATTERN.test(sku)) {
      errors.sku = 'SKU may only contain letters, numbers and hyphens';
    }

    if (!values.category) {
      errors.category = 'Please select a category';
    }

    if (values.description.trim().length > 2000) {
      errors.description = 'Description must be at most 2000 characters';
    }

    const costPrice = parsePrice(values.costPrice);
    if (costPrice === null) {
      errors.costPrice = 'Cost price must be a valid number';
    } else if (costPrice < 0) {
      errors.costPrice = 'Cost price cannot be negative';
    }

    const sellingPrice = parsePrice(values.sellingPrice);
    if (sellingPrice === null) {
      errors.sellingPrice = 'Selling price must be a valid number';
    } else if (sellingPrice < 0) {
      errors.sellingPrice = 'Selling price cannot be negative';
    }

    return errors;
  };

  const handleSubmit = async () => {
    const errors = validate();
    if (
      errors.name ||
      errors.sku ||
      errors.category ||
      errors.description ||
      errors.costPrice ||
      errors.sellingPrice
    ) {
      setFieldErrors(errors);
      setFormError(null);
      return;
    }

    const costPrice = parsePrice(values.costPrice) ?? 0;
    const sellingPrice = parsePrice(values.sellingPrice) ?? 0;

    // The exact payload shape of the web form: trims, an empty description
    // is omitted, prices are numbers, `isActive` is edit-only (create always
    // starts active server-side).
    const payload: CreateProductInput | UpdateProductInput = {
      name: values.name.trim(),
      sku: values.sku.trim(),
      category: values.category,
      description: values.description.trim() || undefined,
      costPrice,
      sellingPrice,
      ...(isEdit ? { isActive: values.isActive === 'true' } : {}),
    };

    setFormError(null);
    try {
      await onSubmit(payload);
    } catch (error) {
      if (isApiError(error) && error.errors) {
        const next: FieldErrors = {};
        if (error.errors.name) next.name = error.errors.name[0];
        if (error.errors.sku) next.sku = error.errors.sku[0];
        if (error.errors.category) next.category = error.errors.category[0];
        if (error.errors.description) next.description = error.errors.description[0];
        if (error.errors.costPrice) next.costPrice = error.errors.costPrice[0];
        if (error.errors.sellingPrice) next.sellingPrice = error.errors.sellingPrice[0];
        if (Object.values(next).some(Boolean)) {
          setFieldErrors(next);
          setFormError(null);
          return;
        }
      }
      // Duplicate-SKU 409s arrive as `{ message }` with no field map - the
      // web form sniffs the message onto the SKU field, and we mirror it.
      const message = getErrorMessage(error);
      if (/sku/i.test(message)) {
        setFieldErrors({ sku: message });
        setFormError(null);
        return;
      }
      if (/category/i.test(message)) {
        setFieldErrors({ category: message });
        setFormError(null);
        return;
      }
      // Anything else (403, network, ...) - surface the backend's own
      // user-facing message, never a fabricated success.
      setFormError(message);
    }
  };

  return (
    <View style={styles.form}>
      <Text variant="label" tone="secondary">
        Identity
      </Text>
      <Input
        label="Product name"
        required
        value={values.name}
        onChangeText={(text) => updateField('name', text)}
        error={fieldErrors.name}
        helperText="200 characters max"
        maxLength={200}
        placeholder="e.g. Banarasi Silk Saree"
        editable={!isSubmitting}
        accessibilityLabel="Product name"
      />
      <Input
        label="SKU"
        required
        value={values.sku}
        onChangeText={(text) => updateField('sku', text)}
        error={fieldErrors.sku}
        helperText="Letters, numbers and hyphens only"
        maxLength={50}
        placeholder="e.g. BAN-SILK-001"
        autoCapitalize="none"
        autoCorrect={false}
        editable={!isSubmitting}
        accessibilityLabel="Product SKU"
      />

      <Text variant="label" tone="secondary">
        Category
      </Text>
      <Select
        label="Category"
        required
        value={values.category}
        options={categoryOptions}
        onChange={(value) => updateField('category', value)}
        error={fieldErrors.category}
        placeholder="Select a category"
        disabled={isSubmitting || categoriesLoading || noCategories}
        helperText={categoriesLoading ? 'Loading categories…' : undefined}
      />
      {noCategories ? (
        <Text variant="caption" tone="muted">
          No active categories available. Create an active category before adding products.
        </Text>
      ) : null}

      <Text variant="label" tone="secondary">
        Pricing
      </Text>
      <Input
        label="Cost price (BDT)"
        required
        value={values.costPrice}
        onChangeText={(text) => updateField('costPrice', text)}
        error={fieldErrors.costPrice}
        helperText="What this product costs to make or source."
        placeholder="0.00"
        keyboardType="decimal-pad"
        editable={!isSubmitting}
        accessibilityLabel="Cost price in Bangladeshi Taka"
      />
      <Input
        label="Selling price (BDT)"
        required
        value={values.sellingPrice}
        onChangeText={(text) => updateField('sellingPrice', text)}
        error={fieldErrors.sellingPrice}
        helperText="The price shown to customers."
        placeholder="0.00"
        keyboardType="decimal-pad"
        editable={!isSubmitting}
        accessibilityLabel="Selling price in Bangladeshi Taka"
      />

      {isEdit ? (
        <Select
          label="Status"
          value={values.isActive}
          options={STATUS_OPTIONS}
          onChange={(value) => updateField('isActive', value as 'true' | 'false')}
          disabled={isSubmitting}
        />
      ) : null}

      {formError ? (
        <Text variant="bodySmall" style={[styles.formError, { color: theme.colors.danger }]}>
          {formError}
        </Text>
      ) : null}

      <View style={styles.actions}>
        <Button
          variant="outline"
          title="Cancel"
          onPress={onCancel}
          disabled={isSubmitting}
          style={styles.flex}
        />
        <Button
          variant="primary"
          title={isEdit ? 'Save changes' : 'Create product'}
          loading={isSubmitting}
          onPress={() => void handleSubmit()}
          style={styles.flex}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.lg },
  formError: {},
  actions: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
});
