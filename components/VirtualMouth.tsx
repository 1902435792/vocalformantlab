import React from 'react';

interface Props {
  f1: number; // Controls Jaw (200-1000)
  f2: number; // Controls Tongue (700-2500)
}

export const VirtualMouth: React.FC<Props> = ({ f1, f2 }) => {
  
  // 1. Jaw Rotation Calculation
  // F1 200Hz (Closed) -> 0 degrees
  // F1 1000Hz (Open) -> 30 degrees
  const jawOpenPct = Math.max(0, Math.min(1, (f1 - 200) / 800));
  const jawRotation = jawOpenPct * 25; // Max 25 degrees rotation

  // 2. Tongue Position Calculation
  // F2 determines front/back.
  // F2 2500Hz (Front) -> X = 0
  // F2 700Hz (Back) -> X = 1
  const tongueBackPct = Math.max(0, Math.min(1, 1 - (f2 - 700) / 1800));
  
  // Tongue Hump Coordinates
  // Neutral center: 50, 60
  // Front: 30, 55 (Higher, more forward)
  // Back: 70, 70 (Lower, more back)
  
  const tongueX = 30 + (tongueBackPct * 50); 
  const tongueY = 55 + (tongueBackPct * 15) + (jawOpenPct * 10); // Jaw opens, tongue drops slightly

  return (
    <div className="w-full aspect-square bg-slate-800 rounded-full border-4 border-slate-700 relative overflow-hidden shadow-inner">
      <svg viewBox="0 0 200 200" className="w-full h-full">
        {/* Definitions for Gradients */}
        <defs>
          <linearGradient id="skinGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fca5a5" />
            <stop offset="100%" stopColor="#f87171" />
          </linearGradient>
          <radialGradient id="tongueGrad" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#fda4af" />
            <stop offset="100%" stopColor="#e11d48" />
          </radialGradient>
        </defs>

        {/* Neck / Throat Background */}
        <path d="M 120 120 L 120 200 L 60 200 L 60 120 Z" fill="#334155" />

        {/* --- UPPER HEAD (Static) --- */}
        <g>
          {/* Skull / Nose */}
          <path 
            d="M 50 120 Q 50 20 120 20 Q 180 20 180 100 L 180 120" 
            fill="none" stroke="#94a3b8" strokeWidth="2"
          />
          {/* Hard Palate (Roof of mouth) */}
          <path d="M 60 100 Q 100 80 140 100" fill="none" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
          {/* Upper Teeth */}
          <rect x="60" y="100" width="10" height="15" fill="#f1f5f9" rx="2" />
          {/* Upper Lip */}
          <path d="M 45 110 Q 55 115 60 100" fill="none" stroke="#fca5a5" strokeWidth="4" strokeLinecap="round" />
        </g>

        {/* --- LOWER JAW (Dynamic Rotation) --- */}
        {/* Pivot point approx near ear (140, 90) */}
        <g transform={`rotate(${jawRotation}, 140, 90)`}>
          
          {/* Jaw Bone */}
          <path 
            d="M 140 90 L 140 140 Q 140 170 100 170 L 60 160" 
            fill="none" stroke="#94a3b8" strokeWidth="2" 
          />
          
          {/* Lower Lip */}
          <path d="M 48 150 Q 55 155 60 145" fill="none" stroke="#fca5a5" strokeWidth="4" strokeLinecap="round" />

          {/* Lower Teeth */}
          <rect x="62" y="130" width="10" height="15" fill="#f1f5f9" rx="2" transform="rotate(-10, 62, 145)" />

          {/* Tongue (Attached to jaw, but morphs based on F2) */}
          {/* Base of tongue is fixed near throat, tip moves */}
          <path 
            d={`M 130 150 Q ${tongueX} ${tongueY} 65 140`} 
            fill="url(#tongueGrad)" 
            stroke="#be123c" strokeWidth="2"
          />
        </g>
        
        {/* Pharynx Indicator (Visualizing Resonance Space) */}
        <circle cx="130" cy="120" r={jawOpenPct * 15 + 5} fill="rgba(99, 102, 241, 0.3)" className="animate-pulse" />

      </svg>
      
      {/* Overlay Labels */}
      <div className="absolute top-2 left-2 text-[10px] text-slate-400 font-mono">
        <div>Jaw: {Math.round(jawOpenPct * 100)}%</div>
        <div>Tongue: {tongueBackPct > 0.6 ? 'BACK' : tongueBackPct < 0.4 ? 'FRONT' : 'MID'}</div>
      </div>
    </div>
  );
};