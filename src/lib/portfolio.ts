import { createPublicClient, http, parseAbi } from 'viem';
import { 
  Holding, 
  PortfolioSummary, 
  PortfolioHealthScore, 
  RiskSignal, 
  RobinhoodStockToken, 
  SimulationResult, 
  AIAnalysisResult,
  SimulatedAssetChange
} from '../types';
import { robinhoodMainnetChain, robinhoodTestnetChain } from './robinhood-chain';
import { fetchMultipleTokenPrices, fetchTokenPrice } from './prices';
import { DEFAULT_STOCK_TOKENS } from './stock-tokens';

const ERC20_ABI = parseAbi([
  'function balanceOf(address account) external view returns (uint256)',
  'function decimals() external view returns (uint8)',
  'function symbol() external view returns (string)',
  'function name() external view returns (string)',
]);

export function getViemPublicClient(chainId: number) {
  const chain = chainId === 4663 ? robinhoodMainnetChain : robinhoodTestnetChain;
  return createPublicClient({
    chain,
    transport: http(),
  });
}

/**
 * Read onchain ERC-20 balances for Robinhood Stock Tokens from a connected wallet
 */
export async function fetchWalletPortfolio(
  walletAddress: string,
  chainId: number = 46630,
  tokens: RobinhoodStockToken[] = DEFAULT_STOCK_TOKENS
): Promise<PortfolioSummary> {
  const client = getViemPublicClient(chainId);
  const holdings: Holding[] = [];

  // Read ETH balance
  let ethBalance = 0;
  try {
    const rawEth = await client.getBalance({ address: walletAddress as `0x${string}` });
    ethBalance = Number(rawEth) / 1e18;
  } catch (err) {
    console.warn('Failed to read ETH balance:', err);
  }

  // Fetch prices for all tokens
  const priceMap = await fetchMultipleTokenPrices(tokens.map(t => t.symbol));

  // Query each token balance from the blockchain
  await Promise.all(
    tokens.map(async (token) => {
      try {
        let balanceRaw = BigInt(0);
        try {
          const res = await (client as any).readContract({
            address: token.contractAddress as `0x${string}`,
            abi: ERC20_ABI,
            functionName: 'balanceOf',
            args: [walletAddress as `0x${string}`],
          });
          balanceRaw = BigInt(res || 0);
        } catch {
          // Token balance query failed (e.g. testnet token not yet minted for this wallet)
          balanceRaw = BigInt(0);
        }

        const balanceFormatted = Number(balanceRaw) / Math.pow(10, token.decimals);
        
        // Only include in holdings if balance > 0
        if (balanceFormatted > 0) {
          const priceData = priceMap[token.symbol] || await fetchTokenPrice(token.symbol);
          const value = balanceFormatted * priceData.price;
          holdings.push({
            token,
            balanceRaw,
            balanceFormatted,
            price: priceData.price,
            value,
            allocationPercentage: 0, // calculated below
            change24h: priceData.change24h,
            change24hPercent: priceData.change24hPercent,
          });
        }
      } catch (err) {
        console.warn(`Error reading token ${token.symbol}:`, err);
      }
    })
  );

  // Calculate total value & allocations
  const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);
  
  if (totalValue > 0) {
    holdings.forEach((h) => {
      h.allocationPercentage = Number(((h.value / totalValue) * 100).toFixed(2));
    });
    // Sort by value descending
    holdings.sort((a, b) => b.value - a.value);
  }

  // Calculate 24h change
  let change24hAmount = 0;
  holdings.forEach((h) => {
    const assetChange = h.balanceFormatted * h.change24h;
    change24hAmount += assetChange;
  });
  const previousValue = totalValue - change24hAmount;
  const change24hPercent = previousValue > 0 ? (change24hAmount / previousValue) * 100 : 0;

  return {
    totalValue: Number(totalValue.toFixed(2)),
    change24hAmount: Number(change24hAmount.toFixed(2)),
    change24hPercent: Number(change24hPercent.toFixed(2)),
    assetCount: holdings.length,
    walletAddress,
    ethBalance: Number(ethBalance.toFixed(4)),
    ethBalanceUsd: Number((ethBalance * 2650.0).toFixed(2)),
    holdings,
    topHolding: holdings[0],
  };
}

