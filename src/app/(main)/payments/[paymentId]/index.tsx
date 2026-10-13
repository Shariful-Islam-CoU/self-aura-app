import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { getErrorMessage, isApiError } from '@/api';
import { EmptyState, ErrorState } from '@/components/feedback';
import { AppHeader, Screen } from '@/components/layout';
import { Button } from '@/components/ui';
import { SectionCard } from '@/features/customers/components/SectionCard';
import { useOrderDetails } from '@/features/orders/queries';
import {
  PaymentAuditSection,
  PaymentCancelDialog,
  PaymentCustomerSection,
  PaymentDetailsSkeleton,
  PaymentManualSection,
  PaymentNoteSection,
  PaymentOrderSection,
  PaymentOverviewSection,
  PaymentRefundDialog,
  PaymentRefundSection,
  PaymentRejectDialog,
  PaymentVerifyDialog,
} from '@/features/payments/components';
import {
  useCancelPayment,
  usePaymentDetails,
  useRefundPayment,
  useRejectPayment,
  useVerifyPayment,
} from '@/features/payments/queries';
import type { RefundPaymentInput, RejectPaymentInput } from '@/features/payments/types';
import { CANCELLABLE_PAYMENT_STATUSES, isManualPaymentMethod } from '@/features/payments/types';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/providers';
import { spacing } from '@/theme';

/**
 * Payment details: fetched by ID only (navigation passes `paymentId` - never a
 * payment object). Sections render backend data as-is. Manual bKash/Nagad
 * payments show their verification lifecycle, and the related order is loaded
 * through the existing Orders module for status/customer. Ledger-changing
 * actions (verify/reject/refund/cancel) always run through the backend - a
 * failed request keeps the dialog open with the server's own message and never
 * fakes success.
 */
