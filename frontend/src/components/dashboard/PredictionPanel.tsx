"use client";

import { motion } from "framer-motion";
import { BrainCircuit, Zap, Sparkles } from "lucide-react";
import { useRealtime } from "@/lib/realtime";

const severityColors: Record<string, { bar: string; bg: string }> = {
  low: { bar: "#10b981", bg: "rgba(16, 185, 129, 0.06)" },
  medium: { bar: "#f59e0b", bg: "rgba(245, 158, 11, 0.06)" },
  high: { bar: "#f43f5e", bg: "rgba(244, 63, 94, 0.06)" },
};

export default function PredictionPanel() {
  const { twinState, isSimulated } = useRealtime();

  const predictions = twinState?.predicted_events || [
    {
      event: "Potential hypertension episode",
      probability: 0.23,
      timeframe: "7 days",
    },
    {
      event: "Sleep quality decline likely",
      probability: 0.15,
      timeframe: "3 days",
    },
    {
      event: "Elevated stress indicators",
      probability: 0.31,
      timeframe: "48 hours",
    },
  ];

  return (
    <div className="glass-card p-5 h-full flex flex-col relative overflow-hidden group">
      {/* Background Decor */}
      <div className="absolute -bottom-6 -left-6 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity pointer-events-none rotate-12">
        <Sparkles size={100} className="text-violet-500" />
      </div>

      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <BrainCircuit size={18} className="text-violet-400 group-hover:rotate-12 transition-transform" />
          <h3 className="text-sm font-semibold text-slate-300">
            Health Prognosis
            {isSimulated && (
              <span className="ml-2 text-[9px] bg-white/5 px-1 py-0.5 rounded text-slate-500 uppercase tracking-widest font-bold">Simulated</span>
            )}
          </h3>
        </div>
        <span className="text-[10px] text-slate-600 font-mono font-bold tracking-tighter">
          Transformer v2.1
        </span>
      </div>

      <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-1 relative z-10">
        {predictions.map((pred, i) => {
          const severity = pred.probability > 0.4 ? "high" : pred.probability > 0.25 ? "medium" : "low";
          const colors = severityColors[severity];
          
          return (
            <motion.div
              key={i}
              className="p-4 rounded-2xl border border-white/[0.04] backdrop-blur-md transition-all hover:border-white/[0.1] group/item"
              style={{ background: colors.bg }}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.12 }}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <p className="text-xs font-semibold text-slate-200 leading-snug group-hover/item:text-white transition-colors">
                  {pred.event}
                </p>
                <div 
                  className="p-1.5 rounded-lg shrink-0"
                  style={{ background: `${colors.bar}20` }}
                >
                  <Zap size={14} style={{ color: colors.bar }} className="drop-shadow-glow" />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1 risk-bar h-1.5 bg-white/[0.03] rounded-full overflow-hidden">
                  <motion.div
                    className="risk-bar-fill h-full rounded-full"
                    style={{ 
                      background: `linear-gradient(90deg, ${colors.bar}80, ${colors.bar})`,
                      boxShadow: `0 0 10px ${colors.bar}40`
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pred.probability * 100}%` }}
                    transition={{ delay: 0.4 + i * 0.1, duration: 1.2, ease: "circOut" }}
                  />
                </div>
                <div className="flex flex-col items-end shrink-0">
                  <span className="text-[11px] text-white font-black font-mono">
                    {Math.round(pred.probability * 100)}%
                  </span>
                  <span className="text-[9px] text-slate-500 uppercase tracking-tighter font-bold">Confidence</span>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/[0.03]">
                <span className="text-[9px] text-slate-400 uppercase tracking-widest font-black">Timeframe:</span>
                <span className="text-[10px] text-violet-400 font-bold font-mono px-2 py-0.5 bg-violet-400/10 rounded-full border border-violet-400/20">
                  {pred.timeframe}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-white/[0.04] relative z-10">
        <button className="w-full py-2 flex items-center justify-center gap-2 text-[11px] font-bold text-slate-400 hover:text-white transition-colors uppercase tracking-widest bg-white/[0.02] rounded-xl hover:bg-white/[0.05] border border-white/[0.04]">
          Run Simulation
        </button>
      </div>
    </div>
  );
}
