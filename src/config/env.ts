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
 * 
 *  */

import Constants from 'expo-constants';

/** Development-only default so `npx expo start` works before `.env` exists. */
const DEV_API_PORT = 5000;
const DEV_API_URL = `http://localhost:${DEV_API_PORT}/api`;
const DEV_WEB_BASE_URL = 'http://localhost:3001';

const HTTP_URL_PATTERN = /^https?:\/\/[^\s]+$/i;
const LOOPBACK_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/i;

function normalizeUrl(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

/**
 * The host that Metro served this bundle from - i.e. the machine running
 * `npx expo start`, which in development is also the machine running the
 * backend.
 *
 * `hostUri` looks like `192.168.1.20:8081` (LAN), `localhost:8081`
 * (localhost or tunnel) or a `<slug>.exp.direct` tunnel host. Returns `null`
 * when there is no usable LAN address, so the caller falls back to its
 * configured value.
 */
function devHostFromMetro(): string | null {
  const hostUri = Constants.expoConfig?.hostUri;
  if (!hostUri) return null;

  const host = hostUri.split('/')[0]?.split(':')[0];
  if (!host || host === 'localhost' || host === '127.0.0.1') return null;
  // Tunnel hosts serve the JS bundle only - they do not expose the local
  // backend, so pointing the API at them would never connect.
  if (host.endsWith('.exp.direct') || host.endsWith('.ngrok.io')) return null;

  return host;
}

function resolveApiUrl(): string {
  const raw = process.env.EXPO_PUBLIC_API_URL;
  const explicit = raw !== undefined && raw.trim() !== '' ? normalizeUrl(raw) : null;

  if (explicit && !HTTP_URL_PATTERN.test(explicit)) {
    throw new Error(
      `EXPO_PUBLIC_API_URL is not a valid http(s) URL: "${raw}". Fix it in .env (see .env.example).`,
    );
  }

  // A loopback URL is only reachable from a simulator sharing this machine's
  // network - on a phone or Android emulator it points at the device itself,
  // so every request fails with a network error. When Metro reports the dev
  // machine's LAN address, use it instead; an explicit non-loopback URL (a
  // remote or staging server) is always respected as-is.
  if (__DEV__ && (explicit === null || LOOPBACK_PATTERN.test(explicit))) {
    const host = devHostFromMetro();
    if (host) {
      const inferred = `http://${host}:${DEV_API_PORT}/api`;
      console.info(`[config] Using dev API base URL ${inferred} (from the Metro host).`);
      return inferred;
    }
  }

  if (explicit) return explicit;

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

function resolveWebBaseUrl(): string {
  const raw = process.env.EXPO_PUBLIC_WEB_BASE_URL;

  if (raw !== undefined && raw.trim() !== '') {
    const normalized = normalizeUrl(raw);
    if (!HTTP_URL_PATTERN.test(normalized)) {
      throw new Error(
        `EXPO_PUBLIC_WEB_BASE_URL is not a valid http(s) URL: "${raw}". Fix it in .env (see .env.example).`,
      );
    }
    return normalized;
  }

  if (__DEV__) {
    console.warn(
      `[config] EXPO_PUBLIC_WEB_BASE_URL is not set; falling back to the development default ${DEV_WEB_BASE_URL}. ` +
        'Copy .env.example to .env to configure it explicitly.',
    );
    return DEV_WEB_BASE_URL;
  }

  throw new Error(
    'EXPO_PUBLIC_WEB_BASE_URL is missing. A production build must define it (in .env or EAS project variables). ' +
      'See .env.example.',
  );
}

export const env = {
  /** Base URL of the existing self_aura_backend API, including the /api prefix. */
  apiUrl: resolveApiUrl(),
  /** Base URL of the web storefront (used for deep links, sharing, etc.). */
  webBaseUrl: resolveWebBaseUrl(),
  appName: process.env.EXPO_PUBLIC_APP_NAME ?? 'Self Aura',
  isDev: __DEV__,
} as const;

export type Env = typeof env;