"use client";

import { motion } from "framer-motion";
import { AlertTriangle, XCircle, Bell, Info, LucideIcon } from "lucide-react";
import { useRealtime } from "@/lib/realtime";

type SeverityType = 'critical' | 'high' | 'medium' | 'low';

const severityConfig: Record<SeverityType, { color: string; bg: string; icon: LucideIcon; border: string }> = {
  critical: { color: "#f43f5e", bg: "rgba(244, 63, 94, 0.08)", icon: XCircle, border: "rgba(244, 63, 94, 0.2)" },
  high: { color: "#f97316", bg: "rgba(249, 115, 22, 0.08)", icon: AlertTriangle, border: "rgba(249, 115, 22, 0.2)" },
  medium: { color: "#f59e0b", bg: "rgba(245, 158, 11, 0.08)", icon: AlertTriangle, border: "rgba(245, 158, 11, 0.2)" },
  low: { color: "#10b981", bg: "rgba(16, 185, 129, 0.08)", icon: Info, border: "rgba(16, 185, 129, 0.2)" },
};

export default function AlertsPanel() {
  const { vitals, twinState, isSimulated } = useRealtime();

  // Derive alerts from vitals and twinState
  const activeAlerts = Object.entries(vitals)
    .filter(([, v]) => v.is_anomaly)
    .map(([key, v]) => ({
      id: `anomaly-${key}`,
      severity: "high", // Defaulting to high for anomalies
      message: `Abnormal ${key.replace("_", " ")} detected: ${v.value}${v.unit}`,
      time: "Just now",
      acknowledged: false,
    }));

  const predictedAlerts = (twinState?.predicted_events || []).map((p, i) => ({
    id: `pred-${i}`,
    severity: p.probability > 0.7 ? "high" : p.probability > 0.4 ? "medium" : "low",
    message: `${p.event} (Prob: ${Math.round(p.probability * 100)}%) predicted within ${p.timeframe}`,
    time: "AI Analysis",
    acknowledged: false,
  }));

  const allAlerts = [...activeAlerts, ...predictedAlerts];

  // Mock alerts if none exist
  const displayAlerts = allAlerts.length > 0 ? allAlerts : [
    { id: "mock-1", severity: "medium", message: "Blood pressure trending upward — monitor closely", time: "1 hr ago", acknowledged: false },
    { id: "mock-2", severity: "low", message: "SpO2 dipped to 93% during sleep — recovered", time: "3 hrs ago", acknowledged: true },
  ];

  return (
    <div className="glass-card p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-rose-400 group-hover:animate-shake" />
          <h3 className="text-sm font-semibold text-slate-300">
            Active Alerts
            {isSimulated && (
              <span className="ml-2 text-[9px] bg-white/5 px-1 py-0.5 rounded text-slate-500 uppercase tracking-widest font-bold">Demo</span>
            )}
          </h3>
          <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] flex items-center justify-center font-bold border border-rose-500/20">
            {displayAlerts.filter((a) => !a.acknowledged).length}
          </span>
        </div>
        <button className="text-[11px] font-bold text-violet-400 hover:text-violet-300 transition-colors uppercase tracking-wider">
          View History
        </button>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-2">
        {displayAlerts.map((alert, i) => {
          const config = severityConfig[alert.severity as keyof typeof severityConfig] || severityConfig.medium;
          const Icon = config.icon;

          return (
            <motion.div
              key={alert.id}
              className={`p-3 rounded-xl border group/alert transition-all relative overflow-hidden ${
                alert.acknowledged ? "opacity-40 grayscale-[0.5]" : "hover:shadow-[0_0_20px_rgba(244,63,94,0.1)]"
              }`}
              style={{
                background: config.bg,
                borderColor: config.border,
              }}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: alert.acknowledged ? 0.4 : 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ x: 3 }}
            >
              <div className="flex gap-3 relative z-10">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-inner overflow-hidden"
                  style={{ background: `${config.color}15`, border: `1px solid ${config.color}20` }}
                >
                  <Icon size={14} style={{ color: config.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-widest border"
                      style={{ color: config.color, background: `${config.color}10`, borderColor: `${config.color}20` }}
                    >
                      {alert.severity}
                    </span>
                    <span className="text-[10px] text-slate-600 font-mono">{alert.time}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed mt-1.5 group-hover/alert:text-white transition-colors">
                    {alert.message}
                  </p>
                </div>
              </div>
              
              {/* Background Glow */}
              <div 
                className="absolute inset-0 opacity-[0.03] group-hover/alert:opacity-[0.06] transition-opacity"
                style={{ background: `radial-gradient(circle at right, ${config.color}, transparent)` }}
              />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
