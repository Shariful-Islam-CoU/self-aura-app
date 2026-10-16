import { StyleSheet, View } from 'react-native';

import { Card, Skeleton } from '@/components/ui';
import { spacing } from '@/theme';

/** Initial-load placeholder: a stack of delivery-rule card skeletons. */
export function DeliveryRuleListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} style={styles.card}>
          <Skeleton width="55%" height={16} />
          <Skeleton width="70%" height={12} />
          <View style={styles.badges}>
            <Skeleton width={70} height={22} radius={11} />
            <Skeleton width={44} height={24} radius={12} />
          </View>
        </Card>
      ))}
    </View>
  );
}

/** Loading placeholder for the rule-form screen. */
export function DeliveryRuleFormSkeleton() {
  return (
    <View style={styles.details}>
      <Card style={styles.card}>
        <Skeleton lines={2} />
      </Card>
      <Card style={styles.card}>
        <Skeleton lines={4} />
      </Card>
      <Card style={styles.card}>
        <Skeleton lines={2} />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  details: { gap: spacing.lg },
  card: { gap: spacing.sm },
  badges: { flexDirection: 'row', gap: spacing.sm },
});
