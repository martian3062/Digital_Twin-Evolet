"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Video, VideoOff, Mic, MicOff, PhoneOff,
  Users, Calendar, Clock,
  Star, MapPin, Shield, Brain
} from "lucide-react";
import { AIScribe } from "../consultation/AIScribe";
import P2PStream from "../consultation/P2PStream";
import { toast } from "sonner";
import { useOfflineSync } from "../../hooks/useOfflineSync";
import { computeHash, anchorToVault } from "@/lib/blockchain";
import { AISummary } from "@/lib/types";

const availableDoctors = [
  {
    id: "d1",
    name: "Dr. Ananya Sharma",
    specialization: "Cardiologist",
    hospital: "Apollo Hospitals, Hyderabad",
    rating: 4.9,
    available: true,
    image: null,
    nextSlot: "Today, 4:30 PM",
    fee: "₹800",
  },
  {
    id: "d2",
    name: "Dr. Rajesh Patel",
    specialization: "Endocrinologist",
    hospital: "AMTZ Medical Center",
    rating: 4.8,
    available: true,
    image: null,
    nextSlot: "Today, 5:00 PM",
    fee: "₹600",
  },
  {
    id: "d3",
    name: "Dr. Priya Mehta",
    specialization: "General Physician",
    hospital: "Max HealthCare, Delhi",
    rating: 4.7,
    available: false,
    image: null,
    nextSlot: "Tomorrow, 10:00 AM",
    fee: "₹400",
  },
  {
    id: "d4",
    name: "Dr. Vikram Singh",
    specialization: "Pulmonologist",
    hospital: "Fortis Hospital, Bangalore",
    rating: 4.9,
    available: true,
    image: null,
    nextSlot: "Today, 6:15 PM",
    fee: "₹700",
  },
];

const pastConsultations = [
  {
    id: "c1",
    doctor: "Dr. Ananya Sharma",
    specialization: "Cardiologist",
    date: "Mar 25, 2026",
    duration: "28 min",
    status: "completed" as const,
    notes: "ECG review normal. Maintain current lifestyle and medication. Follow-up in 3 months.",
  },
  {
    id: "c2",
    doctor: "Dr. Rajesh Patel",
    specialization: "Endocrinologist",
    date: "Mar 15, 2026",
    duration: "22 min",
    status: "completed" as const,
    notes: "HbA1c reviewed. Slight elevation noted. Dietary plan adjusted. Recheck in 6 weeks.",
  },
];

