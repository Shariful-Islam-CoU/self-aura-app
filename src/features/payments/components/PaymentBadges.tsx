import { Badge } from '@/components/ui';

import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_TONES,
  PAYMENT_TYPE_LABELS,
  PAYMENT_TYPE_TONES,
} from '../labels';
import type { PaymentMethod, PaymentStatus, PaymentType } from '../types';

/**
 * Payment status/method/type pills. The label text is always rendered, so
 * status and meaning are never conveyed by color alone.
 */
export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return <Badge label={PAYMENT_STATUS_LABELS[status]} tone={PAYMENT_STATUS_TONES[status]} />;
}

export function PaymentTypeBadge({ type }: { type: PaymentType }) {
  return (
    <Badge
      label={PAYMENT_TYPE_LABELS[type]}
      tone={PAYMENT_TYPE_TONES[type]}
      variant={type === 'refund' ? 'soft' : 'outline'}
    />
  );
}

export function PaymentMethodBadge({ method }: { method: PaymentMethod }) {
  return <Badge label={PAYMENT_METHOD_LABELS[method]} tone="neutral" variant="outline" />;
}
