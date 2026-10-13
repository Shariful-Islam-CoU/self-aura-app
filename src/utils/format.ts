/**
 * Currency/number/date formatting shared by every screen.
 *
 * Output conventions (verified against the web app's `src/lib/currency.ts` and
 * `src/lib/dateUtils.ts` so both clients render identical text for the same
 * data):
 * - Currency: BDT, Bengali digits with Indian grouping - `১,২৩৪.৫৳`
 *   (integer amounts drop the fraction: `১,২৩৪৳`; zero is the deliberate web
 *   quirk `৳0`).
 * - Numbers: Bengali digits with Indian grouping - `১২,৩৪,৫৬৭`.
 * - Dates: `en-GB` style with Latin digits - `07 Oct 2026` and
 *   `07 Oct 2026, 16:30` (local time, 24-hour clock).
 *
 * Engine notes:
 * - Numbers/currency use `Intl.NumberFormat`: Hermes exposes the platform ICU
 *   (Android ICU4J/CLDR and iOS Foundation), so `bn-BD` matches what browsers
 *   render on the web client. Each formatter is created once because Intl
 *   locale matching is comparatively expensive on Hermes.
 * - Dates are formatted manually: deterministic across OS/CLDR versions, so a
 *   2019 phone and a 2026 phone always print the same string, and no
 *   `Intl.DateTimeFormat` option gaps can bite.
 */

const CURRENCY_LOCALE = 'bn-BD';
const CURRENCY_CODE = 'BDT';
const CURRENCY_SYMBOL = '৳';

const currencyFormatter = new Intl.NumberFormat(CURRENCY_LOCALE, {
  style: 'currency',
  currency: CURRENCY_CODE,
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat(CURRENCY_LOCALE);

export function formatCurrency(amount: number): string {
  // Mirrors the web client, including the `৳0` (Latin digit) zero quirk.
  if (amount === 0) return `${CURRENCY_SYMBOL}0`;
  return currencyFormatter.format(amount);
}

export function formatCurrencyCompact(amount: number): string {
  if (amount === 0) return `${CURRENCY_SYMBOL}0`;
  const absAmount = Math.abs(amount);
  if (absAmount >= 1e9) return `${CURRENCY_SYMBOL}${(amount / 1e9).toFixed(1)}B`;
  if (absAmount >= 1e6) return `${CURRENCY_SYMBOL}${(amount / 1e6).toFixed(1)}M`;
  if (absAmount >= 1e3) return `${CURRENCY_SYMBOL}${(amount / 1e3).toFixed(1)}K`;
  return formatCurrency(amount);
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

/** Anything that can be parsed into a local-time `Date`. */
export type DateInput = string | Date;

/**
 * Short month names exactly as the web client's
 * `toLocaleDateString('en-GB', { month: 'short' })` renders them - note that
 * CLDR en-GB abbreviates September as `Sept`, not `Sep`.
 */
const SHORT_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sept',
  'Oct',
  'Nov',
  'Dec',
] as const;

/** Shown instead of `Invalid Date` when a timestamp cannot be parsed. */
const INVALID_DATE = '—';

function toDate(value: DateInput): Date {
  return value instanceof Date ? value : new Date(value);
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

/** `07 Oct 2026` in local time (`—` for unparseable input). */
export function formatDate(value: DateInput): string {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return INVALID_DATE;
  return `${pad2(date.getDate())} ${SHORT_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

/** `07 Oct 2026, 16:30` in local time (`—` for unparseable input). */
export function formatDateTime(value: DateInput): string {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return INVALID_DATE;
  return `${formatDate(date)}, ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}
