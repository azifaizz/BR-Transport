import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { authApi } from "@/lib/api/auth";
import { setUnauthorizedHandler } from "@/lib/api/client";
import { tokenStorage, type AuthUser } from "@/lib/auth/token-storage";

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => tokenStorage.getUser());
  const [isBootstrapping, setIsBootstrapping] = useState<boolean>(
    () => !!tokenStorage.getAccessToken(),
  );

  // On mount, if we have a token, validate it against /auth/me.
  useEffect(() => {
    let cancelled = false;
    const token = tokenStorage.getAccessToken();
    if (!token) {
      setIsBootstrapping(false);
      return;
    }
    void authApi
      .me()
      .then((me) => {
        if (cancelled) return;
        setUser(me);
        // Refresh cached user
        const existing = tokenStorage.getAccessToken();
        if (existing) tokenStorage.set({ accessToken: existing, user: me });
      })
      .catch(() => {
        if (cancelled) return;
        tokenStorage.clear();
        setUser(null);
      })
      .finally(() => {
        if (!cancelled) setIsBootstrapping(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Wire axios 401 handler to clear state.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    tokenStorage.set({
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
      user: res.user,
    });
    setUser(res.user);
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    tokenStorage.clear();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      isBootstrapping,
      login,
      logout,
    }),
    [user, isBootstrapping, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
