import React, { useState } from 'react';
import { 
  Layers, 
  Wallet, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronDown, 
  UserCheck, 
  Sparkles, 
  Sliders, 
  Coins, 
  LayoutDashboard, 
  LogOut,
  RefreshCw,
  Code2
} from 'lucide-react';
import { formatAddress, getBlockscoutUrl, ROBINHOOD_NETWORKS } from '../lib/robinhood-chain';
import { OnchainProfile } from '../types';

import appLogo from '../assets/images/aequitas_logo_1787617537410.jpg';

interface NavbarProps {
  activeTab: 'strategy' | 'rebalance' | 'simulator' | 'holdings';
  setActiveTab: (tab: 'strategy' | 'rebalance' | 'simulator' | 'holdings') => void;
  address: string | null;
  chainId: number;
  isConnected: boolean;
  isConnecting: boolean;
  isDemoWallet: boolean;
  isWatchOnly?: boolean;
  ethBalance: number;
  isCorrectNetwork: boolean;
  profile: OnchainProfile | null;
  onOpenConnectModal: () => void;
  onConnectInjected: () => void;
  onConnectDemo: () => void;
  onDisconnect: () => void;
  onSwitchNetwork: (targetChainId: number) => void;
  onOpenProfileModal: () => void;
  onOpenGraphQLModal?: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  address,
  chainId,
  isConnected,
  isConnecting,
  isDemoWallet,
  isWatchOnly = false,
  ethBalance,
  isCorrectNetwork,
  profile,
  onOpenConnectModal,
  onConnectInjected,
  onConnectDemo,
  onDisconnect,
  onSwitchNetwork,
  onOpenProfileModal,
  onOpenGraphQLModal,
  onRefresh,
  isRefreshing = false,
}) => {
  const [networkDropdownOpen, setNetworkDropdownOpen] = useState(false);
  const [walletDropdownOpen, setWalletDropdownOpen] = useState(false);

  const currentNetwork = ROBINHOOD_NETWORKS[chainId] || ROBINHOOD_NETWORKS[46630];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 glass-panel">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-6">
          <button 
            id="brand-logo-button"
            onClick={() => setActiveTab('strategy')}
            className="flex items-center gap-3 text-left group focus:outline-none cursor-pointer"
          >
            <div className="relative w-9 h-9 rounded-xl overflow-hidden border border-[#ADF802]/40 shadow-lg shadow-[#ADF802]/20 group-hover:scale-105 transition-transform bg-black flex-shrink-0">
              <img
                src={appLogo}
                alt="Aequitas Protocol Logo"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-lg font-bold tracking-tight text-white">
                  Aequitas<span className="text-[#ADF802]"> Protocol</span>
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/5 border border-white/10 text-slate-400 font-mono hidden lg:inline">
                  Robinhood Chain
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block tracking-tight">
                Autonomous asset balancing onchain
              </p>
            </div>
          </button>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-5 text-xs font-semibold uppercase tracking-wider">
            <button
              id="nav-tab-strategy"
              onClick={() => setActiveTab('strategy')}
              className={`transition-colors py-2 cursor-pointer ${
                activeTab === 'strategy'
                  ? 'text-[#ADF802] font-bold border-b-2 border-[#ADF802]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              AI Strategy
            </button>
            <button
              id="nav-tab-rebalance"
              onClick={() => setActiveTab('rebalance')}
              className={`transition-colors py-2 cursor-pointer ${
                activeTab === 'rebalance'
                  ? 'text-[#ADF802] font-bold border-b-2 border-[#ADF802]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Rebalance
            </button>
            <button
              id="nav-tab-simulator"
              onClick={() => setActiveTab('simulator')}
              className={`transition-colors py-2 cursor-pointer ${
                activeTab === 'simulator'
                  ? 'text-[#ADF802] font-bold border-b-2 border-[#ADF802]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Simulator
            </button>
            <button
              id="nav-tab-holdings"
              onClick={() => setActiveTab('holdings')}
              className={`transition-colors py-2 cursor-pointer ${
                activeTab === 'holdings'
                  ? 'text-[#ADF802] font-bold border-b-2 border-[#ADF802]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Holdings
            </button>
          </nav>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-2.5">
          {/* GraphQL API Explorer button */}
          {onOpenGraphQLModal && (
            <button
              id="open-graphql-btn"
              onClick={onOpenGraphQLModal}
              title="Open Robinhood Chain GraphQL API Console"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg glass-panel text-slate-300 hover:text-white hover:border-[#ADF802]/40 transition-colors text-xs font-mono cursor-pointer"
            >
              <Code2 className="w-3.5 h-3.5 text-[#ADF802]" />
              <span className="hidden sm:inline">GraphQL</span>
            </button>
          )}

          {/* Refresh data button */}
          {isConnected && (
            <button
              id="refresh-portfolio-btn"
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Refresh onchain balances & live quotes"
              className="p-1.5 rounded-lg glass-panel text-slate-400 hover:text-white transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#ADF802]' : ''}`} />
            </button>
          )}

          {/* Network Selector Dropdown */}
          <div className="relative">
            <button
              id="network-selector-btn"
              onClick={() => setNetworkDropdownOpen(!networkDropdownOpen)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                isCorrectNetwork
                  ? currentNetwork.isTestnet
                    ? 'bg-[#ADF802]/10 border-[#ADF802]/20 text-[#ADF802] hover:bg-[#ADF802]/20'
                    : 'bg-[#5E5CE6]/10 border-[#5E5CE6]/20 text-[#5E5CE6] hover:bg-[#5E5CE6]/20'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400 animate-pulse'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isCorrectNetwork
                    ? currentNetwork.isTestnet
                      ? 'bg-[#ADF802]'
                      : 'bg-[#5E5CE6]'
                    : 'bg-rose-400'
                }`}
              />
              <span className="font-bold uppercase tracking-widest text-[10px]">
                {isCorrectNetwork ? (currentNetwork.isTestnet ? 'Robinhood Testnet' : 'Robinhood Mainnet') : 'WRONG NET'}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {networkDropdownOpen && (
              <div 
                className="absolute right-0 mt-2 w-56 glass-panel-elevated rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                onMouseLeave={() => setNetworkDropdownOpen(false)}
              >
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-white/5">
                  Select Robinhood Network
                </div>
                <button
                  onClick={() => {
                    onSwitchNetwork(46630);
                    setNetworkDropdownOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left flex items-center justify-between text-xs hover:bg-white/5 transition-colors ${
                    chainId === 46630 ? 'text-[#ADF802] font-semibold bg-[#ADF802]/10' : 'text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ADF802]" />
                    <div>
                      <div className="font-medium">Robinhood Testnet</div>
                      <div className="text-[10px] text-slate-500">Chain ID: 46630 (Default)</div>
                    </div>
                  </div>
                  {chainId === 46630 && <CheckCircle2 className="w-3.5 h-3.5 text-[#ADF802]" />}
                </button>
                <button
                  onClick={() => {
                    onSwitchNetwork(4663);
                    setNetworkDropdownOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left flex items-center justify-between text-xs hover:bg-white/5 transition-colors ${
                    chainId === 4663 ? 'text-[#5E5CE6] font-semibold bg-[#5E5CE6]/10' : 'text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#5E5CE6]" />
                    <div>
                      <div className="font-medium">Robinhood Mainnet</div>
                      <div className="text-[10px] text-slate-500">Chain ID: 4663</div>
                    </div>
                  </div>
                  {chainId === 4663 && <CheckCircle2 className="w-3.5 h-3.5 text-[#5E5CE6]" />}
                </button>
              </div>
            )}
          </div>

          {/* Network Switch Prompt if on wrong chain */}
          {!isCorrectNetwork && isConnected && (
            <button
              id="switch-to-robinhood-btn"
              onClick={() => onSwitchNetwork(46630)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-black shadow-md transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Switch Network</span>
            </button>
          )}

          {/* Wallet / Profile Control */}
          {isConnected && address ? (
            <div className="relative">
              <button
                id="wallet-profile-button"
                onClick={() => setWalletDropdownOpen(!walletDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 glass-panel rounded-lg border border-white/20 text-xs font-mono text-slate-300 hover:border-white/40 transition-colors"
              >
                {profile?.exists ? (
                  <span className="flex items-center gap-1 text-[#ADF802] font-sans font-semibold">
                    <UserCheck className="w-3.5 h-3.5" />
                    {profile.profileName}
                  </span>
                ) : (
                  <span className="font-mono text-slate-300">{formatAddress(address)}</span>
                )}
                {isDemoWallet && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#ADF802]/20 text-[#ADF802] border border-[#ADF802]/30 font-mono font-bold">
                    DEMO
                  </span>
                )}
                {isWatchOnly && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono font-bold">
                    WATCH
                  </span>
                )}
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {walletDropdownOpen && (
                <div 
                  className="absolute right-0 mt-2 w-64 glass-panel-elevated rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                  onMouseLeave={() => setWalletDropdownOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-white/5">
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                        {isWatchOnly ? 'Observed Wallet' : isDemoWallet ? 'Demo Wallet' : 'Connected Address'}
                      </div>
                      <span className="text-[9px] font-mono text-slate-400">Robinhood Chain</span>
                    </div>
                    <div className="font-mono text-xs text-slate-200 break-all select-all mt-0.5">
                      {address}
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-xs text-slate-400">
                      <span>ETH Balance:</span>
                      <span className="font-mono text-slate-200 font-semibold">{(ethBalance ?? 0).toFixed(4)} ETH</span>
                    </div>
                  </div>

                  {/* Profile Registration Action */}
                  <div className="px-2 py-1.5 border-b border-white/5">
                    <button
                      onClick={() => {
                        onOpenProfileModal();
                        setWalletDropdownOpen(false);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg text-left text-xs flex items-center justify-between text-slate-300 hover:bg-white/5 hover:text-[#ADF802] transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-[#ADF802]" />
                        <div>
                          <div className="font-medium">
                            {profile?.exists ? 'Manage Onchain Profile' : 'Register Profile Onchain'}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {profile?.exists ? `@${profile.profileName}` : 'AequitasRegistry Contract'}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-500">→</span>
                    </button>
                  </div>

                  {/* Blockscout Explorer Link */}
                  <div className="px-2 py-1.5 border-b border-white/5">
                    <a
                      href={getBlockscoutUrl(address, chainId, 'address')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full px-2.5 py-1.5 rounded-lg text-left text-xs flex items-center justify-between text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <ExternalLink className="w-3.5 h-3.5" />
                        View on Blockscout
                      </span>
                    </a>
                  </div>

                  {/* Switch / Connect Options */}
                  <div className="px-2 pt-1.5">
                    <button
                      onClick={() => {
                        onOpenConnectModal();
                        setWalletDropdownOpen(false);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg text-left text-xs flex items-center gap-2 text-slate-300 hover:bg-white/5 hover:text-[#ADF802] transition-colors"
                    >
                      <Wallet className="w-3.5 h-3.5 text-[#ADF802]" />
                      Switch / Change Wallet
                    </button>
                    <button
                      onClick={() => {
                        onDisconnect();
                        setWalletDropdownOpen(false);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg text-left text-xs flex items-center gap-2 text-rose-400 hover:bg-rose-500/10 transition-colors mt-1"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Disconnect
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                id="connect-demo-wallet-btn"
                onClick={onConnectDemo}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-panel text-slate-300 text-xs font-medium hover:text-white hover:border-[#ADF802]/30 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#ADF802]" />
                Demo Mode
              </button>
              <button
                id="connect-wallet-btn"
                onClick={onOpenConnectModal}
                disabled={isConnecting}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#ADF802] hover:bg-[#9ee002] text-black text-xs font-bold shadow-md shadow-[#ADF802]/20 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Wallet className="w-3.5 h-3.5" />
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile navigation tab bar */}
      <div className="md:hidden flex items-center justify-around border-t border-white/5 glass-panel px-2 py-1.5">
        <button
          onClick={() => setActiveTab('strategy')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 text-[10px] font-medium ${
            activeTab === 'strategy' ? 'text-[#ADF802]' : 'text-slate-400'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          AI Strategy
        </button>
        <button
          onClick={() => setActiveTab('rebalance')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 text-[10px] font-medium ${
            activeTab === 'rebalance' ? 'text-[#ADF802]' : 'text-slate-400'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Rebalance
        </button>
        <button
          onClick={() => setActiveTab('simulator')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 text-[10px] font-medium ${
            activeTab === 'simulator' ? 'text-[#ADF802]' : 'text-slate-400'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          Simulator
        </button>
        <button
          onClick={() => setActiveTab('holdings')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 text-[10px] font-medium ${
            activeTab === 'holdings' ? 'text-[#ADF802]' : 'text-slate-400'
          }`}
        >
          <Coins className="w-4 h-4" />
          Holdings
        </button>
      </div>
    </header>
  );
};
