import axios, { AxiosError, type AxiosInstance } from "axios";

import { tokenStorage } from "@/lib/auth/token-storage";

/**
 * Base URL for the Spring Boot backend.
 * Configure via VITE_API_BASE_URL in your .env file.
 * Defaults to http://localhost:8080 for local development.
 */
const baseURL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:8080";

export const apiClient: AxiosInstance = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  timeout: 20_000,
});

// Attach JWT to every request when present.
apiClient.interceptors.request.use((config) => {
  const token = tokenStorage.getAccessToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Hook installed by AuthProvider to react to 401 responses.
 * Kept outside React so the plain axios interceptor can call it.
 */
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      tokenStorage.clear();
      onUnauthorized?.();
    }
    return Promise.reject(error);
  },
);

/**
 * Extract a user-facing message from an axios error.
 * The backend is expected to return `{ message: string, errors?: Record<string, string> }`.
 */
export function extractApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    if (data?.message) return data.message;
    if (error.code === "ERR_NETWORK") {
      return "Cannot reach the server. Please check your connection and that the API is running.";
    }
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred.";
}
