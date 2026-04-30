"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  authAPI,
  clearToken,
  getRefreshToken,
  getToken,
  setRefreshToken,
  setToken,
  type UserProfile,
} from "./api";

interface AuthContextType {
  user: UserProfile | null;
  profile: Record<string, unknown> | null;
  loading: boolean;
  login: (credentials: { username?: string; email?: string; password: string }) => Promise<void>;
  register: (data: { email: string; password: string; username: string; first_name?: string; last_name?: string; role?: string }) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const publicPaths = ["/login", "/register"];

function getIdentifier(credentials: { username?: string; email?: string; password: string }) {
  return credentials.username?.trim() || credentials.email?.trim() || "";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const profile = (user?.profile as Record<string, unknown> | undefined) ?? null;

  const handleUnauthenticated = () => {
    clearToken();
    setUser(null);
    if (!publicPaths.includes(pathname)) {
      router.push("/login");
    }
  };

  const restoreSession = async () => {
    const access = getToken();
    const refresh = getRefreshToken();

    if (!access && !refresh) {
      handleUnauthenticated();
      return;
    }

    try {
      const me = await authAPI.getProfile();
      setUser(me);
      if (publicPaths.includes(pathname)) {
        router.push("/");
      }
      return;
    } catch {
      if (!refresh) {
        handleUnauthenticated();
        return;
      }
    }

    try {
      const refreshed = await authAPI.refreshToken(refresh);
      setToken(refreshed.access);
      const me = await authAPI.getProfile();
      setUser(me);
      if (publicPaths.includes(pathname)) {
        router.push("/");
      }
    } catch {
      handleUnauthenticated();
    }
  };

  useEffect(() => {
    restoreSession().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (credentials: { username?: string; email?: string; password: string }) => {
    setLoading(true);
    try {
      const identifier = getIdentifier(credentials);
      if (!identifier) {
        throw new Error("Username or email is required.");
      }

      const tokens = await authAPI.login({
        username: identifier,
        password: credentials.password,
      });
      setToken(tokens.access);
      setRefreshToken(tokens.refresh);

      const me = await authAPI.getProfile();
      setUser(me);
      router.push("/");
    } catch (error) {
      clearToken();
      setUser(null);
      throw error instanceof Error ? error : new Error("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: {
    email: string;
    password: string;
    username: string;
    first_name?: string;
    last_name?: string;
    role?: string;
  }) => {
    setLoading(true);
    try {
      await authAPI.register({
        username: data.username,
        email: data.email,
        password: data.password,
        role: data.role ?? "patient",
      });

      await login({
        username: data.username,
        email: data.email,
        password: data.password,
      });
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    clearToken();
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

export type { UserProfile as Profile };
