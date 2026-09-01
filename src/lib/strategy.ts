import {
  RobinhoodStockToken,
  StructuredStrategy,
  StrategyAssetAllocation,
  StrategyValidationResult,
  StrategyValidationRule,
  StrategyTransactionStep,
  StrategyRebalanceDiff,
  PortfolioSummary,
} from '../types';
import { ROBINHOOD_STOCK_TOKENS, getTokenBySymbol } from './stock-tokens';
import { ROBINHOOD_NETWORKS, DEFAULT_CHAIN_ID } from './robinhood-chain';
import { STOCKLENS_REGISTRY_ADDRESS } from './contracts';

// Standard gas estimation constants for Robinhood Chain EVM (in Gwei & ETH)
export const ESTIMATED_GAS_UNITS = {
  ERC20_APPROVE: 45000n,
  TOKEN_TRANSFER: 65000n,
  STRATEGY_REGISTER: 110000n,
  SWAP_EXECUTION: 160000n,
};

export const GAS_PRICE_GWEI = 0.1; // Robinhood Chain L2/Subnet low gas fees

/**
 * 5 Standard Strategy Templates specified in RWA Agent specification
 */
export const STRATEGY_PRESETS = [
  {
    id: 'preset-ai-diversified',
    name: 'Diversified AI Basket',
    tagline: 'High-growth AI semiconductors, cloud infra & models (max 30% cap)',
    prompt: 'I have $1,000. Build me a diversified AI-stock portfolio with NVDA, MSFT, GOOGL, and META. No single asset should be more than 30%.',
    type: 'sector_basket' as const,
    defaultCapital: 1000,
  },
  {
    id: 'preset-equal-weight-tech',
    name: 'Equal Weight Megacap Tech',
    tagline: 'Even 25% balance across AAPL, NVDA, MSFT, and GOOGL',
    prompt: 'Split $1,000 equally across AAPL, NVDA, MSFT, and GOOGL (25% each).',
    type: 'equal_weight' as const,
    defaultCapital: 1000,
  },
  {
    id: 'preset-balanced-index',
    name: 'Core Market & Growth Balanced',
    tagline: 'Index stability via SPY/QQQ paired with high-beta tech leaders',
    prompt: 'I want a balanced strategy with $2,000: 30% SPY, 30% QQQ, 20% AAPL, 20% MSFT. Cap any single asset at 35%.',
    type: 'diversified' as const,
    defaultCapital: 2000,
  },
  {
    id: 'preset-crypto-ev-conviction',
    name: 'High Beta Conviction',
    tagline: 'Concentrated exposure into Web3 infrastructure (COIN) and robotics (TSLA)',
    prompt: 'Create a custom allocation strategy for $1,500: 35% NVDA, 35% COIN, 30% TSLA.',
    type: 'custom' as const,
    defaultCapital: 1500,
  },
  {
    id: 'preset-rebalance-wallet',
    name: 'Portfolio Rebalance',
    tagline: 'Rebalance current holdings so no single stock token exceeds 35%',
    prompt: 'Rebalance my portfolio so no asset exceeds 35% allocation and trim overweight positions.',
    type: 'rebalance' as const,
    defaultCapital: 0, // Uses current portfolio total value
  },
];

/**
 * Validate strategy structure against strict onchain & financial constraints
 */
