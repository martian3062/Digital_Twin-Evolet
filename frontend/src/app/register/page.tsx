"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Lock, ArrowRight, ShieldCheck, AlertCircle, Heart } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "patient" as "patient" | "doctor",
  });
  const [error, setError] = useState<string | null>(null);
  const { register, loading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Registration failed. Please try again.";
      setError(message);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg"
      >
        <div className="glass-card p-8 relative overflow-hidden group shadow-2xl">
          {/* Header */}
          <div className="flex flex-col items-center mb-6 text-center">
            <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-500">
              <Heart className="w-7 h-7 text-white fill-white/20 animate-pulse" />
            </div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              Create Your Digital Twin
            </h1>
            <p className="text-gray-400 mt-2">Begin your personalized health journey</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg flex items-center gap-3 text-red-400 text-sm"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p>{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Role Selector */}
            <div className="flex p-1 bg-white/5 rounded-xl border border-white/10 mb-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: "patient" })}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                  formData.role === "patient"
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Patient
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: "doctor" })}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                  formData.role === "doctor"
                    ? "bg-purple-600 text-white shadow-lg"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Doctor / Provider
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all placeholder:text-gray-600 font-medium"
                  placeholder="Username"
                  required
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all placeholder:text-gray-600 font-medium"
                  placeholder="Email address"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all placeholder:text-gray-600 font-medium"
                  placeholder="Password"
                  required
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all placeholder:text-gray-600 font-medium"
                  placeholder="Confirm"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 rounded-xl font-bold flex items-center justify-center gap-2 group relative overflow-hidden"
            >
              <span className="relative z-10">{loading ? "Creating Account..." : "Create Account"}</span>
              {!loading && (
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  <ArrowRight size={18} className="relative z-10" />
                </motion.span>
              )}
              <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <p className="text-gray-400 text-sm">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                Sign In
              </Link>
            </p>
          </div>

          <div className="mt-6 flex items-center justify-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <ShieldCheck size={12} />
              <span>Decentralized Data</span>
            </div>
            <div className="flex items-center gap-1">
              <ShieldCheck size={12} />
              <span>User Owned</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
