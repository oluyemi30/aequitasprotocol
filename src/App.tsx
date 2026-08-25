import React, { useState } from 'react';
import { 
  Layers, 
  Sparkles, 
  ExternalLink, 
  ShieldCheck, 
  Zap, 
  Activity,
  Coins, 
  RefreshCw,
  Info,
  Sliders,
  Play,
  TrendingUp,
  Scale
} from 'lucide-react';
import appLogo from './assets/images/aequitas_logo_1787617537410.jpg';
import { Navbar } from './components/Navbar';
import { LandingHero } from './components/LandingHero';
import { PortfolioMetrics } from './components/dashboard/PortfolioMetrics';
import { PortfolioChart } from './components/dashboard/PortfolioChart';
import { HoldingsTable } from './components/portfolio/HoldingsTable';
import { AllocationView } from './components/portfolio/AllocationView';
import { RiskHealthView } from './components/portfolio/RiskHealthView';
import { AIPortfolioAnalyst } from './components/ai/AIPortfolioAnalyst';
import { ScenarioSimulator } from './components/simulator/ScenarioSimulator';
import { AssetsDirectory } from './components/assets/AssetsDirectory';
import { AssetDetailModal } from './components/assets/AssetDetailModal';
import { OnchainProfileModal } from './components/profile/OnchainProfileModal';
import { GraphQLExplorerModal } from './components/graphql/GraphQLExplorerModal';

// RWA Agent Strategy Components
import { StrategyPromptInput } from './components/strategy/StrategyPromptInput';
import { ProposedStrategyCard } from './components/strategy/ProposedStrategyCard';
import { StrategyValidationBadge } from './components/strategy/StrategyValidationBadge';
import { StrategySimulatorCard } from './components/strategy/StrategySimulatorCard';
import { TransactionPlanCard } from './components/strategy/TransactionPlanCard';
import { ExecuteStrategyModal } from './components/strategy/ExecuteStrategyModal';
import { RebalanceWorkspace } from './components/strategy/RebalanceWorkspace';

import { useRobinhoodWallet } from './hooks/useRobinhoodWallet';
import { useStockTokens } from './hooks/useStockTokens';
import { usePortfolio } from './hooks/usePortfolio';
import { useStockLensRegistry } from './hooks/useStockLensRegistry';
import { useStrategy } from './hooks/useStrategy';
import { useStrategyExecution } from './hooks/useStrategyExecution';
import { ROBINHOOD_NETWORKS, getBlockscoutUrl } from './lib/robinhood-chain';