export default function ConsultationView() {
  const [activeTab, setActiveTab] = useState<"book" | "active" | "history">("book");
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [isInCall, setIsInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [transcript, setTranscript] = useState("");
  const { isOnline } = useOfflineSync();

  const simulateTranscript = () => {
    const lines = [
      "Patient reports persistent headache for 3 days.",
      "Blood pressure was recorded as 145/95 this morning.",
      "Patient mentions occasional dizziness when standing up.",
      "No history of migraines or similar episodes.",
      "Currently taking Metformin for diabetes management."
    ];
    let i = 0;
    const interval = setInterval(() => {
      setTranscript((prev: string) => prev + " " + (lines[i] || ""));
      i++;
      if (i >= lines.length) clearInterval(interval);
    }, 3000);
  };

  const handleSaveToVault = async (summary: AISummary) => {
    try {
      const summaryString = JSON.stringify(summary);
      const hash = await computeHash(summaryString);
      
      const promise = anchorToVault(hash);
      
      toast.promise(promise, {
        loading: 'Anchoring to Polygon Amoy...',
        success: (data) => {
          return `Secure! Tx: ${data.transactionHash.slice(0, 10)}...`;
        },
        error: 'Failed to anchor. Retrying via Offline Sync...',
      });

      const vaultResult = await promise;
      console.log("Vault Anchored:", vaultResult);
      
    } catch (err) {
      console.error("Security Vault Error", err);
      toast.error("Security Vault Error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header + Tabs */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-200">Consultation</h2>
          <p className="text-xs text-slate-500 mt-0.5">P2P secure video — powered by Decentralized Signaling</p>
        </div>
        <div className="flex items-center gap-1 bg-white/[0.03] rounded-xl p-1">
          {(["book", "active", "history"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all capitalize ${
                activeTab === tab
                  ? "bg-violet-500/15 text-violet-400"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {tab === "book" ? "Book" : tab === "active" ? "Active" : "History"}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Book Tab */}
        {activeTab === "book" && (
          <motion.div
            key="book"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-4"
          >
            <p className="text-sm text-slate-400">Available Doctors</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableDoctors.map((doc, i) => (
                <motion.div
                  key={doc.id}
                  className={`glass-card p-4 cursor-pointer transition-all ${
                    selectedDoctor === doc.id ? "border-violet-500/30 shadow-lg shadow-violet-500/5" : ""
                  }`}
                  onClick={() => setSelectedDoctor(doc.id)}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ y: -2 }}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/30 to-cyan-500/20 flex items-center justify-center flex-shrink-0">
                      <Users size={20} className="text-violet-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-medium text-slate-200">{doc.name}</h4>
                        <div className="flex items-center gap-1">
                          <Star size={11} className="text-amber-400 fill-amber-400" />
                          <span className="text-[11px] text-amber-400">{doc.rating}</span>
                        </div>
                      </div>
                      <p className="text-xs text-cyan-400 mb-1">{doc.specialization}</p>
                      <p className="text-[11px] text-slate-600 flex items-center gap-1">
                        <MapPin size={10} /> {doc.hospital}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {selectedDoctor && (
              <motion.div
                className="flex items-center justify-end gap-3 pt-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <button className="btn-primary flex items-center gap-2" onClick={() => { setIsInCall(true); setActiveTab("active"); }}>
                  <Video size={14} />
                  Start Consultation
                </button>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Active Consultation */}
        {activeTab === "active" && (
          <motion.div
            key="active"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
          >
            {isInCall ? (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 space-y-4">
                  <div className="bg-slate-900 rounded-3xl border border-white/5 overflow-hidden min-h-[500px] relative shadow-2xl">
                    <P2PStream 
                      roomId="consult-123"
                      isInitiator={true}
                      onCallEnded={() => setIsInCall(false)}
                    />
                    
                    {/* Status Overlays */}
                    <div className="absolute top-6 left-6 z-10 flex flex-col gap-2">
                       <div className="px-3 py-1.5 rounded-lg bg-black/40 backdrop-blur-md border border-white/5 text-[10px] font-mono text-cyan-400 flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-cyan-400' : 'bg-rose-400 animate-pulse'}`} />
                          {isOnline ? 'ENCRYPTED CHANNEL ACTIVE' : 'SWITCHING TO OFFLINE SYNC...'}
                       </div>
                    </div>

                    <div className="absolute top-6 right-6 z-10">
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        <Shield size={10} className="text-emerald-400" />
                        <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">E2EE P2P</span>
                      </div>
                    </div>

                    {/* Self Video PIP */}
                    <div className="absolute bottom-6 right-6 w-48 h-32 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden z-20">
                      <div className="w-full h-full flex items-center justify-center bg-slate-800">
                        <Users size={24} className="text-slate-600" />
                        <div className="absolute bottom-2 left-3">
                           <span className="text-[9px] font-bold text-white/40 uppercase">You</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className={`p-4 rounded-2xl transition-all ${isMuted ? "bg-rose-500/20 text-rose-400" : "bg-white/[0.05] text-slate-300 hover:bg-white/[0.08]"}`}
                    >
                      {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                    </button>
                    <button
                      onClick={() => setIsVideoOff(!isVideoOff)}
                      className={`p-4 rounded-2xl transition-all ${isVideoOff ? "bg-rose-500/20 text-rose-400" : "bg-white/[0.05] text-slate-300 hover:bg-white/[0.08]"}`}
                    >
                      {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
                    </button>
                    <button 
                      onClick={simulateTranscript}
                      className="p-4 rounded-2xl bg-amber-500/20 text-amber-500 hover:bg-amber-500/30 transition-all flex items-center gap-2"
                    >
                      <Brain size={24} />
                      <span className="text-[10px] font-bold uppercase tracking-widest hidden md:inline">Neural Scribe</span>
                    </button>
                    <button
                      onClick={() => setIsInCall(false)}
                      className="p-4 rounded-2xl bg-rose-500 text-white hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/25"
                    >
                      <PhoneOff size={24} />
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-1">
                  <AIScribe 
                    transcript={transcript} 
                    onSave={handleSaveToVault}
                  />
                </div>
              </div>
            ) : (
              <div className="glass-card p-12 text-center">
                <VideoOff size={40} className="mx-auto text-slate-600 mb-4 opacity-20" />
                <p className="text-sm text-slate-400">No active session</p>
                <p className="text-xs text-slate-600 mt-1">Ready for P2P encrypted tele-health</p>
              </div>
            )}
          </motion.div>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-3"
          >
            {pastConsultations.map((consult, i) => (
              <motion.div
                key={consult.id}
                className="glass-card p-4"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-slate-200">{consult.doctor}</h4>
                    <p className="text-xs text-cyan-400">{consult.specialization}</p>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1"><Calendar size={10} /> {consult.date}</span>
                      <span className="flex items-center gap-1"><Clock size={10} /> {consult.duration}</span>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 font-medium capitalize">
                    {consult.status}
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
