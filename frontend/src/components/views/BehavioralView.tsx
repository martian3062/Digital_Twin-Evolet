"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Brain, Activity, Moon, Smile, Frown, Meh, TrendingUp, TrendingDown } from "lucide-react";
import { behavioralAPI, BehavioralResponse } from "@/lib/api";

function GaugeBar({ value, max = 100, color }: { value: number; max?: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
      <motion.div
        className={`h-full rounded-full ${color}`}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
    </div>
  );
}

function MoodIcon({ label }: { label: string }) {
  const l = label.toLowerCase();
  if (l.includes("positive") || l.includes("happy") || l.includes("calm")) return <Smile size={20} className="text-emerald-400" />;
  if (l.includes("negative") || l.includes("stressed") || l.includes("anxious")) return <Frown size={20} className="text-rose-400" />;
  return <Meh size={20} className="text-yellow-400" />;
}

function stressColor(v: number) {
  if (v < 30) return "bg-emerald-500";
  if (v < 60) return "bg-yellow-500";
  if (v < 80) return "bg-orange-500";
  return "bg-rose-500";
}

function stressLabel(v: number) {
  if (v < 30) return { label: "Low", color: "text-emerald-400" };
  if (v < 60) return { label: "Moderate", color: "text-yellow-400" };
  if (v < 80) return { label: "High", color: "text-orange-400" };
  return { label: "Critical", color: "text-rose-400" };
}

export default function BehavioralView() {
  const [data, setData] = useState<BehavioralResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await behavioralAPI.analyze({
        sleep_hours: 7,
        activity_minutes: 30,
      });
      setData(result);
    } catch {
      setError("AI engine offline — showing cached data.");
      setData(mockData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { analyze(); }, []);

  const d = data ?? mockData;
  const stress = stressLabel(d.stress_index);

  return (
    <div className="space-y-6 max-h-[calc(100vh-140px)] overflow-y-auto pr-2 custom-scrollbar">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <span className="status-dot online" />
          <span className="text-emerald-400 font-medium">Behavioral & Emotional AI</span>
        </div>
        <button
          onClick={analyze}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-500/15 text-violet-400 border border-violet-500/20 hover:bg-violet-500/25 transition-all disabled:opacity-50"
        >
          {loading ? "Analyzing..." : "Re-analyze"}
        </button>
      </div>

      {error && (
        <div className="px-4 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs">
          {error}
        </div>
      )}

      {/* Top metrics row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Stress Index",
            value: `${d.stress_index.toFixed(0)}%`,
            sub: stress.label,
            icon: Brain,
            color: stress.color,
            bar: d.stress_index,
            barColor: stressColor(d.stress_index),
          },
          {
            label: "Mood State",
            value: d.mood.label,
            sub: `Valence ${(d.mood.valence * 100).toFixed(0)}%`,
            icon: Smile,
            color: d.mood.valence > 0.5 ? "text-emerald-400" : d.mood.valence > 0 ? "text-yellow-400" : "text-rose-400",
            bar: (d.mood.valence + 1) * 50,
            barColor: d.mood.valence > 0.5 ? "bg-emerald-500" : d.mood.valence > 0 ? "bg-yellow-500" : "bg-rose-500",
          },
          {
            label: "Activity Readiness",
            value: `${(d.activity_readiness * 100).toFixed(0)}%`,
            sub: d.activity_readiness > 0.7 ? "Ready" : d.activity_readiness > 0.4 ? "Moderate" : "Rest needed",
            icon: Activity,
            color: d.activity_readiness > 0.7 ? "text-cyan-400" : d.activity_readiness > 0.4 ? "text-yellow-400" : "text-rose-400",
            bar: d.activity_readiness * 100,
            barColor: d.activity_readiness > 0.7 ? "bg-cyan-500" : d.activity_readiness > 0.4 ? "bg-yellow-500" : "bg-rose-500",
          },
          {
            label: "Sleep Quality",
            value: `${(d.sleep_quality * 100).toFixed(0)}%`,
            sub: d.sleep_quality > 0.7 ? "Restorative" : d.sleep_quality > 0.4 ? "Fair" : "Poor",
            icon: Moon,
            color: d.sleep_quality > 0.7 ? "text-violet-400" : d.sleep_quality > 0.4 ? "text-yellow-400" : "text-rose-400",
            bar: d.sleep_quality * 100,
            barColor: d.sleep_quality > 0.7 ? "bg-violet-500" : d.sleep_quality > 0.4 ? "bg-yellow-500" : "bg-rose-500",
          },
        ].map(({ label, value, sub, icon: Icon, color, bar, barColor }) => (
          <motion.div
            key={label}
            className="glass-card p-4 space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-2">
              <Icon size={15} className="text-slate-500" />
              <p className="text-[11px] text-slate-500 uppercase tracking-wide">{label}</p>
            </div>
            <div>
              <p className={`text-2xl font-bold ${color} capitalize`}>{value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
            </div>
            <GaugeBar value={bar} color={barColor} />
          </motion.div>
        ))}
      </div>

      {/* Risk Modifiers + Mood detail */}
      <div className="grid grid-cols-12 gap-6">
        <motion.div
          className="col-span-12 lg:col-span-5 glass-card p-5"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-violet-400" />
            <span className="text-sm font-semibold text-white">Risk Modifiers</span>
          </div>
          <div className="space-y-3">
            {Object.entries(d.behavioral_risk_modifiers).map(([key, val]) => {
              const pct = Math.abs(val) * 100;
              const isUp = val > 0;
              return (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 capitalize">{key.replace(/_/g, " ")}</span>
                    <div className="flex items-center gap-1">
                      {isUp ? <TrendingUp size={11} className="text-rose-400" /> : <TrendingDown size={11} className="text-emerald-400" />}
                      <span className={isUp ? "text-rose-400" : "text-emerald-400"}>
                        {isUp ? "+" : ""}{(val * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <GaugeBar value={pct} max={50} color={isUp ? "bg-rose-500" : "bg-emerald-500"} />
                </div>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          className="col-span-12 lg:col-span-7 glass-card p-5"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <MoodIcon label={d.mood.label} />
            <span className="text-sm font-semibold text-white">Mood Analysis</span>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <p className="text-[10px] text-slate-500 uppercase">State</p>
              <p className="text-lg font-semibold text-white capitalize mt-0.5">{d.mood.label}</p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <p className="text-[10px] text-slate-500 uppercase">Arousal</p>
              <p className="text-lg font-semibold text-cyan-400 mt-0.5">{(d.mood.arousal * 100).toFixed(0)}%</p>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <Brain size={15} className="text-slate-500" />
            <span className="text-xs font-semibold text-slate-300">AI Insights</span>
          </div>
          <div className="space-y-2">
            {(d.insights ?? []).map((insight, i) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-violet-500/5 border border-violet-500/10">
                <span className="text-violet-400 text-xs mt-0.5">•</span>
                <p className="text-xs text-slate-300">{insight}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

const mockData: BehavioralResponse = {
  stress_index: 42,
  mood: { label: "Neutral", valence: 0.1, arousal: 0.45 },
  activity_readiness: 0.68,
  sleep_quality: 0.72,
  behavioral_risk_modifiers: {
    cardiac_modifier: 0.05,
    diabetes_modifier: -0.02,
    hypertension_modifier: 0.08,
  },
  insights: [
    "Moderate stress detected via HRV proxy — consider breathing exercises.",
    "Sleep quality is adequate but below optimal. Aim for 8h.",
    "Activity readiness is good — light exercise recommended today.",
  ],
};
