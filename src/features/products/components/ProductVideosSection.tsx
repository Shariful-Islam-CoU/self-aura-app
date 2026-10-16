import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { useTheme } from '@/providers';
import { radius, spacing } from '@/theme';
import { formatDuration, resolveMediaUrl } from '../lib/media';
import type { Product, ProductVideo } from '../types';
import { ProductVideoPreviewModal } from './ProductVideoPreviewModal';
import { SectionCard } from './SectionCard';

/**
 * Read-only video gallery on the product-details screen.
 * Tapping a thumbnail opens the full-screen video preview.
 * Section is hidden when the product has no videos.
 */
export function ProductVideosSection({ product }: { product: Product }) {
  const { theme } = useTheme();
  const [preview, setPreview] = useState<ProductVideo | null>(null);

  if (product.videos.length === 0) {
    return null;
  }

  return (
    <SectionCard title="Videos">
      <View style={styles.grid}>
        {product.videos.map((video, index) => {
          const posterUri = resolveMediaUrl(video.thumbnailUrl);
          const duration = formatDuration(video.duration);
          return (
            <Pressable
              key={video.key}
              onPress={() => setPreview(video)}
              accessibilityRole="button"
              accessibilityLabel={`Preview video ${index + 1}${video.alt ? `: ${video.alt}` : ''}`}
              style={({ pressed }) => [
                styles.cell,
                {
                  backgroundColor: theme.colors.surfaceMuted,
                  ...(pressed && { opacity: 0.72 }),
                },
              ]}
            >
              {posterUri ? (
                <Image
                  source={{ uri: posterUri }}
                  style={styles.image}
                  resizeMode="cover"
                  accessibilityLabel={video.alt || `Poster frame for video ${index + 1}`}
                />
              ) : (
                <View style={styles.fallback} accessibilityElementsHidden>
                  <Text variant="caption" tone="muted">
                    No poster
                  </Text>
                </View>
              )}
              <View
                style={styles.playOverlay}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              >
                <Text
                  variant="button"
                  style={styles.playButton}
                >
                  ▶
                </Text>
              </View>
              {duration ? (
                <View style={styles.durationBadge}>
                  <Text variant="caption" tone="inverse">
                    {duration}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      {preview ? (
        <ProductVideoPreviewModal
          video={preview}
          onClose={() => setPreview(null)}
        />
      ) : null}
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
    aspectRatio: 16 / 9,
    borderRadius: radius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
  },
  playOverlay: {
    position: 'absolute',
    inset: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  playButton: {
    fontSize: 28,
    color: 'rgba(255, 255, 255, 0.92)',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  durationBadge: {
    position: 'absolute',
    bottom: spacing.xs,
    right: spacing.xs,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
  },
});