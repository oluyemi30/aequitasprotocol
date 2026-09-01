import { useState, useCallback, useEffect } from 'react';
import {
  StructuredStrategy,
  StrategyValidationResult,
  StrategyTransactionStep,
  PortfolioSummary,
  RobinhoodStockToken,
  StrategySimulationPoint,
} from '../types';
import {
  validateStrategy,
  generateTransactionPlan,
  parseStrategyFromPromptFallback,
  STRATEGY_PRESETS,
} from '../lib/strategy';
import { ROBINHOOD_STOCK_TOKENS, getTokenBySymbol } from '../lib/stock-tokens';
import { DEFAULT_CHAIN_ID } from '../lib/robinhood-chain';

export function useStrategy(
  portfolio: PortfolioSummary | null,
  chainId: number = DEFAULT_CHAIN_ID,
  isLiveMode: boolean = true
) {
  const [activeStrategy, setActiveStrategy] = useState<StructuredStrategy>(() => {
    return parseStrategyFromPromptFallback(STRATEGY_PRESETS[0].prompt, 1000, 30);
  });

  const [promptInput, setPromptInput] = useState<string>(STRATEGY_PRESETS[0].prompt);
  const [capitalInput, setCapitalInput] = useState<number>(1000);
  const [maxConstraintInput, setMaxConstraintInput] = useState<number>(30);
  const [slippageInput, setSlippageInput] = useState<number>(0.5);

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Strategy Validation
  const [validation, setValidation] = useState<StrategyValidationResult>(() =>
    validateStrategy(activeStrategy, portfolio?.ethBalance ?? 0.5, portfolio?.totalValue ?? 5000)
  );

  // Step-by-Step Transaction Plan
  const [transactionPlan, setTransactionPlan] = useState<StrategyTransactionStep[]>(() =>
    generateTransactionPlan(activeStrategy, chainId, slippageInput)
  );

  // Simulation State for shock testing
  const [simulatedShocks, setSimulatedShocks] = useState<Record<string, number>>({});

  // Recalculate validation and transaction plan whenever strategy, portfolio, or chain changes
  useEffect(() => {
    const val = validateStrategy(
      activeStrategy,
      portfolio?.ethBalance || (isLiveMode ? 0.05 : 0.8),
      portfolio?.totalValue || 5000
    );
    setValidation(val);
    setTransactionPlan(generateTransactionPlan(activeStrategy, chainId, slippageInput));
  }, [activeStrategy, portfolio, chainId, isLiveMode, slippageInput]);

  /**
   * Synthesize a new strategy using Gemini AI endpoint with robust mathematical fallback
   */
  const generateStrategy = useCallback(
    async (prompt: string, capital?: number, maxCap?: number) => {
      setIsGenerating(true);
      setGenerationError(null);
      const cap = capital !== undefined ? capital : capitalInput;
      const constraint = maxCap !== undefined ? maxCap : maxConstraintInput;

      try {
        const holdingsList = portfolio?.holdings || [];
        const response = await fetch('/api/ai/strategy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            userCapital: cap,
            maxConstraint: constraint,
            currentHoldings: holdingsList.map((h) => ({
              symbol: h.token.symbol,
              percent: h.allocationPercentage,
              value: h.value,
            })),
            networkMode: chainId === 4663 ? 'mainnet' : 'testnet',
          }),
        });

        if (!response.ok) {
          throw new Error(`Server returned HTTP ${response.status}`);
        }

        const data = await response.json();

        // If the AI returned a valid structured payload
        if (data && data.assets && Array.isArray(data.assets) && data.assets.length > 0) {
          // Normalize assets against Robinhood token registry
          const normalizedAssets = data.assets.map((a: any) => {
            const token = getTokenBySymbol(a.symbol) || ROBINHOOD_STOCK_TOKENS[0];
            const alloc = Math.round((a.allocation || a.allocationPercent || 0.25) * (a.allocation <= 1 ? 100 : 1));
            const targetUsd = (alloc / 100) * (data.capital || cap);
            const price = token.price || 150;
            return {
              symbol: token.symbol,
              name: token.name,
              allocationPercent: alloc,
              targetAmountUsd: targetUsd,
              estimatedTokens: targetUsd / price,
              price,
              contractAddress: token.contractAddress,
              sector: token.sector,
              beta: token.beta,
              routeStatus: 'available' as const,
            };
          });

          // Ensure total allocation is 100%
          const sumAlloc = normalizedAssets.reduce((s: number, a: any) => s + a.allocationPercent, 0);
          if (sumAlloc !== 100 && normalizedAssets.length > 0) {
            const diff = 100 - sumAlloc;
            normalizedAssets[0].allocationPercent += diff;
            normalizedAssets[0].targetAmountUsd = (normalizedAssets[0].allocationPercent / 100) * (data.capital || cap);
            normalizedAssets[0].estimatedTokens = normalizedAssets[0].targetAmountUsd / normalizedAssets[0].price;
          }

          const newStrat: StructuredStrategy = {
            id: `strat-${Date.now()}`,
            title: data.title || `${data.objective || 'Custom'} Strategy`,
            objective: data.objective || 'AI synthesized stock token allocation on Robinhood Chain',
            capital: data.capital || cap,
            maxSingleAssetAllocationPercent: data.max_single_asset_allocation ? Math.round(data.max_single_asset_allocation * 100) : constraint,
            assets: normalizedAssets,
            rawPrompt: prompt,
            createdAt: new Date().toISOString(),
            isAiGenerated: true,
            strategyType: data.strategy_type || 'diversified',
            aiRationale: data.rationale || 'Synthesized by Gemini 3.7 Flash on Robinhood Chain testnet.',
          };

          setActiveStrategy(newStrat);
          setSimulatedShocks({});
        } else {
          // Fallback parsing
          const fallbackStrat = parseStrategyFromPromptFallback(prompt, cap, constraint);
          setActiveStrategy(fallbackStrat);
          setSimulatedShocks({});
        }
      } catch (err: any) {
        console.warn('Strategy generation error, using fallback deterministic synthesizer:', err);
        const fallbackStrat = parseStrategyFromPromptFallback(prompt, cap, constraint);
        setActiveStrategy(fallbackStrat);
        setSimulatedShocks({});
      } finally {
        setIsGenerating(false);
      }
    },
    [capitalInput, maxConstraintInput, portfolio, chainId]
  );

  /**
   * Apply a preset strategy template
   */
  const applyPreset = useCallback(
    (presetId: string) => {
      const preset = STRATEGY_PRESETS.find((p) => p.id === presetId);
      if (!preset) return;

      setPromptInput(preset.prompt);
      if (preset.defaultCapital > 0) {
        setCapitalInput(preset.defaultCapital);
      }
      generateStrategy(preset.prompt, preset.defaultCapital > 0 ? preset.defaultCapital : capitalInput);
    },
    [generateStrategy, capitalInput]
  );

  /**
   * Apply shock simulation to an individual asset
   */
  const setAssetShock = useCallback((symbol: string, percent: number) => {
    setSimulatedShocks((prev) => ({
      ...prev,
      [symbol]: percent,
    }));
  }, []);

  /**
   * Reset all simulation shocks
   */
  const resetShocks = useCallback(() => {
    setSimulatedShocks({});
  }, []);

  // Compute Simulated Portfolio Value
  const simulatedPortfolio = (() => {
    const originalCapital = activeStrategy?.capital || 0;
    let simulatedCapital = 0;
    const assets = Array.isArray(activeStrategy?.assets) ? activeStrategy.assets : [];

    const simulatedAssets = assets.map((asset) => {
      const shock = (simulatedShocks && simulatedShocks[asset.symbol]) || 0;
      const originalValue = asset.targetAmountUsd || 0;
      const newValue = originalValue * (1 + shock / 100);
      simulatedCapital += newValue;
      return {
        ...asset,
        shockPercent: shock,
        originalValue,
        newValue,
        deltaUsd: newValue - originalValue,
      };
    });

    const deltaUsd = simulatedCapital - originalCapital;
    const deltaPercent = originalCapital > 0 ? (deltaUsd / originalCapital) * 100 : 0;

    return {
      originalCapital,
      simulatedCapital,
      deltaUsd,
      deltaPercent,
      simulatedAssets,
      hasShocks: Object.values(simulatedShocks || {}).some((v) => v !== 0),
    };
  })();

  return {
    activeStrategy,
    promptInput,
    setPromptInput,
    capitalInput,
    setCapitalInput,
    maxConstraintInput,
    setMaxConstraintInput,
    slippageInput,
    setSlippageInput,
    isGenerating,
    generationError,
    validation,
    transactionPlan,
    simulatedShocks,
    setAssetShock,
    resetShocks,
    simulatedPortfolio,
    generateStrategy,
    applyPreset,
    setActiveStrategy,
  };
}
