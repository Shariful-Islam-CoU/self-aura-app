import { View, Text, StyleSheet } from 'react-native';
import { Button } from './Button';
import { useTheme } from '@/providers/ThemeProvider';

export interface EmptyStateProps {
  title: string;
  description: string;
  onAction?: () => void;
  actionLabel?: string;
  style?: any;
}

export function EmptyState({ title, description, onAction, actionLabel, style }: EmptyStateProps) {
  const { theme } = useTheme();
  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.title, { color: theme.colors.textMuted }]}>{title}</Text>
      <Text style={[styles.description, { color: theme.colors.textMuted }]}>{description}</Text>
      {onAction && actionLabel && (
        <Button title={actionLabel} onPress={onAction} variant="outline" fullWidth />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, alignItems: 'center', gap: 8 },
  title: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  description: { fontSize: 14, textAlign: 'center' },
});