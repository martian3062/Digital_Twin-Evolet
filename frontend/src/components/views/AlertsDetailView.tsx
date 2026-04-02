"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, AlertTriangle, XCircle, Check } from "lucide-react";

const allAlerts = [
  { id: "1", type: "anomaly", severity: "high" as const, message: "Heart rate elevated to 142 bpm during rest period", metric: "heart_rate", value: 142, time: "12 min ago", acknowledged: false },
  { id: "2", type: "prediction", severity: "medium" as const, message: "Blood pressure trending upward — monitor closely", metric: "bp_systolic", value: 138, time: "1 hr ago", acknowledged: false },
  { id: "3", type: "anomaly", severity: "low" as const, message: "SpO2 dipped to 93% during sleep — recovered", metric: "spo2", value: 93, time: "3 hrs ago", acknowledged: true },
  { id: "4", type: "prediction", severity: "medium" as const, message: "Sleep quality declining — average dropped 12% this week", metric: "sleep_quality", value: 6.3, time: "6 hrs ago", acknowledged: true },
  { id: "5", type: "anomaly", severity: "high" as const, message: "Respiratory rate spike detected: 28 breaths/min", metric: "respiratory_rate", value: 28, time: "1 day ago", acknowledged: true },
  { id: "6", type: "system", severity: "low" as const, message: "Digital Twin model updated to v0.1.1 — improved cardiac risk prediction", metric: "system", value: 0, time: "2 days ago", acknowledged: true },
];

const sevConfig = {
  critical: { color: "#f43f5e", bg: "rgba(244,63,94,0.08)", border: "rgba(244,63,94,0.2)", icon: XCircle },
  high: { color: "#f97316", bg: "rgba(249,115,22,0.08)", border: "rgba(249,115,22,0.2)", icon: AlertTriangle },
  medium: { color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)", icon: AlertTriangle },
  low: { color: "#10b981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)", icon: CheckCircle },
};

export default function AlertsDetailView() {
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [alerts, setAlerts] = useState(allAlerts);

  const filtered = alerts.filter(a => {
    if (filter === "unread") return !a.acknowledged;
    if (filter === "read") return a.acknowledged;
    return true;
  });

  const acknowledge = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-200">Alerts Center</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {alerts.filter(a => !a.acknowledged).length} unacknowledged • {alerts.length} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(["all", "unread", "read"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${filter === f ? "bg-violet-500/10 text-violet-400 border border-violet-500/20" : "text-slate-500 hover:bg-white/[0.03] border border-transparent"}`}>{f}</button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((alert, i) => {
          const config = sevConfig[alert.severity];
          const Icon = config.icon;
          return (
            <motion.div key={alert.id} className={`glass-card p-4 transition-all ${alert.acknowledged ? "opacity-60" : ""}`} style={{ borderColor: alert.acknowledged ? undefined : config.border }} initial={{ opacity: 0, y: 15 }} animate={{ opacity: alert.acknowledged ? 0.6 : 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: config.bg }}>
                  <Icon size={16} style={{ color: config.color }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-300">{alert.message}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wider" style={{ color: config.color, background: `${config.color}15` }}>{alert.severity}</span>
                    <span className="text-[10px] text-slate-600">{alert.type}</span>
                    <span className="text-[10px] text-slate-600">{alert.time}</span>
                    {alert.value > 0 && <span className="text-[10px] font-mono text-slate-500">Value: {alert.value}</span>}
                  </div>
                </div>
                {!alert.acknowledged && (
                  <button onClick={() => acknowledge(alert.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/[0.04] text-xs text-slate-400 hover:bg-white/[0.06] transition-all">
                    <Check size={12} /> Acknowledge
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
