"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Wind, 
  Moon, 
  Zap, 
  CheckCircle2, 
  TrendingDown,
  FlaskConical,
  Sparkles
} from 'lucide-react';
import { simulationAPI, SimulationResponse } from '@/lib/api';

interface TreatmentSimulatorProps {
  patientId: string;
  onSimulationUpdate?: (result: SimulationResponse) => void;
}

const SCENARIOS = [
  { id: 'increase_exercise', label: 'Increased Aerobic Loading', icon: Activity, color: '#3b82f6' },
  { id: 'reduce_sodium', label: 'Sodium Restriction', icon: FlaskConical, color: '#10b981' },
  { id: 'improve_sleep', label: 'Circadian Alignment', icon: Moon, color: '#8b5cf6' },
  { id: 'quit_smoking', label: 'Cessation Support', icon: Wind, color: '#f59e0b' },
  { id: 'medication_adherence', label: 'Medication Adherence', icon: Zap, color: '#ef4444' },
];

export const TreatmentSimulator: React.FC<TreatmentSimulatorProps> = ({ patientId, onSimulationUpdate }) => {
  const [scenario, setScenario] = useState<Record<string, boolean>>({
    increase_exercise: false,
    reduce_sodium: false,
    improve_sleep: false,
    quit_smoking: false,
    medication_adherence: false,
  });
  const [result, setResult] = useState<SimulationResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const toggleScenario = (id: string) => {
    setScenario(prev => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    const runSim = async () => {
      const activeCount = Object.values(scenario).filter(Boolean).length;
      if (activeCount === 0) {
        setResult(null);
        return;
      }

      setLoading(true);
      try {
        const res = await simulationAPI.run(patientId, scenario);
        setResult(res);
        onSimulationUpdate?.(res);
      } catch (err: unknown) {
        console.error("Simulation failed:", err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(runSim, 500);
    return () => clearTimeout(timer);
  }, [scenario, patientId, onSimulationUpdate]);

  return (
    <div className="relative p-6 rounded-3xl bg-slate-900/40 border border-white/10 backdrop-blur-xl overflow-hidden shadow-2xl">
      {/* Background Glow */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/10 blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500/10 blur-[100px] pointer-events-none" />

      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 rounded-2xl bg-blue-500/20 text-blue-400">
          <Sparkles className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">AI Treatment Simulator</h2>
          <p className="text-sm text-slate-400">Explore causal interventions and predicted outcomes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Scenario Selection */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest ml-1">Active Interventions</p>
          {SCENARIOS.map((s) => {
            const active = scenario[s.id];
            const Icon = s.icon;
            return (
              <motion.button
                key={s.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => toggleScenario(s.id)}
                className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${
                  active 
                    ? 'bg-white/10 border-white/20 shadow-lg' 
                    : 'bg-transparent border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div 
                    className="p-2.5 rounded-xl shadow-inner transition-colors duration-300"
                    style={{ backgroundColor: active ? `${s.color}33` : '#ffffff05', color: active ? s.color : '#64748b' }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`font-medium ${active ? 'text-white' : 'text-slate-400'}`}>
                    {s.label}
                  </span>
                </div>
                {active && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Results Panel */}
        <div className="relative min-h-[400px] flex flex-col">
          <AnimatePresence mode="wait">
            {!result ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-white/5 rounded-3xl"
              >
                <FlaskConical className="w-12 h-12 text-slate-700 mb-4 animate-pulse" />
                <p className="text-sm text-slate-500 max-w-[200px]">
                  Select interventions to run the AI simulation engine
                </p>
              </motion.div>
            ) : (
              <motion.div 
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex-1 space-y-6"
              >
                {/* Risk Deltas */}
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(result.adjusted_risks).filter(([k]) => k !== 'overall_health').map(([key, value]) => {
                    const original = result.original_risks[key] || 0;
                    const delta = original - value;
                    return (
                      <div key={key} className="p-4 rounded-2xl bg-white/5 border border-white/5">
                        <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">{key}</p>
                        <div className="flex items-end justify-between">
                          <span className="text-xl font-bold text-white">{(value * 100).toFixed(0)}%</span>
                          <span className="text-xs font-medium text-emerald-400 flex items-center gap-0.5">
                            <TrendingDown className="w-3 h-3" />
                            {(delta * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Metric Projections */}
                <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-3 h-3" /> Physiological Projections
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(result.metric_deltas).map(([metric, delta]) => (
                      <div key={metric} className="flex items-center justify-between">
                        <span className="text-sm text-slate-300 capitalize">{metric.replace('_', ' ')}</span>
                        <div className="flex items-center gap-2 font-mono text-sm">
                          <span className={`${delta < 0 ? 'text-emerald-400' : 'text-blue-400'}`}>
                            {delta > 0 ? '+' : ''}{delta.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Clinical Summaries */}
                <div className="space-y-2">
                   {result.clinical_summary.map((summary, idx) => (
                     <div key={idx} className="flex gap-3 text-sm text-slate-400 pl-2 border-l border-blue-500/30">
                        <p>{summary}</p>
                     </div>
                   ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {loading && (
            <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center rounded-3xl pointer-events-none">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
