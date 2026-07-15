/**
 * Token storage for the admin session.
 * Uses localStorage so the session survives page reloads.
 */

const ACCESS_KEY = "br.auth.accessToken";
const REFRESH_KEY = "br.auth.refreshToken";
const USER_KEY = "br.auth.user";

export interface AuthUser {
  id: string | number;
  email: string;
  name?: string;
}

function safeStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export const tokenStorage = {
  getAccessToken(): string | null {
    return safeStorage()?.getItem(ACCESS_KEY) ?? null;
  },
  getRefreshToken(): string | null {
    return safeStorage()?.getItem(REFRESH_KEY) ?? null;
  },
  getUser(): AuthUser | null {
    const raw = safeStorage()?.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  },
  set(session: { accessToken: string; refreshToken?: string; user: AuthUser }) {
    const s = safeStorage();
    if (!s) return;
    s.setItem(ACCESS_KEY, session.accessToken);
    if (session.refreshToken) s.setItem(REFRESH_KEY, session.refreshToken);
    s.setItem(USER_KEY, JSON.stringify(session.user));
  },
  clear() {
    const s = safeStorage();
    if (!s) return;
    s.removeItem(ACCESS_KEY);
    s.removeItem(REFRESH_KEY);
    s.removeItem(USER_KEY);
  },
};
