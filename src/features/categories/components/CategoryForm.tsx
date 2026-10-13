import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { getErrorMessage, isApiError } from '@/api';
import { Button, Input, Switch, Text } from '@/components/ui';
import { useTheme } from '@/providers';
import { spacing } from '@/theme';
import type { Category, CreateCategoryInput } from '../types';

/**
 * Shared create/edit category form.
 *
 * Field rules mirror the backend's `createCategorySchema` /
 * `updateCategorySchema` (and the web app's CategoryForm) for fast local
 * feedback - the backend re-validates everything and its response stays
 * authoritative: server field errors (`ApiError.errors`) are mapped back
 * onto the fields, anything else surfaces as a form-level message.
 *
 * Only fields the backend actually accepts on the payload are present:
 * name + description on create; the same plus `isActive` on edit (an
 * update-only flag - the web app's status select maps to it). The slug is
 * generated server-side, and media lives in its own section, so neither
 * appears here.
 */
interface CategoryFormValues {
  name: string;
  description: string;
  isActive: boolean;
}

interface FieldErrors {
  name?: string;
  description?: string;
}

export interface CategoryFormProps {
  mode: 'create' | 'edit';
  /** Preloaded category for edit - the screen only mounts the form once it is loaded. */
  initialValues?: Category | null;
  isSubmitting: boolean;
  onSubmit: (values: CreateCategoryInput & { isActive?: boolean }) => Promise<void>;
  onCancel: () => void;
}

export function CategoryForm({
  mode,
  initialValues,
  isSubmitting,
  onSubmit,
  onCancel,
}: CategoryFormProps) {
  const { theme } = useTheme();
  const isEdit = mode === 'edit';

  const [values, setValues] = useState<CategoryFormValues>(() => ({
    name: initialValues?.name ?? '',
    description: initialValues?.description ?? '',
    isActive: initialValues?.isActive ?? true,
  }));
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const updateField = <K extends keyof CategoryFormValues>(
    field: K,
    value: CategoryFormValues[K],
  ) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    setFormError(null);
  };

  /** Client-side mirror of the backend zod rules (used for fast feedback only). */
  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};
    const name = values.name.trim();
    if (!name) errors.name = 'Category name is required';
    else if (name.length > 100) errors.name = 'Category name must be at most 100 characters';
    if (values.description.trim().length > 500) {
      errors.description = 'Description must be at most 500 characters';
    }
    return errors;
  };

  const handleSubmit = async () => {
    const errors = validate();
    if (errors.name || errors.description) {
      setFieldErrors(errors);
      return;
    }
    setFormError(null);
    try {
      await onSubmit({
        name: values.name.trim(),
        description: values.description.trim() || undefined,
        ...(isEdit ? { isActive: values.isActive } : {}),
      });
    } catch (error) {
      if (isApiError(error) && error.errors) {
        const next: FieldErrors = {};
        if (error.errors.name) next.name = error.errors.name[0];
        if (error.errors.description) next.description = error.errors.description[0];
        if (next.name || next.description) {
          setFieldErrors(next);
          return;
        }
      }
      setFormError(getErrorMessage(error));
    }
  };

  return (
    <View style={styles.form}>
      <Input
        label="Name"
        required
        value={values.name}
        onChangeText={(text) => updateField('name', text)}
        placeholder="e.g. Dresses"
        error={fieldErrors.name}
        helperText="100 characters max"
        maxLength={100}
        editable={!isSubmitting}
      />

      <Input
        label="Description"
        value={values.description}
        onChangeText={(text) => updateField('description', text)}
        placeholder="Optional short description of the category"
        multiline
        error={fieldErrors.description}
        helperText="500 characters max"
        maxLength={500}
        editable={!isSubmitting}
      />

      {isEdit ? (
        <View style={styles.switchRow}>
          <Switch
            value={values.isActive}
            onValueChange={(value) => updateField('isActive', value)}
            label="Active"
            disabled={isSubmitting}
          />
          <Text variant="caption" tone="muted">
            Inactive categories are hidden from the catalogue and cannot be used for new products.
          </Text>
        </View>
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
          title={isEdit ? 'Save changes' : 'Create category'}
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
  switchRow: { gap: spacing.xs },
  formError: {},
  actions: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
});
