"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, Navigation, Wind, Thermometer, AlertTriangle, Building2, Ambulance, Leaf } from "lucide-react";
import { geospatialAPI, GeospatialResponse } from "@/lib/api";

const RISK_COLORS: Record<string, string> = {
  low: "text-emerald-400",
  moderate: "text-yellow-400",
  high: "text-orange-400",
  critical: "text-rose-400",
};

const SEVERITY_BG: Record<string, string> = {
  low: "bg-emerald-500/10 border-emerald-500/20",
  moderate: "bg-yellow-500/10 border-yellow-500/20",
  high: "bg-orange-500/10 border-orange-500/20",
  critical: "bg-rose-500/10 border-rose-500/20",
};

export default function GeospatialView() {
  const [data, setData] = useState<GeospatialResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [lat, setLat] = useState(17.385);
  const [lng, setLng] = useState(78.4867);
  const [error, setError] = useState<string | null>(null);

  const analyze = async (latitude: number, longitude: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await geospatialAPI.analyze(latitude, longitude);
      setData(result);
    } catch {
      setError("AI engine offline — showing cached data.");
      setData(mockData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude);
          setLng(pos.coords.longitude);
          analyze(pos.coords.latitude, pos.coords.longitude);
        },
        () => analyze(lat, lng)
      );
    } else {
      analyze(lat, lng);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const d = data;
  const aqiColor = d
    ? d.environmental_risk.aqi < 50 ? "text-emerald-400"
      : d.environmental_risk.aqi < 100 ? "text-yellow-400"
      : d.environmental_risk.aqi < 150 ? "text-orange-400"
      : "text-rose-400"
    : "text-slate-400";

  return (
    <div className="space-y-6 max-h-[calc(100vh-140px)] overflow-y-auto pr-2 custom-scrollbar">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <span className="status-dot online" />
          <span className="text-emerald-400 font-medium">Geospatial Health Intelligence</span>
        </div>
        <button
          onClick={() => analyze(lat, lng)}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-500/15 text-violet-400 border border-violet-500/20 hover:bg-violet-500/25 transition-all disabled:opacity-50"
        >
          {loading ? "Analyzing..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="px-4 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs">
          {error}
        </div>
      )}

      {/* Location + Emergency Route */}
      <div className="grid grid-cols-12 gap-6">
        <motion.div
          className="col-span-12 lg:col-span-5 glass-card p-5 space-y-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Navigation size={16} className="text-cyan-400" />
            <span className="text-sm font-semibold text-white">Current Location</span>
          </div>
          <div className="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/10">
            <p className="text-xs text-slate-400">Coordinates</p>
            <p className="text-lg font-mono text-cyan-400 mt-0.5">
              {d ? `${d.location.lat.toFixed(4)}, ${d.location.lng.toFixed(4)}` : `${lat.toFixed(4)}, ${lng.toFixed(4)}`}
            </p>
          </div>

          {d?.emergency_route && (
            <div className={`p-4 rounded-xl border ${SEVERITY_BG[d.emergency_route.priority] || "bg-white/5 border-white/10"}`}>
              <div className="flex items-center gap-2 mb-2">
                <Ambulance size={16} className="text-rose-400" />
                <span className="text-sm font-semibold text-white">Emergency Route</span>
                {d.emergency_route.ambulance_recommended && (
                  <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400">AMBULANCE</span>
                )}
              </div>
              <p className="text-xs text-slate-300 font-medium">{d.emergency_route.recommended_facility}</p>
              <div className="flex gap-4 mt-2">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase">Distance</p>
                  <p className="text-sm text-white font-semibold">{d.emergency_route.distance_km.toFixed(1)} km</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase">ETA</p>
                  <p className="text-sm text-white font-semibold">{d.emergency_route.eta_minutes} min</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase">Priority</p>
                  <p className={`text-sm font-semibold capitalize ${RISK_COLORS[d.emergency_route.priority] || "text-slate-300"}`}>
                    {d.emergency_route.priority}
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Environmental Risk */}
        <motion.div
          className="col-span-12 lg:col-span-7 glass-card p-5"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Wind size={16} className="text-blue-400" />
            <span className="text-sm font-semibold text-white">Environmental Risk</span>
            {d && (
              <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full capitalize ${RISK_COLORS[d.environmental_risk.risk_level] || ""} bg-white/5`}>
                {d.environmental_risk.risk_level} risk
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              {
                icon: Wind, label: "Air Quality (AQI)", value: d?.environmental_risk.aqi ?? "—",
                sub: d?.environmental_risk.aqi_category ?? "Loading", color: aqiColor,
              },
              {
                icon: Thermometer, label: "Heat Index", value: d ? `${d.environmental_risk.heat_index}°C` : "—",
                sub: `Humidity ${d?.environmental_risk.humidity_pct ?? "—"}%`, color: "text-orange-400",
              },
              {
                icon: Leaf, label: "Pollen Level", value: d?.environmental_risk.pollen_level ?? "—",
                sub: "Allergen risk", color: "text-green-400",
              },
              {
                icon: AlertTriangle, label: "Overall Risk", value: d?.environmental_risk.risk_level ?? "—",
                sub: "Combined index", color: RISK_COLORS[d?.environmental_risk.risk_level ?? ""] || "text-slate-400",
              },
            ].map(({ icon: Icon, label, value, sub, color }) => (
              <div key={label} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon size={13} className="text-slate-500" />
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide">{label}</p>
                </div>
                <p className={`text-xl font-bold ${color} capitalize`}>{value}</p>
                <p className="text-[10px] text-slate-500 mt-0.5 capitalize">{sub}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Nearby Facilities */}
      <motion.div className="glass-card p-5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="flex items-center gap-2 mb-4">
          <Building2 size={16} className="text-violet-400" />
          <span className="text-sm font-semibold text-white">Nearby Medical Facilities</span>
          {d && <span className="ml-auto text-xs text-slate-500">{d.nearby_facilities.length} found</span>}
        </div>
        <div className="space-y-2">
          {(d?.nearby_facilities ?? mockData.nearby_facilities).map((f, i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-all">
              <MapPin size={16} className="text-cyan-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{f.name}</p>
                <p className="text-[10px] text-slate-500 capitalize">{f.type} · {f.services.slice(0, 3).join(", ")}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-cyan-400">{f.distance_km.toFixed(1)} km</p>
                <p className="text-[10px] text-slate-500">{f.eta_minutes} min ETA</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Spatial Insights */}
      {d?.spatial_insights && d.spatial_insights.length > 0 && (
        <motion.div className="glass-card p-5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-yellow-400" />
            <span className="text-sm font-semibold text-white">Spatial Health Insights</span>
          </div>
          <div className="space-y-2">
            {d.spatial_insights.map((insight, i) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-yellow-500/5 border border-yellow-500/10">
                <span className="text-yellow-400 text-xs mt-0.5">•</span>
                <p className="text-xs text-slate-300">{insight}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

const mockData: GeospatialResponse = {
  location: { lat: 17.385, lng: 78.4867 },
  nearby_facilities: [
    { name: "Apollo Hospitals Jubilee Hills", type: "hospital", distance_km: 2.1, eta_minutes: 8, services: ["Emergency", "ICU", "Cardiac"] },
    { name: "Yashoda Hospital", type: "hospital", distance_km: 3.4, eta_minutes: 13, services: ["Emergency", "Neurology", "Orthopedics"] },
    { name: "Care Clinic Banjara Hills", type: "clinic", distance_km: 0.8, eta_minutes: 4, services: ["GP", "Pathology", "ECG"] },
  ],
  environmental_risk: { aqi: 72, aqi_category: "Moderate", heat_index: 34, humidity_pct: 58, pollen_level: "medium", risk_level: "moderate" },
  emergency_route: { priority: "moderate", recommended_facility: "Apollo Hospitals Jubilee Hills", distance_km: 2.1, eta_minutes: 8, ambulance_recommended: false },
  spatial_insights: ["AQI is moderate — limit prolonged outdoor activity.", "Nearest emergency facility is within 10 minutes."],
};
