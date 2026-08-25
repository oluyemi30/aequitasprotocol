import React from 'react';
import { ShieldCheck, AlertCircle, Info, Activity, Layers, Zap } from 'lucide-react';
import { PortfolioHealthScore } from '../../types';

interface RiskHealthViewProps {
  healthScore: PortfolioHealthScore | null;
}

export const RiskHealthView: React.FC<RiskHealthViewProps> = ({ healthScore }) => {
  if (!healthScore) return null;

  const score = healthScore.score;
  const isOptimal = score >= 75;
  const isModerate = score >= 50 && score < 75;

  const scoreColor = isOptimal ? '#ADF802' : isModerate ? '#FFB800' : '#FF453A';
  const scoreTextClass = isOptimal ? 'text-[#ADF802]' : isModerate ? 'text-amber-400' : 'text-rose-400';

  // Calculate SVG arc stroke-dashoffset (circumference for r=58 is ~364.4)
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="glass-panel rounded-xl p-5 border border-white/10 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#ADF802]" />
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Aequitas Health & Risk Engine
          </h2>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-[#ADF802]/10 text-[#ADF802] border border-[#ADF802]/20 tracking-wider uppercase">
          Deterministic
        </span>
      </div>

      {/* Main Score & Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        
        {/* Radial SVG Gauge */}
        <div className="md:col-span-5 flex flex-col items-center justify-center p-4 rounded-xl glass-panel text-center">
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 130 130">
              <circle
                cx="65"
                cy="65"
                r={radius}
                className="text-slate-800/80 stroke-current"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="65"
                cy="65"
                r={radius}
                stroke={scoreColor}
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-bold font-mono stat-value ${scoreTextClass}`}>
                {score}
              </span>
              <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold font-mono">Score</span>
            </div>
          </div>

          <div className="mt-3">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
              isOptimal 
                ? 'bg-[#ADF802]/10 text-[#ADF802] border-[#ADF802]/30'
                : isModerate 
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                  : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
            }`}>
              {healthScore.rating}
            </span>
          </div>

          <p className="mt-3 text-[11px] text-slate-400 leading-snug">
            {healthScore.summaryText}
          </p>
        </div>

        {/* 4 Factor Progress Bars */}
        <div className="md:col-span-7 space-y-3.5">
          
          {/* 1. Diversification */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1 font-mono">
              <span className="text-slate-300 font-sans font-semibold">Sector Diversification</span>
              <span className="text-white font-bold">{healthScore.diversification}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800/80 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 bg-[#ADF802]"
                style={{ width: `${healthScore.diversification}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Multi-sector coverage across tokenized equities.
            </span>
          </div>

          {/* 2. Concentration (Herfindahl Index) */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1 font-mono">
              <span className="text-slate-300 font-sans font-semibold">Concentration Balance</span>
              <span className="text-white font-bold">{healthScore.concentration}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800/80 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 bg-[#5E5CE6]"
                style={{ width: `${healthScore.concentration}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Lower single-asset dominance increases resilience.
            </span>
          </div>

          {/* 3. Asset Count */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1 font-mono">
              <span className="text-slate-300 font-sans font-semibold">Position Breadth</span>
              <span className="text-white font-bold">{healthScore.assetCountScore}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800/80 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 bg-cyan-400"
                style={{ width: `${healthScore.assetCountScore}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Number of verified stock contracts held onchain.
            </span>
          </div>

          {/* 4. Volatility Exposure */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1 font-mono">
              <span className="text-slate-300 font-sans font-semibold">Beta Volatility Sensitivity</span>
              <span className="text-white font-bold">{healthScore.volatilityExposure}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800/80 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 bg-[#FFB800]"
                style={{ width: `${healthScore.volatilityExposure}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Weighted market sensitivity relative to broader equity indices.
            </span>
          </div>

        </div>

      </div>

      <div className="pt-2 border-t border-white/10 flex items-center gap-1.5 text-[10px] text-slate-500">
        <Info className="w-3.5 h-3.5 shrink-0" />
        <span>
          The Aequitas Health Score is calculated deterministically onchain and does not constitute financial advice.
        </span>
      </div>

    </div>
  );
};
