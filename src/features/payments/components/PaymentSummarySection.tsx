import { Divider } from '@/components/ui';
import { DetailRow, SectionCard } from '@/features/customers/components/SectionCard';
import { formatCurrency, formatNumber } from '@/utils/format';

import type { PaymentSummaryData } from '../types';

interface PaymentSummarySectionProps {
  summary: PaymentSummaryData;
}

/**
 * Backend-computed ledger totals (`GET /payments/summary`) for the active
 * filters. Every number is rendered exactly as the server returns it - the app
 * never sums payments or derives net received locally. The backend defaults the
 * summary to completed payments, so these figures reflect received income.
 */
export function PaymentSummarySection({ summary }: PaymentSummarySectionProps) {
  return (
    <SectionCard title="Summary">
      <DetailRow
        label="Net received"
        value={formatCurrency(summary.summary.netReceived)}
        emphasis
      />
      <DetailRow label="Payments" value={formatCurrency(summary.summary.totalPayments)} />
      <Divider />
      <DetailRow label="Refunds" value={formatCurrency(summary.summary.totalRefunds)} />
      <DetailRow
        label="Counts"
        value={`${formatNumber(summary.summary.paymentCount)} paid · ${formatNumber(
          summary.summary.refundCount,
        )} refunded`}
      />
    </SectionCard>
  );
}
