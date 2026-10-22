import { env } from '@/config/env';
import type { ProductImage } from '../types';

/**
 * Client-side mirrors of the server's media allow-lists
 * (`self_aura_backend/src/config/media.ts`). Convenience filters only - the
 * server sniffs the bytes and checks dimensions, so a file that slips past
 * these lists is rejected properly by the backend (whose message is always
 * the right one to show).
 *
 * There is deliberately no count limit and no size limit for product media:
 * any number of images/videos of any size is accepted, so no client-side
 * ceiling constants exist here either.
 */
export const ACCEPTED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export const ACCEPTED_VIDEO_MIME_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'] as const;

/**
 * Human-readable format names for user-facing copy (the MIME lists above are
 * for machine checks only - never rendered).
 */
export const ACCEPTED_IMAGE_FORMATS_LABEL = 'JPEG, PNG and WebP';
export const ACCEPTED_VIDEO_FORMATS_LABEL = 'MP4, MOV and WebM';

/**
 * The primary image is the one shown in the product list and the storefront
 * card. The backend keeps `images` densely ordered with `sortOrder` starting
 * at 0, so index 0 is primary; the find is a defensive fallback only.
 */
export function getPrimaryImage(images: readonly ProductImage[]): ProductImage | null {
  if (images.length === 0) return null;
  return images.find((image) => image.sortOrder === 0) ?? images[0];
}

// Ordered-list edit helpers used by the media managers. Every helper returns
// a NEW array (the draft never mutates the server list) and is a no-op at the
// boundaries so the save payload cannot be produced out of order.

/** Swaps `index` with the previous entry (no-op at index 0). */
export function moveUp<T>(list: readonly T[], index: number): T[] {
  if (index <= 0 || index >= list.length) return [...list];
  const next = [...list];
  [next[index - 1], next[index]] = [next[index], next[index - 1]];
  return next;
}

/** Swaps `index` with the next entry (no-op on the last entry). */
export function moveDown<T>(list: readonly T[], index: number): T[] {
  if (index < 0 || index >= list.length - 1) return [...list];
  const next = [...list];
  [next[index + 1], next[index]] = [next[index], next[index + 1]];
  return next;
}

/** Moves `index` to the front - the "make primary" action for images. */
export function moveToTop<T>(list: readonly T[], index: number): T[] {
  if (index <= 0 || index >= list.length) return [...list];
  const next = [...list];
  const [item] = next.splice(index, 1);
  next.unshift(item);
  return next;
}

/** Drops the entry at `index`. */
export function removeAt<T>(list: readonly T[], index: number): T[] {
  return list.filter((_, i) => i !== index);
}

/** Returns a copy of `list` with the alt text at `index` replaced. */
export function withAltAt<T extends { alt?: string }>(
  list: readonly T[],
  index: number,
  alt: string,
): T[] {
  return list.map((item, i) => (i === index ? { ...item, alt } : item));
}

/** Renders a video length like the web app: `1:24`, `0:05`, never raw seconds. */
export function formatDuration(seconds?: number): string {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds < 0) return '';
  const total = Math.round(seconds);
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}:${rest.toString().padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Media URL handling (mirrors the web app's `lib/mediaUrl.ts` +
// `lib/media.ts` thumbnail policy)
// ---------------------------------------------------------------------------

/** Origin of the backend API, e.g. `http://localhost:5000` from `.../api`. */
function apiOrigin(): string | null {
  try {
    return new URL(env.apiUrl).origin;
  } catch {
    return null;
  }
}

/**
 * Turns a stored media URL into something React Native's `Image` can load.
 *
 * Absolute `http(s)` URLs are returned untouched - which covers every
 * Cloudinary delivery URL. Root-relative URLs are resolved against the API
 * origin for legacy records written by the previous local-filesystem adapter
 * (`/media/<key>`), which would otherwise resolve against nothing on a
 * device. Anything else (empty, `javascript:`, garbage) returns `null` so the
 * caller renders its fallback instead of a broken image.
 */
export function resolveMediaUrl(url: string | undefined | null): string | null {
  if (!url) return null;
  const value = url.trim();
  if (value.length === 0) return null;

  if (/^https?:\/\//i.test(value)) {
    try {
      const parsed = new URL(value);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? value : null;
    } catch {
      return null;
    }
  }

  if (value.startsWith('/')) {
    const origin = apiOrigin();
    return origin ? `${origin}${value}` : null;
  }

  return null;
}

const CLOUDINARY_IMAGE_UPLOAD = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/;
const CLOUDINARY_TRANSFORM_TOKEN = /^[a-z0-9]+_[a-z0-9]+$/;

/**
 * Downscales a Cloudinary image delivery URL for a small on-screen slot.
 *
 * Product cards and thumbnails otherwise pull the full delivery width (the
 * backend caps it at `imageDeliveryWidth`), which is wasteful for a 64pt
 * tile - so a tiny derivative is requested through the SAME public delivery
 * pipeline the backend already uses: the leading transform segment (always
 * `q_auto,f_auto/...` on a managed upload) is swapped for a
 * `c_fill,w_<width>,q_auto,f_auto` one, and the rest of the URL - including
 * the master cap - is kept byte-for-byte.
 *
 * Deliberately conservative: only `res.cloudinary.com/.../image/upload/`
 * URLs whose first segment parses as comma-joined Cloudinary transform
 * tokens are rewritten. Anything else (legacy paths, external hosts, a
 * URL shape this code does not fully recognise) is returned UNCHANGED, so
 * the worst case is "no optimization", never a broken image. Video URLs
 * and poster frames (`/video/upload/...`) never match and pass through.
 */
export function thumbnailUrlFor(url: string, width: number): string {
  const match = CLOUDINARY_IMAGE_UPLOAD.exec(url);
  if (!match) return url;

  const segments = match[2].split('/');
  const first = segments[0] ?? '';
  if (segments.length < 2 || !first.includes(',')) return url;
  if (!first.split(',').every((token) => CLOUDINARY_TRANSFORM_TOKEN.test(token))) return url;

  const size = Math.max(1, Math.round(width));
  return `${match[1]}c_fill,w_${size},q_auto,f_auto/${segments.slice(1).join('/')}`;
}

/**
 * Resolved URL for an `<Image source>` - optionally downscaled to `width`
 * when the URL is a managed Cloudinary image. Returns `null` when the stored
 * URL cannot be rendered at all (the caller then keeps its fallback).
 */
export function mediaImageSource(url: string | undefined | null, width?: number): string | null {
  const resolved = resolveMediaUrl(url);
  if (!resolved || width === undefined) return resolved;
  return thumbnailUrlFor(resolved, width);
}