export default function PaymentDetailsScreen() {
  const { paymentId } = useLocalSearchParams<{ paymentId: string }>();
  const { hasPermission } = usePermissions();
  const toast = useToast();

  const canView = hasPermission('payments.view');
  const canEdit = hasPermission('payments.edit');
  const canDelete = hasPermission('payments.delete');
  const canVerify = hasPermission('payments.verify');
  const canReject = hasPermission('payments.reject');
  const canViewOrders = hasPermission('orders.view');

  const paymentQuery = usePaymentDetails(canView ? paymentId : undefined);
  const verifyPayment = useVerifyPayment();
  const rejectPayment = useRejectPayment();
  const refundPayment = useRefundPayment();
  const cancelPayment = useCancelPayment();

  const [refreshing, setRefreshing] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const payment = paymentQuery.data;
  const orderQuery = useOrderDetails(
    canViewOrders && payment?.order.id ? payment.order.id : undefined,
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.allSettled([paymentQuery.refetch(), orderQuery.refetch()]);
    } finally {
      setRefreshing(false);
    }
  };

  const header = (
    <AppHeader variant="feature" title="Payment details" onBack={() => router.back()} />
  );

  if (!paymentId) {
    return (
      <Screen>
        {header}
        <EmptyState
          icon="card-outline"
          title="Payment not found"
          description="Open a payment from the list to see its details."
          actionLabel="Back to payments"
          onAction={() => router.replace('/payments')}
        />
      </Screen>
    );
  }

  if (!canView) {
    return (
      <Screen>
        {header}
        <ErrorState title="Access denied" message="You don't have permission to view payments." />
      </Screen>
    );
  }

  if (paymentQuery.isPending) {
    return (
      <Screen>
        {header}
        <PaymentDetailsSkeleton />
      </Screen>
    );
  }

  if (!payment) {
    const error = paymentQuery.error;
    if (isApiError(error) && error.kind === 'authorization') {
      return (
        <Screen>
          {header}
          <ErrorState
            title="Access denied"
            message="You don't have permission to view this payment."
          />
        </Screen>
      );
    }
    if (isApiError(error) && error.kind === 'notFound') {
      return (
        <Screen>
          {header}
          <EmptyState
            icon="card-outline"
            title="Payment not found"
            description="This payment may have been removed."
            actionLabel="Back to payments"
            onAction={() => router.replace('/payments')}
          />
        </Screen>
      );
    }
    return (
      <Screen>
        {header}
        <ErrorState
          title="Failed to load payment"
          message={getErrorMessage(error)}
          onRetry={() => void paymentQuery.refetch()}
          retryLabel="Retry"
        />
      </Screen>
    );
  }

  const isManual = isManualPaymentMethod(payment.paymentMethod);
  const isCancellable = CANCELLABLE_PAYMENT_STATUSES.includes(payment.paymentStatus);
  const canRecordRefund =
    canEdit && payment.paymentType === 'payment' && payment.paymentStatus === 'completed';
  const canVerifyPayment = isManual && payment.paymentStatus === 'submitted' && canVerify;
  const canRejectPayment = isManual && payment.paymentStatus === 'submitted' && canReject;
  const canCancelPayment = isCancellable && canDelete;
  const showActions =
    canRecordRefund || canVerifyPayment || canRejectPayment || canEdit || canCancelPayment;

  const handleVerify = async () => {
    const updated = await verifyPayment.mutateAsync(payment.id);
    toast.success(`Payment ${updated.paymentNumber} verified.`);
  };

  const handleReject = async (input: RejectPaymentInput) => {
    const updated = await rejectPayment.mutateAsync({ id: payment.id, input });
    toast.success(`Payment ${updated.paymentNumber} rejected.`);
  };

  const handleRefund = async (input: RefundPaymentInput) => {
    const refund = await refundPayment.mutateAsync({ id: payment.id, input });
    toast.success(`Refund ${refund.paymentNumber} recorded.`);
  };

  const handleCancel = async () => {
    const updated = await cancelPayment.mutateAsync(payment.id);
    toast.success(`Payment ${updated.paymentNumber} cancelled.`);
  };

  return (
    <Screen
      scroll
      refreshControl={{
        refreshing,
        onRefresh: () => void handleRefresh(),
      }}
    >
      {header}
      <View style={styles.container}>
        <PaymentOverviewSection payment={payment} />
        <PaymentManualSection payment={payment} />
        <PaymentRefundSection payment={payment} />
        <PaymentOrderSection
          payment={payment}
          order={orderQuery.data}
          orderLoading={orderQuery.isPending}
          onViewOrder={(orderId) => router.push(`/orders/${orderId}`)}
        />
        <PaymentCustomerSection payment={payment} />
        <PaymentNoteSection payment={payment} />
        <PaymentAuditSection payment={payment} />

        {showActions ? (
          <SectionCard title="Actions">
            {canRecordRefund ? (
              <Button
                title="Refund payment"
                variant="outline"
                icon="arrow-undo-outline"
                fullWidth
                onPress={() => setRefundOpen(true)}
                accessibilityLabel="Refund this payment"
              />
            ) : null}
            {canVerifyPayment ? (
              <Button
                title="Verify payment"
                variant="success"
                icon="shield-checkmark-outline"
                fullWidth
                onPress={() => setVerifyOpen(true)}
                accessibilityLabel="Verify this manual payment"
              />
            ) : null}
            {canRejectPayment ? (
              <Button
                title="Reject payment"
                variant="danger"
                icon="close-circle-outline"
                fullWidth
                onPress={() => setRejectOpen(true)}
                accessibilityLabel="Reject this manual payment"
              />
            ) : null}
            {canEdit ? (
              <Button
                title="Edit payment"
                variant="outline"
                icon="create-outline"
                fullWidth
                onPress={() => router.push(`/payments/${payment.id}/edit`)}
                accessibilityLabel="Edit this payment"
              />
            ) : null}
            {canCancelPayment ? (
              <Button
                title="Cancel payment"
                variant="danger"
                icon="close-outline"
                fullWidth
                onPress={() => setCancelOpen(true)}
                accessibilityLabel="Cancel this payment"
              />
            ) : null}
          </SectionCard>
        ) : null}
      </View>

      <PaymentVerifyDialog
        open={verifyOpen}
        payment={payment}
        isSubmitting={verifyPayment.isPending}
        onConfirm={handleVerify}
        onOpenChange={setVerifyOpen}
      />
      <PaymentRejectDialog
        open={rejectOpen}
        payment={payment}
        isSubmitting={rejectPayment.isPending}
        onConfirm={handleReject}
        onOpenChange={setRejectOpen}
      />
      <PaymentRefundDialog
        open={refundOpen}
        payment={payment}
        isSubmitting={refundPayment.isPending}
        onConfirm={handleRefund}
        onOpenChange={setRefundOpen}
      />
      <PaymentCancelDialog
        open={cancelOpen}
        payment={payment}
        isSubmitting={cancelPayment.isPending}
        onConfirm={handleCancel}
        onOpenChange={setCancelOpen}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
});