/**
 * Generate a representative Demo Portfolio for testing and preview without needing pre-minted testnet tokens
 */
export async function getDemoPortfolio(walletAddress = '0x123479B8206dFA02cD7E36968B4bC3F08b2611A8', chainId = 46630): Promise<PortfolioSummary> {
  const demoTokens = DEFAULT_STOCK_TOKENS;
  const priceMap = await fetchMultipleTokenPrices(demoTokens.map(t => t.symbol));

  const demoHoldingsConfig = [
    { symbol: 'AAPL', quantity: 24.5 },
    { symbol: 'NVDA', quantity: 38.0 },
    { symbol: 'MSFT', quantity: 12.0 },
    { symbol: 'AMZN', quantity: 18.5 },
    { symbol: 'GOOGL', quantity: 15.0 },
    { symbol: 'TSLA', quantity: 8.0 },
    { symbol: 'SPY', quantity: 5.0 },
  ];

  const holdings: Holding[] = demoHoldingsConfig.map((item) => {
    const token = demoTokens.find(t => t.symbol === item.symbol) || {
      symbol: item.symbol,
      name: `${item.symbol} Token`,
      contractAddress: '0x1000000000000000000000000000000000000000',
      chainId: 4663,
      logo: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=128&auto=format&fit=crop&q=80',
      decimals: 18,
      sector: 'Technology',
      industry: 'Equities',
      marketCap: '$1T',
      peRatio: 25,
      dividendYield: 0.5,
      beta: 1.0,
      description: '',
      currentMultiplier: 1.0,
      tradingStatus: 'active' as const,
    };
    const priceData = priceMap[item.symbol] || {
      symbol: item.symbol,
      price: 150.0,
      change24h: 1.0,
      change24hPercent: 0.7,
      high24h: 152.0,
      low24h: 148.0,
      volume24h: '10M',
      lastUpdated: new Date().toISOString(),
    };
    const price = priceData?.price || 150.0;
    const value = item.quantity * price;
    return {
      token,
      balanceRaw: BigInt(Math.floor(item.quantity * 1e18)),
      balanceFormatted: item.quantity,
      price,
      value,
      allocationPercentage: 0,
      change24h: priceData?.change24h || 0,
      change24hPercent: priceData?.change24hPercent || 0,
    };
  });

  const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);
  holdings.forEach((h) => {
    h.allocationPercentage = Number(((h.value / totalValue) * 100).toFixed(2));
  });
  holdings.sort((a, b) => b.value - a.value);

  let change24hAmount = 0;
  holdings.forEach((h) => {
    change24hAmount += h.balanceFormatted * h.change24h;
  });
  const previousValue = totalValue - change24hAmount;
  const change24hPercent = previousValue > 0 ? (change24hAmount / previousValue) * 100 : 0;

  return {
    totalValue: Number(totalValue.toFixed(2)),
    change24hAmount: Number(change24hAmount.toFixed(2)),
    change24hPercent: Number(change24hPercent.toFixed(2)),
    assetCount: holdings.length,
    walletAddress,
    ethBalance: 0.842,
    ethBalanceUsd: Number((0.842 * 2650.0).toFixed(2)),
    holdings,
    topHolding: holdings[0],
  };
}

/**
 * Deterministic StockLens Portfolio Health Score calculation
 */
