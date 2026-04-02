"use client";

import { motion } from "framer-motion";
import { Heart, Droplets, Wind, Thermometer, Footprints, Moon, Activity, LucideIcon } from "lucide-react";
import { useRealtime } from "@/lib/realtime";

const metricConfig: Record<string, { label: string; icon: LucideIcon; color: string; bgGlow: string; borderGlow: string }> = {
  heart_rate: {
    label: "Heart Rate",
    icon: Heart,
    color: "#f43f5e",
    bgGlow: "rgba(244, 63, 94, 0.08)",
    borderGlow: "rgba(244, 63, 94, 0.15)",
  },
  oxygen_saturation: {
    label: "Blood Oxygen",
    icon: Droplets,
    color: "#00f0ff",
    bgGlow: "rgba(0, 240, 255, 0.08)",
    borderGlow: "rgba(0, 240, 255, 0.15)",
  },
  blood_pressure: {
    label: "Blood Pressure",
    icon: Wind,
    color: "#8b5cf6",
    bgGlow: "rgba(139, 92, 246, 0.08)",
    borderGlow: "rgba(139, 92, 246, 0.15)",
  },
  temperature: {
    label: "Temperature",
    icon: Thermometer,
    color: "#f59e0b",
    bgGlow: "rgba(245, 158, 11, 0.08)",
    borderGlow: "rgba(245, 158, 11, 0.15)",
  },
  steps: {
    label: "Steps Today",
    icon: Footprints,
    color: "#10b981",
    bgGlow: "rgba(16, 185, 129, 0.08)",
    borderGlow: "rgba(16, 185, 129, 0.15)",
  },
  sleep: {
    label: "Sleep Quality",
    icon: Moon,
    color: "#6366f1",
    bgGlow: "rgba(99, 102, 241, 0.08)",
    borderGlow: "rgba(99, 102, 241, 0.15)",
  },
};

const defaultMetrics = ["heart_rate", "oxygen_saturation", "blood_pressure", "temperature", "steps", "sleep"];

export default function VitalsGrid() {
  const { vitals, isConnected, isSimulated, lastUpdate } = useRealtime();

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          Real-time Vitals
          {isConnected ? (
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          ) : isSimulated ? (
            <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-slate-500 uppercase tracking-widest font-bold">Simulated</span>
          ) : (
            <span className="flex h-2 w-2 rounded-full bg-slate-700" />
          )}
        </h3>
        <span className="text-xs text-slate-600">
          {lastUpdate ? `Updated ${lastUpdate.toLocaleTimeString()}` : "Waiting for data..."}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {defaultMetrics.map((key, i) => {
          const config = metricConfig[key];
          const data = vitals[key];
          const Icon = config.icon;

          // Handle BP special case (systolic/diastolic)
          let displayValue = data?.value?.toString() || "—";
          if (key === "blood_pressure" && data?.metadata?.systolic) {
            displayValue = `${data.metadata.systolic}/${data.metadata.diastolic}`;
          }

          return (
            <motion.div
              key={key}
              className="metric-card group cursor-pointer relative overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              whileHover={{ y: -4 }}
              style={{
                borderColor: config.borderGlow,
              }}
            >
              {/* Active Indicator Glow */}
              {isConnected && (
                <div 
                  className="absolute -top-10 -right-10 w-20 h-20 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"
                  style={{ background: config.color }}
                />
              )}

              <div className="flex items-center justify-between mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-lg"
                  style={{ background: config.bgGlow, border: `1px solid ${config.borderGlow}` }}
                >
                  <Icon size={18} style={{ color: config.color }} />
                </div>
                {isConnected && <Activity size={12} className="text-emerald-500/40 animate-bounce" />}
              </div>

              <p className="text-2xl font-bold text-white tracking-tight">
                {displayValue}
              </p>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">{config.label}</p>

              <div className="flex items-center gap-1 mt-2">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
                  {data?.unit || "UNIT"}
                </span>
                {data?.is_anomaly && (
                  <span className="ml-auto text-[9px] bg-red-500/20 text-red-500 px-1.5 py-0.5 rounded border border-red-500/30 uppercase font-black">
                    Anomaly
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
