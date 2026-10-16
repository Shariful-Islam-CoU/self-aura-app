/**
 * Safely builds an http(s) href from a backend-provided website string.
 * Mirrors the web client (`features/couriers/utils.ts`): when the value can't
 * be turned into a safe http(s) link the UI renders it as plain text instead -
 * no URLs are constructed from assumptions.
 */
export function toWebsiteHref(website?: string): string | null {
  if (!website) return null;
  const value = website.trim();
  if (!value) return null;
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  if (value.startsWith('www.')) return `https://${value}`;
  return null;
}
