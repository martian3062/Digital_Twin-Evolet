"use client";

import { Bell, Search, User } from "lucide-react";
import { motion } from "framer-motion";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function Header() {
  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-white/[0.04] bg-[#0a0a1a]/60 backdrop-blur-md sticky top-0 z-30">
      {/* Search */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <div className="relative w-full">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
          />
          <input
            type="text"
            placeholder="Search vitals, records, doctors..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-violet-500/30 focus:ring-1 focus:ring-violet-500/20 transition-all"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        {/* Web3 Connect */}
        <div className="hidden sm:block">
          <ConnectButton 
            chainStatus="icon"
            showBalance={false}
            accountStatus="avatar"
          />
        </div>

        {/* Sync Status */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/10 scale-90 origin-right">
          <span className="status-dot online" />
          <span className="text-[10px] text-emerald-400 font-medium uppercase tracking-wider">
            Google Fit
          </span>
        </div>

        {/* Notifications */}
        <motion.button
          className="relative p-2.5 rounded-xl hover:bg-white/[0.03] transition-all"
          whileTap={{ scale: 0.95 }}
        >
          <Bell size={18} className="text-slate-400" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 shadow-lg shadow-rose-500/50" />
        </motion.button>

        {/* User */}
        <div className="flex items-center gap-3 ml-2 pl-4 border-l border-white/[0.06]">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center ring-2 ring-violet-500/20 cursor-pointer">
            <User size={16} className="text-white" />
          </div>
        </div>
      </div>
    </header>
  );
}
