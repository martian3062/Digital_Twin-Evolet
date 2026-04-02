'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Camera, Mic, MicOff, VideoOff, PhoneOff, User, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import Peer from 'simple-peer';

interface P2PStreamProps {
  onCallEnded: () => void;
  isSimulated?: boolean;
  roomId?: string;
  isInitiator?: boolean;
}

const P2PStream: React.FC<P2PStreamProps> = ({ 
  onCallEnded, 
  isSimulated = false,
  roomId = "demo-consultation-room",
  isInitiator = true
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<Peer.Instance | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const handleCallEnded = useCallback(() => {
    if (wsRef.current) wsRef.current.close();
    if (peerRef.current) peerRef.current.destroy();
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    onCallEnded();
  }, [onCallEnded, stream]);

  useEffect(() => {
    if (isSimulated) {
      setTimeout(() => setIsConnected(true), 2000);
      return;
    }

    const initP2P = async () => {
      try {
        const userMedia = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setStream(userMedia);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = userMedia;
        }

        const peer = new Peer({
          initiator: isInitiator,
          trickle: false,
          stream: userMedia,
        });

        // Initialize WebSocket
        const wsUrl = `ws://localhost:8000/ws/communication/${roomId}/`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('[P2P] WebSocket Connected');
        };

        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          const otherSenderType = isInitiator ? 'doctor' : 'patient';
          
          if (data.sender_type === otherSenderType) {
            console.log('[P2P] Received signal via WebSocket');
            peer.signal(data.signal);
          }
        };

        peer.on('signal', (data) => {
          console.log('[P2P] Sending signal via WebSocket...');
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: data.type,
              signal: data,
              sender_type: isInitiator ? 'patient' : 'doctor'
            }));
          }
        });

        peer.on('stream', (remoteStream) => {
          console.log('[P2P] Received remote stream');
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
          }
          setIsConnected(true);
          toast.success("Secure Consultation Link Active", {
            icon: <ShieldCheck className="text-emerald-400" />
          });
        });

        peer.on('error', (err) => {
          console.error('[P2P] Peer error:', err);
          toast.error("Connection Interrupted");
        });

        peerRef.current = peer;

      } catch (err) {
        console.error('[P2P] Setup failed:', err);
        toast.error("Media Permissions Denied");
      }
    };

    initP2P();

    return () => {
      if (wsRef.current) wsRef.current.close();
      if (peerRef.current) peerRef.current.destroy();
    };
  }, [isInitiator, isSimulated, roomId]);

  return (
    <div className="relative w-full h-full bg-slate-900 rounded-2xl overflow-hidden group">
      {/* Remote Video (Other Peer) */}
      <div className="absolute inset-0 flex items-center justify-center bg-slate-950/50">
        {!isConnected ? (
          <div className="text-center space-y-4">
            <div className="h-20 w-20 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto animate-pulse">
              <User className="h-10 w-10 text-emerald-400" />
            </div>
            <div className="space-y-1">
              <p className="text-emerald-400 font-medium tracking-wide">Establishing E2EE Channel...</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Room: {roomId}</p>
            </div>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full h-full relative"
          >
            {isSimulated ? (
              <video 
                autoPlay 
                muted 
                loop 
                className="w-full h-full object-cover grayscale-[0.2]"
                src="https://assets.mixkit.co/videos/preview/mixkit-doctor-working-on-his-laptop-34448-large.mp4"
              />
            ) : (
              <video 
                ref={remoteVideoRef} 
                autoPlay 
                playsInline
                className="w-full h-full object-cover" 
              />
            )}
            
            <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
              <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-semibold text-white uppercase tracking-tighter">Live E2EE Consultation</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Local Video Preview (Self) */}
      <motion.div 
        layout
        className="absolute bottom-24 right-6 w-48 h-32 bg-slate-800 rounded-xl border border-white/10 overflow-hidden shadow-2xl z-10"
      >
        <video 
          ref={localVideoRef} 
          autoPlay 
          muted 
          playsInline 
          className={`w-full h-full object-cover ${!isSimulated && 'mirror'}`} 
        />
        {isVideoOff && (
          <div className="absolute inset-0 bg-slate-950 flex items-center justify-center">
            <VideoOff className="h-6 w-6 text-white/40" />
          </div>
        )}
      </motion.div>

      {/* Control Bar */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl z-20"
      >
        <button 
          onClick={() => setIsMuted(!isMuted)}
          className={`p-3 rounded-xl transition-all ${isMuted ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-white/10 text-white hover:bg-white/20 border-white/5'}`}
        >
          {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </button>
        
        <button 
          onClick={() => setIsVideoOff(!isVideoOff)}
          className={`p-3 rounded-xl transition-all ${isVideoOff ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-white/10 text-white hover:bg-white/20 border-white/5'}`}
        >
          {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Camera className="h-5 w-5" />}
        </button>

        <div className="h-8 w-[1px] bg-white/10 mx-2" />

        <button 
          onClick={handleCallEnded}
          className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-xl shadow-lg shadow-red-500/20 transition-all flex items-center gap-2"
        >
          <PhoneOff className="h-5 w-5" />
          <span className="text-sm font-bold uppercase tracking-tight">End Call</span>
        </button>
      </motion.div>

      {/* Encryption Badge */}
      <div className="absolute top-6 right-6 px-3 py-1 bg-emerald-500/10 backdrop-blur-sm border border-emerald-500/20 rounded-lg flex items-center gap-2">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">AES-256 SECURED</span>
      </div>
    </div>
  );
};

export default P2PStream;
