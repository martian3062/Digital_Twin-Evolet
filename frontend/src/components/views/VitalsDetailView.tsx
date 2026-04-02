"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Heart, Droplets, Wind, Thermometer, Footprints, Moon,
  Activity, TrendingUp, TrendingDown, Minus, Filter, Download
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar
} from "recharts";

const metricConfigs = [
  { key: "heart_rate", label: "Heart Rate", unit: "bpm", icon: Heart, color: "#f43f5e", range: [55, 110] },
  { key: "spo2", label: "Blood Oxygen", unit: "%", icon: Droplets, color: "#00f0ff", range: [94, 100] },
  { key: "bp_systolic", label: "Systolic BP", unit: "mmHg", icon: Wind, color: "#8b5cf6", range: [100, 140] },
  { key: "body_temp", label: "Temperature", unit: "°C", icon: Thermometer, color: "#f59e0b", range: [36, 37.5] },
  { key: "steps", label: "Steps", unit: "steps", icon: Footprints, color: "#10b981", range: [0, 15000] },
  { key: "sleep_duration", label: "Sleep", unit: "hrs", icon: Moon, color: "#6366f1", range: [4, 10] },
];

function generateDetailData(metric: string) {
  const data = [];
  const now = new Date();
  for (let i = 167; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 3600000);
    let base = 72;
    if (metric === "spo2") base = 97.5;
    if (metric === "bp_systolic") base = 122;
    if (metric === "body_temp") base = 36.6;
    if (metric === "steps") base = 300;
    if (metric === "sleep_duration") base = 7;

    const hour = time.getHours();
    const circadian = metric === "heart_rate"
      ? (hour < 6 ? -10 : hour < 12 ? 0 : hour < 18 ? 5 : -5)
      : 0;

    const variance = metric === "steps" ? 200 : metric === "spo2" ? 0.8 : 5;
    data.push({
      time: time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      date: time.toLocaleDateString([], { month: "short", day: "numeric" }),
      value: +(base + circadian + (Math.random() - 0.5) * variance).toFixed(1),
    });
  }
  return data;
}

function generateDailyAverages() {
  const data = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date(Date.now() - i * 86400000);
    data.push({
      date: date.toLocaleDateString([], { month: "short", day: "numeric" }),
      avgHR: Math.round(68 + Math.random() * 10),
      avgSPO2: +(97 + Math.random() * 1.5).toFixed(1),
      avgBP: Math.round(118 + Math.random() * 12),
      steps: Math.round(5000 + Math.random() * 5000),
      sleep: +(6 + Math.random() * 2.5).toFixed(1),
    });
  }
  return data;
}

const VitalDetailTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; color: string }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card p-3 !rounded-lg text-xs">
      <p className="text-slate-400 mb-1 font-mono">{label}</p>
      <p className="text-white font-semibold text-sm">{payload[0].value}</p>
    </div>
  );
};

export default function VitalsDetailView() {
  const [selectedMetric, setSelectedMetric] = useState("heart_rate");
  const [timeRange, setTimeRange] = useState("24h");

  const config = metricConfigs.find((m) => m.key === selectedMetric)!;
  const hourlyData = generateDetailData(selectedMetric);
  const dailyAverages = generateDailyAverages();

  // Compute stats
  const values = hourlyData.map(d => d.value);
  const avg = +(values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const latest = values[values.length - 1];

  return (
    <div className="space-y-6">
      {/* Metric Selector */}
      <div className="flex flex-wrap items-center gap-3">
        {metricConfigs.map((m) => {
          const Icon = m.icon;
          const isActive = m.key === selectedMetric;
          return (
            <motion.button
              key={m.key}
              onClick={() => setSelectedMetric(m.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                isActive
                  ? "border-white/10 bg-white/[0.04]"
                  : "border-transparent hover:bg-white/[0.02]"
              }`}
              style={isActive ? { color: m.color } : { color: "#64748b" }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Icon size={16} />
              <span className="hidden md:inline">{m.label}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Current", value: latest, suffix: config.unit, icon: Activity, trend: "live" },
          { label: "Average", value: avg, suffix: config.unit, icon: Minus, trend: "neutral" },
          { label: "Min", value: min, suffix: config.unit, icon: TrendingDown, trend: "down" },
          { label: "Max", value: max, suffix: config.unit, icon: TrendingUp, trend: "up" },
        ].map((stat, i) => {
          const StatIcon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              className="glass-card p-4"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500">{stat.label}</span>
                <StatIcon size={14} className="text-slate-600" />
              </div>
              <p className="text-2xl font-bold" style={{ color: config.color }}>
                {stat.value}
              </p>
              <span className="text-[10px] text-slate-600">{stat.suffix}</span>
            </motion.div>
          );
        })}
      </div>

      {/* Main Chart */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-slate-300">
              {config.label} — Detailed History
            </h3>
            <div className="flex items-center gap-1 bg-white/[0.03] rounded-lg p-0.5">
              {["6h", "24h", "7d", "30d"].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                    timeRange === range
                      ? "bg-white/[0.06] text-white"
                      : "text-slate-600 hover:text-slate-400"
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg hover:bg-white/[0.03] transition-all">
              <Filter size={14} className="text-slate-500" />
            </button>
            <button className="p-2 rounded-lg hover:bg-white/[0.03] transition-all">
              <Download size={14} className="text-slate-500" />
            </button>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={hourlyData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <defs>
              <linearGradient id="metricGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={config.color} stopOpacity={0.15} />
                <stop offset="100%" stopColor={config.color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
            <XAxis dataKey="time" tick={{ fill: "#475569", fontSize: 10 }} tickLine={false} axisLine={{ stroke: "rgba(255,255,255,0.04)" }} interval={15} />
            <YAxis tick={{ fill: "#475569", fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip content={<VitalDetailTooltip />} />
            <Area type="monotone" dataKey="value" stroke={config.color} strokeWidth={2} fill="url(#metricGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Daily Averages */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">30-Day Trend</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={dailyAverages} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: "#475569", fontSize: 9 }} tickLine={false} interval={4} />
            <YAxis tick={{ fill: "#475569", fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip content={<VitalDetailTooltip />} />
            <Bar dataKey={selectedMetric === "steps" ? "steps" : "avgHR"} fill={config.color} radius={[4, 4, 0, 0]} opacity={0.7} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
