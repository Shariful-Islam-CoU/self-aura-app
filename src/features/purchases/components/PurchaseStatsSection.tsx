import { formatCurrency, formatNumber } from '@/utils/format';
import type { PurchaseStatsTotals } from '../types';
import { SectionCard, DetailRow } from '@/features/customers/components/SectionCard';

interface PurchaseStatsSectionProps {
  totals: PurchaseStatsTotals;
}

export function PurchaseStatsSection({ totals }: PurchaseStatsSectionProps) {
  return (
    <SectionCard title="Purchase statistics">
      <DetailRow
        label="Total purchases this period"
        value={formatNumber(totals.purchaseCount)}
        emphasis
      />
      <DetailRow label="Received" value={formatNumber(totals.receivedCount)} />
      <DetailRow label="Draft" value={formatNumber(totals.draftCount)} />
      <DetailRow label="Cancelled" value={formatNumber(totals.cancelledCount)} />
      <DetailRow label="Total spent" value={formatCurrency(totals.totalSpent)} emphasis />
    </SectionCard>
  );
}
