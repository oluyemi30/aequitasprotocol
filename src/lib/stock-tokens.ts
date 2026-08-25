import { RobinhoodStockToken } from '../types';

// Default Robinhood Stock Tokens registry for Robinhood Chain Mainnet (4663) & Testnet (46630)
export const DEFAULT_STOCK_TOKENS: RobinhoodStockToken[] = [
  {
    symbol: 'AAPL',
    name: 'Apple Inc. Tokenized Stock',
    contractAddress: '0x100000000000000000000000000000000000aApL',
    chainId: 46630,
    logo: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=128&auto=format&fit=crop&q=80',
    currentMultiplier: 1.0,
    tradingStatus: 'active',
    decimals: 18,
    sector: 'Technology',
    industry: 'Consumer Electronics',
    marketCap: '$3.42T',
    peRatio: 33.4,
    dividendYield: 0.48,
    beta: 1.12,
    price: 234.82,
    change24h: 3.42,
    change24hPercent: 1.48,
    description: 'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories.',
  },
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation Tokenized Stock',
    contractAddress: '0x200000000000000000000000000000000000nVdA',
    chainId: 46630,
    logo: 'https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=128&auto=format&fit=crop&q=80',
    currentMultiplier: 1.0,
    tradingStatus: 'active',
    decimals: 18,
    sector: 'Technology',
    industry: 'Semiconductors',
    marketCap: '$3.15T',
    peRatio: 52.8,
    dividendYield: 0.03,
    beta: 1.75,
    price: 138.25,
    change24h: 4.85,
    change24hPercent: 3.64,
    description: 'NVIDIA Corporation provides graphics, computing and networking solutions, pioneering accelerated computing and AI hardware.',
  },
  {
    symbol: 'GOOGL',
    name: 'Alphabet Inc. Tokenized Stock',
    contractAddress: '0x300000000000000000000000000000000000gOoG',
    chainId: 46630,
    logo: 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=128&auto=format&fit=crop&q=80',
    currentMultiplier: 1.0,
    tradingStatus: 'active',
    decimals: 18,
    sector: 'Communication Services',
    industry: 'Internet Content & Information',
    marketCap: '$2.28T',
    peRatio: 24.1,
    dividendYield: 0.45,
    beta: 1.05,
    price: 182.60,
    change24h: -1.15,
    change24hPercent: -0.63,
    description: 'Alphabet Inc. offers products and platforms in the United States, Europe, the Middle East, Africa, the Asia-Pacific, and Canada.',
  },
  {
    symbol: 'AMZN',
    name: 'Amazon.com Inc. Tokenized Stock',
    contractAddress: '0x400000000000000000000000000000000000AmZn',
    chainId: 46630,
    logo: 'https://images.unsplash.com/photo-1523474255658-4af91004901b?w=128&auto=format&fit=crop&q=80',
    currentMultiplier: 1.0,
    tradingStatus: 'active',
    decimals: 18,
    sector: 'Consumer Cyclical',
    industry: 'Internet Retail & Cloud',
    marketCap: '$2.14T',
    peRatio: 41.2,
    dividendYield: 0.0,
    beta: 1.18,
    price: 198.40,
    change24h: 2.10,
    change24hPercent: 1.07,
    description: 'Amazon.com, Inc. focuses on retail sale of consumer products and subscriptions through online and physical stores, plus AWS cloud.',
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corporation Tokenized Stock',
    contractAddress: '0x500000000000000000000000000000000000MsFt',
    chainId: 46630,
    logo: 'https://images.unsplash.com/photo-1642132652075-2b23a9d9e602?w=128&auto=format&fit=crop&q=80',
    currentMultiplier: 1.0,
    tradingStatus: 'active',
    decimals: 18,
    sector: 'Technology',
    industry: 'Software - Infrastructure',
    marketCap: '$3.22T',
    peRatio: 34.6,
    dividendYield: 0.72,
    beta: 0.94,
    price: 448.90,
    change24h: 1.75,
    change24hPercent: 0.39,
    description: 'Microsoft Corporation develops and supports software, services, devices and solutions worldwide, including Azure and Office.',
  },
  {
    symbol: 'TSLA',
    name: 'Tesla, Inc. Tokenized Stock',
    contractAddress: '0x600000000000000000000000000000000000tSLa',
    chainId: 46630,
    logo: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=128&auto=format&fit=crop&q=80',
    currentMultiplier: 1.0,
    tradingStatus: 'active',
    decimals: 18,
    sector: 'Consumer Cyclical',
    industry: 'Auto Manufacturers & Clean Tech',
    marketCap: '$790B',
    peRatio: 68.3,
    dividendYield: 0.0,
    beta: 2.34,
    price: 246.50,
    change24h: -5.40,
    change24hPercent: -2.14,
    description: 'Tesla, Inc. designs, develops, manufactures, sells, and leases electric vehicles, energy generation and storage systems.',
  },
  {
    symbol: 'META',
    name: 'Meta Platforms, Inc. Tokenized Stock',
    contractAddress: '0x700000000000000000000000000000000000mEtA',
    chainId: 46630,
    logo: 'https://images.unsplash.com/photo-1633675254053-d96c7668c3b8?w=128&auto=format&fit=crop&q=80',
    currentMultiplier: 1.0,
    tradingStatus: 'active',
    decimals: 18,
    sector: 'Communication Services',
    industry: 'Internet Content & Information',
    marketCap: '$1.48T',
    peRatio: 26.8,
    dividendYield: 0.35,
    beta: 1.25,
    price: 592.10,
    change24h: 8.60,
    change24hPercent: 1.47,
    description: 'Meta Platforms, Inc. engages in the development of products that enable people to connect through mobile devices, VR, and AI.',
  },
  {
    symbol: 'COIN',
    name: 'Coinbase Global, Inc. Tokenized Stock',
    contractAddress: '0x800000000000000000000000000000000000cOiN',
    chainId: 46630,
    logo: 'https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?w=128&auto=format&fit=crop&q=80',
    currentMultiplier: 1.0,
    tradingStatus: 'active',
    decimals: 18,
    sector: 'Financial Services',
    industry: 'Financial Data & Stock Exchanges',
    marketCap: '$62B',
    peRatio: 38.5,
    dividendYield: 0.0,
    beta: 2.85,
    price: 218.75,
    change24h: 11.20,
    change24hPercent: 5.40,
    description: 'Coinbase Global, Inc. provides financial infrastructure and technology for the cryptoeconomy in the United States and internationally.',
  },
  {
    symbol: 'SPY',
    name: 'SPDR S&P 500 ETF Trust Token',
    contractAddress: '0x900000000000000000000000000000000000sPyE',
    chainId: 46630,
    logo: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=128&auto=format&fit=crop&q=80',
    currentMultiplier: 1.0,
    tradingStatus: 'active',
    decimals: 18,
    sector: 'Index ETF',
    industry: 'Broad Market Equity',
    marketCap: '$580B',
    peRatio: 26.5,
    dividendYield: 1.24,
    beta: 1.0,
    price: 586.40,
    change24h: 4.10,
    change24hPercent: 0.70,
    description: 'The SPDR S&P 500 ETF Trust seeks to provide investment results that correspond generally to the price and yield performance of the S&P 500 Index.',
  },
  {
    symbol: 'QQQ',
    name: 'Invesco QQQ Trust Series 1 Token',
    contractAddress: '0xA00000000000000000000000000000000000qQqT',
    chainId: 46630,
    logo: 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=128&auto=format&fit=crop&q=80',
    currentMultiplier: 1.0,
    tradingStatus: 'active',
    decimals: 18,
    sector: 'Index ETF',
    industry: 'Nasdaq 100 Tech Equity',
    marketCap: '$290B',
    peRatio: 31.2,
    dividendYield: 0.58,
    beta: 1.15,
    price: 504.30,
    change24h: 5.80,
    change24hPercent: 1.16,
    description: 'Invesco QQQ is an exchange-traded fund based on the Nasdaq-100 Index, holding the 100 largest non-financial companies on Nasdaq.',
  },
];

