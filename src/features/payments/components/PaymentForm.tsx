import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { getErrorMessage, isApiError } from '@/api';
import { Button, DateField, Input, Select, Text } from '@/components/ui';
import { useTheme } from '@/providers';
import { spacing } from '@/theme';

import { PAYMENT_METHOD_OPTIONS } from '../labels';
import type { CreatePaymentInput, Payment, PaymentMethod, UpdatePaymentInput } from '../types';
import { PaymentOrderPicker } from './PaymentOrderPicker';

/**
 * Shared create/edit payment form.
 *
 * Field rules mirror the backend's `createPaymentSchema` /
 * `updatePaymentSchema` (and the web app's PaymentForm) for fast local
 * feedback - the backend re-validates everything and its response stays
 * authoritative: server field errors (`ApiError.errors`) are mapped back onto
 * the fields, anything else surfaces as a form-level message.
 *
 * Create picks a real order through `PaymentOrderPicker` (the existing Orders
 * module); amount and method are only sent on create. Edit updates method,
 * date, reference and note - the backend does not allow changing an order,
 * amount or type through PATCH. Only a `YYYY-MM-DD` date string is exchanged.
 */

const MAX_AMOUNT = 100000000000;

interface PaymentFormValues {
  order: string;
  orderLabel: string;
  amount: string;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  reference: string;
  note: string;
}

interface FieldErrors {
  order?: string;
  amount?: string;
  paymentMethod?: string;
  paymentDate?: string;
  reference?: string;
  note?: string;
}

export interface PaymentFormProps {
  mode: 'create' | 'edit';
  /** Preloaded payment for edit - the screen only mounts the form once loaded. */
  initialValues?: Payment | null;
  isSubmitting: boolean;
  onSubmit: (input: CreatePaymentInput | UpdatePaymentInput) => Promise<void>;
  onCancel: () => void;
}

const SERVER_FIELDS: (keyof FieldErrors)[] = [
  'order',
  'amount',
  'paymentMethod',
  'paymentDate',
  'reference',
  'note',
];

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

/** Local-time `YYYY-MM-DD` for today (never a UTC-shifted date). */
function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

export function PaymentForm({
  mode,
  initialValues,
  isSubmitting,
  onSubmit,
  onCancel,
}: PaymentFormProps) {
  const { theme } = useTheme();
  const isCreate = mode === 'create';

  const [values, setValues] = useState<PaymentFormValues>(() => ({
    order: initialValues?.order.id ?? '',
    orderLabel: initialValues?.order.orderNumber ?? initialValues?.order.id ?? '',
    amount: initialValues ? String(initialValues.amount) : '',
    paymentMethod: initialValues?.paymentMethod ?? 'cash',
    paymentDate: initialValues?.paymentDate.split('T')[0] ?? todayIso(),
    reference: initialValues?.reference ?? '',
    note: initialValues?.note ?? '',
  }));
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const updateField = <K extends keyof PaymentFormValues>(key: K, value: PaymentFormValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};
    const amountText = values.amount.trim();
    const amountValue = Number(amountText);

    if (isCreate && !values.order) errors.order = 'Order is required';

    if (isCreate) {
      if (!amountText) errors.amount = 'Amount is required';
      else if (Number.isNaN(amountValue)) errors.amount = 'Amount must be a number';
      else if (amountValue <= 0) errors.amount = 'Amount must be greater than zero';
      else if (amountValue > MAX_AMOUNT) errors.amount = 'Amount is too large';
    }

    if (!values.paymentMethod) errors.paymentMethod = 'Payment method is required';
    if (!values.paymentDate) errors.paymentDate = 'Payment date is required';

    if (values.reference.trim().length > 200) {
      errors.reference = 'Reference must be at most 200 characters';
    }
    if (values.note.trim().length > 2000) {
      errors.note = 'Note must be at most 2000 characters';
    }
    return errors;
  };

  const handleSubmit = async () => {
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setFormError(null);
    const payload: CreatePaymentInput | UpdatePaymentInput = isCreate
      ? {
          order: values.order,
          amount: Number(values.amount.trim()),
          paymentMethod: values.paymentMethod,
          paymentDate: values.paymentDate,
          reference: values.reference.trim() || undefined,
          note: values.note.trim() || undefined,
        }
      : {
          paymentMethod: values.paymentMethod,
          paymentDate: values.paymentDate,
          reference: values.reference.trim() || undefined,
          note: values.note.trim() || undefined,
        };

    try {
      await onSubmit(payload);
    } catch (err) {
      if (isApiError(err) && err.errors) {
        const next: FieldErrors = {};
        for (const field of SERVER_FIELDS) {
          const message = err.errors[field]?.[0];
          if (message) next[field] = message;
        }
        if (Object.keys(next).length > 0) {
          setFieldErrors(next);
          return;
        }
      }
      setFormError(getErrorMessage(err));
    }
  };

  return (
    <View style={styles.form}>
      {isCreate ? (
        <PaymentOrderPicker
          value={values.order}
          selectedLabel={values.orderLabel || undefined}
          onChange={(orderId, label) => {
            updateField('order', orderId);
            updateField('orderLabel', label);
          }}
          error={fieldErrors.order}
          disabled={isSubmitting}
        />
      ) : null}

      {isCreate ? (
        <Input
          label="Amount"
          required
          value={values.amount}
          onChangeText={(text) => updateField('amount', text)}
          error={fieldErrors.amount}
          editable={!isSubmitting}
          placeholder="0.00"
          keyboardType="decimal-pad"
        />
      ) : null}

      <Select
        label="Payment method"
        required
        value={values.paymentMethod}
        options={PAYMENT_METHOD_OPTIONS}
        onChange={(value) => updateField('paymentMethod', value as PaymentMethod)}
        error={fieldErrors.paymentMethod}
        disabled={isSubmitting}
      />

      <DateField
        label="Payment date"
        required
        value={values.paymentDate}
        onChange={(value) => updateField('paymentDate', value)}
        error={fieldErrors.paymentDate}
        disabled={isSubmitting}
      />

      <Input
        label="Reference / transaction ID"
        value={values.reference}
        onChangeText={(text) => updateField('reference', text)}
        error={fieldErrors.reference}
        editable={!isSubmitting}
        placeholder="bKash/Nagad transaction id or slip no. (optional)"
        autoCapitalize="characters"
        maxLength={200}
      />

      <Input
        label="Note"
        value={values.note}
        onChangeText={(text) => updateField('note', text)}
        error={fieldErrors.note}
        editable={!isSubmitting}
        placeholder="Internal note (optional)"
        multiline
        numberOfLines={3}
        maxLength={2000}
      />

      {formError ? (
        <View
          style={[styles.formError, { borderColor: theme.colors.danger }]}
          accessibilityLiveRegion="polite"
        >
          <Text variant="bodySmall" tone="danger">
            {formError}
          </Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        <Button
          title="Cancel"
          variant="outline"
          onPress={onCancel}
          disabled={isSubmitting}
          style={styles.action}
        />
        <Button
          title={isCreate ? 'Record payment' : 'Save changes'}
          onPress={() => void handleSubmit()}
          loading={isSubmitting}
          style={styles.action}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.lg },
  formError: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    padding: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  action: { flex: 1 },
});
