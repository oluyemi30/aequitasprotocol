import React from 'react';
import { StrategyTransactionStep } from '../../types';
import { FileText, ArrowRight, Fuel, Shield, ExternalLink, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ROBINHOOD_NETWORKS } from '../../lib/robinhood-chain';

interface Props {
  steps: StrategyTransactionStep[];
  chainId: number;
  onExecuteClick: () => void;
  canExecute: boolean;
}

export const TransactionPlanCard: React.FC<Props> = ({
  steps,
  chainId,
  onExecuteClick,
  canExecute,
}) => {
  const network = ROBINHOOD_NETWORKS[chainId] || ROBINHOOD_NETWORKS[46630];
  const totalGasEth = steps.reduce((sum, s) => sum + s.estimatedGasEth, 0);

  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-7 border border-white/10 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">Onchain Transaction Plan</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Exact sequence of verified transactions required to instantiate this stock token strategy on {network.name}.
          </p>
        </div>

        <button
          type="button"
          onClick={onExecuteClick}
          disabled={!canExecute}
          className="px-4 py-2 rounded-xl bg-[#ADF802] hover:bg-[#9ee002] disabled:opacity-50 disabled:cursor-not-allowed text-black text-xs font-bold transition-all shadow-lg shadow-[#ADF802]/15 flex items-center gap-1.5 cursor-pointer"
        >
          <span>Review & Execute ({steps.length} Steps)</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Summary Gas & Protocol Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-[#090909] border border-white/10 text-xs">
        <div>
          <span className="text-slate-500 block text-[11px]">Network:</span>
          <span className="font-semibold text-white font-mono">{network.name}</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[11px]">Total Signatures:</span>
          <span className="font-semibold text-white font-mono">{steps.length} Transactions</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[11px]">Est. Gas Total:</span>
          <span className="font-semibold text-emerald-400 font-mono">~{totalGasEth.toFixed(5)} ETH</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[11px]">Default Slippage:</span>
          <span className="font-semibold text-cyan-400 font-mono">0.50%</span>
        </div>
      </div>

      {/* Steps List */}
      <div className="space-y-3">
        {steps.map((step) => (
          <div
            key={step.id}
            className="p-4 rounded-xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition-all space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-mono text-xs font-bold text-slate-300">
                  {step.stepNumber}
                </div>
                <div>
                  <h5 className="font-bold text-sm text-white">{step.title}</h5>
                  <p className="text-xs text-slate-400 mt-0.5">{step.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-white/5 text-slate-300 border border-white/5">
                  {step.type.replace('_', ' ')}
                </span>
                {step.isRouteAvailable ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Route Verified ✓
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    Quote Unavailable
                  </span>
                )}
              </div>
            </div>

            {/* Transaction Parameters Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2.5 border-t border-white/5 text-[11px] font-mono text-slate-400">
              <div>
                <span className="text-slate-500 block">From / To:</span>
                <span className="text-slate-200">
                  {step.fromAmount} {step.fromTokenSymbol} → {step.toAmount} {step.toTokenSymbol}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block">Protocol / Function:</span>
                <span className="text-slate-200 truncate block" title={step.functionName}>
                  {step.functionName.split('(')[0]}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block">Est. Gas:</span>
                <span className="text-slate-200">~{step.estimatedGasEth.toFixed(5)} ETH</span>
              </div>

              <div>
                <span className="text-slate-500 block">Target Contract:</span>
                <a
                  href={`${network.explorerUrl}/address/${step.contractAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-300 hover:text-white flex items-center gap-1 transition-colors"
                >
                  <span>{step.contractAddress.slice(0, 8)}...</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Security Note */}
      <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 flex items-start gap-2 text-xs text-slate-400">
        <Shield className="w-4 h-4 text-[#ADF802] shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-200">Non-Custodial Guarantee: </span>
          <span>
            Aequitas Protocol will NEVER execute transactions autonomously. Every step above must be explicitly approved and signed in your connected Web3 wallet.
          </span>
        </div>
      </div>
    </div>
  );
};