/**
 * Fetch Robinhood Stock Tokens registry dynamically.
 * Abstracted API layer with fallback.
 */
export async function fetchRobinhoodStockTokens(chainId: number = 46630): Promise<RobinhoodStockToken[]> {
  try {
    const response = await fetch('/api/rhj/assets', {
      headers: { 'Accept': 'application/json' },
    });
    
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map((item) => ({
          symbol: item.symbol,
          name: item.name || `${item.symbol} Stock Token`,
          contractAddress: item.contractAddress || item.contract_address,
          chainId: item.chainId || item.chain_id || chainId,
          logo: item.logo || DEFAULT_STOCK_TOKENS.find(t => t.symbol === item.symbol)?.logo || '',
          currentMultiplier: item.currentMultiplier || item.current_multiplier || 1.0,
          tradingStatus: item.tradingStatus || item.trading_status || 'active',
          decimals: item.decimals || 18,
          sector: item.sector || DEFAULT_STOCK_TOKENS.find(t => t.symbol === item.symbol)?.sector || 'Equities',
          industry: item.industry || DEFAULT_STOCK_TOKENS.find(t => t.symbol === item.symbol)?.industry || 'Tokenized Stock',
          marketCap: item.marketCap || DEFAULT_STOCK_TOKENS.find(t => t.symbol === item.symbol)?.marketCap || '$100B+',
          peRatio: item.peRatio || DEFAULT_STOCK_TOKENS.find(t => t.symbol === item.symbol)?.peRatio,
          dividendYield: item.dividendYield || DEFAULT_STOCK_TOKENS.find(t => t.symbol === item.symbol)?.dividendYield,
          beta: item.beta || DEFAULT_STOCK_TOKENS.find(t => t.symbol === item.symbol)?.beta || 1.0,
          description: item.description || DEFAULT_STOCK_TOKENS.find(t => t.symbol === item.symbol)?.description || 'Robinhood Chain Tokenized Stock asset.',
        }));
      }
    }
  } catch (err) {
    console.warn('Dynamic Robinhood token asset registry fetch failed, using built-in registry:', err);
  }

  // Fallback to configured tokens mapped to the requested chainId
  return DEFAULT_STOCK_TOKENS.map(token => ({
    ...token,
    chainId,
  }));
}

export function findTokenByAddress(address: string, tokens: RobinhoodStockToken[] = DEFAULT_STOCK_TOKENS): RobinhoodStockToken | undefined {
  if (!address) return undefined;
  const normalized = address.toLowerCase();
  return tokens.find(t => t.contractAddress.toLowerCase() === normalized);
}

export function findTokenBySymbol(symbol: string, tokens: RobinhoodStockToken[] = DEFAULT_STOCK_TOKENS): RobinhoodStockToken | undefined {
  if (!symbol) return undefined;
  const normalized = symbol.toUpperCase();
  return tokens.find(t => t.symbol.toUpperCase() === normalized);
}

// Aliases for clean strategy engine integration
export const ROBINHOOD_STOCK_TOKENS = DEFAULT_STOCK_TOKENS;
export const getTokenBySymbol = findTokenBySymbol;
