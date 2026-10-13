import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { getErrorMessage } from '@/api';
import { Dialog, Text } from '@/components/ui';
import { DetailRow, SectionCard } from '@/features/customers/components/SectionCard';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format';

import { expensePaymentMethodLabel } from '../labels';
import type { Expense } from '../types';

interface ExpenseOverviewSectionProps {
  expense: Expense;
}

export function ExpenseOverviewSection({ expense }: ExpenseOverviewSectionProps) {
  return (
    <SectionCard title="Overview">
      <DetailRow label="Expense number" value={expense.expenseNumber} emphasis />
      <DetailRow label="Category" value={expense.category.name ?? expense.category.id} />
      <DetailRow label="Amount" value={formatCurrency(expense.amount)} emphasis />
      <DetailRow label="Payment method" value={expensePaymentMethodLabel(expense.paymentMethod)} />
      <DetailRow label="Expense date" value={formatDate(expense.expenseDate)} />
      {expense.reference ? <DetailRow label="Reference" value={expense.reference} /> : null}
    </SectionCard>
  );
}

export function ExpenseAuditSection({ expense }: ExpenseOverviewSectionProps) {
  return (
    <SectionCard title="Record">
      <DetailRow label="Created by" value={expense.createdBy.username ?? expense.createdBy.id} />
      <DetailRow label="Created" value={formatDateTime(expense.createdAt)} />
      <DetailRow label="Last updated" value={formatDateTime(expense.updatedAt)} />
    </SectionCard>
  );
}

export function ExpenseDescriptionSection({ expense }: ExpenseOverviewSectionProps) {
  if (!expense.description) return null;
  return (
    <SectionCard title="Description">
      <Text variant="body">{expense.description}</Text>
    </SectionCard>
  );
}

export function ExpenseNotesSection({ expense }: ExpenseOverviewSectionProps) {
  if (!expense.note) return null;
  return (
    <SectionCard title="Notes">
      <Text variant="body">{expense.note}</Text>
    </SectionCard>
  );
}

interface ExpenseDeleteDialogProps {
  open: boolean;
  expense: Expense | null;
  isSubmitting: boolean;
  onConfirm: () => Promise<void>;
  onOpenChange: (open: boolean) => void;
}

/**
 * Confirms the backend's soft delete (`DELETE /expenses/:id`). The action is
 * never faked: a rejected request surfaces the server's own message and the
 * dialog stays open so the user can retry or cancel.
 */
export function ExpenseDeleteDialog({
  open,
  expense,
  isSubmitting,
  onConfirm,
  onOpenChange,
}: ExpenseDeleteDialogProps) {
  const [error, setError] = useState<string | null>(null);

  // Clear the previous failure when the dialog (re)opens, without an effect.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setError(null);
  }

  if (!expense) return null;

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
      title="Delete expense?"
      message="This removes the expense from all lists, reports and totals. The record is soft-deleted by the backend and cannot be undone from the app."
      primaryAction={{
        label: isSubmitting ? 'Deleting...' : 'Delete expense',
        variant: 'danger',
        loading: isSubmitting,
        onPress: handleConfirm,
      }}
      secondaryAction={{ label: 'Keep expense', onPress: () => onOpenChange(false) }}
    >
      <View style={styles.summary}>
        <View style={styles.row}>
          <Text variant="bodySmall" tone="muted">
            Expense
          </Text>
          <Text variant="bodyMedium" numberOfLines={1} style={styles.value}>
            {expense.expenseNumber}
          </Text>
        </View>
        <View style={styles.row}>
          <Text variant="bodySmall" tone="muted">
            Title
          </Text>
          <Text variant="bodyMedium" numberOfLines={1} style={styles.value}>
            {expense.title}
          </Text>
        </View>
        <View style={styles.rowTotal}>
          <Text variant="bodySmall" tone="muted">
            Amount
          </Text>
          <Text variant="subtitle">{formatCurrency(expense.amount)}</Text>
        </View>
        {error ? (
          <Text variant="bodySmall" tone="danger">
            {error}
          </Text>
        ) : null}
      </View>
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
