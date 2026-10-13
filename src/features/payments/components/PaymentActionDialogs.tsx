import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { getErrorMessage, isApiError } from '@/api';
import { DateField, Dialog, Input, Select, Text } from '@/components/ui';
import { formatCurrency } from '@/utils/format';

import { PAYMENT_METHOD_OPTIONS, paymentMethodLabel } from '../labels';
import type { Payment, PaymentMethod, RefundPaymentInput, RejectPaymentInput } from '../types';

/**
 * Confirmation dialogs for the payment lifecycle actions. Each one owns its
 * own submitting/error bookkeeping (the parent screens only pass the mutation
 * function) and never fakes a result: a rejected request surfaces the server's
 * own message and the dialog stays open so the user can retry or cancel.
 */

const MAX_AMOUNT = 100000000000;

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

interface BaseDialogProps {
  open: boolean;
  payment: Payment | null;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
}

function PaymentFacts({ payment }: { payment: Payment }) {
  return (
    <View style={styles.summary}>
      <View style={styles.row}>
        <Text variant="bodySmall" tone="muted">
          Payment
        </Text>
        <Text variant="bodyMedium" numberOfLines={1} style={styles.value}>
          {payment.paymentNumber}
        </Text>
      </View>
      <View style={styles.row}>
        <Text variant="bodySmall" tone="muted">
          Method
        </Text>
        <Text variant="bodyMedium" style={styles.value}>
          {paymentMethodLabel(payment.paymentMethod)}
        </Text>
      </View>
      {payment.reference ? (
        <View style={styles.row}>
          <Text variant="bodySmall" tone="muted">
            Transaction ID
          </Text>
          <Text variant="bodyMedium" numberOfLines={1} style={styles.value}>
            {payment.reference}
          </Text>
        </View>
      ) : null}
      <View style={styles.rowTotal}>
        <Text variant="bodySmall" tone="muted">
          Amount
        </Text>
        <Text variant="subtitle">{formatCurrency(payment.amount)}</Text>
      </View>
    </View>
  );
}

interface PaymentVerifyDialogProps extends BaseDialogProps {
  onConfirm: () => Promise<void>;
}

/**
 * Verifies a submitted manual bKash/Nagad payment. This is a real financial
 * confirmation (the backend marks the payment completed and counts it as
 * received income) and is only offered by the details screen when the backend
 * says the payment is verifiable. A transaction id is never treated as proof
 * on the client.
 */
export function PaymentVerifyDialog({
  open,
  payment,
  isSubmitting,
  onConfirm,
  onOpenChange,
}: PaymentVerifyDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setError(null);
  }

  if (!payment) return null;

  const handleConfirm = async () => {
    setError(null);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <Dialog
      visible={open}
      onClose={() => onOpenChange(false)}
      title="Verify payment?"
      message="Verify only after confirming the transaction in bKash/Nagad. Verifying marks this payment completed and counts it as received income in the order ledger and reports."
      primaryAction={{
        label: isSubmitting ? 'Verifying...' : 'Verify payment',
        variant: 'success',
        loading: isSubmitting,
        onPress: handleConfirm,
      }}
      secondaryAction={{ label: 'Cancel', onPress: () => onOpenChange(false) }}
    >
      <PaymentFacts payment={payment} />
      {error ? (
        <Text variant="bodySmall" tone="danger">
          {error}
        </Text>
      ) : null}
    </Dialog>
  );
}

interface PaymentRejectDialogProps extends BaseDialogProps {
  onConfirm: (input: RejectPaymentInput) => Promise<void>;
}

/**
 * Rejects a submitted manual payment, optionally recording a reason (the
 * backend caps it at 500 characters). The payment is never counted as income.
 */
export function PaymentRejectDialog({
  open,
  payment,
  isSubmitting,
  onConfirm,
  onOpenChange,
}: PaymentRejectDialogProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setReason('');
      setError(null);
    }
  }

  if (!payment) return null;

  const handleConfirm = async () => {
    setError(null);
    try {
      await onConfirm({ rejectionReason: reason.trim() || undefined });
      onOpenChange(false);
    } catch (err) {
      if (isApiError(err) && err.errors?.rejectionReason?.[0]) {
        setError(err.errors.rejectionReason[0]);
        return;
      }
      setError(getErrorMessage(err));
    }
  };

  return (
    <Dialog
      visible={open}
      onClose={() => onOpenChange(false)}
      title="Reject payment?"
      message="Rejecting marks this submitted payment as rejected. It will not count as received income."
      primaryAction={{
        label: isSubmitting ? 'Rejecting...' : 'Reject payment',
        variant: 'danger',
        loading: isSubmitting,
        onPress: handleConfirm,
      }}
      secondaryAction={{ label: 'Cancel', onPress: () => onOpenChange(false) }}
    >
      <PaymentFacts payment={payment} />
      <Input
        label="Rejection reason"
        value={reason}
        onChangeText={setReason}
        editable={!isSubmitting}
        placeholder="Optional - why is this payment being rejected?"
        multiline
        numberOfLines={3}
        maxLength={500}
      />
      {error ? (
        <Text variant="bodySmall" tone="danger">
          {error}
        </Text>
      ) : null}
    </Dialog>
  );
}

interface PaymentCancelDialogProps extends BaseDialogProps {
  onConfirm: () => Promise<void>;
}