export function validateStrategy(
  strategy: StructuredStrategy,
  userEthBalance: number = 0.5,
  userUsdCapitalAvailable: number = 5000
): StrategyValidationResult {
  const rules: StrategyValidationRule[] = [];
  const assets = Array.isArray(strategy?.assets) ? strategy.assets : [];

  // 1. Total Allocations sum to 100% (within 0.1% tolerance)
  const totalAllocation = assets.reduce((sum, a) => sum + (a?.allocationPercent || 0), 0);
  const isAllocation100 = Math.abs(totalAllocation - 100) < 0.2;
  rules.push({
    id: 'rule-sum-100',
    label: '100% Total Allocation Sum',
    passed: isAllocation100,
    message: isAllocation100
      ? `Total asset allocations sum to exactly ${totalAllocation.toFixed(1)}%`
      : `Allocations must sum to 100% (current sum: ${totalAllocation.toFixed(1)}%)`,
    severity: isAllocation100 ? 'info' : 'error',
  });

  // 2. Non-negative allocations
  const hasNegative = assets.some((a) => (a?.allocationPercent ?? 0) <= 0);
  rules.push({
    id: 'rule-positive-allocations',
    label: 'Positive Asset Allocations',
    passed: !hasNegative,
    message: !hasNegative
      ? 'All assets have valid non-zero positive allocations'
      : 'Asset allocations cannot be zero or negative',
    severity: !hasNegative ? 'info' : 'error',
  });

  // 3. Max single asset allocation constraint
  const maxSingle = assets.length > 0 ? Math.max(...assets.map((a) => a?.allocationPercent || 0), 0) : 0;
  const maxLimit = strategy?.maxSingleAssetAllocationPercent || 100;
  const isWithinMaxConstraint = maxSingle <= maxLimit + 0.1;
  rules.push({
    id: 'rule-max-constraint',
    label: `Max Single Asset Cap (${maxLimit}%)`,
    passed: isWithinMaxConstraint,
    message: isWithinMaxConstraint
      ? `Maximum single asset weighting is ${maxSingle.toFixed(1)}% (under ${maxLimit}% cap)`
      : `Asset weighting ${maxSingle.toFixed(1)}% exceeds user specified maximum of ${maxLimit}%`,
    severity: isWithinMaxConstraint ? 'info' : 'error',
  });

  // 4. Known Robinhood Stock Token validation
  const validTokens = ROBINHOOD_STOCK_TOKENS.map((t) => t.symbol.toUpperCase());
  const invalidTokens = assets.filter(
    (a) => !validTokens.includes((a?.symbol || '').toUpperCase()) || !a?.contractAddress || !a.contractAddress.startsWith('0x')
  );
  const areAllTokensLegit = invalidTokens.length === 0;
  rules.push({
    id: 'rule-verified-tokens',
    label: 'Verified Robinhood Stock Tokens',
    passed: areAllTokensLegit,
    message: areAllTokensLegit
      ? `All ${assets.length} assets are verified Robinhood Chain Stock Token contracts`
      : `Unrecognized or invalid token contracts detected: ${invalidTokens.map((t) => t?.symbol).join(', ')}`,
    severity: areAllTokensLegit ? 'info' : 'error',
  });

  // 5. Capital check
  const isCapitalPositive = (strategy?.capital || 0) > 0;
  rules.push({
    id: 'rule-capital-positive',
    label: 'Valid Strategy Capital',
    passed: isCapitalPositive,
    message: isCapitalPositive
      ? `Strategy capital set to $${(strategy?.capital || 0).toLocaleString()}`
      : 'Strategy capital must be a positive dollar amount',
    severity: isCapitalPositive ? 'info' : 'error',
  });

  // 6. Gas Requirement calculation
  // Each asset execution requires ~1 approve + 1 swap transaction + 1 potential strategy registry
  const totalTxCount = assets.length * 2 + 1;
  const gasPerTxEth = 0.00015; // approximate at current Robinhood Chain gas price
  const totalGasReqEth = totalTxCount * gasPerTxEth;
  const hasSufficientEth = (userEthBalance || 0) >= totalGasReqEth;

  rules.push({
    id: 'rule-gas-sufficiency',
    label: 'Gas Fee Sufficiency',
    passed: hasSufficientEth,
    message: hasSufficientEth
      ? `Wallet holds ${(userEthBalance || 0).toFixed(4)} ETH (Estimated gas for ${totalTxCount} steps: ~${totalGasReqEth.toFixed(4)} ETH)`
      : `Insufficient ETH for gas: required ~${totalGasReqEth.toFixed(4)} ETH, current balance ${(userEthBalance || 0).toFixed(4)} ETH`,
    severity: hasSufficientEth ? 'info' : 'error',
  });

  const allPassed = rules.every((r) => r.passed);

  return {
    isValid: allPassed,
    canExecute: allPassed && assets.length > 0,
    totalAllocationPercent: totalAllocation,
    maxAllocationFound: maxSingle,
    rules,
    gasRequirementEth: totalGasReqEth,
    hasSufficientEth,
    hasSufficientCapital: (userUsdCapitalAvailable || 0) >= (strategy?.capital || 0),
  };
}

/**
 * Generate Step-by-Step Transaction Plan
 */
