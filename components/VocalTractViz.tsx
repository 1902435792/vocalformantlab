import React, { useMemo } from 'react';
import { FormantData } from '../types';

interface Props {
    formants: FormantData;
    pitch: number;
}

// Linear Interpolation
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const VocalTractViz: React.FC<Props> = ({ formants, pitch }) => {
    // --- 1. Control Parameters (Normalized) ---

    // F1: Jaw Opening
    // High F1 (1.0) = Wide Open
    // Low F1 (0.0) = Closed relative to Open, but not Clenched
    const f1Param = useMemo(() => Math.max(0, Math.min(1, (formants.f1 - 250) / 650)), [formants.f1]);

    // F2: Tongue Front-Back
    // High F2 (1.0) = Front
    // Low F2 (0.0) = Back
    const f2Param = useMemo(() => Math.max(0, Math.min(1, (formants.f2 - 800) / 1700)), [formants.f2]);

    // --- 2. Anatomic Points & Paths ---

    // DYNAMIC JAW
    // Pivot: TMJ
    const tmjX = 175;
    const tmjY = 140;

    // VISUAL FIX: User felt "Start Value" (Closed/Low F1) was "Too High".
    // Previously: 25 deg (Up).
    // New Range: 5 deg (Neutral/Slightly Up) -> -25 deg (Wide Open).
    // This ensures the "Closed" state isn't jamming correctly into the skull.
    const jawAngle = lerp(5, -25, f1Param);
    const rad = (jawAngle * Math.PI) / 180;

    // Helper: Rotate point around TMJ
    const rotate = (x: number, y: number) => {
        const dx = x - tmjX;
        const dy = y - tmjY;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        return [
            tmjX + dx * cos - dy * sin,
            tmjY + dx * sin + dy * cos
        ];
    };

    // DYNAMIC TONGUE (Global Space)

    // 1. Root Anchor (Fixed on Pharynx Wall)
    const rootBaseX = lerp(165, 185, f1Param);
    const tRoot = [rootBaseX, 280];

    // 2. Tip Anchor (Attached to Lower Jaw)
    // Base Tip: (100, 220) relative to unrotated jaw
    const baseTipX = lerp(100, 95, f2Param);
    const baseTipY = 220;
    const tTip = rotate(baseTipX, baseTipY);

    // 3. Hump (The Body)
    // Interpolate relative to jaw floor
    const jawMid = rotate(130, 240);

    const humpXOffset = lerp(20, -20, f2Param);
    const humpYOffset = lerp(-10, -50, f2Param);
    // F1 Effect: Open jaw flattens the tongue slightly relative to jaw
    const opennessOffset = f1Param * 10;

    // Final Hump with CLAMPING
    const humpX = jawMid[0] + humpXOffset;
    const rawHumpY = jawMid[1] + humpYOffset + opennessOffset;

    // Clamp to avoid palate clipping (Palate Y ~ 160)
    const humpY = Math.max(165, rawHumpY);

    // Exquisite Tongue Path
    const tonguePath = `
        M ${tRoot[0]},${tRoot[1]} 
        Q ${tRoot[0] - 10},${250} ${humpX},${humpY} 
        S ${tTip[0]},${tTip[1]} ${tTip[0]},${tTip[1]}
    `;

    // --- 3. Render "Glass Anatomy" Style ---
    return (
        <div className="w-full h-full relative bg-black overflow-hidden rounded-3xl select-none shadow-2xl border border-slate-800 ring-1 ring-white/10">
            {/* 1. Deep Background - Subtle Radial */}
            <div className="absolute inset-0 pointer-events-none"
                style={{
                    background: 'radial-gradient(circle at 60% 40%, #1e1e2e 0%, #000000 90%)',
                }}
            />

            <svg viewBox="0 0 300 400" className="w-full h-full z-10 relative">
                <defs>
                    <linearGradient id="boneGlass" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#fff" stopOpacity="0.1" />
                        <stop offset="30%" stopColor="#fff" stopOpacity="0.05" />
                        <stop offset="100%" stopColor="#fff" stopOpacity="0.02" />
                    </linearGradient>

                    <linearGradient id="tongueGlass" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.95" />
                        <stop offset="70%" stopColor="#f43f5e" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
                    </linearGradient>

                    <filter id="blurGlow">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* --- Static Structure (Ghostly) --- */}
                <g stroke="#ffffff" strokeOpacity="0.1" strokeWidth="0.5" fill="none">
                    <path d="M 220,100 L 220,400" strokeDasharray="5,5" />
                    <path d="M 60,80 C 60,20 180,20 220,90 L 220,130" opacity="0.3" />
                    <path d="M 60,80 Q 55,120 70,135 L 40,165 L 65,175 L 80,185 Q 120,160 160,195 L 170,190 L 170,100"
                        fill="url(#boneGlass)" strokeOpacity="0.3" />

                    {/* Upper Lip (Static Reference) */}
                    <path d="M 88,210 Q 75,205 70,230" stroke="#f43f5e" strokeOpacity="0.4" fill="none" />

                    {/* Upper Teeth - Enhanced Visibility */}
                    <path d="M 80,190 L 85,215 L 100,205 L 95,188 Z" fill="#fff" fillOpacity="0.8" stroke="none" />

                    {/* Pharynx Wall */}
                    <path d="M 190,190 L 190,380" stroke="#f43f5e" strokeOpacity="0.2" strokeWidth="1" />
                </g>

                {/* --- Dynamic Jaw (Floating) --- */}
                <g transform={`rotate(${jawAngle}, ${tmjX}, ${tmjY})`} style={{ transition: 'transform 0.1s cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}>
                    <path d="M 175,140 L 165,240 Q 150,260 100,260 L 90,260 L 90,225 L 175,140"
                        fill="url(#boneGlass)" stroke="#ffffff" strokeOpacity="0.1" />

                    {/* Lower Teeth */}
                    <path d="M 90,225 L 95,200 L 110,205 L 105,230 Z" fill="#fff" fillOpacity="0.8" stroke="none" />

                    {/* Lower Lip */}
                    <path d="M 90,220 Q 75,215 85,245 L 100,250" stroke="#f43f5e" strokeOpacity="0.4" fill="url(#boneGlass)" />
                </g>

                {/* --- TONGUE (Global Space) --- */}
                <g filter="url(#blurGlow)">
                    <path
                        d={tonguePath}
                        fill="url(#tongueGlass)"
                        stroke="#fb7185"
                        strokeWidth="2"
                        strokeOpacity="0.9"
                        strokeLinecap="round"
                        style={{ transition: 'd 0.1s linear' }}
                    />
                </g>

                {/* HUD Overlay */}
                <g className="font-mono text-[9px]" fill="#94a3b8" style={{ pointerEvents: 'none' }}>
                    <line x1="280" y1="50" x2="280" y2="350" stroke="#334155" strokeWidth="0.5" />
                    <text x="265" y="55" textAnchor="end">HIGH FREQ</text>
                    <text x="265" y="355" textAnchor="end">LOW FREQ</text>

                    <g transform="translate(15, 360)">
                        <text x="0" y="0" fill="#f43f5e" fontWeight="bold" fontSize="11">F1</text>
                        <text x="20" y="0">{Math.round(formants.f1)} Hz</text>
                    </g>
                    <g transform="translate(15, 375)">
                        <text x="0" y="0" fill="#38bdf8" fontWeight="bold" fontSize="11">F2</text>
                        <text x="20" y="0">{Math.round(formants.f2)} Hz</text>
                    </g>
                </g>
            </svg>
        </div>
    );
};
