import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Coins, 
  ExternalLink, 
  Copy, 
  Check, 
  ShieldCheck, 
  UserCheck, 
  Sparkles,
  Zap
} from 'lucide-react';
import { PortfolioSummary, PortfolioHealthScore, OnchainProfile } from '../../types';
import { formatAddress, getBlockscoutUrl } from '../../lib/robinhood-chain';

interface PortfolioMetricsProps {
  portfolio: PortfolioSummary | null;
  healthScore: PortfolioHealthScore | null;
  chainId: number;
  profile: OnchainProfile | null;
  isDemoWallet: boolean;
  onOpenProfileModal: () => void;
  onOpenAssetDetail?: (symbol: string) => void;
}

export const PortfolioMetrics: React.FC<PortfolioMetricsProps> = ({
  portfolio,
  healthScore,
  chainId,
  profile,
  isDemoWallet,
  onOpenProfileModal,
}) => {
  const [copied, setCopied] = useState(false);

  if (!portfolio) return null;

  const handleCopy = () => {
    if (portfolio.walletAddress) {
      navigator.clipboard.writeText(portfolio.walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isPositive = portfolio.change24hAmount >= 0;

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Your Onchain Portfolio
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#ADF802]/10 text-[#ADF802] border border-[#ADF802]/20 flex items-center gap-1 uppercase tracking-wider">
              <Zap className="w-3 h-3 text-[#ADF802]" />
              Robinhood Chain
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time tokenized equity positions with 24/7 blockchain settlement.
          </p>
        </div>

        {/* Connected Profile or Register CTA */}
        <div className="flex items-center gap-2">
          {profile?.exists ? (
            <button
              onClick={onOpenProfileModal}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass-panel text-[#ADF802] hover:border-white/30 text-xs transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5 text-[#ADF802]" />
              <span className="font-semibold">{profile.profileName}</span>
              <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
                ({formatAddress(portfolio.walletAddress)})
              </span>
            </button>
          ) : (
            <button
              onClick={onOpenProfileModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-panel text-slate-300 hover:text-[#ADF802] hover:border-white/30 text-xs font-medium transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#5E5CE6]" />
              <span>Register Onchain Profile</span>
            </button>
          )}

          <a
            href={getBlockscoutUrl(portfolio.walletAddress, chainId, 'address')}
            target="_blank"
            rel="noopener noreferrer"
            title="Open Address on Robinhood Chain Blockscout"
            className="p-1.5 rounded-lg glass-panel text-slate-400 hover:text-white transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Main KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Portfolio Value */}
        <div className="glass-panel rounded-xl p-5 relative overflow-hidden group hover:border-white/20 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="uppercase font-bold tracking-wider text-[10px] text-slate-500">Total Portfolio Value</span>
            <Coins className="w-4 h-4 text-[#ADF802]" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-white stat-value">
              ${(portfolio.totalValue ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="mt-2 text-xs flex items-center gap-1.5 font-medium font-mono">
            <span className={`flex items-center ${isPositive ? 'text-[#ADF802]' : 'text-[#FF453A]'}`}>
              {isPositive ? <TrendingUp className="w-3.5 h-3.5 mr-1" /> : <TrendingDown className="w-3.5 h-3.5 mr-1" />}
              {isPositive ? '+' : ''}${Math.abs(portfolio.change24hAmount ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} ({isPositive ? '+' : ''}{(portfolio.change24hPercent ?? 0).toFixed(2)}%)
            </span>
            <span className="text-slate-500 text-[10px]">24H</span>
          </div>
        </div>

        {/* Card 2: 24H Performance */}
        <div className="glass-panel rounded-xl p-5 hover:border-white/20 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="uppercase font-bold tracking-wider text-[10px] text-slate-500">24H Net Movement</span>
            <TrendingUp className="w-4 h-4 text-[#5E5CE6]" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-bold font-mono tracking-tight stat-value ${isPositive ? 'text-[#ADF802]' : 'text-[#FF453A]'}`}>
              {isPositive ? '+' : '-'}${Math.abs(portfolio.change24hAmount ?? 0).toFixed(2)}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center justify-between font-mono">
            <span className="font-sans text-slate-500">Daily Delta</span>
            <span className={isPositive ? 'text-[#ADF802] font-semibold' : 'text-[#FF453A] font-semibold'}>
              {(portfolio.change24hPercent ?? 0) >= 0 ? '+' : ''}{(portfolio.change24hPercent ?? 0).toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Card 3: Asset Count & Holdings */}
        <div className="glass-panel rounded-xl p-5 hover:border-white/20 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="uppercase font-bold tracking-wider text-[10px] text-slate-500">Stock Token Holdings</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 font-mono text-slate-400 border border-white/5">ERC-20</span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-white stat-value">
              {portfolio.assetCount ?? 0}
            </span>
            <span className="text-xs text-slate-500">Positions</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
            <span className="text-slate-500">Top Position</span>
            <span className="font-mono text-slate-200 font-semibold">
              {portfolio.topHolding ? `${portfolio.topHolding.token?.symbol} (${portfolio.topHolding.allocationPercentage ?? 0}%)` : 'None'}
            </span>
          </div>
        </div>

        {/* Card 4: Wallet & Health */}
        <div className="glass-panel rounded-xl p-5 hover:border-white/20 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="uppercase font-bold tracking-wider text-[10px] text-slate-500">Health Score</span>
            <ShieldCheck className="w-4 h-4 text-[#ADF802]" />
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-[#ADF802] stat-value">
              {healthScore ? `${healthScore.score}` : '--'}<span className="text-sm font-normal text-slate-500">/100</span>
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
              healthScore?.rating === 'Optimal' || healthScore?.rating === 'Balanced'
                ? 'bg-[#ADF802]/10 text-[#ADF802] border border-[#ADF802]/20'
                : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
            }`}>
              {healthScore?.rating || 'CALCULATING'}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
            <span className="text-slate-500">ETH Gas Reserve</span>
            <span className="font-mono text-slate-200 font-semibold">{(portfolio?.ethBalance ?? 0).toFixed(3)} ETH</span>
          </div>
        </div>

      </div>

      {/* Wallet Bar with Copy & Explorer */}
      <div className="px-4 py-2.5 rounded-xl glass-panel flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Wallet className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-500 font-medium">Wallet:</span>
          <span className="font-mono text-slate-200 font-medium">{portfolio.walletAddress}</span>
          <button
            onClick={handleCopy}
            title="Copy Wallet Address"
            className="p-1 text-slate-400 hover:text-white hover:bg-white/5 rounded transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#ADF802]" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className="flex items-center gap-4 text-slate-400">
          <span>ETH Gas: <strong className="text-slate-200 font-mono">{portfolio?.ethBalance ?? 0} ETH</strong> (~${portfolio?.ethBalanceUsd ?? 0})</span>
          {isDemoWallet && (
            <span className="px-2 py-0.5 rounded bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono">
              PREVIEW DATA
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
