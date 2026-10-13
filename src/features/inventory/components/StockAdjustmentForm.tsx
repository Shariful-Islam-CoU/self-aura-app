import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { getErrorMessage, isApiError } from '@/api';
import { Button, Dialog, Input, Select, Text, type SelectOption } from '@/components/ui';
import { useTheme } from '@/providers';
import { spacing } from '@/theme';
import { ADJUST_REASONS, adjustReasonLabel } from '../labels';
import type {
  AddStockInput,
  AdjustStockInput,
  Product,
  RemoveStockInput,
  StockAdjustmentMode,
} from '../types';

/**
 * Discriminated submit payload: the form builds exactly one input shape per
 * mode, so the screen can narrow without casts and route each payload to its
 * backend endpoint (`add`/`remove` take `quantity`, `adjust` takes `newStock`).
 */
export type AdjustmentPayload =
  | { mode: 'add'; input: AddStockInput }
  | { mode: 'remove'; input: RemoveStockInput }
  | { mode: 'adjust'; input: AdjustStockInput };

interface FieldErrors {
  quantity?: string;
  newStock?: string;
  reason?: string;
  note?: string;
}

export const MODE_CONFIG: Record<
  StockAdjustmentMode,
  { title: string; description: string; submitLabel: string }
> = {
  add: {
    title: 'Add stock',
    description: 'Increase the stock level for this product.',
    submitLabel: 'Add stock',
  },
  remove: {
    title: 'Remove stock',
    description: 'Decrease the stock level for this product.',
    submitLabel: 'Remove stock',
  },
  adjust: {
    title: 'Adjust stock',
    description: 'Set an exact stock level for this product.',
    submitLabel: 'Adjust stock',
  },
};

const REASON_OPTIONS: readonly SelectOption[] = ADJUST_REASONS.map((reason) => ({
  value: reason.value,
  label: reason.label,
}));

export interface StockAdjustmentFormProps {
  product: Product;
  mode: StockAdjustmentMode;
  /** Mutation pending - blocks double submission (button + dialog). */
  isSubmitting: boolean;
  /** Submits the backend operation; MUST reject on failure (never fake). */
  onSubmit: (payload: AdjustmentPayload) => Promise<void>;
}

/**
 * Stock adjustment form (mobile adaptation of the web
 * `StockAdjustmentDialog`): same fields, same validation copy, same
 * backend-error mapping - laid out as screen content with a confirmation
 * dialog before the operation is sent (stock changes are consequential).
 *
 * The form only mirrors field rules for faster feedback; the backend
 * validates, authorizes, updates atomically and records the movement. A
 * rejected submit shows the server's own 4xx message and NEVER pretends
 * success. `newStock` on `adjust` is a SET, not a delta - the payload goes
 * to `POST /inventory/:productId/adjust` exactly as typed.
 */
