import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';

import { BottomSheet, IconButton, Text } from '@/components/ui';
import { env } from '@/config/env';
import { useTheme } from '@/providers';
import { spacing } from '@/theme';
import type { Order, OrderShippingAddress } from '../types';

type ContactField = 'name' | 'phone' | 'address' | 'orderUrl';

export interface OrderContactSheetProps {
  /** Order whose customer contact is shown; `null` while closed. */
  order: Order | null;
  visible: boolean;
  onClose: () => void;
}

/**
 * Plain-text address in the customer-address schema: the address line plus
 * the administrative parts that are actually present. Parts are labelled so
 * the copied value stays readable outside the app; empty parts are skipped.
 */
export function formatOrderAddress(address: OrderShippingAddress): string {
  return [
    address.addressLine?.trim(),
    address.area?.trim() ? `Area: ${address.area.trim()}` : '',
    address.city?.trim() ? `City: ${address.city.trim()}` : '',
    address.district?.trim() ? `District: ${address.district.trim()}` : '',
    address.postalCode?.trim() ? `Postal code: ${address.postalCode.trim()}` : '',
  ]
    .filter(Boolean)
    .join(', ');
}

/**
 * Long-press contact sheet for an order: customer details and a link to the
 * order on the web storefront. Each value has its own copy button; the icon
 * turns into a check once the clipboard write succeeds.
 */
export function OrderContactSheet({ order, visible, onClose }: OrderContactSheetProps) {
  const { theme } = useTheme();
  const [copiedField, setCopiedField] = useState<ContactField | null>(null);

  const name = order
    ? order.customer.name?.trim() || order.shippingAddress.recipientName?.trim() || ''
    : '';
  const phone = order
    ? order.customer.phone?.trim() || order.shippingAddress.phone?.trim() || ''
    : '';
  const address = order ? formatOrderAddress(order.shippingAddress) : '';
  const orderUrl = order
    ? `${env.webBaseUrl}/account/orders/${encodeURIComponent(order.orderNumber)}`
    : '';

  const rows: { field: ContactField; label: string; value: string }[] = [
    { field: 'name', label: 'Name', value: name },
    { field: 'phone', label: 'Phone number', value: phone },
    { field: 'address', label: 'Address', value: address },
    { field: 'orderUrl', label: 'Order URL', value: orderUrl },
  ];

  const handleClose = () => {
    // The next open starts from the copy icons again, never a stale tick.
    setCopiedField(null);
    onClose();
  };

  const copyValue = async (field: ContactField, value: string) => {
    if (!value) return;
    try {
      await Clipboard.setStringAsync(value);
      setCopiedField(field);
    } catch {
      // Clipboard unavailable - leave the copy icon unchanged; nothing was copied.
    }
  };

  return (
    <BottomSheet visible={visible} onClose={handleClose} title="Customer details">
      <View style={styles.rows}>
        {rows.map((row, index) => {
          const copied = copiedField === row.field;
          return (
            <View
              key={row.field}
              style={[
                styles.row,
                index > 0 && {
                  borderTopWidth: StyleSheet.hairlineWidth,
                  borderTopColor: theme.colors.border,
                },
              ]}
            >
              <View style={styles.rowText}>
                <Text variant="caption" tone="muted">
                  {row.label}
                </Text>
                <Text variant="bodyMedium" tone={row.value ? 'default' : 'muted'}>
                  {row.value || 'Not provided'}
                </Text>
              </View>
              <IconButton
                icon={copied ? 'checkmark' : 'copy-outline'}
                color={copied ? theme.colors.success : undefined}
                accessibilityLabel={
                  copied ? `${row.label} copied` : `Copy ${row.label.toLowerCase()}`
                }
                disabled={!row.value}
                onPress={() => void copyValue(row.field, row.value)}
              />
            </View>
          );
        })}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  rows: { paddingBottom: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  rowText: { flex: 1, gap: 2 },
});
