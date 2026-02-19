"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type User = {
  id: string;
  name: string;
  email: string;
};

type AuthContextValue = {
  accessToken: string | null;
  user: User | null;
  setSession: (token: string, nextUser: User) => void;
  clearSession: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const ACCESS_TOKEN_KEY = "task_manager_access_token";
const USER_KEY = "task_manager_user";

export function AuthProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    const serializedUser = localStorage.getItem(USER_KEY);
    if (token) {
      setAccessToken(token);
    }
    if (serializedUser) {
      try {
        setUser(JSON.parse(serializedUser));
      } catch {
        localStorage.removeItem(USER_KEY);
      }
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      accessToken,
      user,
      setSession: (token, nextUser) => {
        setAccessToken(token);
        setUser(nextUser);
        localStorage.setItem(ACCESS_TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
      },
      clearSession: () => {
        setAccessToken(null);
        setUser(null);
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    }),
    [accessToken, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
};
