
import React from 'react';
import { VowelType, Gender, SimulationState, FormantData } from '../types';
import { VowelSelector } from './VowelSelector';
import { F1_MIN, F1_MAX, F2_MIN, F2_MAX } from '../constants';
import { Play, Square, Mic2, Sliders, Volume2 } from 'lucide-react';

interface Props {
  state: SimulationState;
  updateState: (partial: Partial<SimulationState>) => void;
  onTogglePlay: () => void;
  onToggleMic?: () => void;
  isMicActive?: boolean;
  currentFormants: FormantData;
}

export const ControlPanel: React.FC<Props> = ({ state, updateState, onTogglePlay, onToggleMic, isMicActive, currentFormants, onPhysicsChange }) => {

  const handleFormantChange = (type: 'f1' | 'f2', value: number) => {
    const newF1 = type === 'f1' ? value : currentFormants.f1;
    const newF2 = type === 'f2' ? value : currentFormants.f2;

    const newF3 = 2300 + (newF2 - 1000) * 0.25;

    updateState({
      vowel: VowelType.CUSTOM,
      customFormants: {
        f1: newF1,
        f2: newF2,
        f3: newF3,
        bandwidths: currentFormants.bandwidths || [80, 100, 120]
      }
    });
  };

  return (
    <div className="glass-panel p-4 sm:p-6 rounded-3xl flex flex-col h-auto lg:h-full overflow-y-auto">
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 mb-2">
          <Mic2 className="text-indigo-400 w-5 h-5 sm:w-6 sm:h-6" />
          <span>声音控制 <span className="text-sm font-normal text-slate-400 hidden sm:inline">(Controls)</span></span>
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm">调整声源、滤波器和音色增强。</p>
      </div>

      {/* Gender Switch */}
      <div className="mb-6">
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">声道模型 (Vocal Tract)</label>
        <div className="flex bg-slate-900/50 p-1 rounded-xl border border-white/5">
          <button
            onClick={() => updateState({ gender: 'male' })}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg capitalize transition-all ${state.gender === 'male' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
          >
            男声 (Male)
          </button>
          <button
            onClick={() => updateState({ gender: 'female' })}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg capitalize transition-all ${state.gender === 'female' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
          >
            女声 (Female)
          </button>
          <button
            onClick={() => updateState({ gender: 'child' })}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg capitalize transition-all ${state.gender === 'child' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
          >
            童声 (Child)
          </button>
        </div>
      </div>

      {/* Volume Control */}
      <div className="mb-6">
        <div className="flex justify-between items-end mb-2">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
            <Volume2 size={12} /> 输出音量 (Volume)
          </label>
          <span className="text-xs font-mono text-slate-300">{Math.round(state.volume * 100)}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={state.volume}
          onChange={(e) => updateState({ volume: Number(e.target.value) })}
          className="w-full h-1.5 bg-slate-700/50 rounded-lg appearance-none cursor-pointer accent-indigo-400"
        />
      </div>

      {/* Vowel Selector */}
      <div className="mb-8">
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">元音选择 (Vowels)</label>
        <VowelSelector
          selectedVowel={state.vowel}
          onSelect={(v) => updateState({ vowel: v, customFormants: undefined })}
        />
      </div>

      {/* Playback Controls */}
      <div className="mb-8">
        <button
          onClick={onTogglePlay}
          className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-xl border border-white/10 ${state.isPlaying
            ? 'bg-rose-600/90 hover:bg-rose-600 text-white shadow-rose-900/30'
            : 'bg-emerald-600/90 hover:bg-emerald-600 text-white shadow-emerald-900/30'
            }`}
        >
          {state.isPlaying ? <><Square fill="currentColor" size={20} /> <span className="hidden sm:inline">停止合成 (Stop)</span><span className="sm:hidden">停止</span></> : <><Play fill="currentColor" size={20} /> <span className="hidden sm:inline">合成声音 (Synthesize)</span><span className="sm:hidden">合成</span></>}
        </button>
      </div>

      {/* Mic Input Button (Biofeedback) */}
      <div className="mb-8">
        <button
          onClick={onToggleMic}
          className={`w-full py-3 rounded-2xl font-bold text-md flex items-center justify-center gap-2 transition-all shadow-lg border border-white/10 ${isMicActive
            ? 'bg-amber-600/90 hover:bg-amber-600 text-white shadow-amber-900/30'
            : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white'
            }`}
        >
          <Mic2 fill={isMicActive ? "currentColor" : "none"} size={18} />
          <span>{isMicActive ? "停止麦克风追踪 (Stop Mic)" : "开启麦克风追踪 (Start Mic)"}</span>
        </button>
      </div>

      {/* Fine Tuning Section */}
      <div className="pt-6 border-t border-white/10 space-y-8">

        {/* 1. Manual Formant Tuning (The EQ) */}
        <div>
          <div className="flex items-center gap-2 mb-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
            <Sliders size={12} /> 共振峰微调 (Formant Tuning)
          </div>

          <div className="space-y-4">
            {/* F1 Control */}
            <div className="bg-slate-900/30 p-3 rounded-xl border border-white/5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-slate-400 font-mono">F1 / 下颌 (Jaw)</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={F1_MIN} max={F1_MAX}
                    value={Math.round(currentFormants.f1)}
                    onChange={(e) => handleFormantChange('f1', Number(e.target.value))}
                    className="w-16 bg-slate-800/50 border border-slate-700/50 rounded px-1 py-0.5 text-right text-xs font-bold text-pink-400 focus:outline-none focus:border-pink-500"
                  />
                  <span className="text-[10px] text-slate-500">Hz</span>
                </div>
              </div>
              <input
                type="range"
                min={F1_MIN} max={F1_MAX}
                value={currentFormants.f1}
                onChange={(e) => handleFormantChange('f1', Number(e.target.value))}
                className="w-full h-1.5 bg-slate-700/50 rounded-lg appearance-none cursor-pointer accent-pink-500"
              />
            </div>

            {/* F2 Control */}
            <div className="bg-slate-900/30 p-3 rounded-xl border border-white/5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-slate-400 font-mono">F2 / 舌位 (Tongue)</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={F2_MIN} max={F2_MAX}
                    value={Math.round(currentFormants.f2)}
                    onChange={(e) => handleFormantChange('f2', Number(e.target.value))}
                    className="w-16 bg-slate-800/50 border border-slate-700/50 rounded px-1 py-0.5 text-right text-xs font-bold text-indigo-400 focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-[10px] text-slate-500">Hz</span>
                </div>
              </div>
              <input
                type="range"
                min={F2_MIN} max={F2_MAX}
                value={currentFormants.f2}
                onChange={(e) => handleFormantChange('f2', Number(e.target.value))}
                className="w-full h-1.5 bg-slate-700/50 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>
      {/* Physiology Controls */}
      <div className="pt-6 border-t border-white/10 space-y-6">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <div className="w-1 h-3 bg-pink-500 rounded-full" />
          生理构造 (Physiology)
        </h3>

        {/* Vocal Tract Length */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">腔体长度 (VTL)</span>
            <span className="font-mono text-pink-300">{state.physics?.tractLength.toFixed(1)} cm</span>
          </div>
          <input
            type="range"
            min={12}
            max={22}
            step={0.5}
            value={state.physics?.tractLength || 17.5}
            onChange={(e) => onPhysicsChange && onPhysicsChange('tractLength', Number(e.target.value))}
            className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer accent-pink-500"
          />
          <div className="flex justify-between text-[9px] text-slate-600 font-mono uppercase">
            <span>Child</span>
            <span>Giant</span>
          </div>
        </div>

        {/* Vocal Fold Thickness */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">声带厚度 (Thickness)</span>
            <span className="font-mono text-amber-300">{state.physics?.foldThickness.toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={state.physics?.foldThickness || 50}
            onChange={(e) => onPhysicsChange && onPhysicsChange('foldThickness', Number(e.target.value))}
            className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer accent-amber-500"
          />
          <div className="flex justify-between text-[9px] text-slate-600 font-mono uppercase">
            <span>Thin/Bright</span>
            <span>Thick/Dark</span>
          </div>
        </div>

        {/* Closed Quotient (CQ) */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">闭合程度 (QC)</span>
            <span className="font-mono text-emerald-300">{state.physics?.closedQuotient.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min={0.1}
            max={0.9}
            step={0.05}
            value={state.physics?.closedQuotient || 0.5}
            onChange={(e) => onPhysicsChange && onPhysicsChange('closedQuotient', Number(e.target.value))}
            className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer accent-emerald-500"
          />
          <div className="flex justify-between text-[9px] text-slate-600 font-mono uppercase">
            <span>Breathy</span>
            <span>Pressed</span>
          </div>
        </div>
      </div>
    </div>
  );
};
