import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { getErrorMessage, isApiError } from '@/api';
import { Button, DateField, Input, Select, Text } from '@/components/ui';
import { useTheme } from '@/providers';
import { spacing } from '@/theme';

import { EXPENSE_PAYMENT_METHOD_OPTIONS } from '../labels';
import { useExpenseCategoryLookup } from '../queries';
import type { CreateExpenseInput, Expense, ExpensePaymentMethod } from '../types';

/**
 * Shared create/edit expense form.
 *
 * Field rules mirror the backend's `createExpenseSchema` /
 * `updateExpenseSchema` (and the web app's ExpenseForm) for fast local
 * feedback - the backend re-validates everything and its response stays
 * authoritative: server field errors (`ApiError.errors`) are mapped back onto
 * the fields, anything else surfaces as a form-level message. No expense data
 * leaves this component except through `onSubmit`.
 *
 * Categories always come from the backend (`GET /expense-categories`,
 * `isActive=true`); there is no second category system on the client. Only a
 * `YYYY-MM-DD` date string is exchanged for `expenseDate` - the same wire
 * format the backend accepts.
 */

const MAX_AMOUNT = 100000000000;

interface ExpenseFormValues {
  category: string;
  title: string;
  description: string;
  amount: string;
  paymentMethod: ExpensePaymentMethod;
  expenseDate: string;
  reference: string;
  note: string;
}

interface FieldErrors {
  category?: string;
  title?: string;
  description?: string;
  amount?: string;
  paymentMethod?: string;
  expenseDate?: string;
  reference?: string;
  note?: string;
}

export interface ExpenseFormProps {
  mode: 'create' | 'edit';
  /** Preloaded expense for edit - the screen only mounts the form once loaded. */
  initialValues?: Expense | null;
  isSubmitting: boolean;
  onSubmit: (input: CreateExpenseInput) => Promise<void>;
  onCancel: () => void;
}

const SERVER_FIELDS: (keyof FieldErrors)[] = [
  'category',
  'title',
  'description',
  'amount',
  'paymentMethod',
  'expenseDate',
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

export function ExpenseForm({
  mode,
  initialValues,
  isSubmitting,
  onSubmit,
  onCancel,
}: ExpenseFormProps) {
  const { theme } = useTheme();

  const [values, setValues] = useState<ExpenseFormValues>(() => ({
    category: initialValues?.category.id ?? '',
    title: initialValues?.title ?? '',
    description: initialValues?.description ?? '',
    amount: initialValues ? String(initialValues.amount) : '',
    paymentMethod: initialValues?.paymentMethod ?? 'cash',
    expenseDate: initialValues?.expenseDate.split('T')[0] ?? todayIso(),
    reference: initialValues?.reference ?? '',
    note: initialValues?.note ?? '',
  }));
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const categoriesQuery = useExpenseCategoryLookup(true);
  const categories = categoriesQuery.data;

  const categoryOptions = useMemo(() => {
    const options = (categories ?? []).map((category) => ({
      value: category.id,
      label: category.name,
    }));
    // Keep an already-selected (e.g. now inactive) category visible on edit so
    // the field never looks empty; the backend still validates on submit.
    const currentId = initialValues?.category.id;
    if (currentId && !options.some((option) => option.value === currentId)) {
      options.unshift({
        value: currentId,
        label: initialValues?.category.name ?? currentId,
      });
    }
    return options;
  }, [categories, initialValues]);

  const updateField = <K extends keyof ExpenseFormValues>(key: K, value: ExpenseFormValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};
    const amountText = values.amount.trim();
    const amountValue = Number(amountText);

    if (!values.category) errors.category = 'Category is required';
    if (!values.title.trim()) errors.title = 'Title is required';
    else if (values.title.trim().length > 200)
      errors.title = 'Title must be at most 200 characters';

    if (!amountText) errors.amount = 'Amount is required';
    else if (Number.isNaN(amountValue)) errors.amount = 'Amount must be a number';
    else if (amountValue <= 0) errors.amount = 'Amount must be greater than zero';
    else if (amountValue > MAX_AMOUNT) errors.amount = 'Amount is too large';

    if (!values.paymentMethod) errors.paymentMethod = 'Payment method is required';
    if (!values.expenseDate) errors.expenseDate = 'Expense date is required';

    if (values.reference.trim().length > 200) {
      errors.reference = 'Reference must be at most 200 characters';
    }
    if (values.description.trim().length > 2000) {
      errors.description = 'Description must be at most 2000 characters';
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
    const payload: CreateExpenseInput = {
      category: values.category,
      title: values.title.trim(),
      amount: Number(values.amount.trim()),
      paymentMethod: values.paymentMethod,
      expenseDate: values.expenseDate,
      description: values.description.trim() || undefined,
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
      <Select
        label="Category"
        required
        value={values.category}
        options={categoryOptions}
        onChange={(value) => updateField('category', value)}
        placeholder={categoriesQuery.isPending ? 'Loading categories...' : 'Select category'}
        error={fieldErrors.category}
        helperText={
          categoriesQuery.isError
            ? 'Could not load categories. Pull to refresh and try again.'
            : 'Only active categories can be used.'
        }
        disabled={isSubmitting || categoriesQuery.isPending}
      />

      <Input
        label="Title"
        required
        value={values.title}
        onChangeText={(text) => updateField('title', text)}
        error={fieldErrors.title}
        editable={!isSubmitting}
        placeholder="What was this expense for?"
        maxLength={200}
      />

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

      <Select
        label="Payment method"
        required
        value={values.paymentMethod}
        options={EXPENSE_PAYMENT_METHOD_OPTIONS}
        onChange={(value) => updateField('paymentMethod', value as ExpensePaymentMethod)}
        error={fieldErrors.paymentMethod}
        disabled={isSubmitting}
      />

      <DateField
        label="Expense date"
        required
        value={values.expenseDate}
        onChange={(value) => updateField('expenseDate', value)}
        error={fieldErrors.expenseDate}
        disabled={isSubmitting}
      />

      <Input
        label="Reference"
        value={values.reference}
        onChangeText={(text) => updateField('reference', text)}
        error={fieldErrors.reference}
        editable={!isSubmitting}
        placeholder="Receipt no., invoice, etc. (optional)"
        maxLength={200}
      />

      <Input
        label="Description"
        value={values.description}
        onChangeText={(text) => updateField('description', text)}
        error={fieldErrors.description}
        editable={!isSubmitting}
        placeholder="Optional details about this expense"
        multiline
        numberOfLines={3}
        maxLength={2000}
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
          title={mode === 'create' ? 'Create expense' : 'Save changes'}
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
