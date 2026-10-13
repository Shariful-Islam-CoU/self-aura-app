import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar, Badge, Text } from '@/components/ui';
import { useTheme } from '@/providers';
import { radius, spacing } from '@/theme';
import { formatCurrency, formatDate } from '@/utils/format';

import { expensePaymentMethodLabel } from '../labels';
import type { Expense } from '../types';

export interface ExpenseCardProps {
  expense: Expense;
  onPress: (expenseId: string) => void;
}

/**
 * Touch-friendly expense row for the list (never a desktop table):
 * title + expense number, category, amount, payment method and date. The whole
 * card is one accessible button whose label reads every fact the visual layout
 * shows, so screen readers get the full summary too.
 */
export function ExpenseCard({ expense, onPress }: ExpenseCardProps) {
  const { theme } = useTheme();

  const label = [
    expense.title,
    `Expense ${expense.expenseNumber}`,
    expense.category.name ?? 'Uncategorized',
    formatCurrency(expense.amount),
    expensePaymentMethodLabel(expense.paymentMethod),
    `Spent ${formatDate(expense.expenseDate)}`,
  ].join(', ');

  return (
    <Pressable
      onPress={() => onPress(expense.id)}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
        pressed && { opacity: 0.7 },
      ]}
    >
      <View style={styles.topRow}>
        <Avatar name={expense.title} size="sm" />
        <View style={styles.identity}>
          <Text variant="bodyMedium" numberOfLines={1} style={styles.number}>
            {expense.title}
          </Text>
          <Text variant="caption" tone="muted" numberOfLines={1}>
            {expense.expenseNumber} · {expense.category.name ?? 'Uncategorized'}
          </Text>
        </View>
        <Badge label={expensePaymentMethodLabel(expense.paymentMethod)} tone="neutral" />
      </View>

      <View style={styles.bottomRow}>
        <Text variant="caption" tone="muted">
          {formatDate(expense.expenseDate)}
        </Text>
        <Text variant="bodyMedium" numberOfLines={1} style={styles.amount}>
          {formatCurrency(expense.amount)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
    gap: spacing.sm,
    minHeight: 44,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  identity: { flex: 1, gap: 2 },
  number: { flexShrink: 1 },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  amount: { flexShrink: 1 },
});
