import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { formatCurrency } from '@/utils/format';
import { formatDate } from '@/utils/format';
import { spacing } from '@/theme';
import { purchaseStatusLabel } from '../labels';
import type { Purchase } from '../types';
import { SectionCard, DetailRow } from '@/features/customers/components/SectionCard';
import { Dialog } from '@/components/ui';
import { useState } from 'react';

interface PurchaseOverviewSectionProps {
  purchase: Purchase;
}

export function PurchaseOverviewSection({ purchase }: PurchaseOverviewSectionProps) {
  return (
    <SectionCard title="Overview">
      <DetailRow label="Purchase number" value={purchase.purchaseNumber} emphasis />
      <DetailRow label="Status" value={purchaseStatusLabel(purchase.status)} />
      <DetailRow label="Purchase date" value={formatDate(purchase.purchaseDate)} />
      <DetailRow label="Ordered on" value={formatDate(purchase.createdAt)} />
      <DetailRow label="Last updated" value={formatDate(purchase.updatedAt)} />
      <DetailRow label="Created by" value={purchase.createdBy.username ?? purchase.createdBy.id} />
    </SectionCard>
  );
}

interface PurchaseSupplierSectionProps {
  purchase: Purchase;
}

export function PurchaseSupplierSection({ purchase }: PurchaseSupplierSectionProps) {
  const s = purchase.supplier;
  return (
    <SectionCard title="Supplier">
      <DetailRow label="Name" value={s.name ?? s.id} emphasis />
      {s.phone ? <DetailRow label="Phone" value={s.phone} /> : null}
      {s.email ? <DetailRow label="Email" value={s.email} /> : null}
    </SectionCard>
  );
}

interface PurchaseItemsSectionProps {
  purchase: Purchase;
}

export function PurchaseItemsSection({ purchase }: PurchaseItemsSectionProps) {
  if (purchase.items.length === 0) return null;

  return (
    <SectionCard title={`Items (${purchase.items.length})`}>
      {purchase.items.map((item) => (
        <View key={item.id} style={styles.itemRow}>
          <View style={styles.itemLeft}>
            <Text variant="bodyMedium" numberOfLines={1}>
              {item.productName}
            </Text>
            <Text variant="caption" tone="muted">
              SKU: {item.sku}
            </Text>
          </View>
          <View style={styles.itemRight}>
            <Text variant="bodyMedium" numberOfLines={1} style={styles.lineCost}>
              {formatCurrency(item.unitCost)} × {item.quantity}
            </Text>
            <Text variant="subtitle" style={styles.lineTotal} align="right">
              {formatCurrency(item.subtotal)}
            </Text>
          </View>
        </View>
      ))}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  itemLeft: { flex: 1 },
  itemRight: { alignItems: 'flex-end', gap: 2 },
  lineCost: { fontSize: 12 },
  lineTotal: { fontWeight: '600' },
});

interface PurchaseFinancialSectionProps {
  purchase: Purchase;
}

export function PurchaseFinancialSection({ purchase }: PurchaseFinancialSectionProps) {
  return (
    <SectionCard title="Financial Summary">
      <DetailRow label="Subtotal" value={formatCurrency(purchase.subtotal)} />
      {purchase.additionalCost > 0 ? (
        <DetailRow label="Additional cost" value={formatCurrency(purchase.additionalCost)} />
      ) : null}
      <DetailRow label="Total" value={formatCurrency(purchase.total)} emphasis />
    </SectionCard>
  );
}

interface PurchaseNotesSectionProps {
  purchase: Purchase;
}

export function PurchaseNotesSection({ purchase }: PurchaseNotesSectionProps) {
  if (!purchase.note) return null;

  return (
    <SectionCard title="Note">
      <DetailRow label="Note" value={purchase.note} />
    </SectionCard>
  );
}

interface PurchaseReceiveDialogProps {
  open: boolean;
  purchase: Purchase | null;
  isSubmitting: boolean;
  onConfirm: () => Promise<void>;
  onOpenChange: (open: boolean) => void;
}

