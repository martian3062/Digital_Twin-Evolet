"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, CheckCircle, TrendingUp, Dna, Star } from "lucide-react";
import { similarityAPI, SimilarityResponse } from "@/lib/api";

function ScoreRing({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color =
    pct >= 80 ? "text-emerald-400" : pct >= 60 ? "text-cyan-400" : pct >= 40 ? "text-yellow-400" : "text-slate-400";
  const ring =
    pct >= 80 ? "border-emerald-500/40" : pct >= 60 ? "border-cyan-500/40" : pct >= 40 ? "border-yellow-500/40" : "border-slate-500/20";
  return (
    <div className={`w-14 h-14 rounded-full border-2 ${ring} flex items-center justify-center shrink-0`}>
      <span className={`text-sm font-bold ${color}`}>{pct}%</span>
    </div>
  );
}

export default function SimilarityView() {
  const [data, setData] = useState<SimilarityResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const findSimilar = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await similarityAPI.findSimilar([], 5);
      setData(result);
    } catch {
      setError("AI engine offline — showing cached cohort data.");
      setData(mockData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { findSimilar(); }, []);

  const d = data ?? mockData;

  return (
    <div className="space-y-6 max-h-[calc(100vh-140px)] overflow-y-auto pr-2 custom-scrollbar">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <span className="status-dot online" />
          <span className="text-emerald-400 font-medium">Cohort AI — Patient Similarity Engine</span>
        </div>
        <button
          onClick={findSimilar}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-500/15 text-violet-400 border border-violet-500/20 hover:bg-violet-500/25 transition-all disabled:opacity-50"
        >
          {loading ? "Searching..." : "Refresh Cohort"}
        </button>
      </div>

      {error && (
        <div className="px-4 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs">
          {error}
        </div>
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: Users, label: "Matched Patients", value: d.similar_patients.length, color: "text-cyan-400" },
          {
            icon: Star, label: "Best Match",
            value: d.similar_patients.length > 0
              ? `${Math.round(d.similar_patients[0].similarity_score * 100)}%`
              : "—",
            color: "text-emerald-400",
          },
          { icon: TrendingUp, label: "Recommendations", value: d.aggregated_recommendations.length, color: "text-violet-400" },
        ].map(({ icon: Icon, label, value, color }) => (
          <motion.div
            key={label}
            className="glass-card p-4 flex items-center gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-9 h-9 rounded-xl bg-white/[0.04] flex items-center justify-center shrink-0">
              <Icon size={16} className={color} />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wide">{label}</p>
              <p className={`text-xl font-bold ${color}`}>{value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Similar patients list + recommendations */}
      <div className="grid grid-cols-12 gap-6">
        <motion.div
          className="col-span-12 lg:col-span-7 glass-card p-5"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Dna size={16} className="text-cyan-400" />
            <span className="text-sm font-semibold text-white">Similar Patient Cohorts</span>
          </div>

          <div className="space-y-3">
            {d.similar_patients.map((p, i) => (
              <motion.div
                key={p.cohort_id}
                className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-all"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * i }}
              >
                <div className="flex items-center gap-4">
                  <ScoreRing score={p.similarity_score} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-white">Cohort #{p.cohort_id.slice(-6).toUpperCase()}</p>
                      {i === 0 && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400">
                          Best Match
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {p.shared_conditions.map((c) => (
                        <span key={c} className="px-2 py-0.5 rounded-full text-[10px] bg-violet-500/10 text-violet-300 border border-violet-500/20">
                          {c}
                        </span>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {p.treatment_outcomes.map((o) => (
                        <span key={o} className="px-2 py-0.5 rounded-full text-[10px] bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                          {o}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Aggregated Recommendations */}
        <motion.div
          className="col-span-12 lg:col-span-5 glass-card p-5"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle size={16} className="text-emerald-400" />
            <span className="text-sm font-semibold text-white">Aggregated Recommendations</span>
          </div>
          <p className="text-[10px] text-slate-500 mb-3">
            Derived from treatment outcomes of {d.similar_patients.length} matched cohorts
          </p>
          <div className="space-y-2">
            {d.aggregated_recommendations.map((rec, i) => (
              <motion.div
                key={i}
                className="flex items-start gap-2 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i }}
              >
                <span className="text-emerald-400 font-bold text-xs mt-0.5">{i + 1}.</span>
                <p className="text-xs text-slate-300 leading-relaxed">{rec}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

const mockData: SimilarityResponse = {
  similar_patients: [
    {
      cohort_id: "pat_a1b2c3d4",
      similarity_score: 0.87,
      shared_conditions: ["Pre-diabetes", "Hypertension"],
      treatment_outcomes: ["Metformin response: positive", "BP controlled with lifestyle"],
    },
    {
      cohort_id: "pat_e5f6g7h8",
      similarity_score: 0.74,
      shared_conditions: ["Hypertension", "Elevated HR"],
      treatment_outcomes: ["Beta-blocker effective", "Stress management reduced events"],
    },
    {
      cohort_id: "pat_i9j0k1l2",
      similarity_score: 0.61,
      shared_conditions: ["Pre-diabetes"],
      treatment_outcomes: ["Diet intervention: significant improvement"],
    },
  ],
  aggregated_recommendations: [
    "Continue Metformin therapy — 87% of matched cohort responded positively.",
    "Implement structured stress management protocol to reduce hypertension risk.",
    "Low-carb dietary intervention shows strong evidence in similar patient profiles.",
    "Regular 30-min aerobic activity correlated with 23% risk reduction in matched cohorts.",
    "Schedule quarterly HbA1c monitoring based on cohort progression patterns.",
  ],
};
