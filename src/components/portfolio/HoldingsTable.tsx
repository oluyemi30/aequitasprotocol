import React, { useState } from 'react';
import { 
  ExternalLink, 
  Copy, 
  Check, 
  TrendingUp, 
  TrendingDown, 
  Search, 
  ChevronRight, 
  Sparkles, 
  Layers 
} from 'lucide-react';
import { Holding } from '../../types';
import { formatAddress, getBlockscoutUrl } from '../../lib/robinhood-chain';

interface HoldingsTableProps {
  holdings: Holding[];
  chainId: number;
  onSelectAsset: (symbol: string) => void;
}

export const HoldingsTable: React.FC<HoldingsTableProps> = ({
  holdings,
  chainId,
  onSelectAsset,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const safeHoldings = Array.isArray(holdings) ? holdings : [];

  const handleCopy = (e: React.MouseEvent, address: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const filtered = safeHoldings.filter(h => 
    h.token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.token.sector.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="glass-panel rounded-xl border border-white/10 overflow-hidden">
      {/* Table Header Controls */}
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white tracking-tight">
              Holdings Breakdown
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-white/5 text-slate-400 border border-white/5">
              {safeHoldings.length} Assets
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Verified Robinhood Stock Token contracts on Robinhood Chain.
          </p>
        </div>

        {/* Search filter */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Filter by symbol, name, sector..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#ADF802]/50"
          />
        </div>
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-black/30 border-b border-white/10 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Asset</th>
              <th className="py-3 px-4 text-right">Price</th>
              <th className="py-3 px-4 text-right">Balance</th>
              <th className="py-3 px-4 text-right">Value (USD)</th>
              <th className="py-3 px-4 text-right">Allocation</th>
              <th className="py-3 px-4 text-right">24H Change</th>
              <th className="py-3 px-4 text-center">Contract</th>
              <th className="py-3 px-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-mono">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500 font-sans text-xs">
                  No matching stock tokens found.
                </td>
              </tr>
            ) : (
              filtered.map((holding) => {
                const isPositive = holding.change24hPercent >= 0;
                return (
                  <tr
                    key={holding.token.symbol}
                    onClick={() => onSelectAsset(holding.token.symbol)}
                    className="hover:bg-white/5 cursor-pointer transition-colors group"
                  >
                    {/* Asset info */}
                    <td className="py-3.5 px-4 font-sans">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-bold text-white text-xs shrink-0 group-hover:border-[#ADF802]/50 transition-colors">
                          {holding.token.symbol.substring(0, 3)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white group-hover:text-[#ADF802] transition-colors">
                              {holding.token.symbol}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/5 text-slate-400 border border-white/5 font-mono">
                              {holding.token.sector}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 line-clamp-1 max-w-[180px]">
                            {holding.token.name}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Price */}
                    <td className="py-3.5 px-4 text-right font-medium text-slate-200">
                      ${(holding.price ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Balance */}
                    <td className="py-3.5 px-4 text-right text-slate-300 font-mono">
                      {holding.balanceFormatted}
                    </td>

                    {/* Total Value */}
                    <td className="py-3.5 px-4 text-right font-bold text-white font-mono">
                      ${(holding.value ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Allocation */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-white font-bold font-mono">{holding.allocationPercentage ?? 0}%</span>
                        <div className="w-12 h-1.5 rounded-full bg-slate-800/80 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#ADF802]"
                            style={{ width: `${Math.min(100, (holding.allocationPercentage ?? 0) * 2.5)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* 24H Change */}
                    <td className={`py-3.5 px-4 text-right font-medium font-mono ${(holding.change24hPercent ?? 0) >= 0 ? 'text-[#ADF802]' : 'text-[#FF453A]'}`}>
                      <span className="inline-flex items-center gap-0.5">
                        {(holding.change24hPercent ?? 0) >= 0 ? '+' : ''}{(holding.change24hPercent ?? 0).toFixed(2)}%
                      </span>
                    </td>

                    {/* Contract Action */}
                    <td className="py-3.5 px-4 text-center font-sans">
                      <div className="inline-flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleCopy(e, holding.token.contractAddress)}
                          title="Copy Contract Address"
                          className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          {copiedAddress === holding.token.contractAddress ? (
                            <Check className="w-3.5 h-3.5 text-[#ADF802]" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <a
                          href={getBlockscoutUrl(holding.token.contractAddress, chainId, 'address')}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="View on Robinhood Blockscout"
                          className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>

                    {/* Row link arrow */}
                    <td className="py-3.5 px-3 text-right text-slate-500">
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-[#ADF802] transition-colors" />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout */}
      <div className="md:hidden divide-y divide-white/5">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-xs">
            No matching stock tokens found.
          </div>
        ) : (
          filtered.map((holding) => {
            const isPositive = holding.change24hPercent >= 0;
            return (
              <div
                key={holding.token.symbol}
                onClick={() => onSelectAsset(holding.token.symbol)}
                className="p-4 hover:bg-white/5 active:bg-white/10 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-bold text-xs text-white">
                      {holding.token.symbol.substring(0, 3)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-white">{holding.token.symbol}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/5 text-slate-400 border border-white/5">
                          {holding.token.sector}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">{holding.token.name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold font-mono text-white">
                      ${(holding.value ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className={`text-xs font-mono font-medium ${(holding.change24hPercent ?? 0) >= 0 ? 'text-[#ADF802]' : 'text-[#FF453A]'}`}>
                      {(holding.change24hPercent ?? 0) >= 0 ? '+' : ''}{(holding.change24hPercent ?? 0).toFixed(2)}%
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-white/5 grid grid-cols-3 gap-2 text-[11px] font-mono text-slate-400">
                  <div>
                    <span className="block text-[10px] uppercase text-slate-500">Price</span>
                    <span className="text-slate-200">${(holding.price ?? 0).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase text-slate-500">Balance</span>
                    <span className="text-slate-200">{holding.balanceFormatted}</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[10px] uppercase text-slate-500">Alloc</span>
                    <span className="text-slate-200 font-bold">{holding.allocationPercentage ?? 0}%</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
