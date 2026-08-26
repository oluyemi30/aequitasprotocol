import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  Sparkles, 
  ExternalLink, 
  Check, 
  AlertCircle, 
  X, 
  ChevronRight, 
  Search, 
  ShieldCheck, 
  Globe, 
  Layers,
  ArrowUpRight,
  Copy,
  Info
} from 'lucide-react';
import { ROBINHOOD_NETWORKS, DEFAULT_CHAIN_ID, formatAddress } from '../lib/robinhood-chain';
import { EIP6963ProviderDetail } from '../hooks/useRobinhoodWallet';

interface ConnectWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectInjected: (provider?: any) => Promise<void>;
  onConnectDemo: () => void;
  onConnectCustomAddress: (address: string) => void;
  onAddNetwork: (chainId: number) => Promise<void>;
  discoveredProviders: EIP6963ProviderDetail[];
  isConnecting: boolean;
  error: string | null;
  chainId: number;
}

const POPULAR_TEST_ADDRESSES = [
  {
    label: 'Robinhood Treasury / Genesis',
    address: '0x123479B8206dFA02cD7E36968B4bC3F08b2611A8',
    description: 'Active stock token portfolio ($54.2k NAV)',
  },
  {
    label: 'Arbitrage Rebalancer Bot',
    address: '0x71C836e520038914B929dE3917A196144e59178E',
    description: 'Tech-heavy allocation (NVDA, TSLA, MSFT)',
  },
  {
    label: 'Index Strategy Vault',
    address: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4df',
    description: 'Balanced ETF allocation (SPY, QQQ, AAPL)',
  },
];

