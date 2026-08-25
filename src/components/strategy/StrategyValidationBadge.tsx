import React from 'react';
import { StrategyValidationResult } from '../../types';
import { ShieldCheck, AlertCircle, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

interface Props {
  validation: StrategyValidationResult;
}

export const StrategyValidationBadge: React.FC<Props> = ({ validation }) => {
  return (
    <div className="glass-panel rounded-2xl p-5 border border-white/10 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              validation.isValid
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}
          >
            {validation.isValid ? <ShieldCheck className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          </div>
          <div>
            <h4 className="text-sm font-bold text-white tracking-tight">Onchain Constraint & Risk Guard</h4>
            <p className="text-[11px] text-slate-400">
              Pre-flight validation before generating onchain transaction signatures
            </p>
          </div>
        </div>

        <span
          className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono ${
            validation.isValid
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
          }`}
        >
          {validation.isValid ? 'ALL CONSTRAINTS PASSED ✓' : 'VALIDATION BLOCKED ✕'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {validation.rules.map((rule) => (
          <div
            key={rule.id}
            className={`p-3 rounded-xl border text-xs space-y-1 transition-all ${
              rule.passed
                ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-200'
                : 'bg-rose-950/20 border-rose-500/30 text-rose-200'
            }`}
          >
            <div className="flex items-center justify-between font-semibold">
              <span>{rule.label}</span>
              {rule.passed ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              )}
            </div>
            <p className="text-[11px] opacity-80 line-clamp-2 leading-relaxed">
              {rule.message}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
