import { Linking, StyleSheet, View } from 'react-native';

import { Avatar, Badge, Chip, IconButton, Text } from '@/components/ui';
import { useTheme } from '@/providers';
import { spacing } from '@/theme';
import { formatDateTime } from '@/utils/format';
import { customerStatusLabel, customerStatusTone } from '../labels';
import type { Customer, CustomerAddress } from '../types';
import { DetailRow, SectionCard } from './SectionCard';

/** Avatar + identity, status, and record timestamps. */
export function CustomerOverviewSection({ customer }: { customer: Customer }) {
  return (
    <SectionCard title="Overview">
      <View style={styles.identity}>
        <Avatar name={customer.name} source={customer.avatarUrl} size="md" />
        <View style={styles.identityText}>
          <Text variant="subtitle" numberOfLines={2}>
            {customer.name}
          </Text>
          <Text variant="caption" tone="muted">
            Customer since {formatDateTime(customer.createdAt)}
          </Text>
        </View>
      </View>
      <DetailRow label="Status">
        <Badge
          label={customerStatusLabel(customer.isActive)}
          tone={customerStatusTone(customer.isActive)}
        />
      </DetailRow>
      <DetailRow label="Sign-in">
        <Badge
          label={
            customer.authType === 'google'
              ? 'Google'
              : customer.authType === 'password'
                ? 'Phone / email + password'
                : 'No online login'
          }
          tone={
            customer.authType === 'google'
              ? 'info'
              : customer.authType === 'password'
                ? 'success'
                : 'neutral'
          }
        />
      </DetailRow>
      {customer.mustChangePassword ? (
        <DetailRow label="Password">
          <Badge label="Must change" tone="warning" />
        </DetailRow>
      ) : null}
      <DetailRow
        label="Last sign-in"
        value={customer.lastLoginAt ? formatDateTime(customer.lastLoginAt) : 'Never'}
      />
      <DetailRow label="Last updated" value={formatDateTime(customer.updatedAt)} />
    </SectionCard>
  );
}

/**
 * Phone/email contact rows. Phones are tappable exactly like the Orders
 * module's customer row (system dialer via `tel:`; failures are reported
 * by the screen as a toast - the row never pretends the app opened).
 */
export function CustomerContactSection({
  customer,
  onActionFailed,
}: {
  customer: Customer;
  onActionFailed: (message: string) => void;
}) {
  const handleCall = async (phone: string) => {
    try {
      await Linking.openURL(`tel:${phone.replace(/[^\d+]/g, '')}`);
    } catch {
      onActionFailed('Could not open the phone app.');
    }
  };

  const phones = [
    { label: 'Phone', value: customer.phone },
    { label: 'Alternate phone', value: customer.alternatePhone },
  ].filter((row): row is { label: string; value: string } => Boolean(row.value));

  return (
    <SectionCard title="Contact">
      {phones.map((row) => (
        <DetailRow key={row.label} label={row.label}>
          <View style={styles.callRow}>
            <Text variant="bodyMedium" numberOfLines={1}>
              {row.value}
            </Text>
            <IconButton
              icon="call-outline"
              accessibilityLabel={`Call ${customer.name} at ${row.value}`}
              onPress={() => void handleCall(row.value)}
            />
          </View>
        </DetailRow>
      ))}
      {customer.email ? <DetailRow label="Email" value={customer.email} /> : null}
      {phones.length === 0 && !customer.email ? (
        <Text variant="bodySmall" tone="muted">
          No contact details saved for this customer.
        </Text>
      ) : null}
    </SectionCard>
  );
}

/**
 * Private management-only social fields. Display/open at the user's
 * request - never an automatic Facebook API call or profile fetch.
 */
export function CustomerSocialSection({
  customer,
  onActionFailed,
}: {
  customer: Customer;
  onActionFailed: (message: string) => void;
}) {
  const handleOpen = async () => {
    const url = customer.facebookProfileUrl?.trim();
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch {
      onActionFailed('Could not open the Facebook profile link.');
    }
  };

  return (
    <SectionCard title="Social information">
      {customer.facebookName ? (
        <DetailRow label="Facebook name" value={customer.facebookName} />
      ) : null}
      {customer.facebookProfileUrl ? (
        <DetailRow label="Profile">
          <View style={styles.callRow}>
            <Text variant="bodyMedium" numberOfLines={1}>
              {customer.facebookProfileUrl}
            </Text>
            <IconButton
              icon="open-outline"
              accessibilityLabel="Open Facebook profile in browser"
              onPress={() => void handleOpen()}
            />
          </View>
        </DetailRow>
      ) : null}
    </SectionCard>
  );
}

function AddressCard({ address }: { address: CustomerAddress }) {
  const { theme } = useTheme();
  const areaLine = [address.district, address.area, address.city].filter(Boolean).join(', ');
  const postalLine = [address.postalCode, address.country].filter(Boolean).join(', ');

  return (
    <View
      style={[
        styles.address,
        { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceMuted },
      ]}
    >
      <View style={styles.addressHeader}>
        <Text variant="bodyMedium">{address.label}</Text>
        {address.isDefault ? <Badge label="Default" tone="info" /> : null}
      </View>
      {address.recipientName ? <Text variant="bodyMedium">{address.recipientName}</Text> : null}
      <Text variant="bodySmall" tone="secondary">
        {address.addressLine}
      </Text>
      {areaLine ? (
        <Text variant="bodySmall" tone="muted">
          {areaLine}
        </Text>
      ) : null}
      {postalLine ? (
        <Text variant="bodySmall" tone="muted">
          {postalLine}
        </Text>
      ) : null}
      {address.phone ? (
        <Text variant="bodySmall" tone="muted">
          {address.phone}
        </Text>
      ) : null}
    </View>
  );
}

/** Every stored address (backend order preserved); empty state when none. */
export function CustomerAddressSection({ customer }: { customer: Customer }) {
  return (
    <SectionCard title={customer.addresses.length > 0 ? 'Addresses' : 'Address'}>
      {customer.addresses.length > 0 ? (
        <View style={styles.addresses}>
          {customer.addresses.map((address) => (
            <AddressCard key={address.id} address={address} />
          ))}
        </View>
      ) : (
        <Text variant="bodySmall" tone="muted">
          No addresses saved for this customer.
        </Text>
      )}
    </SectionCard>
  );
}

/** Tags as chips + free-text notes (rendered only when at least one exists). */
export function CustomerNotesSection({ customer }: { customer: Customer }) {
  return (
    <SectionCard title="Notes & tags">
      {customer.tags.length > 0 ? (
        <View style={styles.tags}>
          {customer.tags.map((tag) => (
            <Chip key={tag} label={tag} />
          ))}
        </View>
      ) : null}
      {customer.notes ? (
        <Text variant="bodySmall" tone="secondary">
          {customer.notes}
        </Text>
      ) : (
        <Text variant="bodySmall" tone="muted">
          No notes for this customer.
        </Text>
      )}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  identityText: { flex: 1, gap: 2 },
  callRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexShrink: 1,
    justifyContent: 'flex-end',
  },
  addresses: { gap: spacing.md },
  address: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
