import React from 'react';
import { StructuredStrategy } from '../../types';
import { TrendingUp, RefreshCw, AlertCircle, ArrowUpRight, ArrowDownRight, Sliders } from 'lucide-react';

interface Props {
  strategy: StructuredStrategy;
  simulatedShocks: Record<string, number>;
  onSetAssetShock: (symbol: string, percent: number) => void;
  onResetShocks: () => void;
  simulatedPortfolio: {
    originalCapital: number;
    simulatedCapital: number;
    deltaUsd: number;
    deltaPercent: number;
    simulatedAssets: Array<any>;
    hasShocks: boolean;
  };
}

const QUICK_SHOCKS = [-20, -10, -5, 5, 10, 20];

export const StrategySimulatorCard: React.FC<Props> = ({
  strategy,
  simulatedShocks,
  onSetAssetShock,
  onResetShocks,
  simulatedPortfolio,
}) => {
  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-7 border border-white/10 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">Strategy Simulator</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Simulate market price shocks across individual stock tokens to calculate exact portfolio sensitivity.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {simulatedPortfolio.hasShocks && (
            <button
              type="button"
              onClick={onResetShocks}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 font-medium transition-all flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Shocks</span>
            </button>
          )}
          <span className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-300 text-[11px] font-mono border border-amber-500/20">
            Hypothetical Model
          </span>
        </div>
      </div>

      {/* Portfolio Impact Banner (Current vs Simulated) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-[#090909] border border-white/10">
        <div className="space-y-1">
          <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
            Base Capital
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-white">
            ${simulatedPortfolio.originalCapital.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
            Simulated Portfolio Value
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-white">
            ${simulatedPortfolio.simulatedCapital.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
            Net Change (Delta)
          </div>
          <div
            className={`text-lg sm:text-xl font-bold font-mono flex items-center gap-1.5 ${
              simulatedPortfolio.deltaUsd > 0
                ? 'text-emerald-400'
                : simulatedPortfolio.deltaUsd < 0
                ? 'text-rose-400'
                : 'text-slate-300'
            }`}
          >
            {simulatedPortfolio.deltaUsd > 0 ? (
              <ArrowUpRight className="w-5 h-5" />
            ) : simulatedPortfolio.deltaUsd < 0 ? (
              <ArrowDownRight className="w-5 h-5" />
            ) : null}
            <span>
              {simulatedPortfolio.deltaUsd >= 0 ? '+' : ''}
              ${simulatedPortfolio.deltaUsd.toFixed(2)} ({simulatedPortfolio.deltaPercent >= 0 ? '+' : ''}
              {simulatedPortfolio.deltaPercent.toFixed(2)}%)
            </span>
          </div>
        </div>
      </div>

      {/* Individual Asset Sliders and Quick-Shock Buttons */}
      <div className="space-y-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-slate-400" />
          <span>Simulate Individual Asset Movements:</span>
        </div>

        <div className="space-y-3">
          {simulatedPortfolio.simulatedAssets.map((asset) => {
            const currentShock = simulatedShocks[asset.symbol] || 0;
            return (
              <div
                key={asset.symbol}
                className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white font-mono">{asset.symbol}</span>
                    <span className="text-xs text-slate-400">({asset.allocationPercent}% weight)</span>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="text-slate-400">
                      Base: ${asset.originalValue.toFixed(2)} →{' '}
                      <span className="text-white font-bold">${asset.newValue.toFixed(2)}</span>
                    </span>
                    <span
                      className={`font-bold ${
                        currentShock > 0 ? 'text-emerald-400' : currentShock < 0 ? 'text-rose-400' : 'text-slate-400'
                      }`}
                    >
                      {currentShock > 0 ? '+' : ''}
                      {currentShock}%
                    </span>
                  </div>
                </div>

                {/* Quick shock buttons */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-slate-500 mr-1">Quick:</span>
                  {QUICK_SHOCKS.map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => onSetAssetShock(asset.symbol, pct)}
                      className={`px-2 py-1 rounded text-[11px] font-mono transition-all cursor-pointer ${
                        currentShock === pct
                          ? pct > 0
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold'
                          : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 border border-white/5'
                      }`}
                    >
                      {pct > 0 ? `+${pct}%` : `${pct}%`}
                    </button>
                  ))}
                  {currentShock !== 0 && (
                    <button
                      type="button"
                      onClick={() => onSetAssetShock(asset.symbol, 0)}
                      className="px-2 py-1 rounded text-[11px] font-mono bg-white/5 hover:bg-white/10 text-slate-500 hover:text-slate-300 ml-auto cursor-pointer"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mandatory Disclaimer */}
      <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center gap-2 text-[11px] text-slate-500">
        <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span>
          Simulations are mathematical hypotheticals based on spot valuations on Robinhood Chain. They do not constitute investment advice or guarantees of onchain yield.
        </span>
      </div>
    </div>
  );
};
