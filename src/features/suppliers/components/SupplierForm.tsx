import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { getErrorMessage, isApiError } from '@/api';
import { Button, Input, Text } from '@/components/ui';
import { useTheme } from '@/providers';
import { radius, spacing } from '@/theme';
import type { CreateSupplierInput, Supplier, UpdateSupplierInput } from '../types';

/**
 * Shared create/edit supplier form.
 *
 * Field rules mirror the backend's `createSupplierSchema` /
 * `updateSupplierSchema` (and the web app's SupplierForm) for fast local
 * feedback - the backend re-validates everything and its response stays
 * authoritative: server field errors (`ApiError.errors`) are mapped back
 * onto the fields, anything else surfaces as a form-level message.
 * No supplier data leaves this component except through `onSubmit`.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface SupplierFormValues {
  name: string;
  phone: string;
  alternatePhone: string;
  email: string;
  address: string;
  notes: string;
}

interface FieldErrors {
  name?: string;
  phone?: string;
  alternatePhone?: string;
  email?: string;
  address?: string;
  notes?: string;
}

export interface SupplierFormProps {
  mode: 'create' | 'edit';
  /** Preloaded supplier for edit - the screen only mounts the form once it is loaded. */
  initialValues?: Supplier | null;
  isSubmitting: boolean;
  onSubmit: (values: CreateSupplierInput | UpdateSupplierInput) => Promise<void>;
  onCancel: () => void;
}

export function SupplierForm({
  mode,
  initialValues,
  isSubmitting,
  onSubmit,
  onCancel,
}: SupplierFormProps) {
  const { theme } = useTheme();
  const isEdit = mode === 'edit';

  const [values, setValues] = useState<SupplierFormValues>(() => ({
    name: initialValues?.name ?? '',
    phone: initialValues?.phone ?? '',
    alternatePhone: initialValues?.alternatePhone ?? '',
    email: initialValues?.email ?? '',
    address: initialValues?.address ?? '',
    notes: initialValues?.notes ?? '',
  }));
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const updateField = <K extends keyof SupplierFormValues>(
    field: K,
    value: SupplierFormValues[K],
  ) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    setFormError(null);
  };

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};
    const name = values.name.trim();
    const phone = values.phone.trim();
    const alternatePhone = values.alternatePhone.trim();
    const email = values.email.trim();
    const address = values.address.trim();
    const notes = values.notes.trim();

    if (!name) {
      errors.name = 'Name is required';
    } else if (name.length > 100) {
      errors.name = 'Name must be at most 100 characters';
    }

    if (!phone) {
      errors.phone = 'Phone is required';
    } else if (phone.length > 32) {
      errors.phone = 'Phone must be at most 32 characters';
    }

    if (alternatePhone) {
      if (alternatePhone.length > 32) {
        errors.alternatePhone = 'Alternate phone must be at most 32 characters';
      }
    }

    if (email) {
      if (email.length > 200) {
        errors.email = 'Email must be at most 200 characters';
      } else if (!EMAIL_PATTERN.test(email)) {
        errors.email = 'Email must be a valid email address';
      }
    }

    if (address.length > 500) {
      errors.address = 'Address must be at most 500 characters';
    }

    if (notes.length > 2000) {
      errors.notes = 'Notes must be at most 2000 characters';
    }

    return errors;
  };

  const handleSubmit = async () => {
    const errors = validate();
    if (
      errors.name ||
      errors.phone ||
      errors.alternatePhone ||
      errors.email ||
      errors.address ||
      errors.notes
    ) {
      setFieldErrors(errors);
      setFormError(null);
      return;
    }

    // Empty optional fields clear the stored value on edit (null) and are
    // omitted on create - exactly the web form's payload shape.
    const payload: CreateSupplierInput | UpdateSupplierInput = {
      name: values.name.trim(),
      phone: values.phone.trim(),
      alternatePhone: values.alternatePhone.trim() || (isEdit ? null : undefined),
      email: values.email.trim().toLowerCase() || (isEdit ? null : undefined),
      address: values.address.trim() || (isEdit ? null : undefined),
      notes: values.notes.trim() || (isEdit ? null : undefined),
    };

    setFormError(null);
    try {
      await onSubmit(payload);
    } catch (error) {
      if (isApiError(error) && error.errors) {
        const serverErrors = error.errors;
        const next: FieldErrors = {};
        if (serverErrors.name) next.name = serverErrors.name[0];
        if (serverErrors.phone) next.phone = serverErrors.phone[0];
        if (serverErrors.alternatePhone) next.alternatePhone = serverErrors.alternatePhone[0];
        if (serverErrors.email) next.email = serverErrors.email[0];
        if (serverErrors.address) next.address = serverErrors.address[0];
        if (serverErrors.notes) next.notes = serverErrors.notes[0];
        setFieldErrors(next);
        setFormError(null);
        return;
      }
      // Non-field failures (403, network...) - show the backend's own
      // user-facing message, never a fabricated success.
      setFormError(getErrorMessage(error));
    }
  };

  return (
    <View style={styles.form}>
      <Text variant="label" tone="secondary">
        Identity
      </Text>
      <Input
        label="Name"
        required
        value={values.name}
        onChangeText={(text) => updateField('name', text)}
        error={fieldErrors.name}
        placeholder="Supplier name"
        autoComplete="name"
        accessibilityLabel="Supplier name"
      />
      <Input
        label="Phone"
        required
        value={values.phone}
        onChangeText={(text) => updateField('phone', text)}
        error={fieldErrors.phone}
        placeholder="Primary phone"
        keyboardType="phone-pad"
        accessibilityLabel="Supplier phone number"
      />
      <Input
        label="Alternate phone"
        value={values.alternatePhone}
        onChangeText={(text) => updateField('alternatePhone', text)}
        error={fieldErrors.alternatePhone}
        placeholder="Optional"
        keyboardType="phone-pad"
        accessibilityLabel="Supplier alternate phone number"
      />
      <Input
        label="Email"
        value={values.email}
        onChangeText={(text) => updateField('email', text)}
        error={fieldErrors.email}
        placeholder="supplier@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        accessibilityLabel="Supplier email address"
      />

      <Text variant="label" tone="secondary">
        Contact
      </Text>
      <Input
        label="Address"
        value={values.address}
        onChangeText={(text) => updateField('address', text)}
        error={fieldErrors.address}
        placeholder="Optional street / office address"
        multiline
        numberOfLines={2}
        accessibilityLabel="Supplier address"
      />
      <Input
        label="Notes"
        value={values.notes}
        onChangeText={(text) => updateField('notes', text)}
        error={fieldErrors.notes}
        placeholder="Optional internal notes"
        multiline
        numberOfLines={3}
        accessibilityLabel="Supplier notes"
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
          title={isEdit ? 'Save changes' : 'Create supplier'}
          fullWidth
          loading={isSubmitting}
          onPress={() => void handleSubmit()}
          accessibilityLabel={isEdit ? 'Save supplier changes' : 'Create supplier'}
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
  formError: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  actions: { gap: spacing.sm, marginTop: spacing.md },
});
