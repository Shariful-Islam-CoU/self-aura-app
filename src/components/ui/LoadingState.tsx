import { Skeleton } from './Skeleton';
import { View, StyleSheet } from 'react-native';

export function LoadingState({ style, lines = 6 }: { style?: any; lines?: number }) {
  return (
    <View style={[styles.container, style]}>
      <Skeleton lines={lines} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
});