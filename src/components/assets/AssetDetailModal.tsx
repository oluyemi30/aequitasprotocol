import React, { useState } from 'react';
import { 
  X, 
  ExternalLink, 
  Copy, 
  Check, 
  TrendingUp, 
  TrendingDown, 
  Layers, 
  ShieldCheck, 
  Coins, 
  Building2, 
  BarChart3, 
  Zap,
  Globe
} from 'lucide-react';
import { RobinhoodStockToken, Holding } from '../../types';
import { formatAddress, getBlockscoutUrl } from '../../lib/robinhood-chain';

interface AssetDetailModalProps {
  token: RobinhoodStockToken | null;
  holding?: Holding | null;
  chainId: number;
  onClose: () => void;
}

export const AssetDetailModal: React.FC<AssetDetailModalProps> = ({
  token,
  holding,
  chainId,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!token) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(token.contractAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isPositive = (holding?.change24hPercent ?? token.change24hPercent ?? 0) >= 0;
  const currentPrice = holding?.price ?? token.price ?? 0;
  const changePercent = holding?.change24hPercent ?? token.change24hPercent ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-[#050505] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between glass-panel">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-bold text-sm text-white shadow-md">
              {token.symbol.substring(0, 3)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">{token.name}</h2>
                <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-white/10 text-white">
                  {token.symbol}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#ADF802]/10 text-[#ADF802] border border-[#ADF802]/20 font-mono font-bold">
                  ERC-20
                </span>
              </div>
              <p className="text-xs text-slate-400">{token.sector} • {token.industry}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* Price & 24H Highlight */}
          <div className="p-4 rounded-xl glass-panel border border-white/10 flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Live Token Price</div>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white mt-0.5 stat-value">
                ${(currentPrice ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">24H Movement</div>
              <div className={`text-lg font-bold font-mono mt-0.5 flex items-center justify-end stat-value ${isPositive ? 'text-[#ADF802]' : 'text-[#FF453A]'}`}>
                {isPositive ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                {isPositive ? '+' : ''}{(changePercent ?? 0).toFixed(2)}%
              </div>
            </div>
          </div>

          {/* User's Position in Wallet (if holding) */}
          {holding ? (
            <div className="p-4 rounded-xl bg-[#ADF802]/5 border border-[#ADF802]/20">
              <div className="text-xs font-bold text-[#ADF802] uppercase tracking-wider mb-2 flex items-center gap-1.5 font-mono">
                <Coins className="w-4 h-4" />
                Your Position in Connected Wallet
              </div>
              <div className="grid grid-cols-3 gap-3 font-mono text-xs">
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase font-bold">Tokens Held</span>
                  <span className="text-white font-bold text-sm stat-value">{holding.balanceFormatted}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase font-bold">Current USD Value</span>
                  <span className="text-white font-bold text-sm stat-value">${(holding.value ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] text-slate-500 uppercase font-bold">Portfolio Alloc</span>
                  <span className="text-[#ADF802] font-bold text-sm stat-value">{holding.allocationPercentage ?? 0}%</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl glass-panel text-xs text-slate-400 text-center">
              You do not currently hold this stock token in your connected wallet.
            </div>
          )}

          {/* Key Fundamental Metrics */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2.5">
              Fundamental & Market Metrics
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
              <div className="p-3 rounded-lg glass-panel">
                <span className="block text-[10px] text-slate-500 uppercase font-bold">Market Cap</span>
                <span className="text-slate-200 font-semibold stat-value">{token.marketCap || '$2.8T'}</span>
              </div>
              <div className="p-3 rounded-lg glass-panel">
                <span className="block text-[10px] text-slate-500 uppercase font-bold">P/E Ratio</span>
                <span className="text-slate-200 font-semibold stat-value">{token.peRatio ? `${token.peRatio}x` : 'N/A'}</span>
              </div>
              <div className="p-3 rounded-lg glass-panel">
                <span className="block text-[10px] text-slate-500 uppercase font-bold">Dividend Yield</span>
                <span className="text-slate-200 font-semibold stat-value">{token.dividendYield ? `${token.dividendYield}%` : '0.00%'}</span>
              </div>
              <div className="p-3 rounded-lg glass-panel">
                <span className="block text-[10px] text-slate-500 uppercase font-bold">Beta Volatility</span>
                <span className="text-slate-200 font-semibold stat-value">{token.beta ? `${token.beta}x` : '1.15x'}</span>
              </div>
            </div>
          </div>

          {/* Onchain Contract Details & Blockscout Link */}
          <div className="p-4 rounded-xl glass-panel border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Robinhood Chain Contract
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 font-mono text-slate-400">
                Decimals: {token.decimals}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-black/40 border border-white/10 text-xs font-mono text-slate-300 break-all select-all">
              <span>{token.contractAddress}</span>
              <button
                onClick={handleCopy}
                title="Copy Address"
                className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
              >
                {copied ? <Check className="w-4 h-4 text-[#ADF802]" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1 font-mono">
              <span>Block Explorer:</span>
              <a
                href={getBlockscoutUrl(token.contractAddress, chainId, 'address')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[#ADF802] hover:underline font-semibold"
              >
                <span>View on Robinhood Blockscout</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Description */}
          {token.description && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Asset Overview
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {token.description}
              </p>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 glass-panel flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