export function StockAdjustmentForm({
  product,
  mode,
  isSubmitting,
  onSubmit,
}: StockAdjustmentFormProps) {
  const { theme } = useTheme();

  const [quantity, setQuantity] = useState('');
  const [newStock, setNewStock] = useState('');
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const config = MODE_CONFIG[mode];

  const parsePositiveInt = (raw: string): number | null => {
    if (raw.trim() === '') return null;
    const value = Number(raw);
    if (!Number.isInteger(value) || value < 1) return null;
    return value;
  };

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};
    if (mode === 'adjust') {
      const stock = Number(newStock);
      if (newStock.trim() === '' || !Number.isInteger(stock) || stock < 0) {
        errors.newStock = 'New stock must be a whole number of 0 or more';
      }
      if (!reason.trim()) {
        errors.reason = 'Please select a reason';
      }
    } else {
      const qty = parsePositiveInt(quantity);
      if (qty === null) {
        errors.quantity = 'Quantity must be a whole number of at least 1';
      } else if (mode === 'remove' && qty > product.stock) {
        errors.quantity = `Cannot remove more than the current stock (${product.stock} units)`;
      }
    }
    if (note.length > 500) {
      errors.note = 'Note must be at most 500 characters';
    }
    return errors;
  };

  const handleSubmit = () => {
    setFormError(null);
    const errors = validate();
    if (errors.quantity || errors.newStock || errors.reason || errors.note) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    if (isSubmitting) return; // never double-submit
    // One literal per mode: the discriminant stays a literal type so the
    // payload always matches its endpoint's input exactly (no casts).
    const payload: AdjustmentPayload =
      mode === 'adjust'
        ? {
            mode: 'adjust',
            input: {
              newStock: Number(newStock),
              reason: reason.trim(),
              note: note.trim() || undefined,
            },
          }
        : mode === 'add'
          ? {
              mode: 'add',
              input: { quantity: Number(quantity), note: note.trim() || undefined },
            }
          : {
              mode: 'remove',
              input: { quantity: Number(quantity), note: note.trim() || undefined },
            };

    try {
      await onSubmit(payload);
      setConfirmOpen(false); // the screen toasts and navigates back on success
    } catch (err) {
      // Close the confirmation so the mapped errors are visible on the form.
      setConfirmOpen(false);
      const nextErrors: FieldErrors = {};
      if (isApiError(err) && err.errors) {
        if (err.errors.quantity) nextErrors.quantity = err.errors.quantity[0];
        if (err.errors.newStock) nextErrors.newStock = err.errors.newStock[0];
        if (err.errors.reason) nextErrors.reason = err.errors.reason[0];
        if (err.errors.note) nextErrors.note = err.errors.note[0];
        setFieldErrors(nextErrors);
        if (Object.values(nextErrors).some(Boolean)) return;
      }
      // Backend 4xx messages are user-facing by contract (same text the
      // web app shows); `getErrorMessage` sanitizes everything else.
      const message = getErrorMessage(err);
      if (message.toLowerCase().includes('insufficient stock')) {
        setFieldErrors((prev) => ({ ...prev, quantity: message }));
      } else if (message.toLowerCase().includes('different from the current stock')) {
        setFieldErrors((prev) => ({ ...prev, newStock: message }));
      } else {
        setFormError(message); // includes 403 permission errors - shown, never faked
      }
    }
  };

  const clearFieldError = (field: keyof FieldErrors) => {
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    setFormError(null);
  };

  // Confirmation summary (display only - the backend recomputes everything).
  const summary =
    mode === 'adjust'
      ? `Set to ${Number(newStock)} units`
      : mode === 'add'
        ? `+${Number(quantity)} units`
        : `-${Number(quantity)} units`;
  const summaryReason =
    mode === 'adjust' ? adjustReasonLabel(reason) : mode === 'add' ? 'Restock' : 'Removal';
  const trimmedNote = note.trim();

  return (
    <View style={styles.container}>
      <Text variant="body" tone="secondary">
        {config.description} Current stock for <Text variant="bodyMedium">{product.name}</Text> is{' '}
        <Text variant="bodyMedium">{product.stock} units</Text>.
      </Text>

      {formError ? (
        <View
          style={[
            styles.errorBox,
            { backgroundColor: theme.colors.dangerSoft, borderColor: theme.colors.border },
          ]}
          accessibilityRole="alert"
        >
          <Text variant="bodySmall" tone="danger">
            {formError}
          </Text>
        </View>
      ) : null}

      {mode === 'adjust' ? (
        <>
          <Input
            label="New stock level"
            required
            keyboardType="number-pad"
            inputMode="numeric"
            value={newStock}
            onChangeText={(value) => {
              setNewStock(value);
              clearFieldError('newStock');
            }}
            error={fieldErrors.newStock}
            placeholder="e.g. 25"
            helperText="Must be different from the current stock level"
            autoFocus
            accessibilityLabel="New stock level"
          />
          <Select
            label="Reason"
            required
            value={reason || null}
            options={REASON_OPTIONS}
            onChange={(value) => {
              setReason(value);
              clearFieldError('reason');
            }}
            placeholder="Select a reason"
            error={fieldErrors.reason}
          />
        </>
      ) : (
        <Input
          label={mode === 'add' ? 'Quantity to add' : 'Quantity to remove'}
          required
          keyboardType="number-pad"
          inputMode="numeric"
          value={quantity}
          onChangeText={(value) => {
            setQuantity(value);
            clearFieldError('quantity');
          }}
          error={fieldErrors.quantity}
          placeholder="e.g. 10"
          autoFocus
          accessibilityLabel={mode === 'add' ? 'Quantity to add' : 'Quantity to remove'}
        />
      )}

      <Input
        label="Note"
        value={note}
        onChangeText={(value) => {
          setNote(value);
          clearFieldError('note');
        }}
        error={fieldErrors.note}
        placeholder="Optional note (max 500 characters)"
        multiline
        helperText={note.length > 0 ? `${note.length}/500 characters` : null}
        accessibilityLabel="Optional note"
      />

      <Button
        title={config.submitLabel}
        variant={mode === 'remove' ? 'danger' : 'primary'}
        fullWidth
        onPress={handleSubmit}
        disabled={isSubmitting}
        accessibilityLabel={`${config.submitLabel} for ${product.name}`}
      />

      <Dialog
        visible={confirmOpen}
        onClose={() => {
          if (!isSubmitting) setConfirmOpen(false);
        }}
        title="Confirm adjustment"
        dismissOnBackdrop={!isSubmitting}
        primaryAction={{
          label: 'Confirm Adjustment',
          variant: mode === 'remove' ? 'danger' : 'primary',
          loading: isSubmitting,
          onPress: () => void handleConfirm(),
        }}
        secondaryAction={{ label: 'Cancel' }}
      >
        <View style={styles.confirmBody}>
          <ConfirmLine label="Product:" value={product.name} />
          <ConfirmLine label="Adjustment:" value={summary} />
          <ConfirmLine label="Reason:" value={summaryReason} />
          {trimmedNote ? <ConfirmLine label="Note:" value={trimmedNote} /> : null}
        </View>
      </Dialog>
    </View>
  );
}

function ConfirmLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.confirmLine}>
      <Text variant="bodySmall" tone="muted">
        {label}
      </Text>
      <Text variant="bodyMedium" style={styles.confirmValue} numberOfLines={3}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  errorBox: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  confirmBody: { gap: spacing.sm },
  confirmLine: { gap: 2 },
  confirmValue: { textAlign: 'left' },
});
