import * as ImagePicker from 'expo-image-picker';

import type { PickedMediaFile } from '../types';

export type MediaMultiPickResult =
  { ok: true; files: PickedMediaFile[] } | { ok: false; reason: 'cancelled' | 'denied' };

/**
 * Shared photo/video picker for the product media managers.
 *
 * Multi-select mirrors the web manager's `multiple` file input: the picker
 * returns every asset it was given. `selectionLimit` defaults to 0, which the
 * SDK documents as "the maximum that the system supports" - there is no
 * product-media count cap. The MANAGER filters by MIME type exactly like the
 * web component does - one place decides what is acceptable, so the skip copy
 * always matches what was actually filtered out. On platforms whose system
 * picker cannot multi-select, a single asset comes back and the queue handles
 * it as a one-file batch.
 *
 * Permissions are requested first so a denial is surfaced before the picker
 * opens (SDK 57 docs: on iOS the library needs permission to read the
 * original file). Cancellation and denial are handled, never thrown. The
 * MIME checks are convenience filters only - the backend sniffs the actual
 * bytes and validates dimensions, so its rejection is always authoritative.
 * All uploads go through the
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
  selectionLimit = 0,
): Promise<MediaMultiPickResult> {
  if (!(await requestLibraryPermission())) {
    return { ok: false, reason: 'denied' };
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: [mediaType],
    quality: 1,
    allowsMultipleSelection: true,
    // 0 is the SDK's "maximum the system supports" value.
    selectionLimit,
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
 * Picks product images (JPEG/PNG/WebP) for upload. There is no count limit;
 * pass `selectionLimit` only to cap one picker session.
 */
export function pickProductImages(selectionLimit = 0): Promise<MediaMultiPickResult> {
  return pickAssets('images', selectionLimit);
}

/**
 * Picks product videos (MP4/MOV/WebM) for upload. There is no count limit;
 * pass `selectionLimit` only to cap one picker session.
 */
export function pickProductVideos(selectionLimit = 0): Promise<MediaMultiPickResult> {
  return pickAssets('videos', selectionLimit);
}
