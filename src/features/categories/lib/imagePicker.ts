import * as ImagePicker from 'expo-image-picker';

import type { PickedCategoryImage } from '../types';

/**
 * Client-side mirror of the server's image allow-list
 * (`self_aura_backend/src/config/media.ts` ALLOWED_IMAGE_MIME_TYPES).
 * A convenience filter only - the server sniffs the bytes and still
 * validates size and dimensions, so a file that slips past this check is
 * rejected properly by the backend (whose message is always the right one
 * to show). The size ceiling is deliberately not duplicated here because it
 * is configurable server-side.
 */
export const ACCEPTED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export type ImagePickResult =
  | { ok: true; image: PickedCategoryImage }
  | { ok: false; reason: 'cancelled' | 'denied' | 'unsupported' };

/**
 * Opens the system photo picker and returns a file ready for the backend
 * media API - or an explicit non-error reason when nothing was picked.
 *
 * Permissions: requested first so a denial is surfaced before the picker
 * opens (SDK 57 docs: on iOS the library needs permission to read the
 * original file). Cancellation and denial are handled, never thrown.
 *
 * All uploads go through the authenticated backend endpoint - the app never
 * talks to Cloudinary directly, so no media credentials exist in the app.
 */
export async function pickCategoryImage(): Promise<ImagePickResult> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    return { ok: false, reason: 'denied' };
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 1,
  });

  if (result.canceled) {
    return { ok: false, reason: 'cancelled' };
  }

  const asset = result.assets[0];
  if (!asset) {
    return { ok: false, reason: 'cancelled' };
  }

  const mimeType = asset.mimeType ?? 'image/jpeg';
  if (!(ACCEPTED_IMAGE_MIME_TYPES as readonly string[]).includes(mimeType)) {
    return { ok: false, reason: 'unsupported' };
  }

  return {
    ok: true,
    image: {
      uri: asset.uri,
      name: asset.fileName ?? 'category-image',
      type: mimeType,
      size: asset.fileSize,
    },
  };
}
