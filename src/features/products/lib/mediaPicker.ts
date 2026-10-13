import * as ImagePicker from 'expo-image-picker';

import type { PickedMediaFile } from '../types';

export type MediaMultiPickResult =
  { ok: true; files: PickedMediaFile[] } | { ok: false; reason: 'cancelled' | 'denied' };

/**
 * Shared photo/video picker for the product media managers.
 *
 * Multi-select mirrors the web manager's `multiple` file input: the picker
 * returns every asset it was given (capped by `selectionLimit`, which the
 * caller derives from the server's remaining capacity), and the MANAGER
 * filters by MIME type and size exactly like the web component does - one
 * place decides what is acceptable, so the skip/limit copy always matches
 * what was actually filtered out. On platforms whose system picker cannot
 * multi-select, a single asset comes back and the queue handles it as a
 * one-file batch.
 *
 * Permissions are requested first so a denial is surfaced before the picker
 * opens (SDK 57 docs: on iOS the library needs permission to read the
 * original file). Cancellation and denial are handled, never thrown. The
 * MIME/size checks are convenience filters only - the backend sniffs the
 * actual bytes, validates dimensions and enforces its own caps, so its
 * rejection is always authoritative. All uploads go through the
 * authenticated backend media API; the app never talks to Cloudinary
 * directly, so no media credentials exist in the app.
 */
async function requestLibraryPermission(): Promise<boolean> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return permission.granted;
}

/**
 * Infers a MIME type for a video asset: the picker only reports one when the
 * platform knows it, so the file extension is a reliable fallback (the
 * server sniffs the bytes regardless, so a wrong guess cannot pass a bad
 * file - it is a UX label at most).
 */
function resolveVideoMimeType(asset: ImagePicker.ImagePickerAsset): string {
  if (asset.mimeType) return asset.mimeType.toLowerCase();
  const name = asset.fileName?.toLowerCase() ?? '';
  if (name.endsWith('.mov')) return 'video/quicktime';
  if (name.endsWith('.webm')) return 'video/webm';
  return 'video/mp4';
}

function toPickedFile(
  asset: ImagePicker.ImagePickerAsset,
  fallbackType: string,
  fallbackName: string,
): PickedMediaFile {
  return {
    uri: asset.uri,
    name: asset.fileName ?? fallbackName,
    type: (asset.mimeType ?? fallbackType).toLowerCase(),
    size: asset.fileSize,
  };
}

async function pickAssets(
  mediaType: 'images' | 'videos',
  selectionLimit: number,
): Promise<MediaMultiPickResult> {
  if (!(await requestLibraryPermission())) {
    return { ok: false, reason: 'denied' };
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: [mediaType],
    quality: 1,
    allowsMultipleSelection: true,
    selectionLimit: Math.max(1, selectionLimit),
    orderedSelection: true,
  });

  if (result.canceled || result.assets.length === 0) {
    return { ok: false, reason: 'cancelled' };
  }

  const fallbackName = mediaType === 'images' ? 'product-image' : 'product-video';
  const fallbackType = mediaType === 'images' ? 'image/jpeg' : 'video/mp4';

  return {
    ok: true,
    files: result.assets.map((asset) =>
      mediaType === 'images'
        ? toPickedFile(asset, fallbackType, fallbackName)
        : { ...toPickedFile(asset, fallbackType, fallbackName), type: resolveVideoMimeType(asset) },
    ),
  };
}

/**
 * Picks product images (JPEG/PNG/WebP) for upload, up to `selectionLimit`
 * files in one system-picker session.
 */
export function pickProductImages(selectionLimit: number): Promise<MediaMultiPickResult> {
  return pickAssets('images', selectionLimit);
}

/**
 * Picks product videos (MP4/MOV/WebM) for upload, up to `selectionLimit`
 * files in one system-picker session.
 */
export function pickProductVideos(selectionLimit: number): Promise<MediaMultiPickResult> {
  return pickAssets('videos', selectionLimit);
}
