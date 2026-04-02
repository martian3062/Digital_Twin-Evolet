"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { vitalsAPI, vitalsSocket } from "@/lib/api";
import { type VitalReading, type DigitalTwinState, type AnomalyAlert } from "@/lib/types";
import { useAuth } from "@/lib/auth";

interface RealtimeContextType {
  vitals: Record<string, VitalReading>;
  twinState: DigitalTwinState | null;
  isConnected: boolean;
  isSimulated: boolean;
  lastUpdate: Date | null;
  anomalies: AnomalyAlert[]; // Real-time health alerts
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [vitals, setVitals] = useState<Record<string, VitalReading>>({});
  const [twinState, setTwinState] = useState<DigitalTwinState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSimulated, setIsSimulated] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [anomalies, setAnomalies] = useState<AnomalyAlert[]>([]);

  const fetchInitialData = useCallback(async () => {
    try {
      const [latestVitals, state] = await Promise.all([
        vitalsAPI.getLatest(),
        vitalsAPI.getTwinState(),
      ]);

      const vitalsMap: Record<string, VitalReading> = {};
      latestVitals.forEach((v) => {
        vitalsMap[v.metric_type] = v;
      });

      setVitals(vitalsMap);
      setTwinState(state);
      setIsSimulated(false);
      setLastUpdate(new Date());
    } catch (err) {
      console.warn("Realtime API failed, falling back to simulated data", err);
      // Initialize with mock data if API fails or for demo
      const mockVitals: Record<string, VitalReading> = {
        heart_rate: { id: 'mock-hr', value: 72, unit: "bpm", metric_type: "heart_rate", recorded_at: new Date().toISOString(), is_anomaly: false },
        blood_pressure: { id: 'mock-bp', value: 120, unit: "mmHg", metric_type: "blood_pressure", recorded_at: new Date().toISOString(), is_anomaly: false, metadata: { systolic: 120, diastolic: 80 } },
        oxygen_saturation: { id: 'mock-spo2', value: 98, unit: "%", metric_type: "oxygen_saturation", recorded_at: new Date().toISOString(), is_anomaly: false },
        temperature: { id: 'mock-temp', value: 36.6, unit: "°C", metric_type: "temperature", recorded_at: new Date().toISOString(), is_anomaly: false },
        respiratory_rate: { id: 'mock-rr', value: 16, unit: "br/m", metric_type: "respiratory_rate", recorded_at: new Date().toISOString(), is_anomaly: false },
      };
      setVitals(mockVitals);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setIsSimulated(true);
      return;
    }

    fetchInitialData();

    // Connect WebSocket
    const stopListening = vitalsSocket.on("vital_update", (data: Record<string, unknown>) => {
      setVitals((prev) => ({
        ...prev,
        [data.metric_type as string]: data as unknown as VitalReading,
      }));
      setLastUpdate(new Date());
    });

    const stopAnomalyListening = vitalsSocket.on("anomaly_alert", (data: Record<string, unknown>) => {
      setAnomalies((prev) => [data as unknown as AnomalyAlert, ...prev].slice(0, 50)); // Keep last 50
    });

    const stopConnListening = vitalsSocket.on("connection", (data: Record<string, unknown>) => {
      setIsConnected(data.status === "connected");
    });

    vitalsSocket.connect(user.id);

    return () => {
      stopListening();
      stopAnomalyListening();
      stopConnListening();
      vitalsSocket.disconnect();
    };
  }, [isAuthenticated, user, fetchInitialData]);

  // Simulation fallback for vitals if no real stream is active
  useEffect(() => {
    const interval = setInterval(() => {
      if (isConnected) return; // Don't simulate if we have a real connection

      setVitals((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((key) => {
          const v = next[key];
          if (!v) return;
          const change = (Math.random() - 0.5) * 2;
          next[key] = { 
            ...v, 
            value: Number((v.value + (v.value > 0 ? change : 0)).toFixed(1)),
            recorded_at: new Date().toISOString()
          };
        });
        return next;
      });
      setLastUpdate(new Date());
    }, 3000);

    return () => clearInterval(interval);
  }, [isConnected]);

  return (
    <RealtimeContext.Provider value={{ vitals, twinState, isConnected, isSimulated, lastUpdate, anomalies }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error("useRealtime must be used within a RealtimeProvider");
  }
  return context;
}
