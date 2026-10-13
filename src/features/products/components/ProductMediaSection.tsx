import { StyleSheet, View } from 'react-native';

import { spacing } from '@/theme';
import type { Product } from '../types';
import { ProductImageManager } from './ProductImageManager';
import { ProductVideoManager } from './ProductVideoManager';

/**
 * The two media managers for the edit screen, bound to `products.edit` (the
 * same database-driven permission every media endpoint enforces). Each list
 * stages its edits independently and saves atomically, so a failed image
 * save never blocks the video list. Uploads use the backend media API only.
 */
export function ProductMediaSection({ product }: { product: Product }) {
  return (
    <View style={styles.container}>
      <ProductImageManager product={product} />
      <ProductVideoManager product={product} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
});