export function calculatePortfolioHealthScore(summary: PortfolioSummary): PortfolioHealthScore {
  if (!summary || summary.holdings.length === 0) {
    return {
      score: 0,
      diversification: 0,
      concentration: 0,
      assetCountScore: 0,
      volatilityExposure: 0,
      rating: 'High Risk',
      signals: [{
        level: 'HIGH',
        title: 'NO ASSETS DETECTED',
        description: 'Connect wallet or acquire Robinhood Stock Tokens to evaluate portfolio health.',
        category: 'asset_count',
      }],
      summaryText: 'No active stock token holdings found on Robinhood Chain.',
    };
  }

  const { holdings, totalValue } = summary;
  const signals: RiskSignal[] = [];

  // 1. Asset Count Score (0 - 100)
  const count = holdings.length;
  let assetCountScore = 20;
  if (count >= 10) assetCountScore = 100;
  else if (count >= 7) assetCountScore = 90;
  else if (count >= 5) assetCountScore = 80;
  else if (count >= 3) assetCountScore = 60;
  else if (count === 2) assetCountScore = 40;

  if (count < 3) {
    signals.push({
      level: 'HIGH',
      title: 'LOW ASSET COUNT',
      description: `Holding only ${count} asset${count === 1 ? '' : 's'} significantly heightens idiosyncratic risk on Robinhood Chain.`,
      category: 'asset_count',
    });
  } else if (count < 5) {
    signals.push({
      level: 'MEDIUM',
      title: 'MODERATE ASSET COUNT',
      description: `Holding ${count} assets offers baseline coverage; consider broadening across 6+ tokenized instruments.`,
      category: 'asset_count',
    });
  }

  // 2. Concentration Score using Herfindahl-Hirschman Index (HHI)
  // Sum of (allocation / 100)^2
  let hhi = 0;
  holdings.forEach((h) => {
    const fraction = h.value / totalValue;
    hhi += fraction * fraction;
  });
  // Perfect diversification = 1/N, worst = 1.0
  // HHI scale: < 0.15 is un-concentrated, > 0.25 is highly concentrated
  let concentration = Math.max(10, Math.min(100, Math.round((1 - hhi) * 120)));
  
  const topHolding = holdings[0];
  if (topHolding && topHolding.allocationPercentage > 40) {
    signals.push({
      level: 'HIGH',
      title: 'HIGH SINGLE-ASSET CONCENTRATION',
      description: `${topHolding.token.symbol} comprises ${topHolding.allocationPercentage}% of your total portfolio, dominating volatility.`,
      category: 'concentration',
    });
  } else if (topHolding && topHolding.allocationPercentage > 25) {
    signals.push({
      level: 'MEDIUM',
      title: 'ELEVATED TOP-HOLDING WEIGHT',
      description: `${topHolding.token.symbol} represents ${topHolding.allocationPercentage}% of total onchain value.`,
      category: 'concentration',
    });
  }

  // 3. Sector Diversification Score
  const sectorMap: Record<string, number> = {};
  holdings.forEach((h) => {
    const sec = h.token.sector || 'Equities';
    sectorMap[sec] = (sectorMap[sec] || 0) + h.value;
  });

  const numSectors = Object.keys(sectorMap).length;
  let diversification = Math.min(100, numSectors * 22 + (count >= 5 ? 12 : 0));

  // Check sector concentration (e.g. Technology > 60%)
  for (const [sec, secValue] of Object.entries(sectorMap)) {
    const secPercent = (secValue / totalValue) * 100;
    if (secPercent > 60) {
      signals.push({
        level: 'HIGH',
        title: `HIGH ${sec.toUpperCase()} CONCENTRATION`,
        description: `${sec} represents ${secPercent.toFixed(1)}% of your portfolio onchain. Market shocks in this sector will disproportionately impact total value.`,
        category: 'sector',
      });
    } else if (secPercent > 40) {
      signals.push({
        level: 'MEDIUM',
        title: `ELEVATED ${sec.toUpperCase()} EXPOSURE`,
        description: `${sec} constitutes ${secPercent.toFixed(1)}% of your Robinhood Chain holdings.`,
        category: 'sector',
      });
    }
  }

  // 4. Volatility Exposure Score (Weighted Beta)
  let weightedBeta = 0;
  holdings.forEach((h) => {
    const weight = h.value / totalValue;
    weightedBeta += (h.token.beta || 1.0) * weight;
  });
  // Beta 1.0 = score 75. Beta > 1.5 = high volatility (score 40). Beta < 0.9 = defensive (score 90).
  let volatilityExposure = Math.max(20, Math.min(100, Math.round(100 - (weightedBeta - 0.7) * 45)));

  if (weightedBeta > 1.4) {
    signals.push({
      level: 'HIGH',
      title: 'HIGH VOLATILITY EXPOSURE',
      description: `Weighted portfolio Beta is ${weightedBeta.toFixed(2)}, indicating ~${Math.round((weightedBeta - 1) * 100)}% higher volatility than the broader equity index.`,
      category: 'volatility',
    });
  } else if (weightedBeta > 1.15) {
    signals.push({
      level: 'MEDIUM',
      title: 'SLIGHTLY AGGRESSIVE BETA',
      description: `Weighted portfolio Beta is ${weightedBeta.toFixed(2)}, positioned for growth with moderate market sensitivity.`,
      category: 'volatility',
    });
  }

  // Combined score formula: 30% Diversification + 30% Concentration + 20% Asset Count + 20% Volatility
  const overallScore = Math.max(
    15,
    Math.min(99, Math.round(diversification * 0.3 + concentration * 0.3 + assetCountScore * 0.2 + volatilityExposure * 0.2))
  );

  let rating: PortfolioHealthScore['rating'] = 'Balanced';
  if (overallScore >= 80) rating = 'Optimal';
  else if (overallScore >= 65) rating = 'Balanced';
  else if (overallScore >= 45) rating = 'Moderate Risk';
  else rating = 'High Risk';

  const summaryText = `Your Robinhood Chain portfolio holds ${count} asset${count > 1 ? 's' : ''} across ${numSectors} sector${numSectors > 1 ? 's' : ''} with a weighted beta of ${weightedBeta.toFixed(2)}. Health is categorized as ${rating}.`;

  return {
    score: overallScore,
    diversification,
    concentration,
    assetCountScore,
    volatilityExposure,
    rating,
    signals,
    summaryText,
  };
}