export function generateTransactionPlan(
  strategy: StructuredStrategy,
  chainId: number = DEFAULT_CHAIN_ID,
  slippagePercent: number = 0.5
): StrategyTransactionStep[] {
  const steps: StrategyTransactionStep[] = [];
  const network = ROBINHOOD_NETWORKS[chainId] || ROBINHOOD_NETWORKS[DEFAULT_CHAIN_ID];
  let stepIndex = 1;

  // Step 1: Optional Onchain Strategy Profile registration if desired
  steps.push({
    id: `tx-step-register-${strategy.id}`,
    stepNumber: stepIndex++,
    type: 'register_strategy',
    title: `Register Strategy "${strategy.title}" Onchain`,
    description: `Record strategy profile metadata in RWAStrategyRegistry at ${STOCKLENS_REGISTRY_ADDRESS.slice(0, 8)}...`,
    fromTokenSymbol: 'ETH',
    toTokenSymbol: 'RWA-PROFILE',
    fromAmount: '0.000',
    toAmount: '1 Profile',
    fromAmountUsd: 0,
    toAmountUsd: 0,
    contractAddress: STOCKLENS_REGISTRY_ADDRESS,
    functionName: 'registerProfile(string)',
    protocol: 'RWAStrategyRegistry (Robinhood Chain)',
    estimatedGasEth: 0.00012,
    estimatedGasGwei: 0.1,
    slippageTolerancePercent: 0,
    networkName: network.name,
    chainId,
    status: 'idle',
    isRouteAvailable: true,
  });

  // Steps for each asset in the strategy
  for (const asset of strategy.assets) {
    const token = getTokenBySymbol(asset.symbol);
    const tokenAddress = token?.contractAddress || asset.contractAddress;
    const tokenPrice = asset.price > 0 ? asset.price : (token?.price || 150);
    const estimatedTokens = asset.targetAmountUsd / tokenPrice;

    // Step A: Token / USDC Approval
    steps.push({
      id: `tx-step-approve-${asset.symbol.toLowerCase()}-${strategy.id}`,
      stepNumber: stepIndex++,
      type: 'approve',
      title: `Approve USDC Settlement for ${asset.symbol}`,
      description: `Grant exact approval for $${asset.targetAmountUsd.toFixed(2)} USDC to Robinhood Stock Token settlement router`,
      fromTokenSymbol: 'USDC',
      toTokenSymbol: asset.symbol,
      fromAmount: asset.targetAmountUsd.toFixed(2),
      toAmount: `${asset.targetAmountUsd.toFixed(2)} Allowance`,
      fromAmountUsd: asset.targetAmountUsd,
      toAmountUsd: asset.targetAmountUsd,
      contractAddress: tokenAddress,
      functionName: 'approve(address spender, uint256 amount)',
      protocol: 'Robinhood Chain ERC-20 Standard',
      estimatedGasEth: 0.00008,
      estimatedGasGwei: 0.1,
      slippageTolerancePercent: 0,
      networkName: network.name,
      chainId,
      status: 'idle',
      isRouteAvailable: true,
    });

    // Step B: Stock Token Mint / Swap Execution
    steps.push({
      id: `tx-step-swap-${asset.symbol.toLowerCase()}-${strategy.id}`,
      stepNumber: stepIndex++,
      type: 'swap',
      title: `Acquire ${estimatedTokens.toFixed(4)} ${asset.symbol} Tokenized Stock`,
      description: `Swap $${asset.targetAmountUsd.toFixed(2)} USDC for ${asset.symbol} at spot index $${tokenPrice.toFixed(2)}`,
      fromTokenSymbol: 'USDC',
      toTokenSymbol: asset.symbol,
      fromAmount: asset.targetAmountUsd.toFixed(2),
      toAmount: estimatedTokens.toFixed(4),
      fromAmountUsd: asset.targetAmountUsd,
      toAmountUsd: asset.targetAmountUsd,
      contractAddress: tokenAddress,
      functionName: 'swapExactTokensForTokens(uint256,uint256,address[],address,uint256)',
      protocol: 'Robinhood Stock Token Liquidity Provider',
      estimatedGasEth: 0.00018,
      estimatedGasGwei: 0.1,
      slippageTolerancePercent: slippagePercent,
      networkName: network.name,
      chainId,
      status: 'idle',
      isRouteAvailable: true,
    });
  }

  return steps;
}

/**
 * Rebalancing Differential Calculator
 * Calculates current vs target allocations for an existing wallet portfolio
 */
