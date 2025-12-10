import React, { useMemo, useState, useRef } from 'react';
import { FormantData } from '../types';

interface Props {
    formants: FormantData;
    pitch: number;
    onFormantChange?: (f1: number, f2: number) => void;
}

// Linear Interpolation
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Inverse lerp: get t from value
const invLerp = (a: number, b: number, v: number) => Math.max(0, Math.min(1, (v - a) / (b - a)));

export const VocalTractViz: React.FC<Props> = ({ formants, pitch, onFormantChange }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [dragging, setDragging] = useState<'jaw' | 'tongue' | null>(null);

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
    const baseTipX = lerp(100, 95, f2Param);
    const baseTipY = 220;
    const tTip = rotate(baseTipX, baseTipY);

    // 3. Hump (The Body)
    const jawMid = rotate(130, 240);

    const humpXOffset = lerp(20, -20, f2Param);
    const humpYOffset = lerp(-10, -50, f2Param);
    const opennessOffset = f1Param * 10;

    const humpX = jawMid[0] + humpXOffset;
    const rawHumpY = jawMid[1] + humpYOffset + opennessOffset;
    const humpY = Math.max(165, rawHumpY);

    // Exquisite Tongue Path
    const tonguePath = `
        M ${tRoot[0]},${tRoot[1]} 
        Q ${tRoot[0] - 10},${250} ${humpX},${humpY} 
        S ${tTip[0]},${tTip[1]} ${tTip[0]},${tTip[1]}
    `;

    // --- Interaction Handlers ---
    const handlePointerDown = (target: 'jaw' | 'tongue', e: React.PointerEvent) => {
        if (!onFormantChange) return;
        e.stopPropagation();
        (e.target as SVGElement).setPointerCapture(e.pointerId);
        setDragging(target);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!dragging || !svgRef.current || !onFormantChange) return;

        const rect = svgRef.current.getBoundingClientRect();
        // Get position in SVG viewBox coordinates (0-300 x, 0-400 y)
        const x = ((e.clientX - rect.left) / rect.width) * 300;
        const y = ((e.clientY - rect.top) / rect.height) * 400;

        let newF1 = formants.f1;
        let newF2 = formants.f2;

        if (dragging === 'jaw') {
            // Map Y position to F1: Higher Y (lower on screen) = larger F1 (open jaw)
            // Y range roughly 180 (closed) to 280 (open) in viewBox
            const f1T = invLerp(180, 300, y);
            newF1 = lerp(250, 900, f1T);
        } else if (dragging === 'tongue') {
            // Map X position to F2: Lower X (left/front) = higher F2
            // X range roughly 80 (front) to 180 (back) in viewBox
            const f2T = invLerp(180, 80, x); // Inverted: left = high F2
            newF2 = lerp(800, 2500, f2T);
        }

        onFormantChange(Math.round(newF1), Math.round(newF2));
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        (e.target as SVGElement).releasePointerCapture(e.pointerId);
        setDragging(null);
    };

    // --- 3. Render "Glass Anatomy" Style ---
    return (
        <div className="w-full h-full relative bg-black overflow-hidden rounded-3xl select-none shadow-2xl border border-slate-800 ring-1 ring-white/10">
            {/* 1. Deep Background - Subtle Radial */}
            <div className="absolute inset-0 pointer-events-none"
                style={{
                    background: 'radial-gradient(circle at 60% 40%, #1e1e2e 0%, #000000 90%)',
                }}
            />

            <svg 
                ref={svgRef}
                viewBox="0 0 300 400" 
                className="w-full h-full z-10 relative"
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
            >
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

                {/* --- Dynamic Jaw (Floating) - INTERACTIVE --- */}
                <g 
                    transform={`rotate(${jawAngle}, ${tmjX}, ${tmjY})`} 
                    style={{ 
                        transition: dragging === 'jaw' ? 'none' : 'transform 0.1s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                        cursor: onFormantChange ? 'ns-resize' : 'default'
                    }}
                    onPointerDown={(e) => handlePointerDown('jaw', e)}
                >
                    <path d="M 175,140 L 165,240 Q 150,260 100,260 L 90,260 L 90,225 L 175,140"
                        fill="url(#boneGlass)" stroke="#ffffff" strokeOpacity="0.1" />

                    {/* Lower Teeth */}
                    <path d="M 90,225 L 95,200 L 110,205 L 105,230 Z" fill="#fff" fillOpacity="0.8" stroke="none" />

                    {/* Lower Lip */}
                    <path d="M 90,220 Q 75,215 85,245 L 100,250" stroke="#f43f5e" strokeOpacity="0.4" fill="url(#boneGlass)" />
                    
                    {/* Drag Handle Indicator */}
                    {onFormantChange && (
                        <circle cx="130" cy="250" r="8" fill="rgba(99, 102, 241, 0.3)" stroke="rgba(99, 102, 241, 0.6)" strokeWidth="1" className="animate-pulse" />
                    )}
                </g>

                {/* --- TONGUE (Global Space) - INTERACTIVE --- */}
                <g 
                    filter="url(#blurGlow)"
                    style={{ cursor: onFormantChange ? 'ew-resize' : 'default' }}
                    onPointerDown={(e) => handlePointerDown('tongue', e)}
                >
                    <path
                        d={tonguePath}
                        fill="url(#tongueGlass)"
                        stroke="#fb7185"
                        strokeWidth="2"
                        strokeOpacity="0.9"
                        strokeLinecap="round"
                        style={{ transition: dragging === 'tongue' ? 'none' : 'd 0.1s linear' }}
                    />
                    {/* Drag Handle Indicator */}
                    {onFormantChange && (
                        <circle cx={humpX} cy={humpY} r="8" fill="rgba(56, 189, 248, 0.3)" stroke="rgba(56, 189, 248, 0.6)" strokeWidth="1" className="animate-pulse" />
                    )}
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
                    
                    {/* Interactive Hint */}
                    {onFormantChange && (
                        <text x="150" y="395" textAnchor="middle" fill="#6366f1" fontSize="8">拖动下巴/舌头调整共振峰</text>
                    )}
                </g>
            </svg>
        </div>
    );
};
