"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Bot, Send, User, Sparkles, Paperclip, Heart, Brain, Pill, AlertCircle } from "lucide-react";
import { VoiceSymptomLogger } from "../voice/VoiceSymptomLogger";
import { VoiceInsight } from "@/lib/types";

interface Message { id: string; role: "user" | "assistant"; content: string; timestamp: Date; }

const suggestions = [
  { text: "What do my current vitals indicate?", icon: Heart },
  { text: "Explain my latest risk scores", icon: Brain },
  { text: "What medications should I be aware of?", icon: Pill },
  { text: "Are there any anomalies in my data?", icon: AlertCircle },
];

function getAIResponse(msg: string): string {
  const l = msg.toLowerCase();
  if (l.includes("vital") || l.includes("heart")) return "🫀 **Heart Rate (72 bpm)** — Optimal resting range.\n🩸 **SpO2 (97.8%)** — Excellent oxygenation.\n💉 **BP (120/80)** — Normotensive, slight upward systolic trend.\n🌡️ **Temp (36.6°C)** — Stable.\n\nOverall Health Score: **82/100** — Digital Twin rates your state as 'Good'.";
  if (l.includes("risk") || l.includes("score")) return "📊 **Risk Assessment (HealthGNN v0.1):**\n- 🟢 Cardiac: 12% (Low) ↓3%\n- 🟡 Diabetes: 23% (Moderate) ↑1%\n- 🟢 Respiratory: 8% (Low)\n- 🟡 Hypertension: 31% (Moderate) ↑5%\n- 🟢 Stroke: 5% (Low)\n\n⚠️ Hypertension risk increase correlates with elevated systolic readings.";
  if (l.includes("medic") || l.includes("pill")) return "💊 **Metformin HCl 500mg** — Twice daily with meals\nPurpose: Pre-diabetic management\nNext refill: Jun 15, 2026\n\nNo known interactions with your current vitals profile.";
  if (l.includes("anomal") || l.includes("alert")) return "🔴 **HIGH** — HR elevated to 142 bpm during rest (12 min ago)\n🟡 **MEDIUM** — BP trending upward (+3mmHg/day)\n🟢 **LOW** — SpO2 dipped to 93% during sleep (recovered)\n\nDigital Twin simulation: 92% probability stress-related tachycardia.";
  return "I've analyzed your Digital Twin data:\n• Health Score: **82/100**\n• No critical concerns\n• 2 items need monitoring\n\nAsk about **vitals**, **risk scores**, **medications**, or **anomalies**.";
}

export default function MediBookView() {
  const [messages, setMessages] = useState<Message[]>([{
    id: "welcome", role: "assistant",
    content: "Hello! I'm **MediBook**, your AI health assistant. I have access to your real-time vitals, risk scores, and medical history.\n\nHow can I help you today?",
    timestamp: new Date(),
  }]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    setMessages(p => [...p, { id: Date.now().toString(), role: "user", content: text.trim(), timestamp: new Date() }]);
    setInput(""); setIsTyping(true);
    setTimeout(() => {
      setMessages(p => [...p, { id: (Date.now()+1).toString(), role: "assistant", content: getAIResponse(text), timestamp: new Date() }]);
      setIsTyping(false);
    }, 1200);
  };

  const handleVoiceInsight = (insightData: VoiceInsight) => {
    if (insightData.insights && insightData.insights.length > 0) {
      const insight = insightData.insights[0];
      const content = `🧠 **AI Insight Captured via Voice**\n\nI've detected a mention of **${insight.mention}**. \nI'm updating your digital twin metric **${insight.metric.replace('_', ' ')}** to a value of **${insight.value}**.\n\nConfidence: ${(insight.confidence * 100).toFixed(0)}%`;
      
      setMessages(p => [...p, { 
        id: Date.now().toString(), 
        role: "assistant", 
        content, 
        timestamp: new Date() 
      }]);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      <div className="flex items-center gap-3 pb-4 border-b border-white/[0.04]">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
          <Bot size={20} className="text-white" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">MediBook AI <Sparkles size={12} className="text-amber-400" /></h2>
          <p className="text-[11px] text-slate-500">Digital Twin Intelligence • Always analyzing</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="status-dot online" />
          <span className="text-[11px] text-emerald-400">Connected</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {messages.map(msg => (
          <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${msg.role === "assistant" ? "bg-violet-500/20" : "bg-violet-500/20"}`}>
              {msg.role === "assistant" ? <Bot size={14} className="text-violet-400" /> : <User size={14} className="text-violet-400" />}
            </div>
            <div className={`max-w-[75%] p-3.5 rounded-2xl text-sm leading-relaxed ${msg.role === "assistant" ? "glass-card !rounded-tl-md" : "bg-violet-500/15 border border-violet-500/10 !rounded-tr-md"}`}>
              <div className="text-slate-300 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>') }} />
              <p className="text-[9px] text-slate-600 mt-2">{msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
            </div>
          </motion.div>
        ))}
        {isTyping && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center"><Bot size={14} className="text-violet-400" /></div>
            <div className="glass-card !rounded-tl-md px-4 py-3 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {messages.length <= 1 && (
        <div className="grid grid-cols-2 gap-2 pb-4">
          {suggestions.map((s, i) => { const Icon = s.icon; return (
            <motion.button key={i} onClick={() => sendMessage(s.text)} className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] text-xs text-slate-400 hover:text-slate-300 hover:bg-white/[0.04] transition-all text-left" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}>
              <Icon size={14} className="text-violet-400 flex-shrink-0" />{s.text}
            </motion.button>
          ); })}
        </div>
      )}

      <div className="pt-4 border-t border-white/[0.04]">
        <div className="flex items-end gap-2 px-2">
          <div className="flex-shrink-0 pb-1">
            <VoiceSymptomLogger onInsightLogged={handleVoiceInsight} />
          </div>
          <div className="flex-1 flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-2xl px-4 py-2 focus-within:border-violet-500/30 transition-all">
            <button className="p-1.5 rounded-lg hover:bg-white/[0.04] transition-all"><Paperclip size={18} className="text-slate-500" /></button>
            <input 
              type="text" 
              value={input} 
              onChange={e => setInput(e.target.value)} 
              onKeyDown={e => e.key === "Enter" && sendMessage(input)} 
              placeholder="Ask MediBook or tap mic to speak..." 
              className="flex-1 bg-transparent py-1.5 text-sm text-slate-300 placeholder-slate-600 focus:outline-none" 
            />
            <motion.button 
              onClick={() => sendMessage(input)} 
              className="p-1.5 rounded-lg text-violet-400 hover:bg-violet-500/10 transition-all" 
              whileTap={{ scale: 0.95 }} 
              disabled={!input.trim()}
            >
              <Send size={18} />
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
