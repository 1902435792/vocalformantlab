
import React, { useState, useEffect, useMemo } from 'react';
import { VowelType, Gender, SimulationState, FormantData, VocalPhysics } from './types';
import { VOWELS, DEFAULT_PITCH, MIN_PITCH, MAX_PITCH } from './constants';
import { ControlPanel } from './components/ControlPanel';
import { SpectrumViz } from './components/SpectrumViz';
import { VocalTractViz } from './components/VocalTractViz';
import { VowelSpaceChart } from './components/VowelSpaceChart';
import { ResonanceArchitect } from './components/ResonanceArchitect'; // Import new component
import { HelpModal } from './components/HelpModal'; // Import HelpModal
import { audioService } from './services/audioService';
import { analyzerService, AnalyzedFormants } from './services/analyzerService';
import { Waves, Music, Zap, Play, Square, FlaskConical, LayoutTemplate, HelpCircle, AlertTriangle } from 'lucide-react';

// --- Error Boundary ---
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
    public state: { hasError: boolean, error: Error | null } = { hasError: false, error: null };

    constructor(props: { children: React.ReactNode }) {
        super(props);
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center h-full min-h-[400px] p-8 text-center bg-slate-900/50 rounded-3xl border border-red-500/30">
                    <div className="bg-red-500/20 p-4 rounded-full mb-4">
                        <AlertTriangle className="w-8 h-8 text-red-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">组件渲染崩溃 (Component Crashed)</h2>
                    <p className="text-slate-400 mb-4 text-sm max-w-md">
                        抱歉，界面遇到了不可恢复的错误。
                    </p>
                    <div className="bg-black/50 p-4 rounded-lg text-left overflow-auto max-h-48 w-full max-w-lg mb-6 border border-white/5">
                        <code className="font-mono text-xs text-red-300 break-all">
                            {this.state.error?.message || "Unknown Error"}
                        </code>
                    </div>
                    <button
                        onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
                        className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold transition-colors"
                    >
                        重新加载页面 (Reload)
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

// Helper to convert Hz to Note Name
const getNoteFromFreq = (freq: number) => {
    const A4 = 440;
    const C0 = A4 * Math.pow(2, -4.75);
    const steps = 12 * Math.log2(freq / C0);
    const roundedSteps = Math.round(steps);

    const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const oct = Math.floor(roundedSteps / 12);
    const noteIndex = roundedSteps % 12;

    const noteName = notes[noteIndex];

    return `${noteName}${oct}`;
};

const MARKERS = [
    { label: 'A2', freq: 110 },
    { label: 'G3', freq: 196 },
    { label: 'C4', freq: 261.6 },
    { label: 'A4', freq: 440 },
    { label: 'C5', freq: 523.25 },
    { label: 'G5', freq: 784 }
];

type AppMode = 'LAB' | 'ARCHITECT';

function App() {
    useEffect(() => {
        console.log("VocalFormantLab v0.3.1 (LPC + VisualEQ) Loaded");
    }, []);

    const [mode, setMode] = useState<AppMode>('LAB');
    const [showHelp, setShowHelp] = useState(false); // State for Help Modal

    const [state, setState] = useState<SimulationState>({
        isPlaying: false,
        pitch: DEFAULT_PITCH,
        vowel: VowelType.A,
        gender: 'male',
        volume: 0.5,
        singersFormant: false,
        harmonicBoost: {
            active: true,
            freq: 2000,
            gain: 0,
            q: 2
        },
        physics: {
            tractLength: 17.5,
            foldThickness: 50,
            closedQuotient: 0.5
        }
    });

    // Derive current formants: either from preset or custom override
    const currentFormants: FormantData = useMemo(() => {
        if (state.customFormants) {
            return state.customFormants;
        }
        const def = VOWELS[state.vowel];
        return state.gender === 'male' ? def.male : def.female;
    }, [state.vowel, state.gender, state.customFormants]);

    // Audio Sync
    useEffect(() => {
        // Only sync audio from this state if we are in LAB mode. 
        // Architect mode handles its own audio.
        if (mode === 'LAB' && state.isPlaying) {
            try {
                audioService.setParams(
                    state.pitch,
                    currentFormants,
                    state.volume,
                    state.singersFormant,
                    state.harmonicBoost,
                    state.physics
                );
            } catch (e) { console.error("Lab Audio Error", e); }
        } else if (mode === 'ARCHITECT') {
            // Stop lab audio when switching away, unless architect picks it up
            if (state.isPlaying) {
                audioService.stop();
                setState(prev => ({ ...prev, isPlaying: false }));
            }
        }
    }, [state.pitch, currentFormants, state.volume, state.isPlaying, state.singersFormant, state.harmonicBoost, state.physics, mode]);

    const handleTogglePlay = () => {
        const newState = !state.isPlaying;
        try {
            if (newState) {
                audioService.start(
                    state.pitch,
                    currentFormants,
                    state.volume,
                    state.singersFormant,
                    state.harmonicBoost
                );
            } else {
                audioService.stop();
            }
            setState(prev => ({ ...prev, isPlaying: newState }));
        } catch (e) {
            alert("Lab Start Error: " + e);
            setState(prev => ({ ...prev, isPlaying: false }));
        }
    };

    const handleChartInteraction = (f1: number, f2: number) => {
        const f3 = 2300 + (f2 - 1000) * 0.25;
        const bandwidths: [number, number, number] = [80, 100, 120];

        setState(prev => ({
            ...prev,
            vowel: VowelType.CUSTOM,
            customFormants: {
                f1,
                f2,
                f3,
                bandwidths
            }
        }));
    };

    const handleSpectrumInteraction = (formant: 'f1' | 'f2' | 'f3', newFreq: number) => {
        const current = state.customFormants || (state.gender === 'male' ? VOWELS[state.vowel].male : VOWELS[state.vowel].female);
        const updated = { ...current, [formant]: newFreq };

        setState(prev => ({
            ...prev,
            vowel: VowelType.CUSTOM,
            customFormants: {
                ...updated,
                bandwidths: current.bandwidths || [80, 100, 120]
            }
        }));
    };

    const [userFormants, setUserFormants] = useState<AnalyzedFormants | null>(null);
    const [userSpectrum, setUserSpectrum] = useState<number[]>([]); // New state for spectrum
    const [isMicActive, setIsMicActive] = useState(false);

    const handleToggleMic = async () => {
        if (isMicActive) {
            analyzerService.stop();
            setIsMicActive(false);
            setUserFormants(null);
            setUserSpectrum([]);
        } else {
            try {
                await analyzerService.start((data) => {
                    // Split data update to avoid excessive renders if needed, but here simple is good
                    setUserFormants(data);
                    if (data.spectrum) {
                        setUserSpectrum(data.spectrum);
                    }
                });
                setIsMicActive(true);
            } catch (e) {
                alert("无法访问麦克风。请确保已授予权限。");
                console.error(e);
            }
        }
    };



    const handleBoostChange = (field: 'freq' | 'gain', value: number) => {
        updateState({
            harmonicBoost: {
                ...state.harmonicBoost,
                [field]: value,
                active: true
            }
        });
    };

    const handlePhysicsChange = (field: keyof VocalPhysics, value: number) => {
        updateState({
            physics: {
                ...state.physics,
                [field]: value
            }
        });
    };

    const updateState = (partial: Partial<SimulationState>) => {
        setState(prev => ({ ...prev, ...partial }));
    };

    const currentVowelDef = VOWELS[state.vowel];

    return (
        <div className="min-h-screen text-slate-200 font-sans selection:bg-indigo-500 selection:text-white flex flex-col overflow-hidden">
            {/* Help Modal */}
            <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />

            {/* Header - Glassmorphic */}
            <header className="fixed top-4 left-4 right-4 z-50">
                <div className="glass-panel mx-auto px-4 sm:px-6 h-16 rounded-2xl flex items-center justify-between gap-2 max-w-7xl">

                    <div className="flex items-center gap-3 shrink-0">
                        <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
                            <Waves className="text-white w-5 h-5" />
                        </div>
                        {/* Responsive Title */}
                        <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-white leading-tight font-[Outfit]">
                            <span className="sm:hidden">VFLab</span>
                            <span className="hidden sm:inline">Vocal<span className="text-indigo-400">Formant</span>Lab</span>
                            <span className="ml-2 text-[10px] bg-white/10 text-slate-300 px-1.5 py-0.5 rounded border border-white/5 align-middle">
                                v0.3.1 VisualEQ
                            </span>
                        </h1>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        {/* Navigation Tabs - Responsive Labels */}
                        <div className="flex bg-slate-900/50 p-1 rounded-xl border border-white/5">
                            <button
                                onClick={() => setMode('LAB')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${mode === 'LAB' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                            >
                                <FlaskConical size={16} />
                                <span className="hidden sm:inline">实验室 (Lab)</span>
                                <span className="sm:hidden">实验</span>
                            </button>
                            <button
                                onClick={() => setMode('ARCHITECT')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${mode === 'ARCHITECT' ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                            >
                                <LayoutTemplate size={16} />
                                <span className="hidden sm:inline">架构师 (Architect)</span>
                                <span className="sm:hidden">架构</span>
                            </button>
                        </div>

                        {/* Help Button */}
                        <button
                            onClick={() => setShowHelp(true)}
                            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-all border border-transparent hover:border-white/10"
                            title="使用说明与声学指南"
                        >
                            <HelpCircle className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-grow w-full max-w-7xl mx-auto px-4 py-4 lg:px-8 lg:py-6 overflow-y-auto lg:overflow-hidden flex flex-col">

                {/* VIEW: LAB MODE */}
                {mode === 'LAB' && (
                    <ErrorBoundary>
                        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 lg:h-full lg:min-h-0 animate-in fade-in zoom-in-95 duration-500 pt-16">

                            {/* Left Panel: Controls */}
                            <div className="lg:col-span-3 flex flex-col min-h-0 shrink-0">
                                <ControlPanel
                                    state={state}
                                    updateState={updateState}
                                    onTogglePlay={handleTogglePlay}
                                    onToggleMic={handleToggleMic}
                                    isMicActive={isMicActive}
                                    currentFormants={currentFormants}
                                    onPhysicsChange={handlePhysicsChange}
                                />
                            </div>

                            {/* Middle Panel: Interactive Chart & Viz */}
                            <div className="lg:col-span-6 flex flex-col min-h-0 gap-4 shrink-0">

                                {/* The Interactive Vowel Space Chart (IPA Style) */}
                                <div className="glass-panel p-1 rounded-3xl relative group min-h-[350px] lg:flex-grow lg:min-h-[400px]">
                                    <div className="absolute top-3 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                        <span className="text-xs text-indigo-300 font-bold bg-slate-900/80 px-2 py-1 rounded border border-indigo-500/30">拖动变形</span>
                                    </div>
                                    <VowelSpaceChart
                                        currentFormants={currentFormants}
                                        gender={state.gender}
                                        selectedVowel={state.vowel}
                                        onFormantChange={handleChartInteraction}
                                    />
                                </div>

                                {/* Spectrum Viz */}
                                <div className="h-48 sm:h-64 glass-panel rounded-3xl overflow-hidden shrink-0">
                                    <SpectrumViz
                                        pitch={state.pitch}
                                        formants={currentFormants}
                                        singersFormant={state.singersFormant}
                                        harmonicBoost={state.harmonicBoost}
                                        onFormantChange={handleSpectrumInteraction}
                                        userSpectrum={userSpectrum}
                                        physics={state.physics}
                                    />
                                </div>

                                {/* Bottom Controls (Pitch & Timbre) - Below Spectrum */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0">
                                    {/* Pitch Control */}
                                    <div className="glass-panel p-4 rounded-2xl">
                                        <div className="flex justify-between items-end mb-3">
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                <Music size={14} /> 音高 (Pitch)
                                            </label>
                                            <div className="text-right">
                                                <span className="text-indigo-300 font-mono font-bold text-lg">{state.pitch} Hz</span>
                                                <span className="ml-2 text-xs font-bold bg-white/10 text-indigo-200 px-2 py-0.5 rounded border border-white/5">
                                                    {getNoteFromFreq(state.pitch)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="relative mb-4 h-8 touch-none">
                                            <input
                                                type="range"
                                                min={MIN_PITCH}
                                                max={MAX_PITCH}
                                                step={1}
                                                value={state.pitch}
                                                onChange={(e) => updateState({ pitch: Number(e.target.value) })}
                                                className="w-full h-2 bg-slate-700/50 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 relative z-10"
                                            />
                                            <div className="absolute w-full top-3 left-0 h-4 pointer-events-none opacity-50">
                                                {MARKERS.filter(m => m.freq >= MIN_PITCH && m.freq <= MAX_PITCH).map((m) => {
                                                    const pct = ((m.freq - MIN_PITCH) / (MAX_PITCH - MIN_PITCH)) * 100;
                                                    return (
                                                        <div key={m.label} className="absolute flex flex-col items-center" style={{ left: `${pct}%`, transform: 'translateX(-50%)' }}>
                                                            <div className="w-0.5 h-1.5 bg-slate-500 mb-1"></div>
                                                            <span className="text-[9px] font-mono text-slate-500">{m.label}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Timbre Control */}
                                    <div className="glass-panel p-4 rounded-2xl">
                                        <div className="flex items-center justify-between mb-4">
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                <Zap size={14} /> 音色共鸣 (Resonance)
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">歌手共振峰</span>
                                                <button
                                                    onClick={() => updateState({ singersFormant: !state.singersFormant })}
                                                    className={`w-8 h-4 rounded-full transition-colors relative ${state.singersFormant ? 'bg-indigo-500 shadow-lg shadow-indigo-500/50' : 'bg-slate-700/50'}`}
                                                >
                                                    <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${state.singersFormant ? 'left-4.5' : 'left-0.5'}`} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            {/* Frequency Slider */}
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] text-slate-500 w-8">频率</span>
                                                <input
                                                    type="range"
                                                    min={500}
                                                    max={5000}
                                                    step={50}
                                                    value={state.harmonicBoost.freq}
                                                    onChange={(e) => handleBoostChange('freq', Number(e.target.value))}
                                                    className="flex-grow h-1 bg-slate-700/50 rounded-lg appearance-none cursor-pointer accent-amber-500"
                                                />
                                                <span className="text-[10px] font-mono text-amber-400 w-12 text-right">{state.harmonicBoost.freq}Hz</span>
                                            </div>

                                            {/* Gain Slider */}
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] text-slate-500 w-8">增益</span>
                                                <input
                                                    type="range"
                                                    min={0}
                                                    max={24}
                                                    step={0.5}
                                                    value={state.harmonicBoost.gain}
                                                    onChange={(e) => handleBoostChange('gain', Number(e.target.value))}
                                                    className="flex-grow h-1 bg-slate-700/50 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                                />
                                                <span className="text-[10px] font-mono text-emerald-400 w-12 text-right">+{state.harmonicBoost.gain}dB</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Main Play Button - Below Pitch/Timbre */}
                                <button
                                    onClick={handleTogglePlay}
                                    className={`w-full py-4 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 transition-all shadow-xl transform hover:scale-[1.01] active:scale-[0.99] shrink-0 border border-white/10 backdrop-blur-sm ${state.isPlaying
                                        ? 'bg-rose-600/90 hover:bg-rose-600 text-white shadow-rose-900/40'
                                        : 'bg-emerald-600/90 hover:bg-emerald-600 text-white shadow-emerald-900/40'
                                        }`}
                                >
                                    {state.isPlaying ? (
                                        <>
                                            <Square fill="currentColor" size={24} />
                                            <span>停止合成 (Stop)</span>
                                        </>
                                    ) : (
                                        <>
                                            <Play fill="currentColor" size={24} />
                                            <span>合成声音 (Synthesize)</span>
                                        </>
                                    )}
                                </button>

                            </div>

                            {/* Right Panel: Info & Analysis */}
                            <div className="lg:col-span-3 flex flex-col min-h-0 gap-4 shrink-0">
                                {/* Medical Vocal Tract Viz */}
                                <div className="glass-panel p-1 rounded-3xl overflow-hidden relative shadow-2xl border-emerald-500/20 aspect-square shrink-0">
                                    <div className="absolute top-0 left-0 right-0 bg-emerald-900/40 p-2 border-b border-emerald-500/10 backdrop-blur-sm z-20 flex justify-between items-center">
                                        <span className="text-emerald-400 font-bold text-xs tracking-widest uppercase flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                                            MRI 实时成像
                                        </span>
                                        <div className="flex gap-1">
                                            <div className="w-8 h-0.5 bg-emerald-500/30" />
                                            <div className="w-1 h-0.5 bg-emerald-500/30" />
                                        </div>
                                    </div>
                                    <div className="w-full h-full p-0 bg-slate-900/50">
                                        <VocalTractViz
                                            formants={currentFormants}
                                            pitch={state.pitch}
                                            onFormantChange={handleChartInteraction}
                                        />
                                    </div>
                                </div>

                                {/* Acoustic Features / Settings */}
                                <div className="glass-panel p-5 rounded-2xl flex-grow flex flex-col gap-4">
                                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                            <div className="w-1 h-4 bg-indigo-500 rounded-full" />
                                            声学数据 (Acoustics)
                                        </h4>
                                        <div className="text-[10px] font-mono text-slate-500">{currentVowelDef.name}</div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                            <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">第一共振峰 F1</div>
                                            <div className="text-xl font-mono font-bold text-indigo-300">{currentFormants.f1.toFixed(0)} <span className="text-xs text-slate-500">Hz</span></div>
                                            <div className="text-[10px] text-indigo-400/70 mt-1">
                                                {currentFormants.f1 > 700 ? '开颚 (Open)' : '闭颚 (Closed)'}
                                            </div>
                                        </div>
                                        <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                            <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">第二共振峰 F2</div>
                                            <div className="text-xl font-mono font-bold text-cyan-300">{currentFormants.f2.toFixed(0)} <span className="text-xs text-slate-500">Hz</span></div>
                                            <div className="text-[10px] text-cyan-400/70 mt-1">
                                                {currentFormants.f2 > 2000 ? '前舌 (Front)' : '后舌 (Back)'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-auto pt-2">
                                        <div className="text-[10px] text-slate-500 text-center uppercase tracking-widest mb-2">- 模拟状态 -</div>
                                        <div className="flex justify-center gap-4">
                                            <div className={`text-xs px-2 py-1 rounded border ${state.singersFormant ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-200' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                                                歌手共振
                                            </div>
                                            <div className={`text-xs px-2 py-1 rounded border ${state.harmonicBoost.active && state.harmonicBoost.gain > 0 ? 'bg-amber-500/20 border-amber-500/50 text-amber-200' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                                                谐波增强
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ErrorBoundary>
                )}

                {/* VIEW: ARCHITECT MODE */}
                {mode === 'ARCHITECT' && (
                    <ErrorBoundary>
                        <div className="h-full animate-in fade-in zoom-in-95 duration-300">
                            <ResonanceArchitect gender={state.gender} />
                        </div>
                    </ErrorBoundary>
                )}

            </main>
        </div>
    );
}

export default App;
