import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { ApiClient, apiClient } from '@/api';
import {
  clearStoredSession,
  getStoredToken,
  getStoredUser,
  setStoredSession as persistSession,
  setStoredUser,
  type AuthSession,
  type AuthUser,
} from '@/features/auth';
import { queryClient } from '@/store';
import type { PermissionKey } from '@/types';
import {
  registerDeviceForPush,
  unregisterDeviceForPush,
} from '@/services/pushNotifications';

/**
 * Authentication/session state for the mobile app.
 *
 * Mirrors `self_aura_frontend/src/providers/AuthProvider.tsx` (single JWT, no
 * refresh token, backend re-resolves permissions on every request) but is
 * storage- and navigation-agnostic:
 *
 * - `restoring` reads the local session from SecureStore/AsyncStorage and
 *   validates/refreshes the user via GET /auth/me if a token exists. If the
 *   token is invalid (401), the session is cleared automatically.
 * - A 401 from any request clears the session through the API client's global
 *   unauthorized handler; Expo Router's protected groups then move the user
 *   to the login flow automatically.
 * - `setSession` is the entry point the login flow will call.
 *
 * The backend is always the authorization authority: `canAccess` only shapes
 * what this UX shows (entry points, disabled states) - every API call is
 * still checked server-side, and a 403 is surfaced through `ApiError.kind`.
 */
export type AuthStatus = 'restoring' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  isAuthenticated: boolean;
  /** True while the stored session is being restored (show a splash state). */
  isLoading: boolean;
  error: string | null;
  /** Effective permission keys (UX-only snapshot; backend stays authoritative). */
  permissions: string[];
  /** UX-only permission check used by permission-aware navigation/UI. */
  canAccess: (permission: PermissionKey) => boolean;

  /**
   * Optional shell preview flag (kept for internal tooling only). No longer exposed via UI.
   */
  isShellPreview: boolean;
  enterShellPreview: () => void;
  exitShellPreview: () => void;

  /** Persists a freshly issued session (called by the future login flow). */
  setSession: (session: AuthSession) => Promise<void>;
  /** Clears the local session - also invoked automatically on any 401. */
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('restoring');
  const [error, setError] = useState<string | null>(null);
  const [isShellPreview, setShellPreview] = useState(false);

  const clearError = useCallback(() => setError(null), []);

  // Restore the local session on mount. A missing token means "signed out";
  // a token with a cached user restores instantly (the cache may be stale -
  // that is fine, the backend re-validates every request).
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const token = await getStoredToken();
        if (cancelled) return;
        if (!token) {
          setUser(null);
          setStatus('unauthenticated');
          return;
        }
        // Try to validate and refresh user from backend
        try {
          const me = await apiClient.get<{ user: AuthUser }>('/auth/me');
          if (cancelled) return;
          const user = me.user;
          setUser(user);
          setStatus('authenticated');
          await setStoredUser(user);
          void registerDeviceForPush();
        } catch (err) {
          if (cancelled) return;
          // On auth failure, clear session; other errors fall back to cached user if available
          const isAuth =
            (err &&
              typeof err === 'object' &&
              'kind' in err &&
              (err as any).kind === 'authentication') ||
            (err && typeof err === 'object' && 'status' in err && (err as any).status === 401);
          if (isAuth) {
            await clearStoredSession();
            setUser(null);
            setStatus('unauthenticated');
            return;
          }
          const storedUser = await getStoredUser();
          if (cancelled) return;
          setUser(storedUser);
          setStatus('authenticated');
        }
      } catch {
        if (cancelled) return;
        setUser(null);
        setStatus('unauthenticated');
        setError('Could not restore the saved session on this device.');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const signOut = useCallback(async () => {
    try {
      await unregisterDeviceForPush();
    } catch {
      // Best effort
    }
    try {
      await clearStoredSession();
      queryClient.clear();
    } catch {
      queryClient.clear();
    }
    setUser(null);
    setStatus('unauthenticated');
    setShellPreview(false);
    setError(null);
  }, []);

  // Global 401 handling: any request with an invalid/expired token clears the
  // session; protected route groups then redirect to the login flow. Guarded
  // by the API client so concurrent failures only sign out once.
  useEffect(() => {
    const handleUnauthorized = () => {
      void signOut();
    };
    ApiClient.setUnauthorizedHandler(handleUnauthorized);
    return () => ApiClient.setUnauthorizedHandler(null);
  }, [signOut]);

  const setSession = useCallback(async (session: AuthSession) => {
    // Persist first: state only reflects a session that survives a restart.
    await persistSession(session);
    setUser(session.user);
    setStatus('authenticated');
    setError(null);
    setShellPreview(false);
    void registerDeviceForPush();
  }, []);

  const permissions = useMemo(() => user?.permissions ?? [], [user]);
  const canAccess = useCallback(
    (permission: PermissionKey) => permissions.includes(permission),
    [permissions],
  );

  const enterShellPreview = useCallback(() => setShellPreview(true), []);
  const exitShellPreview = useCallback(() => setShellPreview(false), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      isAuthenticated: status === 'authenticated',
      isLoading: status === 'restoring',
      error,
      permissions,
      canAccess,
      isShellPreview,
      enterShellPreview,
      exitShellPreview,
      setSession,
      signOut,
      clearError,
    }),
    [
      status,
      user,
      error,
      permissions,
      canAccess,
      isShellPreview,
      enterShellPreview,
      exitShellPreview,
      setSession,
      signOut,
      clearError,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