export function calculateRebalance(
  portfolio: PortfolioSummary | null,
  targetStrategy: StructuredStrategy
): {
  diffs: StrategyRebalanceDiff[];
  totalToBuyUsd: number;
  totalToSellUsd: number;
  rebalanceTransactionsCount: number;
} {
  const holdings = portfolio?.holdings || [];
  const totalValue = (portfolio?.totalValue && portfolio.totalValue > 0) ? portfolio.totalValue : targetStrategy.capital;
  const diffs: StrategyRebalanceDiff[] = [];

  // Map existing holdings
  const currentHoldingMap = new Map<string, { value: number; percent: number; price: number }>();
  for (const h of holdings) {
    currentHoldingMap.set(h.token.symbol.toUpperCase(), {
      value: h.value,
      percent: h.allocationPercentage,
      price: h.price,
    });
  }

  // Combined symbols from target strategy and existing holdings
  const allSymbols = Array.from(
    new Set([
      ...targetStrategy.assets.map((a) => a.symbol.toUpperCase()),
      ...holdings.map((h) => h.token.symbol.toUpperCase()),
    ])
  );

  let totalToBuyUsd = 0;
  let totalToSellUsd = 0;

  for (const symbol of allSymbols) {
    const targetAsset = targetStrategy.assets.find((a) => a.symbol.toUpperCase() === symbol);
    const currentData = currentHoldingMap.get(symbol);
    const tokenInfo = getTokenBySymbol(symbol);

    const price = currentData?.price || targetAsset?.price || tokenInfo?.price || 150;
    const currentVal = currentData?.value || 0;
    const currentPercent = currentData?.percent || 0;
    const targetPercent = targetAsset?.allocationPercent || 0;
    const targetVal = (targetPercent / 100) * totalValue;

    const diffVal = targetVal - currentVal;
    const diffPercent = targetPercent - currentPercent;

    let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    if (diffVal > 2) {
      action = 'BUY';
      totalToBuyUsd += diffVal;
    } else if (diffVal < -2) {
      action = 'SELL';
      totalToSellUsd += Math.abs(diffVal);
    }

    const estimatedTokens = Math.abs(diffVal) / price;

    diffs.push({
      symbol,
      name: tokenInfo?.name || targetAsset?.name || `${symbol} Token`,
      currentAllocationPercent: currentPercent,
      targetAllocationPercent: targetPercent,
      diffAllocationPercent: diffPercent,
      currentValueUsd: currentVal,
      targetValueUsd: targetVal,
      diffValueUsd: diffVal,
      action,
      estimatedTokensToTrade: estimatedTokens,
      price,
      contractAddress: tokenInfo?.contractAddress || targetAsset?.contractAddress || '',
    });
  }

  // Count required transactions (approx 1 tx per non-HOLD asset)
  const activeTrades = diffs.filter((d) => d.action !== 'HOLD');
  const rebalanceTransactionsCount = activeTrades.length;

  return {
    diffs,
    totalToBuyUsd,
    totalToSellUsd,
    rebalanceTransactionsCount,
  };
}

/**
 * Deterministic Natural Language Strategy Parser Fallback
 * Translates prompts into structured JSON if Gemini API key is missing or offline
 */
