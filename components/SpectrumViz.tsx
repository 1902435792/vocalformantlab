
import React, { useMemo, useState, useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FormantData, HarmonicBoost, VocalPhysics } from '../types';

interface Props {
    pitch: number;
    formants: FormantData;
    singersFormant: boolean;
    harmonicBoost: HarmonicBoost;
    physics?: VocalPhysics;
    onFormantChange?: (formant: 'f1' | 'f2' | 'f3', newFreq: number) => void;
    userSpectrum?: number[]; // FFT data overlay
}

const MAX_FREQ = 5500; // Increased to see high freq boosts

// Helper to calculate Peaking Filter gain at freq f
// Simplified response for visualization
const getPeakingGain = (f: number, centerFreq: number, gainDb: number, Q: number) => {
    if (gainDb === 0) return 0;
    // Lorentzian-like approximation for visualization
    const w = f / centerFreq;
    // This isn't the exact biquad math, but close enough for visual representation of a peak
    const bw = centerFreq / Q;
    const dist = Math.abs(f - centerFreq);
    if (dist > bw * 2) return 0; // Optimization

    // Gaussian approximation for smoother visual curve
    const x = (f - centerFreq) / (bw / 2);
    return gainDb * Math.exp(-0.5 * x * x);
};

const calculateSpectrum = (
    pitch: number,
    formants: FormantData,
    singersFormant: boolean,
    harmonicBoost: HarmonicBoost,
    userSpectrum: number[] | undefined,
    physics: VocalPhysics = { tractLength: 17.5, foldThickness: 50, closedQuotient: 0.5 }
) => {
    const data = [];
    const step = 5;

    // Physics 1: VTL Scaling
    const vtlScale = 17.5 / Math.max(10, physics.tractLength);

    // Physics 2: Thickness (High Frequency Cutoff)
    const thicknessCutoff = 12000 - (physics.foldThickness * 110);

    // Physics 3: Closed Quotient (Spectral Slope) 
    // CQ 0.1 -> Very steep slope (Dark)
    // CQ 0.9 -> Flat slope (Bright)
    const cqSlope = 3.5 - (physics.closedQuotient * 3.0);

    // Physics Constants
    const F = [formants.f1 * vtlScale, formants.f2 * vtlScale, formants.f3 * vtlScale];
    const B = [formants.bandwidths[0], formants.bandwidths[1], formants.bandwidths[2]];

    const userSpecLen = userSpectrum ? userSpectrum.length : 0;

    for (let f = 20; f <= MAX_FREQ; f += step) {
        // 1. Source Spectrum (Glottal Flow with CQ)
        // Standard -6dB/octave becomes variable based on CQ
        // Ref: -6 * log2(f/100) is standard. We multiply by slope factor.

        let tiltDb = -6 * Math.log2(f / 100);
        // Apply CQ modifier to the tilt
        // If CQ is high (0.9), slope should be flatter (brighter)
        // If CQ is low (0.1), slope should be steeper (darker)
        // Let's model it as modifying the decay rate
        // Adjusted Tilt = StandardTilt * (SlopeFactor)
        // We use the cqSlope we calculated earlier as a roughly 1.0 centric modifier?
        // Actually earlier cqSlope was exponent for linear amp (1/f^p).
        // 20*log10(1/f^p) = -20*p*log10(f). Standard is about -12dB/octave.
        // Let's just use the linear power we derived: 1/f^cqSlope
        const sourceMag = 1.0 / Math.pow(Math.max(1, f / 100), cqSlope - 1.0); // normalize at 100hz
        tiltDb = 20 * Math.log10(sourceMag);


        // 2. Vocal Tract Transfer Function
        let transferAmp = 1.0;
        for (let i = 0; i < 3; i++) {
            const Fn = F[i]; // Already VTL scaled
            const Bn = B[i];
            const fRatio = f / Fn;
            const Q = Fn / Bn;
            const term1 = 1 - (fRatio * fRatio);
            const term2 = fRatio / Q;
            const resonance = 1 / Math.sqrt(term1 * term1 + term2 * term2);
            transferAmp *= resonance;
        }

        let envelopeDb = 20 * Math.log10(transferAmp + 0.0000001);

        // 3. Add Peaking Filters
        if (singersFormant) {
            // Apply VTL to Singers Formant too
            envelopeDb += getPeakingGain(f, 3000 * Math.sqrt(vtlScale), 15, 1.5);
        }
        if (harmonicBoost.active) {
            envelopeDb += getPeakingGain(f, harmonicBoost.freq, harmonicBoost.gain, harmonicBoost.q);
        }

        let totalDb = tiltDb + envelopeDb;

        // 4. Thickness Rolloff (Lowpass)
        if (f > thicknessCutoff) {
            // steep rolloff
            const octaves = Math.log2(f / thicknessCutoff);
            totalDb -= octaves * 24; // -24dB/oct abvoer cutoff
        }

        const displayVal = Math.max(0, Math.min(100, totalDb + 60));

        // 4. Sharp Harmonic Spikes
        // We only want to show a value if 'f' is close to a multiple of 'pitch'
        let harmonicAmp = 0;
        const n = f / pitch;
        const distToHarmonic = Math.abs(n - Math.round(n));
        // If within 10% of a step size from integer harmonic
        if (distToHarmonic < (step / pitch)) {
            harmonicAmp = displayVal;
            // Add a little "pop" to harmonics for visualization
            if (harmonicAmp > 10) harmonicAmp += 5;
        }

        // 5. User Spectrum Overlay Mapping
        let userAmp = 0;
        if (userSpectrum && userSpecLen > 0) {
            const pct = f / MAX_FREQ;
            const idx = Math.floor(pct * userSpecLen);
            if (idx >= 0 && idx < userSpecLen) {
                // Map normalized 0-1 magnitude to dB-like scale for viz
                // Say max is 100 on chart.
                userAmp = userSpectrum[idx] * 80; // Scale to chart height
            }
        }

        data.push({
            freq: f,
            envelope: displayVal,
            harmonic: harmonicAmp,
            user: userAmp // Add to data point
        });
    }
    return data;
};

