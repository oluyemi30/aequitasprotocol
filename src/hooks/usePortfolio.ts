import { useState, useEffect, useCallback } from 'react';
import { PortfolioSummary, PortfolioHealthScore, RobinhoodStockToken } from '../types';
import { 
  fetchWalletPortfolio, 
  getDemoPortfolio, 
  calculatePortfolioHealthScore, 
  generateDeterministicAIAnalysis 
} from '../lib/portfolio';

export function usePortfolio(
  address: string | null,
  chainId: number,
  isDemoWallet: boolean,
  tokens: RobinhoodStockToken[]
) {
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [healthScore, setHealthScore] = useState<PortfolioHealthScore | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadPortfolio = useCallback(async (refreshOnly = false) => {
    if (!address) {
      setPortfolio(null);
      setHealthScore(null);
      return;
    }

    if (refreshOnly) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      let data: PortfolioSummary;
      if (isDemoWallet) {
        data = await getDemoPortfolio(address, chainId);
      } else {
        data = await fetchWalletPortfolio(address, chainId, tokens);
      }

      setPortfolio(data);
      const score = calculatePortfolioHealthScore(data);
      setHealthScore(score);
    } catch (err: any) {
      console.error('Portfolio load error:', err);
      setError(err?.message || 'Unable to load Robinhood Chain data.');
      // If live blockchain read fails on testnet, generate deterministic fallback
      if (isDemoWallet) {
        const demo = await getDemoPortfolio(address, chainId);
        setPortfolio(demo);
        setHealthScore(calculatePortfolioHealthScore(demo));
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [address, chainId, isDemoWallet, tokens]);

  useEffect(() => {
    loadPortfolio();
  }, [loadPortfolio]);

  // Auto-refresh prices and balances every 45s
  useEffect(() => {
    if (!address) return;
    const interval = setInterval(() => {
      loadPortfolio(true);
    }, 45000);
    return () => clearInterval(interval);
  }, [address, loadPortfolio]);

  return {
    portfolio,
    healthScore,
    isLoading,
    isRefreshing,
    error,
    refreshPortfolio: () => loadPortfolio(true),
  };
}
