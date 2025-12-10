
import React, { useRef, useState } from 'react';
import { VowelType, Gender, FormantData } from '../types';
import { AnalyzedFormants } from '../services/analyzerService';
import { VOWELS, F1_MIN, F1_MAX, F2_MIN, F2_MAX } from '../constants';

interface Props {
  currentFormants: FormantData;
  userFormants?: AnalyzedFormants | null;
  gender: Gender;
  selectedVowel: VowelType;
  onFormantChange: (f1: number, f2: number) => void;
}

export const VowelSpaceChart: React.FC<Props> = ({
  currentFormants,
  userFormants,
  gender,
  selectedVowel,
  onFormantChange
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Standard Acoustic Plot
  // X-Axis: F1 (Hz)
  // Y-Axis: F2 (Hz)

  const getX = (f1: number) => {
    const pct = (f1 - F1_MIN) / (F1_MAX - F1_MIN);
    return Math.max(0, Math.min(100, pct * 100));
  };

  const getY = (f2: number) => {
    // In plots, usually high F2 is up.
    // 0% is Top (High F2), 100% is Bottom (Low F2) in SVG coords if we want standard Cartesian?
    // Let's do standard Cartesian: 0% is Bottom (Low F2), 100% is Top (High F2).
    // SVG y=0 is Top.
    // So y = 100% - pct%
    const pct = (f2 - F2_MIN) / (F2_MAX - F2_MIN);
    return 100 - Math.max(0, Math.min(100, pct * 100));
  };

  const getFreqFromPoint = (xPct: number, yPct: number) => {
    // X is F1
    const f1 = F1_MIN + (xPct / 100) * (F1_MAX - F1_MIN);

    // Y is F2 (inverted SVG y)
    // yPct = 100 - realYPct
    const realYPct = 100 - yPct;
    const f2 = F2_MIN + (realYPct / 100) * (F2_MAX - F2_MIN);

    return { f1, f2 };
  };

  const handleInteraction = (clientX: number, clientY: number) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));

    const { f1, f2 } = getFreqFromPoint(x, y);
    onFormantChange(f1, f2);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    handleInteraction(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging) {
      handleInteraction(e.clientX, e.clientY);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    setIsDragging(false);
  };

  // Get preset coordinates
  const presets = Object.entries(VOWELS)
    .filter(([key]) => key !== VowelType.CUSTOM)
    .map(([key, def]) => {
      let data = def.male;
      if (gender === 'female') data = def.female;
      if (gender === 'child' && def.child) data = def.child; // Support Child

      return {
        key: key as VowelType,
        x: getX(data.f1),
        y: getY(data.f2),
        label: def.ipa,
        name: def.name
      };
    });

  const curX = getX(currentFormants.f1);
  const curY = getY(currentFormants.f2);

  return (
    <div className="w-full h-full bg-transparent relative select-none flex flex-col p-6 touch-none">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white font-bold text-lg flex items-center gap-2">
          声学图谱 (Acoustic Map) <span className="text-xs font-normal text-slate-500">(F1 vs F2)</span>
        </h3>
        <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">
          拖动以探索共振峰
        </span>
      </div>

      <div className="flex-grow relative border-l border-b border-slate-700">
        {/* Y Label (F2 - Tongue Position) */}
        <div className="absolute -left-8 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] text-indigo-400 font-bold tracking-widest whitespace-nowrap flex flex-col items-center gap-1">
          <span>HIGH (前)</span>
          <span className="text-xs">Tongue Position / F2 (Hz)</span>
          <span>LOW (后)</span>
        </div>

        {/* X Label (F1 - Jaw Opening) */}
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] text-pink-400 font-bold tracking-widest whitespace-nowrap flex items-center gap-4">
          <span>CLOSE (闭)</span>
          <span className="text-xs">Jaw Opening / F1 (Hz)</span>
          <span>OPEN (开)</span>
        </div>

        <svg
          ref={svgRef}
          className="w-full h-full touch-none cursor-crosshair overflow-visible"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* F1 Axis Ticks (X-Axis) - Bottom */}
          <g>
            {[200, 400, 600, 800, 1000].map(freq => (
              <g key={`f1-${freq}`}>
                {/* Tick Line */}
                <line
                  x1={`${getX(freq)}%`} x2={`${getX(freq)}%`}
                  y1="100%" y2="98%"
                  stroke="rgba(255,255,255,0.3)" strokeWidth="1"
                />
                <text
                  x={`${getX(freq)}%`}
                  y="100%" dy="-6"
                  fill="rgba(255,255,255,0.5)"
                  fontSize="8"
                  textAnchor="middle"
                  style={{ transform: 'translateY(15px)' }} // Use CSS for minor offset if needed, or just adjust y
                >
                  {freq}
                </text>
              </g>
            ))}
          </g>

          {/* F2 Axis Ticks (Y-Axis) - Left */}
          <g>
            {[500, 1000, 1500, 2000, 2500].map(freq => (
              <g key={`f2-${freq}`}>
                {/* Tick Line */}
                <line
                  x1="0" x2="2%"
                  y1={`${getY(freq)}%`} y2={`${getY(freq)}%`}
                  stroke="rgba(255,255,255,0.3)" strokeWidth="1"
                />
                <text
                  x="2%" dx="4"
                  y={`${getY(freq)}%`} dy="3"
                  fill="rgba(255,255,255,0.5)"
                  fontSize="8"
                  textAnchor="start"
                >
                  {freq}
                </text>
              </g>
            ))}
          </g>

          {/* Presets */}
          {presets.map(p => (
            <g key={p.key}>
              <circle
                cx={`${p.x}%`}
                cy={`${p.y}%`}
                r={selectedVowel === p.key ? 6 : 4}
                fill={selectedVowel === p.key ? "#818cf8" : "#475569"}
                stroke={selectedVowel === p.key ? "white" : "none"}
                strokeWidth="2"
                className="transition-all duration-300"
              />
              <text
                x={`${p.x}%`}
                y={`${p.y - 4}%`}
                fill={selectedVowel === p.key ? "white" : "#64748b"}
                fontSize="12"
                fontWeight="bold"
                textAnchor="middle"
                pointerEvents="none"
              >
                {p.label}
              </text>
            </g>
          ))}

          {/* Crosshairs - Now defined relative to SVG container to prevent overflow */}
          <line
            x1="0" y1={`${curY}%`}
            x2="100%" y2={`${curY}%`}
            stroke="rgba(244, 63, 94, 0.4)"
            strokeWidth="1"
            strokeDasharray="4 2"
            vectorEffect="non-scaling-stroke"
          />
          <line
            x1={`${curX}%`} y1="0"
            x2={`${curX}%`} y2="100%"
            stroke="rgba(244, 63, 94, 0.4)"
            strokeWidth="1"
            strokeDasharray="4 2"
            vectorEffect="non-scaling-stroke"
          />

          {/* User Biofeedback Marker (Ghost Point) */}
          {userFormants && (
            <g style={{ transform: `translate(${getX(userFormants.f1)}%, ${getY(userFormants.f2)}%)` }}>
              <circle r="20" fill="rgba(250, 204, 21, 0.1)" className="animate-ping" />
              <circle r="15" fill="rgba(250, 204, 21, 0.2)" />
              <circle r="6" fill="#fbbf24" stroke="white" strokeWidth="2" />
              <text y="-25" fill="#fbbf24" fontSize="10" fontWeight="bold" textAnchor="middle">YOU</text>
            </g>
          )}

          {/* Current Position Marker */}
          <g style={{ transform: `translate(${curX}%, ${curY}%)` }}>
            <circle r="12" fill="rgba(244, 63, 94, 0.2)" className="animate-pulse" />
            <circle r="5" fill="#f43f5e" stroke="white" strokeWidth="2" />
          </g>
        </svg>
      </div>
    </div>
  );
};
