"use client";

import { useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sphere, MeshDistortMaterial, PerspectiveCamera, Grid } from "@react-three/drei";
import * as THREE from "three";
import { useRealtime } from "@/lib/realtime";

interface TwinRiskScores {
  cardiac?: number;
  diabetes?: number;
  respiratory?: number;
  hypertension?: number;
  stroke?: number;
  overall_health?: number;
}

function DigitalTwinCore({ 
  risks = {} 
}: { 
  risks?: TwinRiskScores 
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef1 = useRef<THREE.Mesh>(null);
  const ringRef2 = useRef<THREE.Mesh>(null);
  const ringRef3 = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);

  const { respiratory = 0.1, hypertension = 0.1, overall_health = 0.9 } = risks;
  const riskScore = 1 - overall_health;

  // Map riskScore (0.0 - 1.0) to visual properties
  const sphereColor = useMemo(() => {
    if (riskScore < 0.3) return "#8b5cf6"; // Violet (Optimal)
    if (riskScore < 0.6) return "#f59e0b"; // Amber (Warning)
    return "#f43f5e"; // Rose (Critical)
  }, [riskScore]);

  const emissiveColor = useMemo(() => {
    if (riskScore < 0.3) return "#4c1d95";
    if (riskScore < 0.6) return "#78350f";
    return "#881337";
  }, [riskScore]);

  const distortionLevel = useMemo(() => 0.2 + riskScore * 0.5, [riskScore]);
  const rotationSpeedMultiplier = useMemo(() => 1 + riskScore * 2.5, [riskScore]);

  const particlePositions = useMemo(() => {
    const count = 300;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const r = 1.8 + Math.random() * 0.8;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    return positions;
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.12 * rotationSpeedMultiplier;
      meshRef.current.rotation.x = Math.sin(t * 0.08) * 0.15;
    }
    
    if (ringRef1.current) {
      const ringPulse = 1 + (Math.sin(t * (2 + hypertension * 5)) * 0.05);
      ringRef1.current.scale.setScalar(ringPulse);
      ringRef1.current.rotation.x = t * 0.4 * (1 + hypertension);
    }
    
    if (ringRef2.current) {
      ringRef2.current.rotation.y = t * 0.25;
      ringRef2.current.rotation.x = Math.PI / 3 + Math.cos(t * 0.5) * 0.1;
    }
    
    if (ringRef3.current) {
      const respPulse = 1 + (Math.sin(t * (1 + respiratory * 3)) * 0.1);
      ringRef3.current.scale.setScalar(respPulse);
      ringRef3.current.rotation.z = -t * 0.2 * (1 + respiratory);
    }

    if (particlesRef.current) {
      particlesRef.current.rotation.y = t * (0.05 + hypertension * 0.2);
    }
  });

  return (
    <group>
      <Sphere ref={meshRef} args={[1, 64, 64]}>
        <MeshDistortMaterial
          color={sphereColor}
          emissive={emissiveColor}
          emissiveIntensity={0.8}
          roughness={0.1}
          metalness={1.0}
          distort={distortionLevel}
          speed={1.2 + riskScore * 5}
          transparent
          opacity={0.9}
        />
      </Sphere>

      <mesh ref={ringRef1}>
        <torusGeometry args={[1.5, 0.01, 16, 100]} />
        <meshBasicMaterial 
          color={hypertension > 0.5 ? "#f43f5e" : "#e11d48"} 
          transparent 
          opacity={0.4 + hypertension * 0.4} 
        />
      </mesh>
      
      <mesh ref={ringRef2}>
        <torusGeometry args={[1.85, 0.006, 16, 100]} />
        <meshBasicMaterial color="#8b5cf6" transparent opacity={0.3} />
      </mesh>
      
      <mesh ref={ringRef3}>
        <torusGeometry args={[2.25, 0.005, 16, 100]} />
        <meshBasicMaterial 
          color={respiratory > 0.5 ? "#10b981" : "#34d399"} 
          transparent 
          opacity={0.2 + respiratory * 0.3} 
        />
      </mesh>

      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={300}
            array={particlePositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.025}
          color={riskScore > 0.6 ? "#f43f5e" : "#00f0ff"}
          transparent
          opacity={0.5 + riskScore * 0.3}
          sizeAttenuation
        />
      </points>
    </group>
  );
}

