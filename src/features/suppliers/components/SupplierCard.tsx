import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar, Badge, Text } from '@/components/ui';
import { useTheme } from '@/providers';
import { radius, spacing } from '@/theme';
import { formatDate } from '@/utils/format';
import { supplierStatusLabel, supplierStatusTone } from '../labels';
import type { Supplier } from '../types';

export interface SupplierCardProps {
  supplier: Supplier;
  onPress: (supplierId: string) => void;
}

/**
 * Touch-friendly supplier row for the list (never a desktop table):
 * avatar + name, phone/email, address line when one exists,
 * then status and joined date. Only backend-provided fields are shown.
 * The whole card is one accessible button whose label reads every fact
 * the visual layout shows, so screen readers get the full summary too.
 */
export function SupplierCard({ supplier, onPress }: SupplierCardProps) {
  const { theme } = useTheme();

  const addressLine = supplier.address ? supplier.address.split('\n')[0].trim() : null;

  const label = [
    supplier.name,
    supplier.phone,
    supplier.email,
    addressLine,
    supplierStatusLabel(supplier.isActive),
    `Joined ${formatDate(supplier.createdAt)}`,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <Pressable
      onPress={() => onPress(supplier.id)}
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
        <Avatar name={supplier.name} size="sm" />
        <View style={styles.identity}>
          <Text variant="bodyMedium" numberOfLines={1} style={styles.name}>
            {supplier.name}
          </Text>
          <Text variant="caption" tone="muted" numberOfLines={1}>
            {supplier.phone}
            {supplier.email ? ` · ${supplier.email}` : ''}
          </Text>
        </View>
        <Badge
          label={supplierStatusLabel(supplier.isActive)}
          tone={supplierStatusTone(supplier.isActive)}
        />
      </View>

      {addressLine ? (
        <Text variant="caption" tone="muted" numberOfLines={1}>
          {addressLine}
        </Text>
      ) : null}

      <Text variant="caption" tone="muted">
        Joined {formatDate(supplier.createdAt)}
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
