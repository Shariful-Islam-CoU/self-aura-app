import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar, Badge, Text } from '@/components/ui';
import { useTheme } from '@/providers';
import { radius, spacing } from '@/theme';
import { formatDate } from '@/utils/format';
import { customerStatusLabel, customerStatusTone } from '../labels';
import type { Customer } from '../types';

export interface CustomerCardProps {
  customer: Customer;
  onPress: (customerId: string) => void;
}

/**
 * Touch-friendly customer row for the list (never a desktop table):
 * avatar + name, phone/email, the default address line when one exists,
 * then status and joined date. Only backend-provided fields are shown -
 * the customer model has no order statistics, so none are invented here.
 * The whole card is one accessible button whose label reads every fact
 * the visual layout shows, so screen readers get the full summary too.
 */
export function CustomerCard({ customer, onPress }: CustomerCardProps) {
  const { theme } = useTheme();

  const defaultAddress =
    customer.addresses.find((address) => address.isDefault) ?? customer.addresses[0];
  const addressLine = defaultAddress
    ? [defaultAddress.addressLine, defaultAddress.district, defaultAddress.city].filter(Boolean).join(', ')
    : null;

  const label = [
    customer.name,
    customer.phone,
    customer.email,
    addressLine,
    customerStatusLabel(customer.isActive),
    `Joined ${formatDate(customer.createdAt)}`,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <Pressable
      onPress={() => onPress(customer.id)}
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
        <Avatar name={customer.name} source={customer.avatarUrl} size="sm" />
        <View style={styles.identity}>
          <Text variant="bodyMedium" numberOfLines={1} style={styles.name}>
            {customer.name}
          </Text>
          <Text variant="caption" tone="muted" numberOfLines={1}>
            {customer.phone}
            {customer.email ? ` · ${customer.email}` : ''}
          </Text>
        </View>
        <Badge
          label={customerStatusLabel(customer.isActive)}
          tone={customerStatusTone(customer.isActive)}
        />
      </View>

      {addressLine ? (
        <Text variant="caption" tone="muted" numberOfLines={1}>
          {addressLine}
        </Text>
      ) : null}

      <Text variant="caption" tone="muted">
        Joined {formatDate(customer.createdAt)}
      </Text>
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
  name: { flexShrink: 1 },
});