/**
 * Scenario Simulator: Calculate multi-asset shocks entirely client-side
 */
export function simulateMarketScenario(
  summary: PortfolioSummary,
  changes: SimulatedAssetChange[]
): SimulationResult {
  const originalTotalValue = summary.totalValue;
  let simulatedTotalValue = 0;

  const changeMap: Record<string, number> = {};
  changes.forEach(c => {
    changeMap[c.symbol.toUpperCase()] = c.percentChange;
  });

  const assetBreakdown = summary.holdings.map((h) => {
    const percentChange = changeMap[h.token.symbol.toUpperCase()] ?? 0;
    const originalPrice = h.price;
    const newPrice = Number((originalPrice * (1 + percentChange / 100)).toFixed(2));
    const originalValue = h.value;
    const newValue = Number((h.balanceFormatted * newPrice).toFixed(2));
    const deltaValue = Number((newValue - originalValue).toFixed(2));

    simulatedTotalValue += newValue;

    return {
      symbol: h.token.symbol,
      name: h.token.name,
      originalPrice,
      newPrice,
      originalValue,
      newValue,
      deltaValue,
      percentChange,
    };
  });

  const deltaAmount = Number((simulatedTotalValue - originalTotalValue).toFixed(2));
  const deltaPercent = originalTotalValue > 0 ? Number(((deltaAmount / originalTotalValue) * 100).toFixed(2)) : 0;

  return {
    originalTotalValue,
    simulatedTotalValue: Number(simulatedTotalValue.toFixed(2)),
    deltaAmount,
    deltaPercent,
    assetBreakdown,
  };
}

/**
 * Deterministic AI Portfolio Analysis Fallback
 */
