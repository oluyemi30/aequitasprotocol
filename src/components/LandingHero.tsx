import React from 'react';
import appLogo from '../assets/images/aequitas_logo_1787617537410.jpg';
import { 
  Sparkles, 
  ArrowRight, 
  ShieldAlert, 
  Sliders, 
  Database, 
  Coins, 
  Layers, 
  ExternalLink, 
  Check, 
  Activity,
  Zap
} from 'lucide-react';

interface LandingHeroProps {
  onLaunchApp: () => void;
  onTryDemo: () => void;
  totalAssetsCount: number;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onLaunchApp,
  onTryDemo,
  totalAssetsCount,
}) => {
  return (
    <div className="relative overflow-hidden py-12 sm:py-16 lg:py-20">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[#ADF802]/10 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[350px] h-[250px] bg-[#5E5CE6]/15 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Top Brand Logo & Badge */}
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl p-1 bg-gradient-to-br from-[#ADF802] via-[#d4ff38] to-[#5E5CE6] shadow-2xl shadow-[#ADF802]/25">
            <div className="w-full h-full rounded-xl overflow-hidden bg-black">
              <img
                src={appLogo}
                alt="Aequitas Protocol Logo"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[#ADF802] text-xs font-mono font-bold uppercase tracking-wider backdrop-blur-md">
            <span className="flex h-2 w-2 rounded-full bg-[#ADF802] animate-ping" />
            <span>Built on Robinhood Chain • Native Stock Tokens</span>
          </div>
        </div>

        {/* Hero Headlines */}
        <div className="text-center mt-6 max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white">
            Autonomous Asset Balancing <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ADF802] via-[#e2ff6e] to-[#5E5CE6]">Onchain.</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Aequitas Protocol synthesizes natural language financial goals into mathematically balanced stock token portfolios on Robinhood Chain. Perform pre-flight constraint validation, test market shock scenarios, and execute non-custodial swaps with your own wallet.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              id="launch-app-hero-btn"
              onClick={onLaunchApp}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#ADF802] hover:bg-[#9ee002] text-black font-bold text-sm shadow-xl shadow-[#ADF802]/20 flex items-center justify-center gap-2 transition-all group cursor-pointer"
            >
              <span>Connect Live Wallet</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <button
              id="try-demo-hero-btn"
              onClick={onTryDemo}
              className="w-full sm:w-auto px-6 py-3 rounded-xl glass-panel hover:bg-white/10 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#ADF802]" />
              <span>Explore Demo Strategy Sandbox</span>
            </button>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-mono">
              <Check className="w-3.5 h-3.5 text-[#ADF802]" /> Gemini 3.7 Flash Synthesizer
            </span>
            <span className="flex items-center gap-1.5 font-mono">
              <Check className="w-3.5 h-3.5 text-[#ADF802]" /> Non-Custodial Wallet Approval
            </span>
            <span className="flex items-center gap-1.5 font-mono">
              <Check className="w-3.5 h-3.5 text-[#ADF802]" /> Robinhood Chain Verified
            </span>
          </div>
        </div>

        {/* Live Mock Terminal Preview Card */}
        <div className="mt-14 max-w-5xl mx-auto rounded-2xl glass-panel-elevated p-2 sm:p-4 shadow-2xl border border-white/10">
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 mb-4 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-[#ADF802]/80" />
              <span className="ml-2 font-mono text-slate-400">aequitas.robinhood.eth</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-2 py-0.5 rounded bg-[#ADF802]/10 text-[#ADF802] font-mono text-[10px] font-bold border border-[#ADF802]/20">
                LIVE ONCHAIN RPC
              </span>
              <span className="text-slate-500 font-mono text-[11px] hidden sm:inline">Chain ID: 46630</span>
            </div>
          </div>

          {/* Quick Metrics Bar in Preview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 glass-panel rounded-xl">
            <div className="p-3 bg-black/40 rounded-lg border border-white/5">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Value</div>
              <div className="text-lg sm:text-xl font-bold font-mono text-white mt-0.5 stat-value">$18,482.32</div>
              <div className="text-xs text-[#ADF802] flex items-center gap-1 mt-1 font-mono font-bold">
                <span>+$484.21 (+2.69%)</span>
              </div>
            </div>
            <div className="p-3 bg-black/40 rounded-lg border border-white/5">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Health Score</div>
              <div className="text-lg sm:text-xl font-bold font-mono text-[#ADF802] mt-0.5 stat-value">78 / 100</div>
              <div className="text-xs text-slate-400 mt-1">Balanced Exposure</div>
            </div>
            <div className="p-3 bg-black/40 rounded-lg border border-white/5">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Top Holding</div>
              <div className="text-lg sm:text-xl font-bold font-mono text-white mt-0.5 stat-value">NVDA (28.4%)</div>
              <div className="text-xs text-slate-400 mt-1">38.0 Stock Tokens</div>
            </div>
            <div className="p-3 bg-black/40 rounded-lg border border-white/5">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">AI Signals</div>
              <div className="text-lg sm:text-xl font-bold font-mono text-[#5E5CE6] mt-0.5 stat-value">3 Active</div>
              <div className="text-xs text-amber-400 mt-1">Tech Concentration</div>
            </div>
          </div>
        </div>

        {/* 4 Feature Pillars */}
        <div className="mt-16 sm:mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="p-6 rounded-2xl glass-panel hover:border-white/20 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-[#ADF802]/10 border border-[#ADF802]/20 flex items-center justify-center text-[#ADF802] mb-4 shadow-lg shadow-[#ADF802]/5">
              <Coins className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-white tracking-tight">Onchain Portfolio</h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
              Track tokenized stocks directly from your EVM wallet with live prices, 24/7 valuation, and transparent ERC-20 contract verification.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-panel hover:border-white/20 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-[#5E5CE6]/15 border border-[#5E5CE6]/30 flex items-center justify-center text-[#5E5CE6] mb-4 shadow-lg shadow-[#5E5CE6]/5">
              <Sparkles className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-white tracking-tight">AI Intelligence</h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
              Understand concentration, exposure, and ask natural language questions with real-time portfolio impact calculations.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-panel hover:border-white/20 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
              <Sliders className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-white tracking-tight">Scenario Simulator</h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
              Explore how individual stock shocks or multi-asset market corrections affect your total onchain equity in real time.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-panel hover:border-white/20 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-[#5E5CE6]/20 border border-[#5E5CE6]/30 flex items-center justify-center text-indigo-300 mb-4">
              <Layers className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-white tracking-tight">Robinhood Chain Native</h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
              Native support for Robinhood Chain Mainnet (4663) and Testnet (46630), Blockscout explorer links, and registry profiles.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
