"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRealtime } from "@/lib/realtime";
import { AlertCircle, AlertTriangle, X } from "lucide-react";

interface Alert {
  id: string;
  message: string;
  severity: "critical" | "warning" | "high" | "medium" | "low";
  timestamp: string;
}

export default function NotificationManager() {
  const { anomalies } = useRealtime();
  const [activeAlerts, setActiveAlerts] = useState<Alert[]>([]);

  // When a new anomaly arrives, add it to the active alerts if not already present
  useEffect(() => {
    if (anomalies.length > 0) {
      const latest = anomalies[0];
      const alertId = `${latest.metric}-${latest.timestamp}`;
      
      setActiveAlerts(prev => {
        if (prev.some(a => a.id === alertId)) return prev;
        return [{
          id: alertId,
          message: latest.message,
          severity: (latest.severity === "high" || latest.severity === "critical") ? "critical" : "warning",
          timestamp: latest.timestamp
        } as Alert, ...prev].slice(0, 5); // Show top 5
      });

      // Auto-clear after 10 seconds
      const timer = setTimeout(() => {
        setActiveAlerts(prev => prev.filter(a => a.id !== alertId));
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [anomalies]);

  const removeAlert = (id: string) => {
    setActiveAlerts(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 w-80 pointer-events-none">
      <AnimatePresence>
        {activeAlerts.map((alert) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            className={`pointer-events-auto relative overflow-hidden rounded-xl border p-4 shadow-2xl backdrop-blur-md ${
              alert.severity === "critical"
                ? "bg-rose-500/20 border-rose-500/50 text-rose-200"
                : "bg-amber-500/20 border-amber-500/50 text-amber-200"
            }`}
          >
            {/* Glossy Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-none" />
            
            <div className="flex items-start gap-3 relative z-10">
              <div className={`mt-0.5 p-1.5 rounded-lg ${
                alert.severity === "critical" ? "bg-rose-500/30" : "bg-amber-500/30"
              }`}>
                {alert.severity === "critical" ? (
                  <AlertCircle className="w-5 h-5 text-rose-400" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider opacity-60">
                    {alert.severity} System Alert
                  </span>
                  <button 
                    onClick={() => removeAlert(alert.id)}
                    className="p-1 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X className="w-3.5 h-3.5 opacity-50" />
                  </button>
                </div>
                <p className="text-sm font-medium leading-relaxed">
                  {alert.message}
                </p>
                <div className="mt-2 text-[10px] opacity-40 flex items-center gap-1">
                  <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                  <span>•</span>
                  <span>AI Engine 1.0</span>
                </div>
              </div>
            </div>

            {/* Progress bar for auto-dismiss */}
            <motion.div 
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 10, ease: "linear" }}
              className={`absolute bottom-0 left-0 h-0.5 ${
                alert.severity === "critical" ? "bg-rose-500" : "bg-amber-500"
              }`}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