export const SpectrumViz: React.FC<Props> = ({ pitch, formants, singersFormant, harmonicBoost, onFormantChange, userSpectrum, physics }) => {
    const data = useMemo(() =>
        calculateSpectrum(pitch, formants, singersFormant, harmonicBoost, userSpectrum, physics),
        [pitch, formants, singersFormant, harmonicBoost, userSpectrum, physics]
    );

    const containerRef = useRef<HTMLDivElement>(null);
    const [dragging, setDragging] = useState<'f1' | 'f2' | 'f3' | null>(null);

    const handlePointerDown = (formant: 'f1' | 'f2' | 'f3', e: React.PointerEvent) => {
        if (!onFormantChange) return;
        e.stopPropagation();
        e.currentTarget.setPointerCapture(e.pointerId);
        setDragging(formant);
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        e.currentTarget.releasePointerCapture(e.pointerId);
        setDragging(null);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!dragging || !containerRef.current || !onFormantChange) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;

        // Map X position to Frequency
        let newFreq = (x / width) * MAX_FREQ;
        newFreq = Math.max(100, Math.min(MAX_FREQ, newFreq));

        onFormantChange(dragging, newFreq);
    };

    const getLeftPct = (freq: number) => `${(freq / MAX_FREQ) * 100}%`;

    return (
        <div className="w-full h-full bg-transparent p-6 relative flex flex-col">
            <div className="flex justify-between items-center mb-2 z-20 relative shrink-0">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_#34d399]" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">频谱分析 & 泛音列</span>
                    <span className="text-xs font-mono text-slate-500 hidden sm:inline">(Spectrum)</span>
                </h3>
                <div className="text-xs font-mono text-slate-400 flex gap-4">
                    {singersFormant && <span className="text-purple-400 font-bold drop-shadow-md">✨ 歌手共振峰 (RING)</span>}
                    {harmonicBoost.active && harmonicBoost.gain > 0 && <span className="text-amber-400 font-bold drop-shadow-md">⚡ 增强: {harmonicBoost.freq}Hz</span>}
                </div>
            </div>

            <div
                className="relative w-full flex-grow cursor-crosshair select-none touch-none"
                ref={containerRef}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
            >
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorEnv" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.0} />
                            </linearGradient>
                            <linearGradient id="colorHarmonic" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f472b6" stopOpacity={1} />
                                <stop offset="95%" stopColor="#ec4899" stopOpacity={0.4} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis
                            dataKey="freq"
                            stroke="#64748b"
                            tick={{ fill: '#64748b', fontSize: 11 }}
                            type="number"
                            domain={[0, MAX_FREQ]}
                            ticks={[0, 1000, 2000, 3000, 4000, 5000]}
                        />
                        <YAxis hide domain={[0, 120]} />
                        <Tooltip
                            contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.1)', color: '#e2e8f0', borderRadius: '8px', backdropFilter: 'blur(4px)' }}
                            labelFormatter={(v) => `${v} Hz`}
                            formatter={(value: number, name: string) => [value.toFixed(1), name === 'envelope' ? '共鸣包络' : '谐波能量']}
                            cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1 }}
                        />

                        {/* Formant Envelope (Background, Smooth) */}
                        <Area
                            type="monotone"
                            dataKey="envelope"
                            stroke="#06b6d4"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorEnv)"
                            animationDuration={200}
                            isAnimationActive={false}
                        />

                        {/* User Spectrum Overlay (Gold, Behind Harmonics but Visible) */}
                        <Area
                            type="monotone"
                            dataKey="user"
                            stroke="#fbbf24"
                            strokeWidth={2}
                            fill="#fbbf24"
                            fillOpacity={0.2}
                            animationDuration={100}
                            isAnimationActive={false}
                        />

                        {/* Harmonics (Foreground, Sharp) */}
                        <Area
                            type="step"
                            dataKey="harmonic"
                            stroke="none"
                            fill="url(#colorHarmonic)"
                            fillOpacity={1}
                            animationDuration={200}
                            isAnimationActive={false}
                        />
                    </AreaChart>
                </ResponsiveContainer>

                {/* Interactive Drag Layer */}
                <div className="absolute inset-0 pointer-events-none">
                    <div
                        className="absolute top-0 bottom-6 w-8 -ml-4 flex flex-col items-center group pointer-events-auto cursor-ew-resize"
                        style={{ left: getLeftPct(formants.f1) }}
                        onPointerDown={(e) => handlePointerDown('f1', e)}
                    >
                        <div className={`h-full w-[2px] bg-pink-500/60 group-hover:bg-pink-400 group-hover:w-[3px] group-hover:shadow-[0_0_8px_#ec4899] transition-all ${dragging === 'f1' ? 'bg-pink-400 w-[3px] shadow-[0_0_10px_#ec4899]' : ''}`}></div>
                        <div className="absolute top-2 bg-pink-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">F1</div>
                    </div>

                    <div
                        className="absolute top-0 bottom-6 w-8 -ml-4 flex flex-col items-center group pointer-events-auto cursor-ew-resize"
                        style={{ left: getLeftPct(formants.f2) }}
                        onPointerDown={(e) => handlePointerDown('f2', e)}
                    >
                        <div className={`h-full w-[2px] bg-violet-500/60 group-hover:bg-violet-400 group-hover:w-[3px] group-hover:shadow-[0_0_8px_#8b5cf6] transition-all ${dragging === 'f2' ? 'bg-violet-400 w-[3px] shadow-[0_0_10px_#8b5cf6]' : ''}`}></div>
                        <div className="absolute top-8 bg-violet-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">F2</div>
                    </div>

                    <div
                        className="absolute top-0 bottom-6 w-8 -ml-4 flex flex-col items-center group pointer-events-auto cursor-ew-resize"
                        style={{ left: getLeftPct(formants.f3) }}
                        onPointerDown={(e) => handlePointerDown('f3', e)}
                    >
                        <div className={`h-full w-[2px] bg-cyan-500/60 group-hover:bg-cyan-400 group-hover:w-[3px] group-hover:shadow-[0_0_8px_#06b6d4] transition-all ${dragging === 'f3' ? 'bg-cyan-400 w-[3px] shadow-[0_0_10px_#06b6d4]' : ''}`}></div>
                        <div className="absolute top-14 bg-cyan-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">F3</div>
                    </div>

                    {/* Singers Formant Indicator */}
                    {singersFormant && (
                        <div
                            className="absolute top-0 bottom-6 w-0.5 border-l-2 border-dashed border-purple-400/50 pointer-events-none"
                            style={{ left: getLeftPct(3000) }}
                        >
                            <div className="absolute top-20 -left-6 bg-purple-900/80 text-purple-200 text-[9px] font-bold px-1 rounded backdrop-blur">RING</div>
                        </div>
                    )}

                    {/* Harmonic Boost Indicator */}
                    {harmonicBoost.active && harmonicBoost.gain > 0 && (
                        <div
                            className="absolute top-0 bottom-6 w-0.5 border-l-2 border-dotted border-amber-400/50 pointer-events-none"
                            style={{ left: getLeftPct(harmonicBoost.freq) }}
                        >
                            <div className="absolute top-24 -left-6 bg-amber-900/80 text-amber-200 text-[9px] font-bold px-1 rounded backdrop-blur">BOOST</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
