import { useState, useEffect } from 'react';
import { RobinhoodStockToken } from '../types';
import { fetchRobinhoodStockTokens, DEFAULT_STOCK_TOKENS } from '../lib/stock-tokens';

export function useStockTokens(chainId: number) {
  const [tokens, setTokens] = useState<RobinhoodStockToken[]>(DEFAULT_STOCK_TOKENS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const list = await fetchRobinhoodStockTokens(chainId);
        if (isMounted) {
          setTokens(list);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Failed to load tokens');
          setTokens(DEFAULT_STOCK_TOKENS);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [chainId]);

  return { tokens, isLoading, error };
}
