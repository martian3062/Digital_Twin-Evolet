"use client";

import dynamic from "next/dynamic";

const DigitalTwinViewerInner = dynamic(
  () => import("./DigitalTwinViewerInner"),
  { ssr: false, loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
        <p className="text-xs text-slate-600">Initializing Digital Twin...</p>
      </div>
    </div>
  )}
);

export default function DigitalTwinViewer({ simulatedRisks }: { simulatedRisks?: Record<string, number> }) {
  return <DigitalTwinViewerInner simulatedRisks={simulatedRisks} />;
}
