import React, { useState } from 'react';
import { 
  Search, 
  Sparkles, 
  ExternalLink, 
  TrendingUp, 
  TrendingDown, 
  ChevronRight, 
  Coins,
  Layers,
  Copy,
  Check
} from 'lucide-react';
import { RobinhoodStockToken, Holding } from '../../types';
import { getBlockscoutUrl } from '../../lib/robinhood-chain';

interface AssetsDirectoryProps {
  tokens: RobinhoodStockToken[];
  holdings?: Holding[];
  chainId: number;
  onSelectAsset: (symbol: string) => void;
}

export const AssetsDirectory: React.FC<AssetsDirectoryProps> = ({
  tokens,
  holdings = [],
  chainId,
  onSelectAsset,
}) => {
  const [selectedSector, setSelectedSector] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (e: React.MouseEvent, address: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(address);
    setCopied(address);
    setTimeout(() => setCopied(null), 2000);
  };

  const sectors = ['All', 'Technology', 'Communication Services', 'Consumer Discretionary', 'Financial Services', 'Automotive', 'Indices'];

  const holdingsMap = new Map(holdings.map(h => [h.token.symbol, h]));

  const filteredTokens = tokens.filter(t => {
    const matchesSearch = 
      t.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.sector.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSector = 
      selectedSector === 'All' || 
      t.sector.toLowerCase() === selectedSector.toLowerCase() ||
      (selectedSector === 'Indices' && t.sector.toLowerCase().includes('index'));

    return matchesSearch && matchesSector;
  });

  return (
    <div className="glass-panel rounded-xl p-5 border border-white/10 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#5E5CE6]" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Robinhood Stock Tokens Directory
            </h2>
            <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-white/10 text-slate-300">
              {tokens.length} Verified
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Fractionalized real-world equities tokenized natively on Robinhood Chain.
          </p>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search symbol, name, sector..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#ADF802]/60"
          />
        </div>
      </div>

      {/* Sector filter tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {sectors.map((sec) => (
          <button
            key={sec}
            onClick={() => setSelectedSector(sec)}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors ${
              selectedSector === sec
                ? 'bg-[#ADF802]/10 text-[#ADF802] border border-[#ADF802]/30 font-bold shadow-sm'
                : 'glass-panel text-slate-400 hover:text-white border-transparent'
            }`}
          >
            {sec}
          </button>
        ))}
      </div>

      {/* Token Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredTokens.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 text-xs">
            No Robinhood stock tokens matching your criteria.
          </div>
        ) : (
          filteredTokens.map((token) => {
            const userHolding = holdingsMap.get(token.symbol);
            const isPositive = (token.change24hPercent ?? 0) >= 0;

            return (
              <div
                key={token.symbol}
                onClick={() => onSelectAsset(token.symbol)}
                className="p-4 rounded-xl glass-panel hover:border-white/20 cursor-pointer transition-all hover:translate-y-[-1px] group relative flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-bold text-xs text-white group-hover:border-[#ADF802]/50 transition-colors">
                        {token.symbol.substring(0, 3)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm text-white group-hover:text-[#ADF802] transition-colors">
                            {token.symbol}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/5 text-slate-400 font-mono">
                            {token.sector}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 line-clamp-1">{token.name}</div>
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <div className="text-sm font-bold text-white stat-value">
                        ${(token.price ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                      <div className={`text-[11px] font-bold flex items-center justify-end stat-value ${isPositive ? 'text-[#ADF802]' : 'text-[#FF453A]'}`}>
                        {isPositive ? '+' : ''}{(token.change24hPercent ?? 0).toFixed(2)}%
                      </div>
                    </div>
                  </div>

                  {/* If user holds this asset, show holding badge */}
                  {userHolding && (
                    <div className="mt-3 p-2 rounded-lg bg-[#ADF802]/5 border border-[#ADF802]/20 flex items-center justify-between text-xs font-mono">
                      <span className="text-[#ADF802] text-[10px] uppercase font-bold flex items-center gap-1">
                        <Coins className="w-3 h-3" /> Holding:
                      </span>
                      <span className="text-slate-200">
                        {userHolding.balanceFormatted} {token.symbol} (${(userHolding.value ?? 0).toFixed(0)})
                      </span>
                    </div>
                  )}
                </div>

                {/* Card footer with contract link */}
                <div className="mt-4 pt-2.5 border-t border-white/5 flex items-center justify-between text-xs text-slate-400 font-mono">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleCopy(e, token.contractAddress)}
                      title="Copy contract"
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      {copied === token.contractAddress ? (
                        <Check className="w-3.5 h-3.5 text-[#ADF802]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <a
                      href={getBlockscoutUrl(token.contractAddress, chainId, 'address')}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-slate-400 hover:text-[#ADF802] flex items-center gap-1 text-[11px] font-sans"
                    >
                      <span>Blockscout</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <span className="text-xs text-slate-400 group-hover:text-white flex items-center gap-0.5 font-sans">
                    Details <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
