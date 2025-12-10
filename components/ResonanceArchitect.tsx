
import React, { useState, useEffect } from 'react';
import { Gender, ResonanceStrategy, FormantData, VowelType } from '../types';
import { calculateResonanceStrategy } from '../services/vraService';
import { VowelSpaceChart } from './VowelSpaceChart';
import { Music, AlertTriangle, Info, Play, Square } from 'lucide-react';
import { audioService } from '../services/audioService';

interface Props {
  gender: Gender;
}

export const ResonanceArchitect: React.FC<Props> = ({ gender }) => {
  const [pitch, setPitch] = useState(392); // G4 default
  const [strategy, setStrategy] = useState<ResonanceStrategy>(ResonanceStrategy.OPEN_CHEST);
  const [isPlaying, setIsPlaying] = useState(false);

  const result = calculateResonanceStrategy(pitch, strategy, gender);

  // Construct FormantData for visualization
  const vizFormants: FormantData = {
    f1: result.targetF1,
    f2: result.targetF2 || 1500,
    f3: result.targetF3 || 2500,
    bandwidths: [80, 100, 120]
  };

  // Sync audio if playing
  useEffect(() => {
    if (isPlaying) {
      try {
        audioService.setParams(
          pitch,
          vizFormants,
          0.5,
          false, // No singer's formant default
          { active: false, freq: 0, gain: 0, q: 0 } // No boost default
        );
      } catch (e) {
        console.error("Audio update failed", e);
      }
    }
  }, [pitch, strategy, result, isPlaying]);

  const togglePlay = () => {
    try {
      if (isPlaying) {
        audioService.stop();
      } else {
        audioService.start(
          pitch,
          vizFormants,
          0.5,
          false,
          { active: false, freq: 0, gain: 0, q: 0 }
        );
      }
      setIsPlaying(!isPlaying);
    } catch (e) {
      console.error("Audio toggle failed", e);
      alert("无法启动音频引擎: " + (e as Error).message);
      setIsPlaying(false);
    }
  };

  const getNoteName = (freq: number) => {
    const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const steps = Math.round(12 * Math.log2(freq / 440) + 57);
    return notes[steps % 12] + Math.floor(steps / 12);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full p-1 pt-16">

      {/* 1. Controller Panel (Left) */}
      <div className="lg:col-span-3 flex flex-col gap-6 glass-panel p-6 rounded-3xl shadow-2xl overflow-y-auto max-h-[calc(100vh-120px)]">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">共鸣架构师 (Architect)</h2>
          <p className="text-slate-400 text-xs">设计并探索高级声乐共鸣策略。</p>
        </div>

        {/* Strategy Selector */}
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase mb-3 block">共鸣策略 (Strategy)</label>
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => setStrategy(ResonanceStrategy.DEEP_COVER)}
              className={`p-3 rounded-xl text-left transition-all border ${strategy === ResonanceStrategy.DEEP_COVER ? 'bg-indigo-600 shadow-lg shadow-indigo-900/40 border-indigo-500 text-white' : 'bg-slate-900/50 border-white/5 text-slate-400 hover:bg-white/10'}`}
            >
              <div className="font-bold text-sm">1. 深度覆盖 (Deep Cover)</div>
              <div className="text-[10px] opacity-70">目标 F1 ≈ H1. 纯净、Whoop、假声。</div>
            </button>

            <button
              onClick={() => setStrategy(ResonanceStrategy.OPEN_CHEST)}
              className={`p-3 rounded-xl text-left transition-all border ${strategy === ResonanceStrategy.OPEN_CHEST ? 'bg-indigo-600 shadow-lg shadow-indigo-900/40 border-indigo-500 text-white' : 'bg-slate-900/50 border-white/5 text-slate-400 hover:bg-white/10'}`}
            >
              <div className="font-bold text-sm">2. 开放胸声 (Open Chest)</div>
              <div className="text-[10px] opacity-70">目标 F1 ≈ H2. 呐喊、Belting基础。</div>
            </button>

            <button
              onClick={() => setStrategy(ResonanceStrategy.GOLDEN_RING)}
              className={`p-3 rounded-xl text-left transition-all border ${strategy === ResonanceStrategy.GOLDEN_RING ? 'bg-indigo-600 shadow-lg shadow-indigo-900/40 border-indigo-500 text-white' : 'bg-slate-900/50 border-white/5 text-slate-400 hover:bg-slate-900/70'}`}
            >
              <div className="font-bold text-sm">3. 黄金共鸣 (Golden Ring)</div>
              <div className="text-[10px] opacity-70">F1≈H2, F2≈H4. 古典美声投射。</div>
            </button>

            <button
              onClick={() => setStrategy(ResonanceStrategy.METAL_BELT)}
              className={`p-3 rounded-xl text-left transition-all border ${strategy === ResonanceStrategy.METAL_BELT ? 'bg-indigo-600 shadow-lg shadow-indigo-900/40 border-indigo-500 text-white' : 'bg-slate-900/50 border-white/5 text-slate-400 hover:bg-white/10'}`}
            >
              <div className="font-bold text-sm">4. 金属强声 (Metal Belt)</div>
              <div className="text-[10px] opacity-70">F1≈H2, F2≈H3. 摇滚、金属边缘。</div>
            </button>

            <button
              onClick={() => setStrategy(ResonanceStrategy.TWANG_MIX)}
              className={`p-3 rounded-xl text-left transition-all border ${strategy === ResonanceStrategy.TWANG_MIX ? 'bg-indigo-600 shadow-lg shadow-indigo-900/40 border-indigo-500 text-white' : 'bg-slate-900/50 border-white/5 text-slate-400 hover:bg-white/10'}`}
            >
              <div className="font-bold text-sm">5. Twang混声 (Twang Mix)</div>
              <div className="text-[10px] opacity-70">F1≈H1, F2≈H3. 明亮混声。</div>
            </button>

            <button
              onClick={() => setStrategy(ResonanceStrategy.SUPER_HEAD)}
              className={`p-3 rounded-xl text-left transition-all border ${strategy === ResonanceStrategy.SUPER_HEAD ? 'bg-indigo-600 shadow-lg shadow-indigo-900/40 border-indigo-500 text-white' : 'bg-slate-900/50 border-white/5 text-slate-400 hover:bg-white/10'}`}
            >
              <div className="font-bold text-sm">6. 超高头声 (Super Head)</div>
              <div className="text-[10px] opacity-70">F2≈H3. 极高音头声共鸣。</div>
            </button>
          </div>
        </div>

        {/* Warning Panel */}
        {result.warning && (
          <div className="mt-auto bg-amber-900/30 border border-amber-500/30 p-3 rounded-lg flex gap-2">
            <AlertTriangle className="text-amber-500 w-5 h-5 shrink-0" />
            <p className="text-amber-200 text-xs font-semibold">{result.warning}</p>
          </div>
        )}
      </div>

      {/* 2. Visualization Panel (Center) */}
      <div className="lg:col-span-6 flex flex-col gap-6">
        {/* Chart Container */}
        <div className="glass-panel p-2 rounded-3xl shadow-xl flex-grow min-h-[400px] relative pointer-events-none">
          <div className="absolute top-4 right-4 z-10 bg-slate-900/80 px-3 py-1 rounded-lg text-xs font-mono text-slate-400 border border-white/10 backdrop-blur-sm">
            目标: {result.closestVowel.ipa}
          </div>
          {/* We reuse VowelSpaceChart in read-only mode by passing a no-op handler */}
          {/* We reuse VowelSpaceChart in read-only mode by passing a no-op handler */}
          {(!isNaN(vizFormants.f1) && !isNaN(vizFormants.f2)) ? (
            <VowelSpaceChart
              currentFormants={vizFormants}
              gender={gender}
              selectedVowel={result.closestVowel.type}
              onFormantChange={() => { }}
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full text-slate-500">
              配置无效 (Invalid Configuration)
            </div>
          )}
        </div>

        {/* Pitch Slider (Moved here) */}
        <div className="glass-panel p-6 rounded-3xl shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <label className="text-sm font-bold text-slate-400 uppercase flex items-center gap-2">
              <Music size={16} /> 音高 / 基频 (Pitch)
            </label>
            <div className="text-right">
              <span className="text-2xl font-bold text-indigo-400 font-mono">{pitch} Hz</span>
              <span className="ml-3 text-sm font-bold bg-white/5 px-2 py-1 rounded text-slate-300 border border-white/10">{getNoteName(pitch)}</span>
            </div>
          </div>

          <input
            type="range"
            min={130}
            max={1000}
            value={pitch}
            onChange={(e) => setPitch(Number(e.target.value))}
            className="w-full h-4 bg-slate-700/50 rounded-lg appearance-none cursor-pointer accent-indigo-500 mb-2"
          />
          <div className="flex justify-between text-xs font-mono text-slate-500">
            <span>C3 (130)</span>
            <span>C4 (261)</span>
            <span>C5 (523)</span>
            <span>C6 (1046)</span>
          </div>
        </div>

        {/* Play Button */}
        <button
          onClick={togglePlay}
          className={`w-full py-4 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 transition-all shadow-xl backdrop-blur-sm border border-white/10 ${isPlaying
            ? 'bg-rose-600/90 hover:bg-rose-600 text-white shadow-rose-900/30'
            : 'bg-indigo-600/90 hover:bg-indigo-600 text-white shadow-indigo-900/30'
            }`}
        >
          {isPlaying ? <><Square fill="currentColor" /> 停止模拟</> : <><Play fill="currentColor" /> 试听策略效果</>}
        </button>
      </div>

      {/* 3. Instructions (Right) */}
      <div className="lg:col-span-3 flex flex-col gap-4 glass-panel p-6 rounded-3xl shadow-xl overflow-y-auto">

        <div className="border-b border-white/10 pb-4">
          <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
            <Info size={18} className="text-indigo-400" /> 调音指南 (Instructions)
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed italic">
            "{result.instruction.general}"
          </p>
        </div>

        {/* Vowel Modification */}
        <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
          <div className="text-xs font-bold text-slate-500 uppercase mb-2">元音修正 (Vowel Mod)</div>
          <div className="text-indigo-300 text-lg font-serif font-bold mb-1">
            {result.closestVowel.ipa} <span className="text-sm font-sans font-normal text-slate-400">({result.closestVowel.description})</span>
          </div>
        </div>

        {/* Articulators */}
        <div className="space-y-3">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase mb-1">下颌 (Jaw / F1)</div>
            <div className="text-sm font-semibold text-slate-200 bg-slate-900/50 p-2 rounded border border-white/5">
              {Math.round(result.targetF1)} Hz — {result.instruction.jaw}
            </div>
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase mb-1">舌位 (Tongue / F2)</div>
            <div className="text-sm font-semibold text-slate-200 bg-slate-900/50 p-2 rounded border border-white/5">
              {result.targetF2 ? `${Math.round(result.targetF2)} Hz — ${result.instruction.tongue}` : '自由 / 未锁定'}
            </div>
          </div>
        </div>

        {/* Harmonics Breakdown */}
        <div className="mt-auto pt-4 border-t border-white/10">
          <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">谐波对齐 (Alignment)</h4>
          <div className="space-y-2 font-mono text-xs">
            <div className={`flex justify-between p-1 rounded ${Math.abs(result.targetF1 - result.harmonics[0]) < 50 ? 'bg-emerald-900/30 text-emerald-400' : 'text-slate-500'}`}>
              <span>H1 (基频)</span>
              <span>{result.harmonics[0]} Hz</span>
            </div>
            <div className={`flex justify-between p-1 rounded ${Math.abs(result.targetF1 - result.harmonics[1]) < 50 ? 'bg-emerald-900/30 text-emerald-400' : 'text-slate-500'}`}>
              <span>H2 (泛音)</span>
              <span>{result.harmonics[1]} Hz</span>
            </div>
            <div className={`flex justify-between p-1 rounded ${result.targetF2 && Math.abs(result.targetF2 - result.harmonics[2]) < 100 ? 'bg-emerald-900/30 text-emerald-400' : 'text-slate-500'}`}>
              <span>H3 (泛音)</span>
              <span>{result.harmonics[2]} Hz</span>
            </div>
            <div className={`flex justify-between p-1 rounded ${result.targetF2 && Math.abs(result.targetF2 - result.harmonics[3]) < 100 ? 'bg-emerald-900/30 text-emerald-400' : 'text-slate-500'}`}>
              <span>H4 (泛音)</span>
              <span>{result.harmonics[3]} Hz</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
