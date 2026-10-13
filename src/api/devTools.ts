/**
 * Development-only API utilities for manual verification.
 * Never import in production code paths; use only in dev scripts/tests or via console in dev builds.
 */
import { env } from '@/config/env';
import { pingBackend } from './health';

export async function __devTestBackendConnectivity(): Promise<{
  ok: boolean;
  apiUrl: string;
  error?: string;
}> {
  if (!env.isDev) {
    return { ok: false, apiUrl: env.apiUrl, error: 'Not available in production' };
  }
  try {
    const ok = await pingBackend();
    return { ok, apiUrl: env.apiUrl };
  } catch (e) {
    return {
      ok: false,
      apiUrl: env.apiUrl,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