function HeartbeatIndicator({ bpm = 72, risk = 0.1 }: { bpm?: number; risk?: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const frequency = useMemo(() => (bpm / 60), [bpm]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const heartbeat = Math.sin(t * frequency * Math.PI * 2) * 0.4 + 0.6;
    const pulse = (1 + risk * 0.5) + heartbeat * (0.1 + risk * 0.2);
    if (ref.current) {
      ref.current.scale.setScalar(pulse);
    }
  });

  return (
    <Sphere ref={ref} args={[0.12, 24, 24]} position={[0.4, 0.6, 0.8]}>
      <meshBasicMaterial 
        color={risk > 0.6 ? "#ff0000" : "#f43f5e"} 
        transparent 
        opacity={0.7 + risk * 0.3} 
      />
    </Sphere>
  );
}

function PostProcessing() {
  // Simple post-processing using standard R3F lights for bloom-like effect
  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#4c1d95" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#0e7490" />
    </>
  );
}

export default function DigitalTwinViewerInner({ simulatedRisks }: { simulatedRisks?: Record<string, number> }) {
  const { vitals, twinState, anomalies } = useRealtime();

  const activeRisks: TwinRiskScores = (simulatedRisks || twinState?.risk_scores || {
    cardiac: 0.1,
    respiratory: 0.1,
    hypertension: 0.1,
    overall_health: 0.95
  }) as TwinRiskScores;

  const healthValue = activeRisks.overall_health !== undefined ? activeRisks.overall_health : 0.8;
  const isCritical = 1 - healthValue > 0.6;
  const hr = vitals.heart_rate?.value || 72;

  return (
    <div className="w-full h-full relative">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ alpha: true, antialias: true, stencil: false, depth: true }}
        dpr={[1, 2]}
      >
        <color attach="background" args={["#00000a"]} />
        <PerspectiveCamera makeDefault position={[0, 0, 8]} />
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={5}
          maxDistance={12}
          autoRotate
          autoRotateSpeed={isCritical ? 4.0 : 0.5}
          makeDefault
        />

        <Suspense fallback={null}>
          <DigitalTwinCore risks={activeRisks} />
          <HeartbeatIndicator bpm={hr} risk={activeRisks.cardiac || 0.1} />
          <Grid
            infiniteGrid
            fadeDistance={30}
            sectionSize={1}
            sectionThickness={1}
            sectionColor="#ffffff10"
          />
        </Suspense>

        <PostProcessing />
      </Canvas>

      {/* Floating State Overlay */}
      <div className="absolute top-6 left-6 p-4 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl pointer-events-none">
        <h3 className="text-xs font-medium text-white/40 uppercase tracking-widest mb-1">
          {simulatedRisks ? "Simulation Engine" : "Twin Integrity"}
        </h3>
        <div className="flex items-end gap-2">
          <span className="text-3xl font-bold text-white leading-none">
            {Math.round(healthValue * 100)}%
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            healthValue > 0.8 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
            healthValue > 0.6 ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
            "bg-rose-500/10 text-rose-400 border-rose-500/20"
          }`}>
            {healthValue > 0.8 ? "OPTIMAL" : healthValue > 0.6 ? "STABLE" : "CRITICAL"}
          </span>
        </div>
      </div>

      <div className="absolute top-6 right-6 flex flex-col gap-2 pointer-events-none">
        <div className="p-3 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${anomalies.length > 0 ? "bg-rose-500 animate-pulse" : "bg-emerald-500"}`} />
          <span className="text-[10px] font-medium text-white/60 tracking-wider">
            {simulatedRisks ? "WHAT-IF ACTIVE" : anomalies.length > 0 ? `${anomalies.length} ACTIVE ANOMALIES` : "AI COGNITION ACTIVE"}
          </span>
        </div>
      </div>
    </div>
  );
}
