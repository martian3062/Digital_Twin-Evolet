"use client";

import { motion } from "framer-motion";
import {
  RefreshCw, Video, Mic, FileUp,
  Shield, Brain
} from "lucide-react";

const actions = [
  {
    label: "Sync Google Fit",
    description: "Fetch latest wearable data",
    icon: RefreshCw,
    color: "#10b981",
    gradient: "from-emerald-500/10 to-emerald-600/5",
  },
  {
    label: "Start Consultation",
    description: "Connect with a doctor",
    icon: Video,
    color: "#8b5cf6",
    gradient: "from-violet-500/10 to-violet-600/5",
  },
  {
    label: "Voice Assistant",
    description: "Report symptoms by voice",
    icon: Mic,
    color: "#f59e0b",
    gradient: "from-amber-500/10 to-amber-600/5",
  },
  {
    label: "Upload Record",
    description: "Add medical documents",
    icon: FileUp,
    color: "#00f0ff",
    gradient: "from-cyan-500/10 to-cyan-600/5",
  },
  {
    label: "Web3 Vault",
    description: "Manage data ownership",
    icon: Shield,
    color: "#6366f1",
    gradient: "from-indigo-500/10 to-indigo-600/5",
  },
  {
    label: "Run AI Analysis",
    description: "Full digital twin update",
    icon: Brain,
    color: "#f43f5e",
    gradient: "from-rose-500/10 to-rose-600/5",
  },
];

export default function QuickActions() {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-300 mb-4">
        Quick Actions
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {actions.map((action, i) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.label}
              className={`p-4 rounded-xl bg-gradient-to-br ${action.gradient} border border-white/[0.04] 
                text-left group hover:border-white/[0.08] transition-all`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -3, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Icon
                size={20}
                style={{ color: action.color }}
                className="mb-3 group-hover:scale-110 transition-transform"
              />
              <p className="text-xs font-medium text-slate-300 mb-0.5">
                {action.label}
              </p>
              <p className="text-[10px] text-slate-600">{action.description}</p>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
