import { StyleSheet, View } from 'react-native';
import { Text } from './Text';

export const Trash2Icon = ({
  size = 24,
  color,
  style,
}: {
  size?: number;
  color?: string;
  style?: any;
}) => (
  <View style={[styles.container, { width: size, height: size }, style]}>
    <Text variant="bodyMedium" tone="muted" style={{ fontSize: size * 0.6, color }}>
      🗑️
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
