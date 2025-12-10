
import React from 'react';
import { X, BookOpen, Activity, Mic2, Cpu, Waves } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-200" 
        onClick={onClose}
      />
      
      {/* Modal Card */}
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 shrink-0 bg-slate-900 rounded-t-2xl">
          <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-3">
            <BookOpen className="text-indigo-400" /> 
            <span>使用说明与声学原理指南</span>
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="overflow-y-auto p-6 md:p-8 space-y-12 text-slate-300 leading-relaxed font-sans">
           
           {/* Section 1: Science */}
           <section>
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 border-l-4 border-rose-500 pl-3">
                <Activity className="text-rose-400" /> 第一部分：声学基础概念 (The Science)
              </h3>
              <div className="prose prose-invert max-w-none space-y-6">
                  <p>人声乐器遵循 <strong>“源-滤大器理论” (Source-Filter Theory)</strong>。理解这一点是科学发声的第一步。</p>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-slate-950/50 p-5 rounded-xl border border-slate-800">
                          <h4 className="font-bold text-indigo-300 mb-2 text-lg">1. 声源 (Source)：声带</h4>
                          <ul className="list-disc pl-4 space-y-2 text-sm text-slate-400">
                              <li><strong>基频 (F0)</strong>：即“音高”。声带每秒振动的次数。对应界面下方的 <code>PITCH</code> 滑块。</li>
                              <li><strong>泛音 (Harmonics)</strong>：声音的“血肉”。当声带以 440Hz 振动时，它同时也产生 880Hz, 1320Hz 等倍频。对应频谱图中的<strong>粉色竖条</strong>。</li>
                              <li><strong>振幅 (Amplitude)</strong>：即“音量”。对应频谱图的纵轴高度。</li>
                          </ul>
                      </div>
                      
                      <div className="bg-slate-950/50 p-5 rounded-xl border border-slate-800">
                          <h4 className="font-bold text-pink-300 mb-2 text-lg">2. 滤大器 (Filter)：声道</h4>
                          <p className="text-sm text-slate-400 mb-3">声道（咽喉口腔）就像一个扩音器，其形状决定了哪些频率被放大。这些放大的区域叫<strong>共振峰 (Formants)</strong>。</p>
                          <ul className="list-disc pl-4 space-y-2 text-sm text-slate-400">
                              <li><strong>F1 (第一共振峰)</strong>：受<strong>下颌 (Jaw)</strong>控制。嘴张大 = F1 高 (声音宽厚)；嘴闭合 = F1 低 (声音圆暗)。</li>
                              <li><strong>F2 (第二共振峰)</strong>：受<strong>舌头 (Tongue)</strong>控制。舌前伸 = F2 高 (声音明亮 /i/)；舌后缩 = F2 低 (声音深沉 /u/)。</li>
                          </ul>
                      </div>
                  </div>

                  <div className="bg-slate-800/50 p-4 rounded-lg border-l-2 border-amber-400">
                      <h4 className="font-bold text-amber-400 mb-1">关键概念：共振峰调谐 (Formant Tuning)</h4>
                      <p className="text-sm">
                          唱歌不仅仅是发声，而是<strong>让声道形状去“追踪”声带的泛音</strong>。当共振峰 (紫色波峰) 恰好覆盖在一个强力的泛音 (粉色竖条) 上时，音量会瞬间变大，且声带极其省力。这就是“共鸣”的物理本质。
                      </p>
                  </div>
              </div>
           </section>

           <hr className="border-slate-800" />

           {/* Section 2: Operation */}
           <section>
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 border-l-4 border-emerald-500 pl-3">
                 <Cpu className="text-emerald-400" /> 第二部分：软件操作指南
              </h3>
              
              <div className="space-y-6">
                  <div>
                      <h4 className="text-lg font-bold text-white mb-2">模式一：实验室 (Lab Mode)</h4>
                      <p className="mb-2 text-sm">自由探索区。实时观察元音变化与频谱的关系。</p>
                      <ul className="list-disc pl-5 space-y-1 text-slate-400 text-sm">
                          <li><strong>声学地图</strong>：拖动红点。向右=张嘴(F1升高)，向上=舌前伸(F2升高)。</li>
                          <li><strong>频谱仪</strong>：观察粉色竖线(声源)如何被紫色曲线(共鸣)包裹。</li>
                          <li><strong>歌手共振峰</strong>：开启后增强 3000Hz 高频，模拟面罩共鸣/穿透力。</li>
                      </ul>
                  </div>

                  <div>
                      <h4 className="text-lg font-bold text-white mb-2">模式二：架构师 (Architect Mode)</h4>
                      <p className="mb-2 text-sm">声乐教练区。计算解决特定音高难题的策略。</p>
                      <ol className="list-decimal pl-5 space-y-2 text-slate-400 text-sm">
                          <li><strong>选择策略</strong>：左侧选择你想要的音色（如“开放胸声”或“Twang混声”）。</li>
                          <li><strong>设定音高</strong>：拉动滑块到你唱不上去的那个音。</li>
                          <li><strong>读取指令</strong>：右侧面板会告诉你——
                              <ul className="list-disc pl-4 mt-1 text-slate-500">
                                  <li><strong>元音修正</strong>：应该把元音改成什么样（如 /a/ 改 /o/）。</li>
                                  <li><strong>生理动作</strong>：下巴开几指，舌头怎么放。</li>
                              </ul>
                          </li>
                      </ol>
                  </div>
              </div>
           </section>

           <hr className="border-slate-800" />

           {/* Section 3: Application */}
           <section>
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 border-l-4 border-amber-500 pl-3">
                 <Mic2 className="text-amber-400" /> 第三部分：声乐实战策略
              </h3>
              
              <div className="grid gap-6">
                  {/* Strategy 1 */}
                  <div className="bg-slate-950/30 p-5 rounded-xl border border-slate-800">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-lg font-bold text-indigo-300">1. 解决“换声点” (Bridging / Mixing)</h4>
                        <span className="text-xs font-mono bg-indigo-900/50 text-indigo-200 px-2 py-1 rounded">推荐策略: Twang Mix</span>
                      </div>
                      <p className="text-sm text-slate-400 mb-3">
                          <strong>问题：</strong> 音高上升时，如果保持真声状态(F1追H2)，会遇到生理极限而破音。<br/>
                          <strong>原理：</strong> 混声的本质是<strong>切换共振峰的追踪对象</strong>。让 F1 放弃 H2，掉下来去追踪 H1 (基频)。
                      </p>
                      <div className="bg-slate-800 p-3 rounded text-sm text-slate-300">
                          <strong>练习：</strong> 在 Architect 模式选 <code>Twang Mix</code>。当音高超过 G4(男)/C5(女) 时，软件会指示你<strong>“收小下巴，元音窄化”</strong> (如 /a/ 变 /o/)。照做即可平滑换声。
                      </div>
                  </div>

                  {/* Strategy 2 */}
                  <div className="bg-slate-950/30 p-5 rounded-xl border border-slate-800">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-lg font-bold text-rose-300">2. 强力真声 / 呐喊 (Belting)</h4>
                        <span className="text-xs font-mono bg-rose-900/50 text-rose-200 px-2 py-1 rounded">推荐策略: Open Chest</span>
                      </div>
                      <p className="text-sm text-slate-400 mb-3">
                          <strong>原理：</strong> 强行提升 F1，紧紧咬住 H2 不放。音越高，嘴巴张得越大，像喇叭一样。
                      </p>
                      <div className="bg-slate-800 p-3 rounded text-sm text-slate-300">
                          <strong>警告：</strong> 这种唱法有物理极限。如果在 Architect 模式看到 <span className="text-rose-400 font-bold">红色警告</span>，说明已达生理极限，必须切换策略，否则损伤声带。
                      </div>
                  </div>

                  {/* Strategy 3 */}
                  <div className="bg-slate-950/30 p-5 rounded-xl border border-slate-800">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-lg font-bold text-amber-300">3. 提升穿透力 (Singer's Ring)</h4>
                        <span className="text-xs font-mono bg-amber-900/50 text-amber-200 px-2 py-1 rounded">功能: Singer's Formant</span>
                      </div>
                      <p className="text-sm text-slate-400 mb-3">
                          <strong>原理：</strong> 在 3000Hz 处聚集能量。生理上通过<strong>收缩会厌漏斗 (Twang)</strong> 实现。<br/>
                      </p>
                      <div className="bg-slate-800 p-3 rounded text-sm text-slate-300">
                          <strong>练习：</strong> 在 Lab 模式开启 <code>Singer's Ring</code>。模仿巫婆笑声 "Nye-Nye" 或鸭子叫，感受声音集中在眉心/面罩的感觉。
                      </div>
                  </div>
              </div>
           </section>

           <div className="text-center text-slate-500 text-xs pt-8">
               <Waves className="inline w-4 h-4 mb-1" /> VocalFormantLab - Visualizing the Art of Voice
           </div>

        </div>
      </div>
    </div>
  );
};
