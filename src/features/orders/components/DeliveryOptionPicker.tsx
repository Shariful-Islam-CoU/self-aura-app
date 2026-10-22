import { Pressable, StyleSheet, View } from 'react-native';

import { Card, Radio, SectionHeader, Text } from '@/components/ui';
import { useTheme } from '@/providers';
import { spacing } from '@/theme';
import { formatCurrency } from '@/utils/format';
import type { PublicDeliveryRule } from '../types';

export interface DeliveryOptionPickerProps {
  rules: PublicDeliveryRule[];
  /** True while the rules list is being fetched. */
  isLoading: boolean;
  /**
   * The rules fetch failed. Creation still works - the backend falls back to
   * a 0 delivery charge when no rule is sent - so this is informational.
   */
  loadFailed: boolean;
  selectedRuleId: string | null;
  onSelect: (ruleId: string) => void;
  /** Server-side message for the current selection (e.g. rule deactivated). */
  error?: string | null;
  disabled?: boolean;
}

/**
 * Delivery-option picker for the create-order form: the mobile counterpart
 * of the storefront checkout's `DeliveryRulesList`. Same contract - active
 * rules sorted by price descending, the highest selected by default, free
 * rules shown as FREE - so staff and shoppers pick from an identical list.
 * The chosen rule's id is sent as `selectedRuleId` and its price becomes
 * the order's delivery charge (server-authoritative).
 */
export function DeliveryOptionPicker({
  rules,
  isLoading,
  loadFailed,
  selectedRuleId,
  onSelect,
  error,
  disabled = false,
}: DeliveryOptionPickerProps) {
  const { theme } = useTheme();

  return (
    <View>
      <SectionHeader title="Delivery option" />
      <Card style={styles.card}>
        <Text variant="caption" tone="muted">
          Select a delivery option. The highest price is selected by default. Admin can
          correct wrong selections on the order page.
        </Text>

        {isLoading ? (
          <Text variant="bodySmall" tone="muted">
            Loading delivery options…
          </Text>
        ) : loadFailed ? (
          <Text variant="bodySmall" tone="muted">
            Delivery options could not be loaded. The order will be created with a 0
            delivery charge.
          </Text>
        ) : rules.length === 0 ? (
          <Text variant="bodySmall" tone="muted">
            No delivery options available. The order will be created with a 0 delivery
            charge.
          </Text>
        ) : (
          <View style={styles.rows}>
            {rules.map((rule) => {
              const isSelected = rule.id === selectedRuleId;
              return (
                <Pressable
                  key={rule.id}
                  onPress={() => onSelect(rule.id)}
                  disabled={disabled}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected, disabled }}
                  accessibilityLabel={`${rule.name}, ${
                    rule.price === 0 ? 'free' : formatCurrency(rule.price)
                  } delivery, ${rule.estimatedMinDays} to ${rule.estimatedMaxDays} days`}
                  style={({ pressed }) => [
                    styles.row,
                    isSelected && { backgroundColor: theme.colors.surfaceMuted },
                    pressed && { opacity: 0.72 },
                  ]}
                >
                  <Radio selected={isSelected} onSelect={() => onSelect(rule.id)} disabled={disabled} />
                  <View style={styles.rowBody}>
                    <Text variant="bodyMedium" style={styles.name}>
                      {rule.name}
                    </Text>
                    <Text variant="caption" tone="muted">
                      {rule.estimatedMinDays}–{rule.estimatedMaxDays} days
                    </Text>
                  </View>
                  <Text
                    variant="subtitle"
                    tone={rule.price === 0 ? 'success' : 'default'}
                    style={styles.price}
                  >
                    {rule.price === 0 ? 'FREE' : formatCurrency(rule.price)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {error ? (
          <Text variant="bodySmall" tone="danger" role="alert">
            {error}
          </Text>
        ) : null}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  rows: { gap: spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minHeight: 44,
  },
  rowBody: { flex: 1, gap: 2 },
  name: { flexShrink: 1 },
  price: { fontVariant: ['tabular-nums'] },
});
