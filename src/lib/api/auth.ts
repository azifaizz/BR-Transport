import { apiClient } from "./client";
import type { AuthUser } from "@/lib/auth/token-storage";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  user: AuthUser;
}

export const authApi = {
  async login(payload: LoginRequest): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>("/api/auth/login", payload);
    return data;
  },
  async me(): Promise<AuthUser> {
    const { data } = await apiClient.get<AuthUser>("/api/auth/me");
    return data;
  },
  async logout(): Promise<void> {
    // Best-effort; token is cleared client-side regardless.
    try {
      await apiClient.post("/api/auth/logout");
    } catch {
      /* ignore */
    }
  },
};
