"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { sbAuth, sbProfiles } from "./supabase";

interface Profile {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: "patient" | "doctor" | "admin";
  did_identifier?: string;
  wallet_address?: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (data: { email: string; password: string; username: string; first_name?: string; last_name?: string; role?: string }) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const publicPaths = ["/login", "/register"];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const loadProfile = async (userId: string) => {
    const { data } = await sbProfiles.get(userId);
    if (data) setProfile(data as Profile);
  };

  useEffect(() => {
    // Initial session check
    sbAuth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
        if (!publicPaths.includes(pathname)) router.push("/login");
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = sbAuth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
        if (publicPaths.includes(pathname)) router.push("/");
      } else {
        setProfile(null);
        if (!publicPaths.includes(pathname)) router.push("/login");
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async ({ email, password }: { email: string; password: string }) => {
    setLoading(true);
    try {
      const { error } = await sbAuth.signIn(email, password);
      if (error) throw new Error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: {
    email: string; password: string; username: string;
    first_name?: string; last_name?: string; role?: string;
  }) => {
    setLoading(true);
    try {
      const { error } = await sbAuth.signUp(data.email, data.password, {
        username: data.username,
        first_name: data.first_name,
        last_name: data.last_name,
        role: data.role ?? "patient",
      });
      if (error) throw new Error(error.message);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await sbAuth.signOut();
    setUser(null);
    setProfile(null);
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

// Legacy compatibility — existing components call useAuth().user.username etc.
// They should migrate to profile, but we expose a merged shape for now.
export type { Profile };
