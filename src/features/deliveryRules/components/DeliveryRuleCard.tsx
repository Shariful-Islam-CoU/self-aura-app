import { StyleSheet, View } from 'react-native';

import { Badge, Card, IconButton, Switch, Text } from '@/components/ui';
import { spacing } from '@/theme';
import { formatCurrency } from '@/utils/format';
import type { DeliveryRule } from '../types';

export interface DeliveryRuleCardProps {
  rule: DeliveryRule;
  canEdit: boolean;
  /** Disabled while this rule's toggle request is in flight. */
  toggling: boolean;
  onEdit: (rule: DeliveryRule) => void;
  onToggle: (rule: DeliveryRule, isActive: boolean) => void;
}

/**
 * Touch-friendly delivery-rule row: name + price (FREE when 0), ETA/sort
 * line, active badge and - when the user may edit - an inline active toggle
 * plus an Edit button. The backend re-validates every request.
 */
export function DeliveryRuleCard({
  rule,
  canEdit,
  toggling,
  onEdit,
  onToggle,
}: DeliveryRuleCardProps) {
  const priceLabel = rule.price === 0 ? 'FREE' : formatCurrency(rule.price);

  return (
    <Card style={styles.card}>
      <View style={styles.topRow}>
        <Text variant="bodyMedium" numberOfLines={1} style={styles.name}>
          {rule.name}
        </Text>
        <Text variant="bodyMedium" tone={rule.price === 0 ? 'success' : 'default'}>
          {priceLabel}
        </Text>
      </View>

      <Text variant="caption" tone="muted" numberOfLines={1}>
        ETA {rule.estimatedMinDays}–{rule.estimatedMaxDays} days · Sort order {rule.sortOrder}
      </Text>

      <View style={styles.footer}>
        <Badge
          label={rule.isActive ? 'Active' : 'Inactive'}
          tone={rule.isActive ? 'success' : 'neutral'}
        />
        {canEdit ? (
          <View style={styles.actions}>
            <Switch
              value={rule.isActive}
              onValueChange={(value) => onToggle(rule, value)}
              accessibilityLabel={`${rule.name} active`}
              disabled={toggling}
            />
            <IconButton
              icon="create-outline"
              accessibilityLabel={`Edit delivery rule ${rule.name}`}
              onPress={() => onEdit(rule)}
              disabled={toggling}
            />
          </View>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  name: { flex: 1 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
