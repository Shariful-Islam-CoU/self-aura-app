import { File, Paths } from 'expo-file-system';

/** Outcome of a save-to-gallery attempt; the caller maps it to user-facing copy. */
export type SaveMediaResult =
  | { ok: true }
  | { ok: false; reason: 'permission' | 'unavailable' | 'failed' };

/** Gallery album the downloaded media is grouped under. */
const ALBUM_NAME = 'Self Aura';

/** Extension used for the temp file: taken from the URL when it has one. */
function resolveExtension(url: string, fallback: 'jpg' | 'mp4'): string {
  try {
    const match = /\.([a-z0-9]{2,5})$/i.exec(new URL(url).pathname);
    if (match) return match[1].toLowerCase();
  } catch {
    // Not an absolute URL - fall through to the media-kind default.
  }
  return fallback;
}

/**
 * Downloads a remote product image/video and saves it into the device's photo
 * library.
 *
 * Uses the `expo-media-library/legacy` entry point on purpose. Since SDK 56 the
 * root import requires a brand-new native module (`ExpoMediaLibraryNext`) that
 * is missing from some runtimes (notably Expo Go), which throws at import time
 * and takes the whole screen down with it. The legacy entry point talks to the
 * original `ExpoMediaLibrary` module that ships everywhere, and is the
 * compatibility path Expo documents for exactly this situation.
 *
 * The module is imported lazily so that a runtime without the native module
 * (for example a development build created before this dependency was added)
 * resolves to a normal `unavailable` failure instead of crashing the app.
 *
 * The backend stays the source of truth for what media exists - this only
 * copies the already-delivered, already-authorized file onto the device.
 */
export async function saveRemoteMediaToLibrary(
  url: string,
  kind: 'image' | 'video',
): Promise<SaveMediaResult> {
  let MediaLibrary: typeof import('expo-media-library/legacy');
  try {
    MediaLibrary = await import('expo-media-library/legacy');
  } catch {
    return { ok: false, reason: 'unavailable' };
  }

  try {
    // Write-only access is all a save needs and avoids asking to read the
    // user's whole gallery.
    const { status } = await MediaLibrary.requestPermissionsAsync(true);
    if (status !== 'granted') {
      return { ok: false, reason: 'permission' };
    }

    const extension = resolveExtension(url, kind === 'image' ? 'jpg' : 'mp4');
    const destination = new File(Paths.cache, `self-aura-${Date.now()}.${extension}`);
    const file = await File.downloadFileAsync(url, destination);

    // Add straight into the album when it exists; otherwise seed the album with
    // the file. Never move an existing asset between albums: on Android 11+
    // that would raise a system confirmation prompt on every download.
    const album = await MediaLibrary.getAlbumAsync(ALBUM_NAME).catch(() => null);
    if (album) {
      await MediaLibrary.createAssetAsync(file.uri, album);
    } else {
      await MediaLibrary.createAlbumAsync(ALBUM_NAME, undefined, false, file.uri);
    }

    return { ok: true };
  } catch {
    return { ok: false, reason: 'failed' };
  }
}