export function generateDeterministicAIAnalysis(summary: PortfolioSummary): AIAnalysisResult {
  if (!summary || summary.holdings.length === 0) {
    return {
      executiveSummary: 'Connect your EVM wallet or switch to Robinhood Chain to analyze your tokenized stock holdings.',
      riskSignals: [],
      insights: ['No token balances detected on Robinhood Chain.'],
      suggestedQuestions: [
        'How do I acquire Robinhood Stock Tokens?',
        'What stock tokens are supported on Robinhood Chain?',
        'How does onchain stock settlement work?',
      ],
      sectorDistribution: [],
      isAIPowered: false,
    };
  }

  const health = calculatePortfolioHealthScore(summary);
  const { holdings, totalValue } = summary;

  // Sector breakdown
  const sectorMap: Record<string, number> = {};
  holdings.forEach(h => {
    const sec = h.token.sector || 'Equities';
    sectorMap[sec] = (sectorMap[sec] || 0) + h.value;
  });
  const sectorDistribution = Object.entries(sectorMap).map(([sector, val]) => ({
    sector,
    percentage: Number(((val / totalValue) * 100).toFixed(1)),
  })).sort((a, b) => b.percentage - a.percentage);

  const topSector = sectorDistribution[0];
  const topAsset = holdings[0];

  let execSummary = `Your tokenized stock portfolio on Robinhood Chain holds $${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })} across ${holdings.length} assets. `;
  if (topSector && topSector.percentage > 50) {
    execSummary += `It is heavily concentrated in ${topSector.sector} (${topSector.percentage}%). `;
  }
  if (topAsset && topAsset.allocationPercentage > 25) {
    execSummary += `${topAsset.token.symbol} is your largest position representing ${topAsset.allocationPercentage}% of holdings.`;
  }

  const insights: string[] = [
    `Asset Concentration: Top holding ${topAsset?.token.symbol || 'N/A'} accounts for $${(topAsset?.value || 0).toLocaleString()} (${topAsset?.allocationPercentage || 0}%).`,
    `Sector Exposure: ${sectorDistribution.map(s => `${s.sector} ${s.percentage}%`).join(' • ')}.`,
    `Risk Rating: Portfolio Health Score is ${health.score}/100 (${health.rating}).`,
    `Scenario Baseline: A 10% decline in ${topAsset?.token.symbol} would reduce total portfolio value by ~$${((topAsset?.value || 0) * 0.1).toFixed(2)} (${(((topAsset?.value || 0) * 0.1 / totalValue) * 100).toFixed(2)}%).`,
  ];

  const suggestedQuestions = [
    `What happens if ${topAsset?.token.symbol || 'NVDA'} falls 10%?`,
    `How does my ${topSector?.sector || 'Tech'} exposure affect portfolio volatility?`,
    `What are the benefits of tokenized stock settlement on Robinhood Chain?`,
    `How would a broad market drop of 5% impact my positions?`,
  ];

  return {
    executiveSummary: execSummary,
    riskSignals: health.signals,
    insights,
    suggestedQuestions,
    sectorDistribution,
    isAIPowered: false,
  };
}

/**
 * Generate simulated derived historical chart points for performance chart
 */
export function generateDerivedPerformanceData(currentValue: number, timeframe: '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL' = '1M') {
  const pointsCount = timeframe === '1D' ? 24 : timeframe === '1W' ? 28 : timeframe === '1M' ? 30 : timeframe === '3M' ? 45 : 60;
  const now = Date.now();
  const stepMs = timeframe === '1D' ? 3600000 : timeframe === '1W' ? 6 * 3600000 : timeframe === '1M' ? 24 * 3600000 : 3 * 24 * 3600000;
  
  // Create a realistic stochastic walk ending exactly at currentValue
  const points: { timestamp: string; date: string; value: number; benchmark: number }[] = [];
  const baseGrowthRate = 0.0008;
  const volatility = timeframe === '1D' ? 0.004 : 0.012;

  // Work backwards from current value
  let walkValue = currentValue;
  const values: number[] = [currentValue];

  for (let i = 1; i < pointsCount; i++) {
    const shock = (Math.sin(i * 1.3) * 0.5 + (Math.cos(i * 2.1) * 0.3) + (Math.random() - 0.48)) * volatility;
    walkValue = walkValue / (1 + baseGrowthRate + shock);
    values.unshift(Number(walkValue.toFixed(2)));
  }

  for (let i = 0; i < pointsCount; i++) {
    const time = new Date(now - (pointsCount - 1 - i) * stepMs);
    const dateStr = timeframe === '1D' 
      ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : time.toLocaleDateString([], { month: 'short', day: 'numeric' });
    
    // Benchmark S&P token equivalent
    const initialVal = values[0];
    const progress = i / pointsCount;
    const benchmark = Number((initialVal * (1 + progress * 0.04 + Math.sin(i * 0.4) * 0.01)).toFixed(2));

    points.push({
      timestamp: time.toISOString(),
      date: dateStr,
      value: values[i],
      benchmark,
    });
  }

  return points;
}
