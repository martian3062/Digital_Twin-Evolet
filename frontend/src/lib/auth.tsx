"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { authAPI, UserProfile, setToken, clearToken, getToken } from "./api";

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  register: (data: Parameters<typeof authAPI.register>[0]) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const publicPaths = ["/login", "/register"];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function initAuth() {
      const token = getToken();
      if (!token) {
        setLoading(false);
        if (!publicPaths.includes(pathname)) {
          router.push("/login");
        }
        return;
      }

      try {
        const profile = await authAPI.getProfile();
        setUser(profile);
      } catch (err) {
        console.error("Failed to fetch profile", err);
        clearToken();
        if (!publicPaths.includes(pathname)) {
          router.push("/login");
        }
      } finally {
        setLoading(false);
      }
    }

    initAuth();
  }, [pathname, router]);

  const login = async (credentials: { username: string; password: string }) => {
    setLoading(true);
    try {
      const { access } = await authAPI.login(credentials);
      setToken(access);
      const profile = await authAPI.getProfile();
      setUser(profile);
      router.push("/");
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: Parameters<typeof authAPI.register>[0]) => {
    setLoading(true);
    try {
      await authAPI.register(data);
      // Auto login after registration or redirect to login
      router.push("/login");
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearToken();
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
