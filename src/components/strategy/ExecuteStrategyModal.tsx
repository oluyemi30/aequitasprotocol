import React, { useState } from 'react';
import { StructuredStrategy, StrategyTransactionStep } from '../../types';
import {
  X,
  ShieldCheck,
  AlertTriangle,
  Play,
  CheckCircle2,
  Clock,
  Loader2,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Fuel,
  Network,
} from 'lucide-react';
import { ROBINHOOD_NETWORKS } from '../../lib/robinhood-chain';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  strategy: StructuredStrategy;
  steps: StrategyTransactionStep[];
  isExecuting: boolean;
  onStartExecution: () => void;
  onRetryStep: (index: number) => void;
  summary: {
    totalSteps: number;
    completedSteps: number;
    failedSteps: number;
    currentStepIndex: number;
    isRunning: boolean;
    isComplete: boolean;
    hasErrors: boolean;
  };
  chainId: number;
  isLiveMode: boolean;
  walletAddress: string | null;
}

export const ExecuteStrategyModal: React.FC<Props> = ({
  isOpen,
  onClose,
  strategy,
  steps,
  isExecuting,
  onStartExecution,
  onRetryStep,
  summary,
  chainId,
  isLiveMode,
  walletAddress,
}) => {
  const [hasConfirmedReview, setHasConfirmedReview] = useState<boolean>(false);
  const network = ROBINHOOD_NETWORKS[chainId] || ROBINHOOD_NETWORKS[46630];
  const totalGasEth = steps.reduce((sum, s) => sum + s.estimatedGasEth, 0);

  if (!isOpen) return null;

  const handleStart = () => {
    setHasConfirmedReview(true);
    onStartExecution();
  };

  const handleModalClose = () => {
    if (isExecuting) return; // Prevent close during active wallet signature
    setHasConfirmedReview(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="max-w-2xl w-full glass-panel border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ADF802]/10 border border-[#ADF802]/20 flex items-center justify-center text-[#ADF802]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                {!hasConfirmedReview ? 'Review Before Signing' : 'Transaction Console'}
              </h3>
              <p className="text-xs text-slate-400">
                {isLiveMode ? (
                  <span className="text-[#ADF802] font-medium">LIVE MODE ({network.name})</span>
                ) : (
                  <span className="text-amber-400 font-medium">DEMO SANDBOX MODE</span>
                )}
                {' • '}
                <span>{strategy.title}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleModalClose}
            disabled={isExecuting}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all disabled:opacity-30 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Stage 1: Review Before Signing */}
          {!hasConfirmedReview ? (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-[#090909] border border-white/10 space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Execution Parameters Summary
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
                  <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                    <span className="text-slate-500 block text-[11px]">Total Capital:</span>
                    <span className="text-base font-bold text-white">${strategy.capital.toLocaleString()}</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                    <span className="text-slate-500 block text-[11px]">Transactions:</span>
                    <span className="text-base font-bold text-cyan-400">{steps.length} Steps</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                    <span className="text-slate-500 block text-[11px]">Est. Gas:</span>
                    <span className="text-base font-bold text-[#ADF802]">~{totalGasEth.toFixed(5)} ETH</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                    <span className="text-slate-500 block text-[11px]">Slippage Tolerance:</span>
                    <span className="text-sm font-bold text-white">0.50%</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                    <span className="text-slate-500 block text-[11px]">Target Network:</span>
                    <span className="text-sm font-bold text-white">{network.name}</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                    <span className="text-slate-500 block text-[11px]">Signing Wallet:</span>
                    <span className="text-sm font-bold text-slate-300 truncate block">
                      {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Not Connected'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Assets list preview */}
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Assets To Acquire ({strategy.assets.length}):
                </div>
                <div className="space-y-1.5">
                  {strategy.assets.map((asset) => (
                    <div
                      key={asset.symbol}
                      className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white font-mono">{asset.symbol}</span>
                        <span className="text-slate-400">{asset.name}</span>
                      </div>
                      <div className="text-right font-mono">
                        <span className="text-white font-bold">{asset.allocationPercent}%</span>{' '}
                        <span className="text-[#ADF802]">(${asset.targetAmountUsd.toFixed(2)})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Security Warning Notice */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5 text-xs text-amber-300">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>
                  You will be prompted to sign each transaction sequentially in your wallet. Review gas fees and token amounts before approving each signature.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleModalClose}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 transition-all cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleStart}
                  className="px-6 py-2.5 rounded-xl bg-[#ADF802] hover:bg-[#9ee002] text-black text-xs font-bold transition-all shadow-lg shadow-[#ADF802]/15 flex items-center gap-2 cursor-pointer"
                >
                  <span>Continue to Signatures</span>
                  <Play className="w-3.5 h-3.5 fill-black" />
                </button>
              </div>
            </div>
          ) : (
            /* Stage 2: Live Transaction Console */
            <div className="space-y-4">
              {/* Progress Summary Bar */}
              <div className="p-4 rounded-xl bg-[#090909] border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">Execution Progress</span>
                  <span className="text-sm font-bold text-white font-mono">
                    {summary.completedSteps} of {summary.totalSteps} Completed
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {summary.isComplete ? (
                    <span className="px-3 py-1 rounded-full bg-[#ADF802]/10 text-[#ADF802] border border-[#ADF802]/20 text-xs font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Strategy Executed Successfully</span>
                    </span>
                  ) : summary.hasErrors ? (
                    <span className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Action Required</span>
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-bold flex items-center gap-1.5 animate-pulse">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Executing Sequence...</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Transaction Steps Stream */}
              <div className="space-y-3">
                {steps.map((step, idx) => {
                  const isCurrent = idx === summary.currentStepIndex;
                  return (
                    <div
                      key={step.id}
                      className={`p-4 rounded-xl border transition-all space-y-2.5 ${
                        step.status === 'confirmed'
                          ? 'bg-emerald-950/10 border-[#ADF802]/20'
                          : step.status === 'failed' || step.status === 'rejected'
                          ? 'bg-rose-950/20 border-rose-500/30'
                          : isCurrent
                          ? 'bg-white/[0.04] border-[#ADF802]/40 ring-1 ring-[#ADF802]/20'
                          : 'bg-white/[0.02] border-white/5 opacity-60'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-bold ${
                              step.status === 'confirmed'
                                ? 'bg-[#ADF802]/20 text-[#ADF802]'
                                : step.status === 'failed' || step.status === 'rejected'
                                ? 'bg-rose-500/20 text-rose-400'
                                : isCurrent
                                ? 'bg-[#ADF802]/20 text-[#ADF802]'
                                : 'bg-white/5 text-slate-400'
                            }`}
                          >
                            {step.status === 'confirmed' ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : step.status === 'failed' || step.status === 'rejected' ? (
                              <AlertCircle className="w-4 h-4" />
                            ) : isCurrent ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              step.stepNumber
                            )}
                          </div>

                          <div>
                            <h5 className="font-bold text-sm text-white">{step.title}</h5>
                            <p className="text-xs text-slate-400">{step.description}</p>
                          </div>
                        </div>

                        {/* Status Chip */}
                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          {step.status === 'idle' && (
                            <span className="px-2.5 py-0.5 rounded text-[11px] font-mono text-slate-400 bg-white/5">
                              Pending
                            </span>
                          )}
                          {step.status === 'preparing' && (
                            <span className="px-2.5 py-0.5 rounded text-[11px] font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 animate-pulse">
                              Preparing...
                            </span>
                          )}
                          {step.status === 'awaiting_approval' && (
                            <span className="px-2.5 py-0.5 rounded text-[11px] font-mono text-amber-300 bg-amber-500/10 border border-amber-500/20 flex items-center gap-1 animate-pulse font-bold">
                              <Clock className="w-3 h-3" />
                              <span>Awaiting wallet approval...</span>
                            </span>
                          )}
                          {step.status === 'submitted' && (
                            <span className="px-2.5 py-0.5 rounded text-[11px] font-mono text-cyan-300 bg-cyan-500/10 border border-cyan-500/20">
                              Transaction submitted...
                            </span>
                          )}
                          {step.status === 'confirming' && (
                            <span className="px-2.5 py-0.5 rounded text-[11px] font-mono text-purple-300 bg-purple-500/10 border border-purple-500/20 flex items-center gap-1 animate-pulse">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>Confirming onchain...</span>
                            </span>
                          )}
                          {step.status === 'confirmed' && (
                            <span className="px-2.5 py-0.5 rounded text-[11px] font-mono text-[#ADF802] bg-[#ADF802]/10 border border-[#ADF802]/20 font-bold">
                              Confirmed ✓
                            </span>
                          )}
                          {step.status === 'rejected' && (
                            <span className="px-2.5 py-0.5 rounded text-[11px] font-mono text-rose-400 bg-rose-500/10 border border-rose-500/20 font-bold">
                              Rejected by user
                            </span>
                          )}
                          {step.status === 'failed' && (
                            <span className="px-2.5 py-0.5 rounded text-[11px] font-mono text-rose-400 bg-rose-500/10 border border-rose-500/20 font-bold">
                              Failed ✕
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Error or Blockscout Link */}
                      {step.errorMessage && (
                        <div className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-500/20 text-xs text-rose-300 flex items-center justify-between">
                          <span>{step.errorMessage}</span>
                          <button
                            type="button"
                            onClick={() => onRetryStep(idx)}
                            className="px-2 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-white font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Retry Step</span>
                          </button>
                        </div>
                      )}

                      {step.txHash && step.status === 'confirmed' && (
                        <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs font-mono">
                          <span className="text-slate-400 truncate max-w-[200px]">
                            Hash: {step.txHash}
                          </span>
                          <a
                            href={`${network.explorerUrl}/tx/${step.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#ADF802] hover:underline flex items-center gap-1 font-semibold"
                          >
                            <span>View on Blockscout</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Close Button on completion */}
              {summary.isComplete && (
                <div className="pt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={handleModalClose}
                    className="px-6 py-2.5 rounded-xl bg-[#ADF802] hover:bg-[#9ee002] text-black text-xs font-bold transition-all shadow-lg shadow-[#ADF802]/15 cursor-pointer"
                  >
                    Done & Return to Terminal
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
