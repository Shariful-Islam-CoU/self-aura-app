import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { spacing } from '@/theme';

export interface UploadProgressState {
  /** 1-based index of the file being uploaded. */
  current: number;
  /** Total files in this batch. */
  total: number;
  /** Filename of the current file, shown so a multi-file selection is trackable. */
  fileName: string;
}

/** The progress row renders exactly the queue position the managers track. */
export type MediaUploadProgressProps = UploadProgressState;

/**
 * Upload queue indicator (the mobile counterpart of the web app's
 * `MediaUploadProgress`).
 *
 * A product video can be hundreds of megabytes, so "Uploading 2 of 3: clip.mp4"
 * says which file is moving and where the batch stands - the two facts a user
 * needs.
 * React Native's fetch-based request pipeline exposes no byte-level upload
 * progress, so the spinner is honest about being indeterminate rather than
 * faking a percentage; `role="status"` + a polite live region mean the
 * change is announced without stealing focus.
 */
export function MediaUploadProgress({ current, total, fileName }: MediaUploadProgressProps) {
  const label =
    total > 1 ? `Uploading ${current} of ${total}: ${fileName}` : `Uploading ${fileName}`;

  return (
    <View style={styles.row}>
      <ActivityIndicator size="small" accessibilityLabel="Uploading" />
      <Text
        variant="caption"
        tone="muted"
        style={styles.text}
        numberOfLines={1}
        role="status"
        accessibilityLiveRegion="polite"
        accessibilityLabel={label}
      >
        {total > 1 ? `Uploading ${current} of ${total}: ` : 'Uploading '}
        {fileName}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  text: {
    flex: 1,
  },
});
