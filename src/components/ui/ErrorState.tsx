import { View, Text, StyleSheet } from 'react-native';
import { Button } from './Button';
import { useTheme } from '@/providers/ThemeProvider';

export interface ErrorStateProps {
  title: string;
  description: string;
  onRetry?: () => void;
  style?: any;
}

export function ErrorState({ title, description, onRetry, style }: ErrorStateProps) {
  const { theme } = useTheme();
  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.title, { color: theme.colors.danger }]}>{title}</Text>
      <Text style={[styles.description, { color: theme.colors.textMuted }]}>{description}</Text>
      {onRetry && (
        <Button title="Try Again" variant="outline" onPress={onRetry} fullWidth />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, alignItems: 'center', gap: 8 },
  title: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  description: { fontSize: 14, textAlign: 'center' },
});