import { Divider } from '@/components/ui';
import { DetailRow, SectionCard } from '@/features/customers/components/SectionCard';
import { formatCurrency, formatNumber } from '@/utils/format';

import type { ExpenseSummaryData } from '../types';

interface ExpenseSummarySectionProps {
  summary: ExpenseSummaryData;
}

/**
 * Backend-computed expense totals (`GET /expenses/summary`) for the active
 * filters. Shown only when the user has `reports.expenses`; the numbers are
 * rendered exactly as the server returns them.
 */
export function ExpenseSummarySection({ summary }: ExpenseSummarySectionProps) {
  return (
    <SectionCard title="Expense summary">
      <DetailRow label="Total spent" value={formatCurrency(summary.summary.total)} emphasis />
      <DetailRow label="Expenses" value={formatNumber(summary.summary.count)} />
      {summary.byCategory.length > 0 ? (
        <>
          <Divider />
          {summary.byCategory.map((entry) => (
            <DetailRow
              key={entry.categoryId || entry.categoryName}
              label={entry.categoryName || 'Uncategorized'}
              value={formatCurrency(entry.total)}
            />
          ))}
        </>
      ) : null}
    </SectionCard>
  );
}
