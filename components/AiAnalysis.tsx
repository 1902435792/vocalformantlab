import React from 'react';
import { Sparkles } from 'lucide-react';

interface Props {
  analysis: string | null;
  onClose: () => void;
}

export const AiAnalysis: React.FC<Props> = ({ analysis, onClose }) => {
  if (!analysis) return null;

  return (
    <div className="mt-6 bg-slate-800/50 border border-indigo-500/30 rounded-2xl p-6 relative animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-2 mb-4 text-indigo-300 font-bold">
        <Sparkles className="w-5 h-5" />
        <h3>Gemini Acoustic Analysis</h3>
      </div>
      
      <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed">
        <div className="whitespace-pre-wrap">{analysis}</div>
      </div>

      <button 
        onClick={onClose}
        className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
      >
        ✕
      </button>
    </div>
  );
};