export type NetworkMode = 'testnet' | 'mainnet';

export interface RobinhoodNetwork {
  chainId: number;
  name: string;
  shortName: string;
  rpcUrl: string;
  explorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  isTestnet: boolean;
}

export interface RobinhoodStockToken {
  symbol: string;
  name: string;
  contractAddress: string;
  chainId: number;
  logo: string;
  currentMultiplier: number;
  tradingStatus: 'active' | 'halted' | 'pre-market' | 'after-hours' | 'closed';
  decimals: number;
  sector: string;
  industry: string;
  marketCap: string;
  peRatio?: number;
  dividendYield?: number;
  beta: number;
  description: string;
  price?: number;
  change24h?: number;
  change24hPercent?: number;
}

export interface TokenPriceData {
  symbol: string;
  price: number;
  change24h: number;
  change24hPercent: number;
  high24h: number;
  low24h: number;
  volume24h: string;
  lastUpdated: string;
}

export interface Holding {
  token: RobinhoodStockToken;
  balanceRaw: bigint;
  balanceFormatted: number;
  price: number;
  value: number;
  allocationPercentage: number;
  change24h: number;
  change24hPercent: number;
}

export interface PortfolioSummary {
  totalValue: number;
  change24hAmount: number;
  change24hPercent: number;
  assetCount: number;
  walletAddress: string;
  ethBalance: number;
  ethBalanceUsd: number;
  holdings: Holding[];
  topHolding?: Holding;
}

export interface RiskSignal {
  level: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  category: 'concentration' | 'sector' | 'asset_count' | 'volatility';
}

export interface PortfolioHealthScore {
  score: number; // 0 - 100
  diversification: number; // 0 - 100
  concentration: number; // 0 - 100
  assetCountScore: number; // 0 - 100
  volatilityExposure: number; // 0 - 100
  rating: 'Optimal' | 'Balanced' | 'Moderate Risk' | 'High Risk';
  signals: RiskSignal[];
  summaryText: string;
}

export interface SimulatedAssetChange {
  symbol: string;
  percentChange: number;
}

export interface SimulationResult {
  originalTotalValue: number;
  simulatedTotalValue: number;
  deltaAmount: number;
  deltaPercent: number;
  assetBreakdown: {
    symbol: string;
    name: string;
    originalPrice: number;
    newPrice: number;
    originalValue: number;
    newValue: number;
    deltaValue: number;
    percentChange: number;
  }[];
}

export interface AIAnalysisResult {
  executiveSummary: string;
  riskSignals: RiskSignal[];
  insights: string[];
  suggestedQuestions: string[];
  sectorDistribution: { sector: string; percentage: number }[];
  isAIPowered: boolean;
}

export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  mathImpact?: {
    hypotheticalDeltaValue: number;
    hypotheticalDeltaPercent: number;
    affectedHoldings: string[];
  };
}

export interface OnchainProfile {
  address: string;
  profileName: string;
  createdAt: number;
  exists: boolean;
  txHash?: string;
}

// ----------------------------------------------------
// RWA Agent Strategy & Programmable Execution Types
// ----------------------------------------------------

export interface StrategyAssetAllocation {
  symbol: string;
  name: string;
  allocationPercent: number; // 0 - 100 (e.g. 30 for 30%)
  targetAmountUsd: number;
  estimatedTokens: number;
  price: number;
  contractAddress: string;
  sector: string;
  beta: number;
  routeStatus: 'available' | 'route_unavailable';
}

export interface StructuredStrategy {
  id: string;
  title: string;
  objective: string;
  capital: number;
  maxSingleAssetAllocationPercent: number;
  assets: StrategyAssetAllocation[];
  rawPrompt: string;
  createdAt: string;
  isAiGenerated: boolean;
  strategyType: 'diversified' | 'sector_basket' | 'equal_weight' | 'custom' | 'rebalance';
  aiRationale?: string;
}

export interface StrategyValidationRule {
  id: string;
  label: string;
  passed: boolean;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface StrategyValidationResult {
  isValid: boolean;
  canExecute: boolean;
  totalAllocationPercent: number;
  maxAllocationFound: number;
  rules: StrategyValidationRule[];
  gasRequirementEth: number;
  hasSufficientEth: boolean;
  hasSufficientCapital: boolean;
}

export type TransactionStepState =
  | 'idle'
  | 'preparing'
  | 'awaiting_approval'
  | 'submitted'
  | 'confirming'
  | 'confirmed'
  | 'failed'
  | 'rejected';

export interface StrategyTransactionStep {
  id: string;
  stepNumber: number;
  type: 'approve' | 'swap' | 'mint' | 'rebalance_transfer' | 'register_strategy';
  title: string;
  description: string;
  fromTokenSymbol: string;
  toTokenSymbol: string;
  fromAmount: string;
  toAmount: string;
  fromAmountUsd: number;
  toAmountUsd: number;
  contractAddress: string;
  functionName: string;
  protocol: string;
  estimatedGasEth: number;
  estimatedGasGwei: number;
  slippageTolerancePercent: number;
  networkName: string;
  chainId: number;
  status: TransactionStepState;
  txHash?: string;
  errorMessage?: string;
  explorerUrl?: string;
  isRouteAvailable: boolean;
}

export interface StrategySimulationPoint {
  shockPercent: number;
  portfolioValue: number;
  deltaUsd: number;
  deltaPercent: number;
}

export interface StrategyRebalanceDiff {
  symbol: string;
  name: string;
  currentAllocationPercent: number;
  targetAllocationPercent: number;
  diffAllocationPercent: number;
  currentValueUsd: number;
  targetValueUsd: number;
  diffValueUsd: number;
  action: 'BUY' | 'SELL' | 'HOLD';
  estimatedTokensToTrade: number;
  price: number;
  contractAddress: string;
}

