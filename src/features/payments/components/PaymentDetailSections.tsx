import { Button, Divider, Text } from '@/components/ui';
import { DetailRow, SectionCard } from '@/features/customers/components/SectionCard';
import { ORDER_STATUS_LABELS } from '@/features/orders/labels';
import type { Order } from '@/features/orders/types';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format';

import { paymentMethodLabel } from '../labels';
import { isManualPaymentMethod, type Payment } from '../types';
import { PaymentStatusBadge, PaymentTypeBadge } from './PaymentBadges';

interface PaymentSectionProps {
  payment: Payment;
}

/** Core payment facts (number, amount, type, method, status, date, reference). */
export function PaymentOverviewSection({ payment }: PaymentSectionProps) {
  return (
    <SectionCard title="Payment summary">
      <DetailRow label="Payment number" value={payment.paymentNumber} emphasis />
      <DetailRow label="Amount" value={formatCurrency(payment.amount)} emphasis />
      <DetailRow label="Type">
        <PaymentTypeBadge type={payment.paymentType} />
      </DetailRow>
      <DetailRow label="Status">
        <PaymentStatusBadge status={payment.paymentStatus} />
      </DetailRow>
      <DetailRow label="Method" value={paymentMethodLabel(payment.paymentMethod)} />
      <DetailRow label="Payment date" value={formatDate(payment.paymentDate)} />
      {payment.reference ? (
        <DetailRow label="Reference / transaction ID" value={payment.reference} />
      ) : null}
    </SectionCard>
  );
}

interface PaymentOrderSectionProps {
  payment: Payment;
  /** The related order, loaded through the Orders module when permitted. */
  order?: Order;
  orderLoading?: boolean;
  onViewOrder: (orderId: string) => void;
}

/**
 * Related order block. Order number/total come from the payment payload; the
 * full order (status, customer) is only shown when the Orders module loaded it
 * (requires `orders.view`). Navigation passes the order id only.
 */
export function PaymentOrderSection({
  payment,
  order,
  orderLoading = false,
  onViewOrder,
}: PaymentOrderSectionProps) {
  const orderId = payment.order.id;
  if (!orderId) return null;

  const orderNumber = order?.orderNumber ?? payment.order.orderNumber ?? orderId;
  const total = order?.total ?? payment.order.total;
  const customerName = order?.customer.name ?? payment.customer.name;

  return (
    <SectionCard title="Related order">
      <DetailRow label="Order number" value={orderNumber} emphasis />
      {total !== undefined ? <DetailRow label="Order total" value={formatCurrency(total)} /> : null}
      {order ? (
        <DetailRow label="Order status" value={ORDER_STATUS_LABELS[order.orderStatus]} />
      ) : null}
      {orderLoading && !order ? (
        <Text variant="bodySmall" tone="muted">
          Loading order status…
        </Text>
      ) : null}
      {customerName ? <DetailRow label="Customer" value={customerName} /> : null}
      <Button
        title="View order"
        variant="outline"
        icon="open-outline"
        fullWidth
        onPress={() => onViewOrder(orderId)}
        accessibilityLabel={`View order ${orderNumber}`}
      />
    </SectionCard>
  );
}

/** Customer contact details the backend exposes to payments.view. */
export function PaymentCustomerSection({ payment }: PaymentSectionProps) {
  const { customer } = payment;
  if (!customer.name && !customer.phone && !customer.email) return null;

  return (
    <SectionCard title="Customer">
      <DetailRow label="Name" value={customer.name ?? '—'} />
      {customer.phone ? <DetailRow label="Phone" value={customer.phone} /> : null}
      {customer.email ? <DetailRow label="Email" value={customer.email} /> : null}
    </SectionCard>
  );
}

/**
 * Manual bKash/Nagad block: the submitted transaction and its verification
 * lifecycle. A transaction id is never treated as verified here - only the
 * backend's `paymentStatus`/`verifiedAt` fields decide that.
 */
export function PaymentManualSection({ payment }: PaymentSectionProps) {
  if (!isManualPaymentMethod(payment.paymentMethod)) return null;

  return (
    <SectionCard title="Manual payment">
      <DetailRow label="Method" value={paymentMethodLabel(payment.paymentMethod)} />
      <DetailRow label="Transaction ID" value={payment.reference ?? '—'} />
      <DetailRow label="Submitted amount" value={formatCurrency(payment.amount)} />
      <DetailRow label="Submitted on" value={formatDate(payment.paymentDate)} />
      <DetailRow label="Verification status">
        <PaymentStatusBadge status={payment.paymentStatus} />
      </DetailRow>

      {payment.verifiedAt ? (
        <>
          <Divider />
          <DetailRow label="Verified on" value={formatDateTime(payment.verifiedAt)} />
          <DetailRow
            label="Verified by"
            value={payment.verifiedBy?.username ?? payment.verifiedBy?.id ?? '—'}
          />
        </>
      ) : null}

      {payment.rejectedAt ? (
        <>
          <Divider />
          <DetailRow label="Rejected on" value={formatDateTime(payment.rejectedAt)} />
          <DetailRow
            label="Rejected by"
            value={payment.rejectedBy?.username ?? payment.rejectedBy?.id ?? '—'}
          />
          {payment.rejectionReason ? (
            <DetailRow label="Rejection reason" value={payment.rejectionReason} />
          ) : null}
        </>
      ) : null}
    </SectionCard>
  );
}

/** Refund context: which original payment this refund was issued against. */
export function PaymentRefundSection({ payment }: PaymentSectionProps) {
  if (payment.paymentType !== 'refund') return null;
  const parent = payment.parentPayment;

  return (
    <SectionCard title="Refund">
      <DetailRow
        label="Refund of"
        value={parent?.paymentNumber ?? parent?.id ?? 'Original payment'}
      />
      {parent?.amount !== undefined ? (
        <DetailRow label="Original amount" value={formatCurrency(parent.amount)} />
      ) : null}
      <Text variant="bodySmall" tone="muted">
        This refund was issued by the backend against the original payment. Refund totals are part
        of the order ledger.
      </Text>
    </SectionCard>
  );
}

export function PaymentNoteSection({ payment }: PaymentSectionProps) {
  if (!payment.note) return null;
  return (
    <SectionCard title="Notes">
      <Text variant="body">{payment.note}</Text>
    </SectionCard>
  );
}

/** Audit trail the backend stores (created/verified/rejected/cancelled). */
export function PaymentAuditSection({ payment }: PaymentSectionProps) {
  return (
    <SectionCard title="Record">
      <DetailRow
        label="Created by"
        value={payment.createdBy.username ?? payment.createdBy.id ?? '—'}
      />
      <DetailRow label="Created" value={formatDateTime(payment.createdAt)} />
      <DetailRow label="Last updated" value={formatDateTime(payment.updatedAt)} />
      {payment.cancelledAt ? (
        <>
          <Divider />
          <DetailRow label="Cancelled" value={formatDateTime(payment.cancelledAt)} />
          {payment.cancelledBy?.id ? (
            <DetailRow label="Cancelled by" value={payment.cancelledBy.id} />
          ) : null}
        </>
      ) : null}
    </SectionCard>
  );
}
