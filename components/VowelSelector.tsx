
import React from 'react';
import { VowelType } from '../types';
import { VOWELS } from '../constants';

interface Props {
  selectedVowel: VowelType;
  onSelect: (v: VowelType) => void;
}

export const VowelSelector: React.FC<Props> = ({ selectedVowel, onSelect }) => {
  
  // Coordinate Mapping for the IPA Chart (Articulatory Space)
  // X: 0 (Front) -> 100 (Back)
  // Y: 0 (Close) -> 100 (Open)
  
  const positions: Record<string, { x: number; y: number; rounded: boolean }> = {
    // --- Front Vowels ---
    [VowelType.I]:       { x: 5,  y: 5,  rounded: false }, // i
    [VowelType.Y]:       { x: 12, y: 5,  rounded: true },  // y (Rounded i)
    
    [VowelType.I_SHORT]: { x: 20, y: 18, rounded: false }, // I
    
    [VowelType.E_CLOSE]: { x: 15, y: 35, rounded: false }, // e
    [VowelType.O_SLASH]: { x: 22, y: 35, rounded: true },  // ø (Rounded e)
    
    [VowelType.E_OPEN]:  { x: 22, y: 55, rounded: false }, // ɛ
    [VowelType.OE]:      { x: 29, y: 55, rounded: true },  // œ (Rounded ɛ)
    
    [VowelType.AE]:      { x: 28, y: 75, rounded: false }, // æ
    [VowelType.A_FRONT]: { x: 30, y: 95, rounded: false }, // a (Front open)

    // --- Central ---
    [VowelType.SCHWA]:   { x: 50, y: 50, rounded: false }, // ə
    [VowelType.BIRD]:    { x: 50, y: 62, rounded: false }, // 3

    // --- Back Vowels ---
    [VowelType.A]:       { x: 85, y: 95, rounded: false }, // ɑ
    [VowelType.A_ROUND]: { x: 92, y: 95, rounded: true },  // ɒ

    [VowelType.CARET]:   { x: 70, y: 75, rounded: false }, // ʌ
    [VowelType.O_OPEN]:  { x: 90, y: 65, rounded: true },  // ɔ

    [VowelType.GAMMA]:   { x: 80, y: 40, rounded: false }, // ɤ
    [VowelType.O_CLOSE]: { x: 92, y: 40, rounded: true },  // o
    
    [VowelType.U_SHORT]: { x: 78, y: 20, rounded: true },  // ʊ

    [VowelType.U_UNROUND]:{ x: 85, y: 5, rounded: false }, // ɯ
    [VowelType.U]:       { x: 95, y: 5,  rounded: true },  // u
  };

  // Polygon connecting the "Cardinal Vowels"
  const polygonPoints = `
    5,5 
    30,95 
    92,95 
    95,5 
  `;

  const activeVowels = Object.keys(positions) as VowelType[];

  return (
    <div className="w-full aspect-[4/3] bg-slate-800 rounded-xl relative p-2 border border-slate-700 select-none">
       {/* Axis Labels */}
       <div className="absolute top-1 left-2 text-[9px] font-bold text-slate-500 uppercase tracking-wider">前 (Front)</div>
       <div className="absolute top-1 right-2 text-[9px] font-bold text-slate-500 uppercase tracking-wider">后 (Back)</div>
       <div className="absolute top-8 -left-2 -rotate-90 text-[9px] font-bold text-slate-500 uppercase tracking-wider origin-center">闭 (Close)</div>
       <div className="absolute bottom-8 -left-2 -rotate-90 text-[9px] font-bold text-slate-500 uppercase tracking-wider origin-center">开 (Open)</div>

       <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Background Grid */}
          <line x1="0" y1="33" x2="100" y2="33" stroke="#334155" strokeWidth="0.5" strokeDasharray="2 2" />
          <line x1="0" y1="66" x2="100" y2="66" stroke="#334155" strokeWidth="0.5" strokeDasharray="2 2" />
          <line x1="50" y1="0" x2="50" y2="100" stroke="#334155" strokeWidth="0.5" strokeDasharray="2 2" />

          {/* Vowel Trapezoid */}
          <polygon 
            points={polygonPoints} 
            fill="rgba(99, 102, 241, 0.1)" 
            stroke="#4f46e5" 
            strokeWidth="1"
            strokeLinejoin="round"
          />

          {/* Points */}
          {activeVowels.map(v => {
            const pos = positions[v];
            const isSelected = selectedVowel === v;
            const vowelDef = VOWELS[v];
            
            // Adjust label position for crowded areas
            let labelY = pos.y + 12;
            if (pos.y < 15) labelY = pos.y + 12;
            if (pos.y > 90) labelY = pos.y - 8;

            return (
              <g 
                key={v} 
                onClick={() => onSelect(v)} 
                className="cursor-pointer group"
              >
                {/* Hit area */}
                <circle cx={pos.x} cy={pos.y} r="8" fill="transparent" />
                
                {/* Selection Halo */}
                {isSelected && (
                  <circle cx={pos.x} cy={pos.y} r="7" fill="rgba(255,255,255,0.15)" className="animate-pulse" />
                )}

                {/* Visible Dot */}
                <circle 
                  cx={pos.x} 
                  cy={pos.y} 
                  r={isSelected ? 3.5 : 2} 
                  fill={isSelected ? '#fff' : (pos.rounded ? '#38bdf8' : '#f472b6')} // Cyan for rounded, Pink for unrounded
                  stroke={isSelected ? (pos.rounded ? '#0ea5e9' : '#ec4899') : 'transparent'}
                  strokeWidth="2"
                  className="transition-all duration-200"
                />

                {/* Label */}
                <text 
                  x={pos.x} 
                  y={labelY} 
                  textAnchor="middle" 
                  className={`text-[9px] font-serif font-bold transition-colors ${isSelected ? 'fill-white' : 'fill-slate-400 group-hover:fill-slate-200'}`}
                >
                  {vowelDef.ipa}
                </text>
              </g>
            );
          })}
       </svg>

       {/* Legend */}
       <div className="absolute bottom-1 right-2 flex gap-3 text-[8px] text-slate-500 font-bold bg-slate-900/80 px-2 py-1 rounded-full border border-slate-700/50">
          <div className="flex items-center gap-1">
             <div className="w-1.5 h-1.5 rounded-full bg-pink-400"></div> 非圆唇
          </div>
          <div className="flex items-center gap-1">
             <div className="w-1.5 h-1.5 rounded-full bg-sky-400"></div> 圆唇
          </div>
       </div>
    </div>
  );
};