export function App() {
  const [activeTab, setActiveTab] = useState<'strategy' | 'rebalance' | 'simulator' | 'holdings'>('strategy');
  const [selectedAssetSymbol, setSelectedAssetSymbol] = useState<string | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isGraphQLModalOpen, setIsGraphQLModalOpen] = useState<boolean>(false);

  // Wallet Hook
  const {
    address,
    chainId,
    isConnected,
    isConnecting,
    isDemoWallet,
    ethBalance,
    isCorrectNetwork,
    connectInjected,
    connectDemoWallet,
    disconnect,
    switchNetwork,
  } = useRobinhoodWallet();

  // Stock Tokens Registry Hook
  const { tokens, isLoading: isLoadingTokens } = useStockTokens(chainId);

  // Portfolio Engine Hook
  const {
    portfolio,
    healthScore,
    isLoading: isLoadingPortfolio,
    isRefreshing,
    refreshPortfolio,
  } = usePortfolio(address, chainId, isDemoWallet, tokens);

  // Onchain Profile Registry Hook
  const {
    profile,
    txStatus,
    registerOrUpdateProfile,
    resetTxStatus,
  } = useStockLensRegistry(address, chainId, isDemoWallet);

  // RWA Agent Strategy Synthesizer Hook
  const {
    activeStrategy,
    promptInput,
    setPromptInput,
    capitalInput,
    setCapitalInput,
    maxConstraintInput,
    setMaxConstraintInput,
    isGenerating,
    validation,
    transactionPlan,
    simulatedShocks,
    setAssetShock,
    resetShocks,
    simulatedPortfolio,
    generateStrategy,
    applyPreset,
    setActiveStrategy,
  } = useStrategy(portfolio, chainId, !isDemoWallet);

  // Strategy Execution Hook
  const {
    executionSteps,
    isReviewOpen,
    isExecuting,
    openReviewModal,
    closeReviewModal,
    startExecution,
    retryStep,
    summary: executionSummary,
  } = useStrategyExecution(transactionPlan, chainId, !isDemoWallet, address);

  // Active selected asset data for modal
  const selectedToken = selectedAssetSymbol
    ? tokens.find((t) => t.symbol === selectedAssetSymbol) || null
    : null;
  const selectedHolding = selectedAssetSymbol && portfolio
    ? portfolio.holdings.find((h) => h.token.symbol === selectedAssetSymbol) || null
    : null;

  const currentNetwork = ROBINHOOD_NETWORKS[chainId] || ROBINHOOD_NETWORKS[46630];

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 flex flex-col font-sans selection:bg-[#ADF802]/30 selection:text-[#ADF802]">
      
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        address={address}
        chainId={chainId}
        isConnected={isConnected}
        isConnecting={isConnecting}
        isDemoWallet={isDemoWallet}
        ethBalance={ethBalance}
        isCorrectNetwork={isCorrectNetwork}
        profile={profile}
        onConnectInjected={connectInjected}
        onConnectDemo={connectDemoWallet}
        onDisconnect={disconnect}
        onSwitchNetwork={switchNetwork}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        onOpenGraphQLModal={() => setIsGraphQLModalOpen(true)}
        onRefresh={refreshPortfolio}
        isRefreshing={isRefreshing}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {!isConnected ? (
          /* Landing Screen */
          <div className="space-y-12">
            <LandingHero
              onLaunchApp={connectInjected}
              onTryDemo={() => {
                connectDemoWallet();
                setActiveTab('strategy');
              }}
              totalAssetsCount={tokens.length}
            />

            {/* Quick Strategy Preset Preview Section */}
            <div className="space-y-6">
              <StrategyPromptInput
                promptInput={promptInput}
                setPromptInput={setPromptInput}
                capitalInput={capitalInput}
                setCapitalInput={setCapitalInput}
                maxConstraintInput={maxConstraintInput}
                setMaxConstraintInput={setMaxConstraintInput}
                isGenerating={isGenerating}
                onGenerate={(p, c, m) => {
                  connectDemoWallet();
                  generateStrategy(p, c, m);
                  setActiveTab('strategy');
                }}
                onApplyPreset={(id) => {
                  connectDemoWallet();
                  applyPreset(id);
                  setActiveTab('strategy');
                }}
              />
            </div>

            {/* Public Assets Directory Section on Landing */}
            <div className="mt-8">
              <AssetsDirectory
                tokens={tokens}
                chainId={chainId}
                onSelectAsset={(sym) => setSelectedAssetSymbol(sym)}
              />
            </div>
          </div>
        ) : (
          /* Connected Terminal Views */
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* Tab: AI Strategy Synthesizer & Execution */}
            {activeTab === 'strategy' && (
              <div className="space-y-6">
                {/* 1. Natural Language Prompt Input */}
                <StrategyPromptInput
                  promptInput={promptInput}
                  setPromptInput={setPromptInput}
                  capitalInput={capitalInput}
                  setCapitalInput={setCapitalInput}
                  maxConstraintInput={maxConstraintInput}
                  setMaxConstraintInput={setMaxConstraintInput}
                  isGenerating={isGenerating}
                  onGenerate={generateStrategy}
                  onApplyPreset={applyPreset}
                />

                {/* 2. Onchain Constraint & Risk Validation */}
                <StrategyValidationBadge validation={validation} />

                {/* 3. Proposed Strategy Card */}
                <ProposedStrategyCard
                  strategy={activeStrategy}
                  validation={validation}
                  portfolio={portfolio}
                  chainId={chainId}
                  onSimulateClick={() => setActiveTab('simulator')}
                  onReviewTransactionsClick={openReviewModal}
                  onExecuteClick={openReviewModal}
                />

                {/* 4. Step-by-Step Transaction Plan */}
                <TransactionPlanCard
                  steps={transactionPlan}
                  chainId={chainId}
                  onExecuteClick={openReviewModal}
                  canExecute={validation.canExecute}
                />
              </div>
            )}

            {/* Tab: Portfolio Rebalancer */}
            {activeTab === 'rebalance' && (
              <div className="space-y-6">
                <RebalanceWorkspace
                  portfolio={portfolio}
                  activeStrategy={activeStrategy}
                  onApplyRebalanceAsStrategy={(newStrat) => {
                    setActiveStrategy(newStrat);
                    setActiveTab('strategy');
                  }}
                  chainId={chainId}
                />

                <HoldingsTable
                  holdings={portfolio?.holdings || []}
                  chainId={chainId}
                  onSelectAsset={(sym) => setSelectedAssetSymbol(sym)}
                />
              </div>
            )}

            {/* Tab: Scenario Shock Simulator */}
            {activeTab === 'simulator' && (
              <div className="space-y-6">
                <StrategySimulatorCard
                  strategy={activeStrategy}
                  simulatedShocks={simulatedShocks}
                  onSetAssetShock={setAssetShock}
                  onResetShocks={resetShocks}
                  simulatedPortfolio={simulatedPortfolio}
                />

                <ScenarioSimulator portfolio={portfolio} />
                <AIPortfolioAnalyst portfolio={portfolio} />
              </div>
            )}

            {/* Tab: Holdings / Portfolio Details */}
            {activeTab === 'holdings' && (
              <div className="space-y-6">
                <PortfolioMetrics
                  portfolio={portfolio}
                  healthScore={healthScore}
                  chainId={chainId}
                  profile={profile}
                  isDemoWallet={isDemoWallet}
                  onOpenProfileModal={() => setIsProfileModalOpen(true)}
                  onOpenAssetDetail={(sym) => setSelectedAssetSymbol(sym)}
                />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-7">
                    <PortfolioChart currentValue={portfolio?.totalValue || 0} />
                  </div>
                  <div className="lg:col-span-5">
                    <AllocationView
                      holdings={portfolio?.holdings || []}
                      totalValue={portfolio?.totalValue || 0}
                    />
                  </div>
                </div>

                <HoldingsTable
                  holdings={portfolio?.holdings || []}
                  chainId={chainId}
                  onSelectAsset={(sym) => setSelectedAssetSymbol(sym)}
                />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <RiskHealthView healthScore={healthScore} />
                  <AIPortfolioAnalyst portfolio={portfolio} />
                </div>

                <AssetsDirectory
                  tokens={tokens}
                  holdings={portfolio?.holdings || []}
                  chainId={chainId}
                  onSelectAsset={(sym) => setSelectedAssetSymbol(sym)}
                />
              </div>
            )}

          </div>
        )}
      </main>

      {/* Asset Details Modal */}
      {selectedToken && (
        <AssetDetailModal
          token={selectedToken}
          holding={selectedHolding}
          chainId={chainId}
          onClose={() => setSelectedAssetSymbol(null)}
        />
      )}

      {/* Onchain Profile Modal */}
      <OnchainProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        address={address}
        chainId={chainId}
        profile={profile}
        txStatus={txStatus}
        onRegisterOrUpdate={registerOrUpdateProfile}
        onResetTx={resetTxStatus}
      />

      {/* RWA Agent Live Execution & Transaction Console Modal */}
      <ExecuteStrategyModal
        isOpen={isReviewOpen}
        onClose={closeReviewModal}
        strategy={activeStrategy}
        steps={executionSteps}
        isExecuting={isExecuting}
        onStartExecution={startExecution}
        onRetryStep={retryStep}
        summary={executionSummary}
        chainId={chainId}
        isLiveMode={!isDemoWallet}
        walletAddress={address}
      />

      {/* Robinhood Chain GraphQL API Explorer Modal */}
      <GraphQLExplorerModal
        isOpen={isGraphQLModalOpen}
        onClose={() => setIsGraphQLModalOpen(false)}
        chainId={chainId}
      />

      {/* Footer */}
      <footer className="mt-16 border-t border-white/10 glass-panel py-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-[#ADF802]/30 shadow-md bg-black flex-shrink-0">
              <img
                src={appLogo}
                alt="Aequitas Protocol Logo"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <span className="font-semibold text-slate-200">Aequitas<span className="text-[#ADF802]"> Protocol</span></span>
              <span className="text-[11px] text-slate-500 ml-2 font-mono">Robinhood Chain Programmable Strategies</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-[11px] font-medium text-slate-400">
            <button
              onClick={() => setIsGraphQLModalOpen(true)}
              className="flex items-center gap-1.5 text-[#ADF802] hover:underline font-mono cursor-pointer"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#ADF802]" />
              GraphQL API (/api/graphql)
            </button>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ADF802]" />
              Robinhood RPC Connected
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ADF802]" />
              Gemini 3.7 Synthesizer
            </span>
            <a
              href={currentNetwork.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#ADF802] transition-colors flex items-center gap-1"
            >
              <span>Blockscout Explorer</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <span className="font-mono text-slate-500">
              {currentNetwork.name} (Chain ID: {currentNetwork.chainId})
            </span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 pt-4 border-t border-white/5 text-[11px] text-slate-500 text-center leading-relaxed">
          Aequitas Protocol provides informational tools, algorithmic strategy synthesis, and user-directed transaction execution for Robinhood Chain stock tokens. It does not provide financial investment advice. All blockchain transactions require explicit wallet confirmation.
        </div>
      </footer>

    </div>
  );
}
export default App;
