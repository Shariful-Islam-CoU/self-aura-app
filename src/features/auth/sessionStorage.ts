import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

import type { AuthUser } from './types';

/**
 * Local session storage.
 *
 * - The JWT is stored with `expo-secure-store` (encrypted Keychain on iOS,
 *   Keystore-backed SharedPreferences on Android) - never in AsyncStorage,
 *   never in plain text. It is small enough for SecureStore's size limits.
 * - The cached user (profile + permission snapshot) is NOT a credential, so it
 *   lives in AsyncStorage for fast startup rendering. It may go stale; the
 *   backend re-validates on every request.
 *
 * The token is mirrored in memory so the API client can attach the
 * Authorization header synchronously. The mirror is a convenience, never a
 * source of truth: it starts empty on every cold start and is only populated
 * by the functions below.
 *
 * Never store passwords, never log tokens, never put tokens in URLs.
 */

const TOKEN_KEY = 'self_aura_auth_token';
const USER_KEY = 'self_aura_user';
const SESSION_KEY = 'self_aura_session';

let memoryToken: string | null = null;

/** Synchronous token accessor used by `apiClient` (see src/api/client.ts). */
export function getMemoryToken(): string | null {
  return memoryToken;
}

/** Reads the stored JWT and refreshes the in-memory mirror. */
export async function getStoredToken(): Promise<string | null> {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  memoryToken = token;
  return token;
}

export async function setStoredToken(token: string): Promise<void> {
  memoryToken = token;
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearStoredToken(): Promise<void> {
  memoryToken = null;
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

/** Reads the cached user; a corrupt cache degrades to "no user". */
export async function getStoredUser(): Promise<AuthUser | null> {
  const raw = await AsyncStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export async function setStoredUser(user: AuthUser): Promise<void> {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ token: memoryToken, user }));
}

export async function clearStoredUser(): Promise<void> {
  await AsyncStorage.removeItem(USER_KEY);
}

/** Clears the whole local session (JWT + cached user). */
export async function setStoredSession(session: { token: string; user: AuthUser }): Promise<void> {
  memoryToken = session.token;
  await Promise.all([
    SecureStore.setItemAsync(TOKEN_KEY, session.token),
    AsyncStorage.setItem(USER_KEY, JSON.stringify(session.user)),
    AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ token: session.token, user: session.user })),
  ]);
}

/** Clears the whole local session (JWT + cached user). */
export async function clearStoredSession(): Promise<void> {
  // The token is dropped from memory first so an in-memory sign-out always
  // takes effect even if the native delete below fails.
  memoryToken = null;
  await Promise.all([
    SecureStore.deleteItemAsync(TOKEN_KEY),
    AsyncStorage.removeItem(USER_KEY),
    AsyncStorage.removeItem(SESSION_KEY),
  ]);
}
