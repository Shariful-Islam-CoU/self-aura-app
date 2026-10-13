import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Badge, Text } from '@/components/ui';
import { useTheme } from '@/providers';
import { radius, spacing } from '@/theme';

import { EXPENSE_CATEGORY_STATUS_TONES } from '../labels';
import type { ExpenseCategory } from '../types';

export interface ExpenseCategoryCardProps {
  category: ExpenseCategory;
  /** Omitted when the user cannot edit categories - the row is then read-only. */
  onPress?: (category: ExpenseCategory) => void;
  /** Optional trailing control (e.g. a deactivate icon button). */
  action?: ReactNode;
}

/**
 * Expense-category row for the manager screen. Active categories are the only
 * ones offered when recording an expense, so the active/inactive state is the
 * key fact and is rendered as visible text (never color alone). The info area
 * and the trailing action are separate pressables so a row tap never triggers
 * the action by accident.
 */
export function ExpenseCategoryCard({ category, onPress, action }: ExpenseCategoryCardProps) {
  const { theme } = useTheme();
  const status = category.isActive ? 'active' : 'inactive';

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
      ]}
    >
      <Pressable
        disabled={!onPress}
        onPress={() => onPress?.(category)}
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={`${category.name}, ${status}`}
        accessibilityHint={onPress ? 'Opens the category editor' : undefined}
        style={({ pressed }) => [styles.info, pressed && onPress ? { opacity: 0.7 } : null]}
      >
        <Text variant="bodyMedium" numberOfLines={1}>
          {category.name}
        </Text>
        {category.description ? (
          <Text variant="caption" tone="muted" numberOfLines={2}>
            {category.description}
          </Text>
        ) : null}
      </Pressable>

      <View style={styles.trailing}>
        <Badge
          label={category.isActive ? 'Active' : 'Inactive'}
          tone={EXPENSE_CATEGORY_STATUS_TONES[status]}
        />
        {action}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
  },
  info: { flex: 1, gap: 2, paddingVertical: spacing.xs },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
});
