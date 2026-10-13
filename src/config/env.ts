/**
 * Centralized public runtime configuration.
 *
 * Expo inlines every `EXPO_PUBLIC_*` variable into the JavaScript bundle at
 * build time. They are PUBLIC - anyone with the app bundle can read them - so
 * they may only hold non-secret values such as the API base URL.
 *
 * Backend secrets (MongoDB credentials, JWT signing secrets, Cloudinary API
 * secret, payment keys, private keys) belong exclusively to
 * `self_aura_backend/.env` and must never be added to this app, its `.env`
 * files, or any `EXPO_PUBLIC_*` variable.
 */

/** Development-only default so `npx expo start` works before `.env` exists. */
const DEV_API_URL = 'http://localhost:5000/api';

const HTTP_URL_PATTERN = /^https?:\/\/[^\s]+$/i;

function normalizeUrl(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

function resolveApiUrl(): string {
  const raw = process.env.EXPO_PUBLIC_API_URL;

  if (raw !== undefined && raw.trim() !== '') {
    const normalized = normalizeUrl(raw);
    if (!HTTP_URL_PATTERN.test(normalized)) {
      throw new Error(
        `EXPO_PUBLIC_API_URL is not a valid http(s) URL: "${raw}". Fix it in .env (see .env.example).`,
      );
    }
    return normalized;
  }

  if (__DEV__) {
    console.warn(
      `[config] EXPO_PUBLIC_API_URL is not set; falling back to the development default ${DEV_API_URL}. ` +
        'Copy .env.example to .env to configure it explicitly.',
    );
    return DEV_API_URL;
  }

  throw new Error(
    'EXPO_PUBLIC_API_URL is missing. A production build must define it (in .env or EAS project variables). ' +
      'See .env.example.',
  );
}

export const env = {
  /** Base URL of the existing self_aura_backend API, including the /api prefix. */
  apiUrl: resolveApiUrl(),
  appName: process.env.EXPO_PUBLIC_APP_NAME ?? 'Self Aura',
  isDev: __DEV__,
} as const;

export type Env = typeof env;
