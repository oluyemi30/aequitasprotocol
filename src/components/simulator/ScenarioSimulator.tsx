import React, { useState, useMemo } from 'react';
import { 
  Sliders, 
  RotateCcw, 
  TrendingDown, 
  TrendingUp, 
  Zap, 
  ArrowRight, 
  Info,
  Layers,
  Sparkles
} from 'lucide-react';
import { PortfolioSummary, SimulatedAssetChange } from '../../types';
import { simulateMarketScenario } from '../../lib/portfolio';

interface ScenarioSimulatorProps {
  portfolio: PortfolioSummary | null;
}

export const ScenarioSimulator: React.FC<ScenarioSimulatorProps> = ({ portfolio }) => {
  // Map of symbol -> percentage change (e.g. { 'NVDA': -10, 'AAPL': 5 })
  const [adjustments, setAdjustments] = useState<Record<string, number>>({});

  const changesArray = useMemo<SimulatedAssetChange[]>(() => {
    return Object.entries(adjustments).map(([symbol, percentChange]) => ({
      symbol,
      percentChange,
    }));
  }, [adjustments]);

  const simulation = useMemo(() => {
    if (!portfolio || portfolio.holdings.length === 0) return null;
    return simulateMarketScenario(portfolio, changesArray);
  }, [portfolio, changesArray]);

  if (!portfolio || portfolio.holdings.length === 0) {
    return (
      <div className="p-8 text-center rounded-2xl bg-zinc-900/80 border border-zinc-800 text-zinc-400">
        Connect a wallet with Robinhood Stock Tokens or use Demo Mode to run scenario simulations.
      </div>
    );
  }

  const handleSliderChange = (symbol: string, val: number) => {
    setAdjustments((prev) => {
      if (val === 0) {
        const next = { ...prev };
        delete next[symbol];
        return next;
      }
      return { ...prev, [symbol]: val };
    });
  };

  const handleReset = () => {
    setAdjustments({});
  };

  // Presets
  const applyPreset = (type: 'tech_pullback' | 'ai_rally' | 'market_dip') => {
    const newAdj: Record<string, number> = {};
    if (type === 'tech_pullback') {
      portfolio.holdings.forEach(h => {
        if (h.token.sector === 'Technology') newAdj[h.token.symbol] = -10;
        else newAdj[h.token.symbol] = -2;
      });
    } else if (type === 'ai_rally') {
      portfolio.holdings.forEach(h => {
        if (['NVDA', 'MSFT', 'GOOGL', 'AAPL'].includes(h.token.symbol)) newAdj[h.token.symbol] = 15;
        else newAdj[h.token.symbol] = 3;
      });
    } else if (type === 'market_dip') {
      portfolio.holdings.forEach(h => {
        newAdj[h.token.symbol] = -5;
      });
    }
    setAdjustments(newAdj);
  };

  const isDeltaPositive = (simulation?.deltaAmount ?? 0) >= 0;

  return (
    <div className="glass-panel rounded-xl p-5 border border-white/10 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#FFB800]" />
            <h2 className="text-base font-bold text-white tracking-tight">Scenario Simulator</h2>
            <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/20">
              Client Engine
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Simulate price shocks across multiple Robinhood Stock Tokens to test stress resilience.
          </p>
        </div>

        {/* Preset Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => applyPreset('tech_pullback')}
            className="px-2.5 py-1 rounded-lg glass-panel hover:border-rose-500/40 text-[11px] text-slate-300 hover:text-rose-300 transition-colors"
          >
            Tech Pullback (-10%)
          </button>
          <button
            onClick={() => applyPreset('ai_rally')}
            className="px-2.5 py-1 rounded-lg glass-panel hover:border-[#ADF802]/40 text-[11px] text-slate-300 hover:text-[#ADF802] transition-colors"
          >
            AI Surge (+15%)
          </button>
          <button
            onClick={() => applyPreset('market_dip')}
            className="px-2.5 py-1 rounded-lg glass-panel hover:border-amber-500/40 text-[11px] text-slate-300 hover:text-amber-300 transition-colors"
          >
            Market Dip (-5%)
          </button>
          {Object.keys(adjustments).length > 0 && (
            <button
              onClick={handleReset}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] text-white flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* KPI Impact Banner */}
      {simulation && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl glass-panel">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Current Value</div>
            <div className="text-lg font-bold font-mono text-slate-300 mt-0.5 stat-value">
              ${(simulation.originalTotalValue ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Simulated Value</div>
            <div className="text-lg font-bold font-mono text-white mt-0.5 stat-value">
              ${(simulation.simulatedTotalValue ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Portfolio Impact ($)</div>
            <div className={`text-lg font-bold font-mono mt-0.5 flex items-center stat-value ${isDeltaPositive ? 'text-[#ADF802]' : 'text-[#FF453A]'}`}>
              {isDeltaPositive ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
              {isDeltaPositive ? '+' : ''}${Math.abs(simulation.deltaAmount ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Portfolio Change (%)</div>
            <div className={`text-lg font-bold font-mono mt-0.5 stat-value ${isDeltaPositive ? 'text-[#ADF802]' : 'text-[#FF453A]'}`}>
              {isDeltaPositive ? '+' : ''}{(simulation.deltaPercent ?? 0).toFixed(2)}%
            </div>
          </div>
        </div>
      )}

      {/* Interactive Asset Sliders List */}
      <div className="space-y-4">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Adjust Token Price Movements (+/- %)
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {portfolio.holdings.map((h) => {
            const currentShift = adjustments[h.token.symbol] || 0;
            const isShiftPositive = currentShift >= 0;
            const newPrice = Number((h.price * (1 + currentShift / 100)).toFixed(2));
            const deltaVal = (h.value * (currentShift / 100));

            return (
              <div
                key={h.token.symbol}
                className="p-3.5 rounded-xl glass-panel space-y-2.5 hover:border-white/20 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-bold text-xs text-white">
                      {h.token.symbol.substring(0, 3)}
                    </div>
                    <div>
                      <span className="font-bold text-xs text-white">{h.token.symbol}</span>
                      <span className="text-[10px] text-slate-500 ml-1.5 font-mono">{h.allocationPercentage}% alloc</span>
                    </div>
                  </div>

                  <div className="text-right font-mono text-xs">
                    <span className={`font-bold ${currentShift === 0 ? 'text-slate-500' : isShiftPositive ? 'text-[#ADF802]' : 'text-[#FF453A]'}`}>
                      {currentShift > 0 ? '+' : ''}{currentShift}%
                    </span>
                    <div className="text-[10px] text-slate-500">
                      ${h.price.toFixed(2)} → <strong className="text-slate-200">${newPrice.toFixed(2)}</strong>
                    </div>
                  </div>
                </div>

                {/* Range Slider (-50% to +50%) */}
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-slate-500">-50%</span>
                  <input
                    type="range"
                    min="-50"
                    max="50"
                    step="1"
                    value={currentShift}
                    onChange={(e) => handleSliderChange(h.token.symbol, parseInt(e.target.value))}
                    className="flex-1 accent-[#ADF802] h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <span className="text-[10px] font-mono text-slate-500">+50%</span>
                </div>

                {currentShift !== 0 && (
                  <div className="text-[10px] font-mono flex items-center justify-between pt-1 border-t border-white/5 text-slate-400">
                    <span>Position Impact:</span>
                    <span className={deltaVal >= 0 ? 'text-[#ADF802] font-bold' : 'text-[#FF453A] font-bold'}>
                      {deltaVal >= 0 ? '+' : '-'}${Math.abs(deltaVal).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-2 border-t border-white/10">
        <Info className="w-3.5 h-3.5 shrink-0" />
        <span>
          Simulations are computed deterministically in-browser using instantaneous linear valuation multipliers.
        </span>
      </div>

    </div>
  );
};
