import React from 'react';
import {
  StructuredStrategy,
  StrategyValidationResult,
  PortfolioSummary,
} from '../../types';
import {
  Layers,
  DollarSign,
  TrendingUp,
  Percent,
  Play,
  FileText,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { ROBINHOOD_NETWORKS } from '../../lib/robinhood-chain';

interface Props {
  strategy: StructuredStrategy;
  validation: StrategyValidationResult;
  portfolio: PortfolioSummary | null;
  chainId: number;
  onSimulateClick: () => void;
  onReviewTransactionsClick: () => void;
  onExecuteClick: () => void;
}

const SECTOR_COLORS: Record<string, string> = {
  Technology: '#38bdf8',
  'Semiconductors & AI': '#ADF802',
  'Communication Services': '#a855f7',
  'Consumer Cyclical': '#f59e0b',
  'Financial Services': '#ec4899',
  'Index ETF': '#6366f1',
};

export const ProposedStrategyCard: React.FC<Props> = ({
  strategy,
  validation,
  portfolio,
  chainId,
  onSimulateClick,
  onReviewTransactionsClick,
  onExecuteClick,
}) => {
  const network = ROBINHOOD_NETWORKS[chainId] || ROBINHOOD_NETWORKS[46630];
  const maxAllocation = Math.max(...strategy.assets.map((a) => a.allocationPercent), 0);
  const estimatedTxCount = strategy.assets.length * 2 + 1;

  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-7 border border-white/10 shadow-2xl space-y-6">
      {/* Header Info */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-[#ADF802]/10 text-[#ADF802] text-[11px] font-bold uppercase tracking-wider border border-[#ADF802]/20">
              {strategy.strategyType.replace('_', ' ')}
            </span>
            <span className="text-xs text-slate-500 font-mono">ID: {strategy.id.slice(0, 12)}</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1.5">
            {strategy.title}
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            {strategy.objective}
          </p>
        </div>

        {/* Action Button Group */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onSimulateClick}
            className="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-semibold text-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
            <span>Simulate Strategy</span>
          </button>

          <button
            type="button"
            onClick={onReviewTransactionsClick}
            className="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-semibold text-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-purple-400" />
            <span>Review Plan ({estimatedTxCount} Txs)</span>
          </button>

          <button
            type="button"
            onClick={onExecuteClick}
            disabled={!validation.canExecute}
            className="px-5 py-2 rounded-xl bg-[#ADF802] hover:bg-[#9ee002] disabled:opacity-50 disabled:cursor-not-allowed text-black text-xs font-bold tracking-wide transition-all shadow-lg shadow-[#ADF802]/15 flex items-center gap-1.5 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-black" />
            <span>Execute Strategy</span>
          </button>
        </div>
      </div>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
          <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span>Target Capital</span>
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-white">
            ${strategy.capital.toLocaleString()}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
          <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
            <Percent className="w-3.5 h-3.5 text-cyan-400" />
            <span>Max Allocation</span>
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-white">
            {maxAllocation}%{' '}
            <span className="text-[11px] text-slate-400 font-normal">
              (Cap: {strategy.maxSingleAssetAllocationPercent}%)
            </span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
          <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span>Total Assets</span>
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-white">
            {strategy.assets.length} <span className="text-[11px] text-slate-400 font-normal">Tokens</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
          <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Estimated Steps</span>
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-white">
            {estimatedTxCount} <span className="text-[11px] text-slate-400 font-normal">Txs</span>
          </div>
        </div>
      </div>

      {/* Proportional Visual Allocation Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-300">Portfolio Weight Distribution</span>
          <span className="font-mono text-emerald-400 text-[11px] font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>100% Total Sum</span>
          </span>
        </div>
        <div className="h-3 rounded-full bg-white/5 overflow-hidden flex p-0.5 border border-white/5 gap-1">
          {strategy.assets.map((asset) => (
            <div
              key={asset.symbol}
              className="h-full rounded-full transition-all relative group"
              style={{
                width: `${asset.allocationPercent}%`,
                backgroundColor: SECTOR_COLORS[asset.sector] || '#ADF802',
              }}
              title={`${asset.symbol}: ${asset.allocationPercent}% ($${asset.targetAmountUsd.toFixed(2)})`}
            />
          ))}
        </div>
      </div>

      {/* Asset Cards Breakdown */}
      <div className="space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Target Token Allocation Breakdown
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {strategy.assets.map((asset) => {
            const tokenPrice = asset.price > 0 ? asset.price : 150;
            const shares = asset.targetAmountUsd / tokenPrice;
            const color = SECTOR_COLORS[asset.sector] || '#ADF802';

            return (
              <div
                key={asset.symbol}
                className="p-4 rounded-xl bg-[#090909] border border-white/10 hover:border-white/20 transition-all space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs tracking-wider border border-white/10"
                      style={{ backgroundColor: `${color}15`, color }}
                    >
                      {asset.symbol}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{asset.symbol}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400">
                          {asset.sector}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 truncate max-w-[180px]">
                        {asset.name}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-base font-bold font-mono text-white">
                      {asset.allocationPercent}%
                    </div>
                    <div className="text-xs text-emerald-400 font-mono">
                      ${asset.targetAmountUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-slate-400 font-mono">
                  <div>
                    <span>Spot: </span>
                    <span className="text-slate-200">${tokenPrice.toFixed(2)}</span>
                  </div>
                  <div>
                    <span>Est. Tokens: </span>
                    <span className="text-slate-200">{shares.toFixed(4)}</span>
                  </div>
                  <div>
                    <a
                      href={`${network.explorerUrl}/address/${asset.contractAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-500 hover:text-white flex items-center gap-1 transition-colors"
                      title="View Verified Contract on Blockscout"
                    >
                      <span>{asset.contractAddress.slice(0, 6)}...</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Rationale & Safety Note */}
      {strategy.aiRationale && (
        <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-2.5 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-300">Synthesis Rationale: </span>
            <span>{strategy.aiRationale}</span>
          </div>
        </div>
      )}
    </div>
  );
};