/**
 * Cancels a payment. The backend recomputes the order's payment status and
 * totals, so this is confirmed explicitly. Cancelled payments stay in the
 * ledger as cancelled records (payments are never deleted).
 */
export function PaymentCancelDialog({
  open,
  payment,
  isSubmitting,
  onConfirm,
  onOpenChange,
}: PaymentCancelDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setError(null);
  }

  if (!payment) return null;

  const handleConfirm = async () => {
    setError(null);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <Dialog
      visible={open}
      onClose={() => onOpenChange(false)}
      title="Cancel payment?"
      message="Cancelling marks this payment as cancelled and the backend recomputes the order's payment status. This cannot be undone from the app."
      primaryAction={{
        label: isSubmitting ? 'Cancelling...' : 'Cancel payment',
        variant: 'danger',
        loading: isSubmitting,
        onPress: handleConfirm,
      }}
      secondaryAction={{ label: 'Keep payment', onPress: () => onOpenChange(false) }}
    >
      <PaymentFacts payment={payment} />
      {error ? (
        <Text variant="bodySmall" tone="danger">
          {error}
        </Text>
      ) : null}
    </Dialog>
  );
}

interface PaymentRefundDialogProps extends BaseDialogProps {
  onConfirm: (input: RefundPaymentInput) => Promise<void>;
}

interface RefundFieldErrors {
  amount?: string;
  reference?: string;
  note?: string;
}

/**
 * Refunds a completed payment. The backend creates the refund record and
 * enforces the refundable limit against the order ledger - the client only
 * collects the form and surfaces the server's decision. Amount is required;
 * method/date/reference/note are optional and default server-side.
 */
export function PaymentRefundDialog({
  open,
  payment,
  isSubmitting,
  onConfirm,
  onOpenChange,
}: PaymentRefundDialogProps) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod | ''>('');
  const [date, setDate] = useState('');
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [fieldErrors, setFieldErrors] = useState<RefundFieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open && payment) {
      setAmount(String(payment.amount));
      setMethod('');
      setDate(todayIso());
      setReference('');
      setNote('');
      setFieldErrors({});
      setError(null);
    }
  }

  if (!payment) return null;

  const handleConfirm = async () => {
    const errors: RefundFieldErrors = {};
    const amountText = amount.trim();
    const amountValue = Number(amountText);
    if (!amountText) errors.amount = 'Amount is required';
    else if (Number.isNaN(amountValue)) errors.amount = 'Amount must be a number';
    else if (amountValue <= 0) errors.amount = 'Amount must be greater than zero';
    else if (amountValue > MAX_AMOUNT) errors.amount = 'Amount is too large';
    if (reference.trim().length > 200)
      errors.reference = 'Reference must be at most 200 characters';
    if (note.trim().length > 2000) errors.note = 'Note must be at most 2000 characters';

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setError(null);
    try {
      await onConfirm({
        amount: Number(amountText),
        paymentMethod: method || undefined,
        paymentDate: date || undefined,
        reference: reference.trim() || undefined,
        note: note.trim() || undefined,
      });
      onOpenChange(false);
    } catch (err) {
      if (isApiError(err) && err.errors) {
        const next: RefundFieldErrors = {};
        if (err.errors.amount?.[0]) next.amount = err.errors.amount[0];
        if (err.errors.reference?.[0]) next.reference = err.errors.reference[0];
        if (err.errors.note?.[0]) next.note = err.errors.note[0];
        if (Object.keys(next).length > 0) {
          setFieldErrors(next);
          return;
        }
      }
      setError(getErrorMessage(err));
    }
  };

  return (
    <Dialog
      visible={open}
      onClose={() => onOpenChange(false)}
      title="Refund payment?"
      message="This records a refund against the original payment. The backend validates the refundable amount against the order ledger."
      primaryAction={{
        label: isSubmitting ? 'Refunding...' : 'Record refund',
        variant: 'primary',
        loading: isSubmitting,
        onPress: handleConfirm,
      }}
      secondaryAction={{ label: 'Cancel', onPress: () => onOpenChange(false) }}
    >
      <PaymentFacts payment={payment} />
      <Input
        label="Refund amount"
        required
        value={amount}
        onChangeText={setAmount}
        error={fieldErrors.amount}
        editable={!isSubmitting}
        placeholder="0.00"
        keyboardType="decimal-pad"
      />
      <Select
        label="Refund method"
        value={method}
        options={PAYMENT_METHOD_OPTIONS}
        onChange={(value) => setMethod(value as PaymentMethod | '')}
        placeholder="Same as original"
        disabled={isSubmitting}
      />
      <DateField label="Refund date" value={date} onChange={setDate} disabled={isSubmitting} />
      <Input
        label="Reference"
        value={reference}
        onChangeText={setReference}
        error={fieldErrors.reference}
        editable={!isSubmitting}
        placeholder="Optional reference"
        maxLength={200}
      />
      <Input
        label="Note"
        value={note}
        onChangeText={setNote}
        error={fieldErrors.note}
        editable={!isSubmitting}
        placeholder="Optional note"
        multiline
        numberOfLines={2}
        maxLength={2000}
      />
      {error ? (
        <Text variant="bodySmall" tone="danger">
          {error}
        </Text>
      ) : null}
    </Dialog>
  );
}

const styles = StyleSheet.create({
  summary: { gap: 8, paddingVertical: 8 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  value: { flexShrink: 1 },
  rowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
    marginTop: 8,
  },
});
