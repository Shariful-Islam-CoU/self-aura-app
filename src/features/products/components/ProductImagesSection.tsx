import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Badge, Text } from '@/components/ui';
import { useTheme } from '@/providers';
import { radius, spacing } from '@/theme';
import { mediaImageSource, resolveMediaUrl } from '../lib/media';
import type { Product, ProductImage } from '../types';
import { ProductMediaPreviewModal } from './ProductMediaPreviewModal';
import { SectionCard } from './SectionCard';

/**
 * Read-only image gallery on the product-details screen (the web details
 * dialog shows images only, so videos are not rendered here - they live in
 * the edit screen's media managers). Tapping a thumbnail opens the shared
 * full-screen preview; the first tile is badged as the primary image.
 */
export function ProductImagesSection({ product }: { product: Product }) {
  const { theme } = useTheme();
  const [preview, setPreview] = useState<ProductImage | null>(null);

  return (
    <SectionCard title="Images">
      {product.images.length === 0 ? (
        <Text variant="bodySmall" tone="muted">
          No images yet. Use the edit screen to upload product photos.
        </Text>
      ) : (
        <View style={styles.grid}>
          {product.images.map((image, index) => {
            const thumbUri = mediaImageSource(image.url, 360);
            return (
              <Pressable
                key={image.key}
                onPress={() => setPreview(image)}
                accessibilityRole="imagebutton"
                accessibilityLabel={`Preview ${image.alt || `product image ${index + 1}`}`}
                style={({ pressed }) => [
                  styles.cell,
                  {
                    backgroundColor: theme.colors.surfaceMuted,
                    ...(pressed && { opacity: 0.72 }),
                  },
                ]}
              >
                <Image
                  source={thumbUri ? { uri: thumbUri } : undefined}
                  style={styles.image}
                  resizeMode="cover"
                  accessibilityLabel={image.alt || `Product image ${index + 1}`}
                />
                {index === 0 ? (
                  <View style={styles.badge}>
                    <Badge label="Primary" tone="primary" variant="solid" />
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      )}

      <ProductMediaPreviewModal
        uri={resolveMediaUrl(preview?.url) ?? null}
        alt={preview?.alt ?? ''}
        onClose={() => setPreview(null)}
      />
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  cell: {
    width: '31.5%',
    aspectRatio: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    bottom: spacing.xs,
    left: spacing.xs,
  },
});
