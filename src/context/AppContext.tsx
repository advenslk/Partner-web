import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { BootstrapData, SessionUser, UserRole } from '../types/portal';

interface AppContextValue {
  bootstrap: BootstrapData | null;
  bootstrapLoading: boolean;
  refreshBootstrap: () => Promise<void>;
  user: SessionUser | null;
  csrfToken: string | null;
  authLoading: boolean;
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
  apiFetch: <T = unknown>(url: string, options?: RequestInit) => Promise<T>;
  isStaff: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

const STAFF_SET = new Set<UserRole>([
  'SUPER_ADMIN',
  'ADMIN',
  'PARTNERSHIP_MANAGER',
  'REVIEWER',
]);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [bootstrap, setBootstrap] = useState<BootstrapData | null>(null);
  const [bootstrapLoading, setBootstrapLoading] = useState(true);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const refreshBootstrap = useCallback(async () => {
    try {
      const res = await fetch('/api/public/bootstrap', { credentials: 'include' });
      if (res.ok) {
        const data = (await res.json()) as BootstrapData;
        setBootstrap(data);
      }
    } catch (err) {
      console.error('Failed to load portal configuration:', err);
    } finally {
      setBootstrapLoading(false);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (res.ok) {
        const data = (await res.json()) as {
          authenticated: boolean;
          csrfToken?: string;
          user: SessionUser | null;
        };
        if (data.authenticated && data.user) {
          setUser(data.user);
          setCsrfToken(data.csrfToken || null);
        } else {
          setUser(null);
          setCsrfToken(null);
        }
      }
    } catch (err) {
      console.error('Failed to check session:', err);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshBootstrap();
    refreshSession();
  }, [refreshBootstrap, refreshSession]);

  const apiFetch = useCallback(
    async <T = unknown>(url: string, options: RequestInit = {}): Promise<T> => {
      const headers = new Headers(options.headers || {});
      if (csrfToken && options.method && !['GET', 'HEAD'].includes(options.method.toUpperCase())) {
        headers.set('X-CSRF-Token', csrfToken);
      }
      if (!(options.body instanceof FormData) && !headers.has('Content-Type') && options.body) {
        headers.set('Content-Type', 'application/json');
      }

      const res = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      });

      const contentType = res.headers.get('content-type') || '';
      const data = contentType.includes('application/json') ? await res.json() : await res.text();
      if (!res.ok) {
        const msg =
          typeof data === 'object' && data && 'error' in data
            ? String((data as { error: unknown }).error)
            : `Request failed (${res.status})`;
        throw new Error(msg);
      }
      return data as T;
    },
    [csrfToken]
  );

  const logout = useCallback(async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      setUser(null);
      setCsrfToken(null);
    }
  }, [apiFetch]);

  const isStaff = Boolean(user && STAFF_SET.has(user.role));

  return (
    <AppContext.Provider
      value={{
        bootstrap,
        bootstrapLoading,
        refreshBootstrap,
        user,
        csrfToken,
        authLoading,
        refreshSession,
        logout,
        apiFetch,
        isStaff,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used inside AppProvider');
  }
  return ctx;
}
