
import React, { useState, useEffect } from 'react';
import { Gender, ResonanceStrategy, FormantData, VowelType, VocalPhysics, HarmonicBoost } from '../types';
import { calculateResonanceStrategy } from '../services/vraService';
import { VowelSpaceChart } from './VowelSpaceChart';
import { Music, AlertTriangle, Info, Play, Square, Sliders, Zap } from 'lucide-react';
import { audioService } from '../services/audioService';

interface Props {
  gender: Gender;
}

export const ResonanceArchitect: React.FC<Props> = ({ gender }) => {
  const [pitch, setPitch] = useState(392); // G4 default
  const [strategy, setStrategy] = useState<ResonanceStrategy>(ResonanceStrategy.OPEN_CHEST);
  const [isPlaying, setIsPlaying] = useState(false);

  // NEW: Physiology state
  const [physics, setPhysics] = useState<VocalPhysics>({
    tractLength: 17.5,
    foldThickness: 50,
    closedQuotient: 0.5
  });

  // NEW: Resonance state
  const [singersFormant, setSingersFormant] = useState(false);
  const [harmonicBoost, setHarmonicBoost] = useState<HarmonicBoost>({
    active: true,
    freq: 2000,
    gain: 0,
    q: 2
  });

  const result = calculateResonanceStrategy(pitch, strategy, gender);

  // Construct FormantData for visualization
  const vizFormants: FormantData = {
    f1: result.targetF1,
    f2: result.targetF2 || 1500,
    f3: result.targetF3 || 2500,
    bandwidths: [80, 100, 120]
  };

  const [applyPresets, setApplyPresets] = useState(true);

  // Auto-Apply Physics presets when strategy matches
  useEffect(() => {
    if (applyPresets) {
      if (result.physics) {
        setPhysics(prev => ({ ...prev, ...result.physics }));
      } else {
        // Reset to neutral if no override
        setPhysics({ tractLength: 17.5, foldThickness: 50, closedQuotient: 0.5 });
      }

      if (result.harmonicBoost) {
        setHarmonicBoost(result.harmonicBoost);
      } else {
        setHarmonicBoost({ active: false, freq: 2000, gain: 0, q: 2 });
      }

      setSingersFormant(!!result.singersFormant);
    }
  }, [strategy, applyPresets, result.strategy]); // Depend on strategy change

  // Sync audio if playing
  useEffect(() => {
    if (isPlaying) {
      try {
        audioService.setParams(
          pitch,
          vizFormants,
          0.5,
          singersFormant,
          harmonicBoost,
          physics
        );
      } catch (e) {
        console.error("Audio update failed", e);
      }
    }
  }, [pitch, strategy, result, isPlaying, singersFormant, harmonicBoost, physics]);

  const togglePlay = () => {
    try {
      if (isPlaying) {
        audioService.stop();
      } else {
        audioService.start(
          pitch,
          vizFormants,
          0.5,
          singersFormant,
          harmonicBoost,
          physics
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

  const handlePhysicsChange = (field: keyof VocalPhysics, value: number) => {
    setPhysics(prev => ({ ...prev, [field]: value }));
  };

  const handleBoostChange = (field: 'freq' | 'gain', value: number) => {
    setHarmonicBoost(prev => ({ ...prev, [field]: value, active: true }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full p-1 pt-16">

      {/* 1. Controller Panel (Left) */}
      <div className="lg:col-span-3 flex flex-col gap-6 glass-panel p-6 rounded-3xl shadow-2xl overflow-y-auto max-h-[calc(100vh-120px)]">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">共鸣架构师 (Architect)</h2>
          <p className="text-slate-400 text-xs text-balance mb-4">设计并探索高级声乐共鸣策略。</p>

          {/* Preset Toggle Switch */}
          <div className="flex items-center justify-between bg-slate-800/50 p-2 rounded-lg border border-white/5">
            <span className="text-xs font-bold text-indigo-300">自动应用物理预设</span>
            <button
              onClick={() => setApplyPresets(!applyPresets)}
              className={`w-9 h-5 rounded-full transition-colors relative ${applyPresets ? 'bg-indigo-500' : 'bg-slate-600'}`}
            >
              <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-transform ${applyPresets ? 'left-5' : 'left-1'}`} />
            </button>
          </div>
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
              <div className="text-[10px] opacity-70">F1≈H2, F2≈H3. 刺耳、重金属风格。</div>
            </button>

            <button
              onClick={() => setStrategy(ResonanceStrategy.TWANG_MIX)}
              className={`p-3 rounded-xl text-left transition-all border ${strategy === ResonanceStrategy.TWANG_MIX ? 'bg-indigo-600 shadow-lg shadow-indigo-900/40 border-indigo-500 text-white' : 'bg-slate-900/50 border-white/5 text-slate-400 hover:bg-white/10'}`}
            >
              <div className="font-bold text-sm">5. Twang混声 (Twang Mix)</div>
              <div className="text-[10px] opacity-70">F1≈H1, F2≈H3. 明亮强混声。</div>
            </button>

            <button
              onClick={() => setStrategy(ResonanceStrategy.SUPER_HEAD)}
              className={`p-3 rounded-xl text-left transition-all border ${strategy === ResonanceStrategy.SUPER_HEAD ? 'bg-indigo-600 shadow-lg shadow-indigo-900/40 border-indigo-500 text-white' : 'bg-slate-900/50 border-white/5 text-slate-400 hover:bg-white/10'}`}
            >
              <div className="font-bold text-sm">6. 超高头声 (Super Head)</div>
              <div className="text-[10px] opacity-70">F2≈H3. 极高音穿透力。</div>
            </button>

            <button
              onClick={() => setStrategy(ResonanceStrategy.SOB_CRY)}
              className={`p-3 rounded-xl text-left transition-all border ${strategy === ResonanceStrategy.SOB_CRY ? 'bg-indigo-600 shadow-lg shadow-indigo-900/40 border-indigo-500 text-white' : 'bg-slate-900/50 border-white/5 text-slate-400 hover:bg-white/10'}`}
            >
              <div className="font-bold text-sm">7. 哭腔 (Sob / Cry)</div>
              <div className="text-[10px] opacity-70">低喉位、深沉。抒情必备。</div>
            </button>

            <button
              onClick={() => setStrategy(ResonanceStrategy.PHARYNGEAL)}
              className={`p-3 rounded-xl text-left transition-all border ${strategy === ResonanceStrategy.PHARYNGEAL ? 'bg-indigo-600 shadow-lg shadow-indigo-900/40 border-indigo-500 text-white' : 'bg-slate-900/50 border-white/5 text-slate-400 hover:bg-white/10'}`}
            >
              <div className="font-bold text-sm">8. 咽音 (Pharyngeal)</div>
              <div className="text-[10px] opacity-70">高闭合、挤压感。力量训练。</div>
            </button>
          </div>
        </div>
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
        </div >


  {/* Warning Panel */ }
{
  result.warning && (
    <div className="mt-auto bg-amber-900/30 border border-amber-500/30 p-3 rounded-lg flex gap-2">
      <AlertTriangle className="text-amber-500 w-5 h-5 shrink-0" />
      <p className="text-amber-200 text-xs font-semibold">{result.warning}</p>
    </div>
  )
}
      </div >

  {/* 2. Visualization Panel (Center) */ }
  < div className = "lg:col-span-6 flex flex-col gap-6" >
    {/* Chart Container - With Warning Glow */ }
    < div className = {`glass-panel p-2 rounded-3xl shadow-xl flex-grow min-h-[400px] relative pointer-events-none transition-all duration-300 ${!result.isFeasible ? 'ring-2 ring-red-500/50 shadow-red-500/20' : ''}`}>

      {/* Target IPA Label */ }
      < div className = "absolute top-4 right-4 z-10 bg-slate-900/80 px-3 py-1 rounded-lg text-xs font-mono text-slate-400 border border-white/10 backdrop-blur-sm" >
        目标: { result.closestVowel.ipa }
          </div >

  {/* Warning Overlay - When Not Feasible */ }
{
  !result.isFeasible && (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm rounded-3xl p-6 animate-in fade-in duration-300">
      <div className="bg-red-500/20 p-4 rounded-full mb-4 animate-pulse">
        <AlertTriangle className="w-10 h-10 text-red-400" />
      </div>
      <h3 className="text-lg font-bold text-red-300 mb-2">超出生理极限</h3>
      <p className="text-sm text-slate-400 text-center max-w-md mb-4">
        {result.warning}
      </p>

      {/* Strategy Suggestions */}
      <div className="bg-slate-900/50 rounded-xl p-4 border border-white/10 w-full max-w-sm">
        <div className="text-xs text-slate-500 uppercase font-bold mb-2">建议切换到：</div>
        <div className="space-y-1 text-sm">
          {pitch > 400 && strategy !== ResonanceStrategy.DEEP_COVER && (
            <div className="flex items-center gap-2 text-indigo-300">
              <span className="w-2 h-2 bg-indigo-400 rounded-full" />
              深度覆盖 (Deep Cover) - 高音更舒适
            </div>
          )}
          {pitch > 350 && strategy !== ResonanceStrategy.SUPER_HEAD && (
            <div className="flex items-center gap-2 text-cyan-300">
              <span className="w-2 h-2 bg-cyan-400 rounded-full" />
              超高头声 (Super Head) - 极高音共鸣
            </div>
          )}
          {pitch < 300 && strategy !== ResonanceStrategy.OPEN_CHEST && (
            <div className="flex items-center gap-2 text-emerald-300">
              <span className="w-2 h-2 bg-emerald-400 rounded-full" />
              开放胸声 (Open Chest) - 低音更自然
            </div>
          )}
          <div className="flex items-center gap-2 text-amber-300 mt-2 pt-2 border-t border-white/10">
            <span className="w-2 h-2 bg-amber-400 rounded-full" />
            或降低音高 (Pitch) 尝试
          </div>
        </div>
      </div>
    </div>
  )
}

{/* VowelSpaceChart */ }
{
  (!isNaN(vizFormants.f1) && !isNaN(vizFormants.f2)) ? (
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
)
}
        </div >

  {/* Pitch Slider (Moved here) */ }
  < div className = "glass-panel p-6 rounded-3xl shadow-xl" >
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
        </div >

  {/* Physiology & Resonance Controls - Two Column Layout */ }
  < div className = "grid grid-cols-1 md:grid-cols-2 gap-4" >
    {/* Physiology Panel */ }
    < div className = "glass-panel p-4 rounded-2xl" >
            <label className="text-xs font-bold text-slate-400 uppercase mb-3 block flex items-center gap-2">
              <Sliders size={14} /> 生理构造 (Physiology)
            </label>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                  <span>声道长度</span>
                  <span className="font-mono text-indigo-300">{physics.tractLength.toFixed(1)} cm</span>
                </div>
                <input
                  type="range" min={12} max={22} step={0.5}
                  value={physics.tractLength}
                  onChange={(e) => handlePhysicsChange('tractLength', Number(e.target.value))}
                  className="w-full h-1 bg-slate-700/50 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
              <div>
                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                  <span>声带厚度</span>
                  <span className="font-mono text-rose-300">{physics.foldThickness}%</span>
                </div>
                <input
                  type="range" min={0} max={100} step={1}
                  value={physics.foldThickness}
                  onChange={(e) => handlePhysicsChange('foldThickness', Number(e.target.value))}
                  className="w-full h-1 bg-slate-700/50 rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
              </div>
              <div>
                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                  <span>闭合系数</span>
                  <span className="font-mono text-amber-300">{(physics.closedQuotient * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range" min={0.1} max={0.9} step={0.05}
                  value={physics.closedQuotient}
                  onChange={(e) => handlePhysicsChange('closedQuotient', Number(e.target.value))}
                  className="w-full h-1 bg-slate-700/50 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>
            </div>
          </div >

  {/* Resonance Panel */ }
  < div className = "glass-panel p-4 rounded-2xl" >
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                <Zap size={14} /> 音色共鸣 (Resonance)
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500">歌手峰</span>
                <button
                  onClick={() => setSingersFormant(!singersFormant)}
                  className={`w-8 h-4 rounded-full transition-colors relative ${singersFormant ? 'bg-indigo-500' : 'bg-slate-700/50'}`}
                >
                  <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${singersFormant ? 'left-4.5' : 'left-0.5'}`} />
                </button>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-slate-500 w-8">频率</span>
                <input
                  type="range" min={500} max={5000} step={50}
                  value={harmonicBoost.freq}
                  onChange={(e) => handleBoostChange('freq', Number(e.target.value))}
                  className="flex-grow h-1 bg-slate-700/50 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <span className="text-[10px] font-mono text-amber-400 w-12 text-right">{harmonicBoost.freq}Hz</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-slate-500 w-8">增益</span>
                <input
                  type="range" min={0} max={24} step={0.5}
                  value={harmonicBoost.gain}
                  onChange={(e) => handleBoostChange('gain', Number(e.target.value))}
                  className="flex-grow h-1 bg-slate-700/50 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <span className="text-[10px] font-mono text-emerald-400 w-12 text-right">+{harmonicBoost.gain}dB</span>
              </div>
            </div>
          </div >
        </div >

  {/* Play Button */ }
  < button
onClick = { togglePlay }
className = {`w-full py-4 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 transition-all shadow-xl backdrop-blur-sm border border-white/10 ${isPlaying
  ? 'bg-rose-600/90 hover:bg-rose-600 text-white shadow-rose-900/30'
  : 'bg-indigo-600/90 hover:bg-indigo-600 text-white shadow-indigo-900/30'
  }`}
        >
  { isPlaying?<>< Square fill = "currentColor" /> 停止模拟</> : <><Play fill="currentColor" /> 试听策略效果</>}
        </button >
      </div >

  {/* 3. Instructions (Right) */ }
  < div className = "lg:col-span-3 flex flex-col gap-4 glass-panel p-6 rounded-3xl shadow-xl overflow-y-auto" >

    <div className="border-b border-white/10 pb-4">
      <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
        <Info size={18} className="text-indigo-400" /> 调音指南 (Instructions)
      </h3>
      <p className="text-sm text-slate-300 leading-relaxed italic">
        "{result.instruction.general}"
      </p>
    </div>

{/* Vowel Modification */ }
<div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
  <div className="text-xs font-bold text-slate-500 uppercase mb-2">元音修正 (Vowel Mod)</div>
  <div className="text-indigo-300 text-lg font-serif font-bold mb-1">
    {result.closestVowel.ipa} <span className="text-sm font-sans font-normal text-slate-400">({result.closestVowel.description})</span>
  </div>
</div>

{/* Articulators */ }
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

{/* Harmonics Breakdown */ }
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
      </div >
    </div >
  );
};
