import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { Screen } from '@/components/layout';
import { LoadingState, ErrorState, EmptyState, Text, Button } from '@/components/ui';
import { useReturnDetails, useApproveReturn, useRejectReturn, useReceiveReturn } from '@/features/returns';
import { useAuth } from '@/providers';
import { useState } from 'react';

export default function ReturnDetailsScreen() {
  const { returnId } = useLocalSearchParams<{ returnId: string }>();
  const id = returnId ?? '';
  const { data, isLoading, isError, refetch } = useReturnDetails(id);
  const { canAccess } = useAuth();
  const canManage = canAccess('returns.approve') || canAccess('returns.receive') || canAccess('returns.refund') || canAccess('returns.edit') || canAccess('returns.cancel');
  const approve = useApproveReturn(id);
  const reject = useRejectReturn(id);
  const receive = useReceiveReturn(id);
  const [rejectNote] = useState('');

  if (!id) return <Screen scroll={true}><ErrorState title="Missing ID" description="Invalid route." /></Screen>;
  if (isLoading) return <LoadingState />;
  if (isError) return <Screen scroll={true}><ErrorState title="Failed to load return" description="Try again." onRetry={() => refetch()} /></Screen>;
  if (!data) return <Screen scroll={true}><EmptyState title="Not found" description="Return not found." /></Screen>;

  const requested = data.status === 'requested';
  const approved = data.status === 'approved';
  const receivedButNotRefunded = data.status === 'received' && data.refundStatus !== 'refunded';

  return (
    <Screen scroll={true}>
      <View style={{ padding: 16, gap: 12 }}>
        <Text style={{ fontSize: 20, fontWeight: '700' }}>{data.returnNumber}</Text>
        <Text>Status: {data.status}</Text>
        <Text>Refund: {data.refundStatus}</Text>
        <Text>Order: {data.order.orderNumber ?? data.order.id}</Text>
        <Text>Customer: {data.customer.name ?? data.customer.id}</Text>
        <Text>Amount: {data.refundAmount}</Text>
        {canManage && requested && (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button title="Approve" onPress={() => approve.mutate()} disabled={approve.isPending} />
            <Button title="Reject" variant="outline" onPress={() => reject.mutate({ note: rejectNote || undefined })} disabled={reject.isPending} />
          </View>
        )}
        {canManage && approved && (
          <Button title="Receive" onPress={() => receive.mutate()} disabled={receive.isPending} />
        )}
        {canManage && receivedButNotRefunded && (
          <Text style={{ color: '#6b7280' }}>Refund in progress via backend</Text>
        )}
      </View>
    </Screen>
  );
}