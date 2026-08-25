import React from 'react';
import { Sparkles, ArrowRight, Sliders, DollarSign, Shield, Zap } from 'lucide-react';
import { STRATEGY_PRESETS } from '../../lib/strategy';

interface Props {
  promptInput: string;
  setPromptInput: (val: string) => void;
  capitalInput: number;
  setCapitalInput: (val: number) => void;
  maxConstraintInput: number;
  setMaxConstraintInput: (val: number) => void;
  isGenerating: boolean;
  onGenerate: (prompt: string, capital?: number, maxCap?: number) => void;
  onApplyPreset: (presetId: string) => void;
}

export const StrategyPromptInput: React.FC<Props> = ({
  promptInput,
  setPromptInput,
  capitalInput,
  setCapitalInput,
  maxConstraintInput,
  setMaxConstraintInput,
  isGenerating,
  onGenerate,
  onApplyPreset,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim() || isGenerating) return;
    onGenerate(promptInput, capitalInput, maxConstraintInput);
  };

  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-7 border border-white/10 shadow-2xl relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-[#ADF802]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-5">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#ADF802]/10 border border-[#ADF802]/20 flex items-center justify-center text-[#ADF802]">
                <Sparkles className="w-4 h-4" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Aequitas Strategy Synthesizer
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Describe your portfolio objective in natural language. The AI will convert it into a mathematically validated onchain strategy.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ADF802]/10 border border-[#ADF802]/20 text-[11px] font-medium text-[#ADF802]">
              <Zap className="w-3 h-3" />
              <span>Robinhood Chain Verified</span>
            </span>
          </div>
        </div>

        {/* Prompt Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <textarea
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              placeholder="e.g. I have $1,000. Build me a diversified AI-stock portfolio with NVDA, MSFT, and GOOGL. No single asset should be more than 30%."
              rows={3}
              className="w-full bg-[#080808]/90 border border-white/10 focus:border-[#ADF802]/50 focus:ring-1 focus:ring-[#ADF802]/40 rounded-xl p-4 text-sm sm:text-base text-slate-100 placeholder:text-slate-500 transition-all resize-none shadow-inner"
            />
          </div>

          {/* Parameters row (Capital & Constraint) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <DollarSign className="w-4 h-4 text-[#ADF802]" />
                <span>Strategy Capital:</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-slate-400">$</span>
                <input
                  type="number"
                  min={50}
                  step={50}
                  value={capitalInput}
                  onChange={(e) => setCapitalInput(Math.max(50, Number(e.target.value)))}
                  className="w-24 bg-black/50 border border-white/10 rounded-lg px-2.5 py-1 text-right text-xs font-mono text-white focus:border-[#ADF802]/50"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Shield className="w-4 h-4 text-cyan-400" />
                <span>Max Asset Cap:</span>
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={10}
                  max={100}
                  step={5}
                  value={maxConstraintInput}
                  onChange={(e) => setMaxConstraintInput(Math.min(100, Math.max(10, Number(e.target.value))))}
                  className="w-16 bg-black/50 border border-white/10 rounded-lg px-2.5 py-1 text-right text-xs font-mono text-white focus:border-[#ADF802]/50"
                />
                <span className="text-xs text-slate-400">%</span>
              </div>
            </div>

            <div className="sm:col-span-2 lg:col-span-1">
              <button
                type="submit"
                disabled={isGenerating || !promptInput.trim()}
                className="w-full h-full min-h-[44px] py-2.5 px-5 rounded-xl bg-[#ADF802] hover:bg-[#9ee002] disabled:opacity-50 text-black font-bold text-xs sm:text-sm tracking-wide transition-all shadow-lg shadow-[#ADF802]/15 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    <span>Synthesizing Strategy...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Strategy</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Strategy Presets */}
        <div className="pt-2 border-t border-white/5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            <span>Preset Strategy Templates:</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {STRATEGY_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => onApplyPreset(preset.id)}
                className="px-3 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-white/20 text-xs text-slate-300 transition-all flex items-center gap-1.5 group text-left"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#ADF802]/70 group-hover:scale-125 transition-transform" />
                <span className="font-medium">{preset.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