export function PurchaseReceiveDialog({
  open,
  purchase,
  isSubmitting,
  onConfirm,
  onOpenChange,
}: PurchaseReceiveDialogProps) {
  const [error, setError] = useState<string | null>(null);

  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setError(null);
  }

  if (!purchase) return null;

  const handleConfirm = async () => {
    setError(null);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to receive the purchase. Please try again.',
      );
    }
  };

  return (
    <Dialog
      visible={open}
      onClose={() => onOpenChange(false)}
      title={`Receive purchase ${purchase.purchaseNumber}?`}
      message="Only draft purchases can be received. Receiving marks the purchase as received and the backend updates inventory and records the actual received totals."
      primaryAction={{
        label: isSubmitting ? 'Receiving...' : 'Receive purchase',
        variant: 'primary',
        loading: isSubmitting,
        onPress: handleConfirm,
      }}
      secondaryAction={{ label: 'Cancel', onPress: () => onOpenChange(false) }}
    >
      <View style={dialogStyles.dialogSummary}>
        <View style={dialogStyles.dialogRow}>
          <Text variant="bodySmall" tone="muted">
            Supplier
          </Text>
          <Text variant="bodyMedium">{purchase.supplier.name ?? purchase.supplier.id}</Text>
        </View>
        <View style={dialogStyles.dialogRow}>
          <Text variant="bodySmall" tone="muted">
            Line items
          </Text>
          <Text variant="bodyMedium">{purchase.items.length}</Text>
        </View>
        <View style={dialogStyles.dialogRowTotal}>
          <Text variant="bodySmall" tone="muted">
            Estimated total
          </Text>
          <Text variant="subtitle">{formatCurrency(purchase.total)}</Text>
        </View>
      </View>

      {error && (
        <View role="alert" style={[dialogStyles.formError, { borderColor: 'red' }]}>
          <Text variant="bodySmall" tone="danger">
            {error}
          </Text>
        </View>
      )}
    </Dialog>
  );
}

interface PurchaseCancelDialogProps {
  open: boolean;
  purchase: Purchase | null;
  isSubmitting: boolean;
  onConfirm: () => Promise<void>;
  onOpenChange: (open: boolean) => void;
}

export function PurchaseCancelDialog({
  open,
  purchase,
  isSubmitting,
  onConfirm,
  onOpenChange,
}: PurchaseCancelDialogProps) {
  if (!purchase) return null;

  const handleConfirm = async () => {
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (err) {
      // Error will be handled by the caller
      onOpenChange(false);
    }
  };

  return (
    <Dialog
      visible={open}
      onClose={() => onOpenChange(false)}
      title={`Cancel purchase ${purchase.purchaseNumber}?`}
      message="The purchase must be a draft to be cancelled. Only owners and managers can cancel purchases. Cancelling cannot be undone."
      primaryAction={{
        label: isSubmitting ? 'Cancelling...' : 'Cancel purchase',
        variant: 'danger',
        loading: isSubmitting,
        onPress: handleConfirm,
      }}
      secondaryAction={{ label: 'Keep purchase', onPress: () => onOpenChange(false) }}
    >
      <View style={dialogStyles.dialogSummary}>
        <View style={dialogStyles.dialogRow}>
          <Text variant="bodySmall" tone="muted">
            Supplier
          </Text>
          <Text variant="bodyMedium">{purchase.supplier.name ?? purchase.supplier.id}</Text>
        </View>
        <View style={dialogStyles.dialogRow}>
          <Text variant="bodySmall" tone="muted">
            Items
          </Text>
          <Text variant="bodyMedium">{purchase.items.length} line(s)</Text>
        </View>
        <View style={dialogStyles.dialogRowTotal}>
          <Text variant="bodySmall" tone="muted">
            Total
          </Text>
          <Text variant="subtitle">{formatCurrency(purchase.total)}</Text>
        </View>
      </View>
    </Dialog>
  );
}

const dialogStyles = StyleSheet.create({
  dialogSummary: { gap: 8, paddingVertical: 8 },
  dialogRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dialogRowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
    marginTop: 8,
  },
  formError: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
  },
});