export const ConnectWalletModal: React.FC<ConnectWalletModalProps> = ({
  isOpen,
  onClose,
  onConnectInjected,
  onConnectDemo,
  onConnectCustomAddress,
  onAddNetwork,
  discoveredProviders,
  isConnecting,
  error,
  chainId,
}) => {
  const [tab, setTab] = useState<'wallets' | 'watch' | 'setup'>('wallets');
  const [customAddressInput, setCustomAddressInput] = useState('');
  const [customAddressError, setCustomAddressError] = useState<string | null>(null);
  const [copiedNetwork, setCopiedNetwork] = useState<number | null>(null);
  const [isInIframe, setIsInIframe] = useState(false);

  useEffect(() => {
    try {
      setIsInIframe(window.self !== window.top);
    } catch {
      setIsInIframe(true);
    }
  }, []);

  if (!isOpen) return null;

  const hasInjected = typeof window !== 'undefined' && (!!window.ethereum || discoveredProviders.length > 0);

  const handleCustomAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customAddressInput.trim();
    if (!clean.startsWith('0x') || clean.length !== 42) {
      setCustomAddressError('Please enter a valid 42-character EVM address starting with 0x');
      return;
    }
    setCustomAddressError(null);
    onConnectCustomAddress(clean);
    onClose();
  };

  const handleSelectSample = (addr: string) => {
    onConnectCustomAddress(addr);
    onClose();
  };

  const currentNetwork = ROBINHOOD_NETWORKS[chainId] || ROBINHOOD_NETWORKS[DEFAULT_CHAIN_ID];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg glass-panel-elevated rounded-2xl border border-white/10 shadow-2xl overflow-hidden text-slate-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#ADF802]/10 border border-[#ADF802]/20 text-[#ADF802]">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Connect to Robinhood Chain</h3>
              <p className="text-xs text-slate-400">Non-custodial access to programmable stock tokens</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-white/10 bg-black/40 text-xs font-semibold">
          <button
            onClick={() => setTab('wallets')}
            className={`flex-1 py-3 px-4 text-center transition-colors border-b-2 ${
              tab === 'wallets'
                ? 'border-[#ADF802] text-[#ADF802] bg-[#ADF802]/5'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Web3 Wallets
          </button>
          <button
            onClick={() => setTab('watch')}
            className={`flex-1 py-3 px-4 text-center transition-colors border-b-2 ${
              tab === 'watch'
                ? 'border-[#ADF802] text-[#ADF802] bg-[#ADF802]/5'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Watch Any Address
          </button>
          <button
            onClick={() => setTab('setup')}
            className={`flex-1 py-3 px-4 text-center transition-colors border-b-2 ${
              tab === 'setup'
                ? 'border-[#ADF802] text-[#ADF802] bg-[#ADF802]/5'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            RPC Network Setup
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 max-h-[65vh] overflow-y-auto space-y-4">
          
          {/* Error Banner if any */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex flex-col gap-2.5">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <div className="flex-1">
                  <div className="font-semibold text-rose-200">Connection Notice</div>
                  <div className="text-[11px] text-rose-200/90 mt-0.5">{error}</div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-rose-500/20">
                <button
                  type="button"
                  onClick={() => {
                    onConnectDemo();
                    onClose();
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#ADF802] hover:bg-[#9ee002] text-black font-bold text-[11px] transition-colors"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Launch 1-Click Demo Sandbox</span>
                </button>
                <a
                  href={window.location.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-medium transition-colors"
                >
                  <span>Open in New Tab</span>
                  <ArrowUpRight className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          {/* Iframe Notice for Browser Extension Permissions */}
          {isInIframe && tab === 'wallets' && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2.5">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <div className="flex-1">
                <div className="font-semibold text-amber-200">Running inside Preview Window</div>
                <p className="text-[11px] text-amber-200/80 mt-0.5">
                  Some browser extensions (MetaMask, Rabby) restrict injection inside iframes. If the connection popup does not appear, open the app in a new browser tab or use <strong>Demo Sandbox Mode</strong>.
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <a
                    href={window.location.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#ADF802] hover:underline"
                  >
                    <span>Open in New Tab</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: WALLET SELECTION */}
          {tab === 'wallets' && (
            <div className="space-y-3">
              
              {/* EIP-6963 Discovered Wallets */}
              {discoveredProviders.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Detected Browser Wallets
                  </div>
                  {discoveredProviders.map((dp) => (
                    <button
                      key={dp.info.uuid}
                      disabled={isConnecting}
                      onClick={async () => {
                        await onConnectInjected(dp.provider);
                        onClose();
                      }}
                      className="w-full p-3 rounded-xl glass-panel hover:bg-white/10 border border-white/10 hover:border-[#ADF802]/50 flex items-center justify-between text-left transition-all group disabled:opacity-50"
                    >
                      <div className="flex items-center gap-3">
                        <img 
                          src={dp.info.icon} 
                          alt={dp.info.name} 
                          className="w-7 h-7 rounded-lg object-contain bg-white/5 p-0.5" 
                        />
                        <div>
                          <div className="text-xs font-bold text-white group-hover:text-[#ADF802] transition-colors">
                            {dp.info.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            EIP-6963 Auto-Detected
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                    </button>
                  ))}
                </div>
              )}

              {/* Standard Injected / MetaMask / Rabby / Browser Extension */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Default EVM Provider
                </div>

                <button
                  id="modal-connect-injected-btn"
                  disabled={isConnecting}
                  onClick={async () => {
                    await onConnectInjected();
                    onClose();
                  }}
                  className="w-full p-3.5 rounded-xl bg-white/5 hover:bg-[#ADF802]/10 border border-white/10 hover:border-[#ADF802]/50 flex items-center justify-between text-left transition-all group disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center text-black font-black text-xs shadow-md">
                      🦊
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-[#ADF802] transition-colors flex items-center gap-2">
                        <span>MetaMask / Injected Wallet</span>
                        {hasInjected && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                            Detected
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Connect with MetaMask, Rabby, Coinbase, or Brave
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </button>
              </div>

              {/* Instant Demo Sandbox */}
              <div className="pt-2 border-t border-white/10 space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Instant Sandbox
                </div>

                <button
                  id="modal-connect-demo-btn"
                  onClick={() => {
                    onConnectDemo();
                    onClose();
                  }}
                  className="w-full p-3.5 rounded-xl bg-gradient-to-r from-[#ADF802]/10 to-[#5E5CE6]/10 hover:from-[#ADF802]/20 hover:to-[#5E5CE6]/20 border border-[#ADF802]/30 flex items-center justify-between text-left transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#ADF802] flex items-center justify-center text-black font-black shadow-md shadow-[#ADF802]/20">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-[#ADF802] transition-colors flex items-center gap-2">
                        <span>1-Click Interactive Demo Mode</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#ADF802]/20 text-[#ADF802] font-mono font-bold">
                          Recommended
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Pre-funded with live stock tokens (NVDA, TSLA, AAPL, MSFT) & test ETH
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#ADF802] group-hover:translate-x-0.5 transition-all" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: WATCH ANY ADDRESS */}
          {tab === 'watch' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Paste any EVM address on Robinhood Chain to analyze its stock token portfolio, calculate concentration health, and simulate rebalancing strategies in read-only mode.
              </p>

              <form onSubmit={handleCustomAddressSubmit} className="space-y-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="0x..."
                    value={customAddressInput}
                    onChange={(e) => setCustomAddressInput(e.target.value)}
                    className="w-full pl-3 pr-20 py-2.5 rounded-xl bg-black/60 border border-white/15 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-[#ADF802]"
                  />
                  <button
                    type="submit"
                    className="absolute right-1.5 top-1.5 bottom-1.5 px-3 rounded-lg bg-[#ADF802] hover:bg-[#9ee002] text-black text-xs font-bold transition-colors cursor-pointer"
                  >
                    Explore
                  </button>
                </div>
                {customAddressError && (
                  <p className="text-[11px] text-rose-400 font-mono">{customAddressError}</p>
                )}
              </form>

              <div className="pt-3 border-t border-white/10 space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Featured Robinhood Chain Portfolios
                </div>
                <div className="space-y-1.5">
                  {POPULAR_TEST_ADDRESSES.map((item) => (
                    <button
                      key={item.address}
                      onClick={() => handleSelectSample(item.address)}
                      className="w-full p-2.5 rounded-xl glass-panel hover:bg-white/10 text-left transition-all group flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-[#ADF802] transition-colors">
                          {item.label}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {formatAddress(item.address, 6)} • {item.description}
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: NETWORK SETUP */}
          {tab === 'setup' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Add Robinhood Chain directly to your MetaMask or Web3 wallet with verified parameters.
              </p>

              {/* Network Cards */}
              <div className="space-y-3">
                {[46630, 4663].map((netId) => {
                  const net = ROBINHOOD_NETWORKS[netId];
                  return (
                    <div
                      key={netId}
                      className="p-3.5 rounded-xl glass-panel border border-white/10 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              net.isTestnet ? 'bg-[#ADF802]' : 'bg-[#5E5CE6]'
                            }`}
                          />
                          <div>
                            <span className="text-xs font-bold text-white">{net.name}</span>
                            <span className="ml-2 text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/5 text-slate-400">
                              Chain ID: {net.chainId}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={async () => {
                            await onAddNetwork(net.chainId);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#ADF802]/10 hover:bg-[#ADF802]/20 text-[#ADF802] border border-[#ADF802]/30 text-xs font-bold transition-colors cursor-pointer"
                        >
                          Add to Wallet
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-black/40 p-2.5 rounded-lg border border-white/5">
                        <div>
                          <span className="text-slate-500 block text-[10px] uppercase">RPC URL</span>
                          <span className="text-slate-300 truncate block">{net.rpcUrl}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px] uppercase">Currency</span>
                          <span className="text-slate-300 block">ETH (18 decimals)</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-slate-500 block text-[10px] uppercase">Block Explorer</span>
                          <a
                            href={net.explorerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#ADF802] hover:underline truncate block flex items-center gap-1"
                          >
                            <span>{net.explorerUrl}</span>
                            <ExternalLink className="w-3 h-3 inline" />
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-black/60 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#ADF802]" />
            <span>Non-custodial & client-side signing</span>
          </div>
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