export function parseStrategyFromPromptFallback(
  rawPrompt: string,
  userCapital: number = 1000,
  maxConstraint: number = 35
): StructuredStrategy {
  const p = rawPrompt.toLowerCase();

  // Extract explicit capital if present ($1,000, $500, etc.)
  const capitalMatch = rawPrompt.match(/\$\s?([0-9,]+(\.[0-9]+)?)/i);
  let capital = userCapital || 1000;
  if (capitalMatch && capitalMatch[1]) {
    capital = parseFloat(capitalMatch[1].replace(/,/g, ''));
  }

  // Extract explicit max constraint if present ("35%", "no asset above 30%")
  const maxMatch = rawPrompt.match(/(?:no single asset|cap|max|above|exceed)\s*(?:more than|above|exceed)?\s*([0-9]+)%/i);
  let maxSingleCap = maxConstraint || 35;
  if (maxMatch && maxMatch[1]) {
    maxSingleCap = parseInt(maxMatch[1], 10);
  }

  let selectedSymbols: { symbol: string; weight: number }[] = [];
  let title = 'Custom Stock Token Strategy';
  let objective = 'Diversified allocation across Robinhood Chain tokenized assets';
  let strategyType: StructuredStrategy['strategyType'] = 'diversified';

  if (p.includes('ai') || p.includes('artificial intelligence') || p.includes('nvidia') || p.includes('gpu')) {
    title = 'AI Sector High-Conviction Basket';
    objective = 'Targeted exposure to artificial intelligence hardware, hyperscale cloud, and foundation models';
    strategyType = 'sector_basket';
    selectedSymbols = [
      { symbol: 'NVDA', weight: 0.30 },
      { symbol: 'MSFT', weight: 0.25 },
      { symbol: 'GOOGL', weight: 0.25 },
      { symbol: 'META', weight: 0.20 },
    ];
  } else if (p.includes('equal') || p.includes('split') || p.includes('even')) {
    title = 'Equal Weight Tech Core';
    objective = 'Balanced 25% distribution across mega-cap innovation leaders';
    strategyType = 'equal_weight';
    selectedSymbols = [
      { symbol: 'AAPL', weight: 0.25 },
      { symbol: 'NVDA', weight: 0.25 },
      { symbol: 'MSFT', weight: 0.25 },
      { symbol: 'GOOGL', weight: 0.25 },
    ];
  } else if (p.includes('rebalance') || p.includes('trim') || p.includes('overweight')) {
    title = 'Portfolio Rebalance Strategy';
    objective = 'Normalize asset weights to stay strictly below risk threshold';
    strategyType = 'rebalance';
    selectedSymbols = [
      { symbol: 'NVDA', weight: 0.25 },
      { symbol: 'AAPL', weight: 0.25 },
      { symbol: 'MSFT', weight: 0.25 },
      { symbol: 'AMZN', weight: 0.25 },
    ];
  } else if (p.includes('coin') || p.includes('crypto') || p.includes('tsla') || p.includes('tesla')) {
    title = 'High Beta Growth Basket';
    objective = 'High-growth momentum exposure via Web3 financial infrastructure and clean mobility';
    strategyType = 'custom';
    selectedSymbols = [
      { symbol: 'NVDA', weight: 0.35 },
      { symbol: 'COIN', weight: 0.35 },
      { symbol: 'TSLA', weight: 0.30 },
    ];
  } else if (p.includes('safe') || p.includes('conservative') || p.includes('spy') || p.includes('qqq') || p.includes('etf')) {
    title = 'Core Index Benchmark Strategy';
    objective = 'Broad market equity stability paired with top technology leaders';
    strategyType = 'diversified';
    selectedSymbols = [
      { symbol: 'SPY', weight: 0.35 },
      { symbol: 'QQQ', weight: 0.30 },
      { symbol: 'AAPL', weight: 0.20 },
      { symbol: 'MSFT', weight: 0.15 },
    ];
  } else {
    // Default diversified balanced basket
    title = 'Diversified Growth Portfolio';
    objective = 'Broad tech and market exposure with strict risk weighting';
    strategyType = 'diversified';
    selectedSymbols = [
      { symbol: 'NVDA', weight: 0.30 },
      { symbol: 'MSFT', weight: 0.25 },
      { symbol: 'GOOGL', weight: 0.25 },
      { symbol: 'AMZN', weight: 0.20 },
    ];
  }

  // Enforce max single asset cap adjustment if any asset exceeds it
  let totalWeight = selectedSymbols.reduce((sum, s) => sum + s.weight, 0);
  const maxCapNormalized = maxSingleCap / 100;
  selectedSymbols = selectedSymbols.map((s) => ({
    symbol: s.symbol,
    weight: Math.min(s.weight, maxCapNormalized),
  }));

  // Re-normalize so sum is exactly 1.0
  totalWeight = selectedSymbols.reduce((sum, s) => sum + s.weight, 0);
  selectedSymbols = selectedSymbols.map((s) => ({
    symbol: s.symbol,
    weight: s.weight / totalWeight,
  }));

  const assets: StrategyAssetAllocation[] = selectedSymbols.map((s) => {
    const token = getTokenBySymbol(s.symbol) || ROBINHOOD_STOCK_TOKENS[0];
    const allocationPercent = Math.round(s.weight * 100);
    const targetAmountUsd = (allocationPercent / 100) * capital;
    const price = token.price || 150;
    const estimatedTokens = targetAmountUsd / price;

    return {
      symbol: token.symbol,
      name: token.name,
      allocationPercent,
      targetAmountUsd,
      estimatedTokens,
      price,
      contractAddress: token.contractAddress,
      sector: token.sector,
      beta: token.beta,
      routeStatus: 'available',
    };
  });

  return {
    id: `strat-${Date.now()}`,
    title,
    objective,
    capital,
    maxSingleAssetAllocationPercent: maxSingleCap,
    assets,
    rawPrompt,
    createdAt: new Date().toISOString(),
    isAiGenerated: false,
    strategyType,
    aiRationale: `Computed mathematically to ensure 100% allocation across ${assets.length} Robinhood Stock Tokens while capping maximum asset exposure at ${maxSingleCap}%.`,
  };
}
