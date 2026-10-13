import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { Screen } from '@/components/layout';
import { LoadingState, ErrorState, EmptyState, Text } from '@/components/ui';
import { useCourierDetails } from '@/features/couriers';

export default function CourierDetailsScreen() {
  const { courierId } = useLocalSearchParams<{ courierId: string }>();
  const id = courierId ?? '';
  const { data, isLoading, isError, refetch } = useCourierDetails(id);

  if (!id) return <Screen scroll={true}><ErrorState title="Missing courier ID" description="Invalid route." /></Screen>;
  if (isLoading) return <LoadingState />;
  if (isError) return <Screen scroll={true}><ErrorState title="Failed to load courier" description="Try again." onRetry={() => refetch()} /></Screen>;
  if (!data) return <Screen scroll={true}><EmptyState title="Not found" description="Courier not found." /></Screen>;

  return (
    <Screen scroll={true}>
      <View style={{ padding: 16, gap: 12 }}>
        <Text style={{ fontSize: 20, fontWeight: '700' }}>{data.name}</Text>
        {data.contactPerson ? <Text>Contact: {data.contactPerson}</Text> : null}
        {data.phone ? <Text>Phone: {data.phone}</Text> : null}
        {data.website ? <Text>Website: {data.website}</Text> : null}
        {data.address ? <Text>Address: {data.address}</Text> : null}
        {data.notes ? <Text>Notes: {data.notes}</Text> : null}
        <Text>Status: {data.isActive ? 'Active' : 'Inactive'}</Text>
      </View>
    </Screen>
  );
}