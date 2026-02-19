"use client";

import { useMemo } from "react";
import { useAuth } from "@/components/auth-context";
import { request } from "@/lib/api";

const buildRefreshUrl = (): string => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not set");
  }
  return `${baseUrl.replace(/\/+$/, "")}/auth/refresh`;
};

export const useApi = () => {
  const { accessToken, clearSession, setSession, user } = useAuth();

  return useMemo(
    () => ({
      request: <T,>(path: string, init: RequestInit = {}) =>
        request<T>(path, {
          ...init,
          accessToken,
          onUnauthorized: async () => {
            const refreshResponse = await fetch(buildRefreshUrl(), {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({})
            });

            if (!refreshResponse.ok) {
              clearSession();
              throw new Error("Session expired. Please sign in again.");
            }

            const data = (await refreshResponse.json()) as { accessToken: string };
            if (!user) {
              throw new Error("Session user missing. Please sign in again.");
            }
            setSession(data.accessToken, user);
            return data.accessToken;
          }
        })
    }),
    [accessToken, clearSession, setSession, user]
  );
};
