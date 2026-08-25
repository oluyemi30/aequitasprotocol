import React, { useState } from 'react';
import { PortfolioSummary, StructuredStrategy } from '../../types';
import { calculateRebalance } from '../../lib/strategy';
import { RefreshCw, Scale, ArrowRight, ArrowUpRight, ArrowDownRight, CheckCircle2, Shield, Play } from 'lucide-react';
import { ROBINHOOD_NETWORKS } from '../../lib/robinhood-chain';

interface Props {
  portfolio: PortfolioSummary | null;
  activeStrategy: StructuredStrategy;
  onApplyRebalanceAsStrategy: (strategy: StructuredStrategy) => void;
  chainId: number;
}

export const RebalanceWorkspace: React.FC<Props> = ({
  portfolio,
  activeStrategy,
  onApplyRebalanceAsStrategy,
  chainId,
}) => {
  const [targetCapPercent, setTargetCapPercent] = useState<number>(35);
  const rebalanceData = calculateRebalance(portfolio, activeStrategy);
  const network = ROBINHOOD_NETWORKS[chainId] || ROBINHOOD_NETWORKS[46630];

  const handleApply = () => {
    // Generate normalized rebalance target strategy
    const totalVal = (portfolio?.totalValue && portfolio.totalValue > 0) ? portfolio.totalValue : 1000;
    const rebalancedStrategy: StructuredStrategy = {
      ...activeStrategy,
      id: `rebal-${Date.now()}`,
      title: `Portfolio Rebalance (Cap ${targetCapPercent}%)`,
      objective: `Rebalance wallet holdings on Robinhood Chain to maintain strict ${targetCapPercent}% maximum single asset cap.`,
      strategyType: 'rebalance',
      capital: totalVal,
      maxSingleAssetAllocationPercent: targetCapPercent,
      isAiGenerated: false,
      aiRationale: `Calculated from live wallet balances to eliminate overweight concentration while generating ${rebalanceData.rebalanceTransactionsCount} rebalancing swaps.`,
    };

    onApplyRebalanceAsStrategy(rebalancedStrategy);
  };

  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-7 border border-white/10 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">Portfolio Rebalancer</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Compare active wallet holdings with target constraints to calculate exact buy/sell deltas on Robinhood Chain.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.02] border border-white/10 text-xs text-slate-300">
            <span className="text-slate-500">Max Asset Cap:</span>
            <input
              type="number"
              min={10}
              max={60}
              value={targetCapPercent}
              onChange={(e) => setTargetCapPercent(Number(e.target.value))}
              className="w-12 bg-black/50 border border-white/10 rounded px-1.5 py-0.5 text-center text-xs font-mono text-white"
            />
            <span>%</span>
          </div>

          <button
            type="button"
            onClick={handleApply}
            className="px-4 py-2 rounded-xl bg-[#ADF802] hover:bg-[#9ee002] text-black text-xs font-bold transition-all shadow-lg shadow-[#ADF802]/15 flex items-center gap-1.5 cursor-pointer"
          >
            <span>Generate Rebalance Strategy</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Summary Delta Strips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-[#090909] border border-white/10 text-xs font-mono">
        <div>
          <span className="text-slate-500 block text-[11px]">Total Portfolio Value:</span>
          <span className="text-base font-bold text-white">${portfolio.totalValue.toLocaleString()}</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[11px]">Total to Trim (Sell):</span>
          <span className="text-base font-bold text-rose-400">${rebalanceData.totalToSellUsd.toFixed(2)}</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[11px]">Total to Re-allocate (Buy):</span>
          <span className="text-base font-bold text-emerald-400">${rebalanceData.totalToBuyUsd.toFixed(2)}</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[11px]">Required Swaps:</span>
          <span className="text-base font-bold text-cyan-400">{rebalanceData.rebalanceTransactionsCount} Trades</span>
        </div>
      </div>

      {/* Rebalance Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-slate-500 font-mono">
              <th className="pb-3 font-semibold">Asset</th>
              <th className="pb-3 font-semibold text-right">Current Weight</th>
              <th className="pb-3 font-semibold text-right">Target Weight</th>
              <th className="pb-3 font-semibold text-right">Weight Delta</th>
              <th className="pb-3 font-semibold text-right">USD Delta</th>
              <th className="pb-3 font-semibold text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-mono">
            {rebalanceData.diffs.map((diff) => (
              <tr key={diff.symbol} className="hover:bg-white/[0.02] transition-colors">
                <td className="py-3 font-bold text-white flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-white/5 flex items-center justify-center text-[10px]">
                    {diff.symbol.slice(0, 2)}
                  </div>
                  <div>
                    <span className="block text-white">{diff.symbol}</span>
                    <span className="text-[10px] text-slate-400 font-normal">{diff.name}</span>
                  </div>
                </td>

                <td className="py-3 text-right text-slate-300">
                  {diff.currentAllocationPercent.toFixed(1)}%
                  <span className="text-[10px] text-slate-500 block">(${diff.currentValueUsd.toFixed(2)})</span>
                </td>

                <td className="py-3 text-right text-white font-bold">
                  {diff.targetAllocationPercent.toFixed(1)}%
                  <span className="text-[10px] text-slate-400 block">(${diff.targetValueUsd.toFixed(2)})</span>
                </td>

                <td
                  className={`py-3 text-right font-bold ${
                    diff.diffAllocationPercent > 0
                      ? 'text-emerald-400'
                      : diff.diffAllocationPercent < 0
                      ? 'text-rose-400'
                      : 'text-slate-400'
                  }`}
                >
                  {diff.diffAllocationPercent > 0 ? '+' : ''}
                  {diff.diffAllocationPercent.toFixed(1)}%
                </td>

                <td
                  className={`py-3 text-right font-bold ${
                    diff.diffValueUsd > 0
                      ? 'text-emerald-400'
                      : diff.diffValueUsd < 0
                      ? 'text-rose-400'
                      : 'text-slate-400'
                  }`}
                >
                  {diff.diffValueUsd > 0 ? '+' : ''}
                  ${diff.diffValueUsd.toFixed(2)}
                </td>

                <td className="py-3 text-center">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                      diff.action === 'BUY'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : diff.action === 'SELL'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-white/5 text-slate-400'
                    }`}
                  >
                    {diff.action}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Safety Notice */}
      <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 flex items-center gap-2 text-xs text-slate-400">
        <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>
          Rebalance calculations do NOT trigger automated transactions. You must review the transaction plan and approve each swap individually.
        </span>
      </div>
    </div>
  );
};
