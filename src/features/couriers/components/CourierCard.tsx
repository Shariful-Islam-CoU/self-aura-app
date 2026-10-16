import { Pressable, StyleSheet, View } from 'react-native';

import { Badge, Text } from '@/components/ui';
import { useTheme } from '@/providers';
import { radius, spacing } from '@/theme';
import { courierStatusLabel, courierStatusTone } from '../labels';
import type { Courier } from '../types';

export interface CourierCardProps {
  courier: Courier;
  onPress: (courierId: string) => void;
}

/**
 * Touch-friendly courier row for the list: name, optional contact details and
 * the active/inactive badge. The whole card is one accessible button whose
 * label reads every fact the visual layout shows.
 */
export function CourierCard({ courier, onPress }: CourierCardProps) {
  const { theme } = useTheme();

  const label = [
    courier.name,
    courierStatusLabel(courier.isActive),
    courier.contactPerson ? `Contact ${courier.contactPerson}` : null,
    courier.phone ? `Phone ${courier.phone}` : null,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <Pressable
      onPress={() => onPress(courier.id)}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        pressed && { opacity: 0.7 },
      ]}
    >
      <Text variant="bodyMedium" numberOfLines={1}>
        {courier.name}
      </Text>
      {courier.contactPerson ? (
        <Text variant="caption" tone="muted" numberOfLines={1}>
          Contact: {courier.contactPerson}
        </Text>
      ) : null}
      {courier.phone ? (
        <Text variant="caption" tone="muted" numberOfLines={1}>
          Phone: {courier.phone}
        </Text>
      ) : null}
      <View style={styles.badges}>
        <Badge
          label={courierStatusLabel(courier.isActive)}
          tone={courierStatusTone(courier.isActive)}
        />
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
  badges: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
});
