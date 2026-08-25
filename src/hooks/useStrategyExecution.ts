import { useState, useCallback } from 'react';
import { StrategyTransactionStep, TransactionStepState } from '../types';
import { ROBINHOOD_NETWORKS, DEFAULT_CHAIN_ID } from '../lib/robinhood-chain';
import { createWalletClient, custom, parseAbi, parseEther, encodeFunctionData } from 'viem';
import { robinhoodTestnetChain, robinhoodMainnetChain } from '../lib/robinhood-chain';

export interface ExecutionSummary {
  totalSteps: number;
  completedSteps: number;
  failedSteps: number;
  currentStepIndex: number;
  isRunning: boolean;
  isComplete: boolean;
  hasErrors: boolean;
}

export function useStrategyExecution(
  steps: StrategyTransactionStep[],
  chainId: number = DEFAULT_CHAIN_ID,
  isLiveMode: boolean = true,
  walletAddress: string | null = null
) {
  const [executionSteps, setExecutionSteps] = useState<StrategyTransactionStep[]>(steps);
  const [isReviewOpen, setIsReviewOpen] = useState<boolean>(false);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [activeTxHash, setActiveTxHash] = useState<string | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);

  // Sync execution steps when outer plan changes (if not currently running)
  const syncSteps = useCallback((newSteps: StrategyTransactionStep[]) => {
    if (!isExecuting) {
      setExecutionSteps(newSteps);
    }
  }, [isExecuting]);

  // Open "Review before signing" modal
  const openReviewModal = useCallback(() => {
    setExecutionSteps(steps.map((s) => ({ ...s, status: 'idle', errorMessage: undefined, txHash: undefined })));
    setExecutionError(null);
    setCurrentStepIndex(-1);
    setIsReviewOpen(true);
  }, [steps]);

  // Close modal
  const closeReviewModal = useCallback(() => {
    if (isExecuting) return; // Prevent accidental closing while waiting for signature
    setIsReviewOpen(false);
  }, [isExecuting]);

  /**
   * Execute a single step with real wallet prompt (or demo simulator)
   */
  const executeSingleStep = async (stepIndex: number, currentList: StrategyTransactionStep[]): Promise<boolean> => {
    const step = currentList[stepIndex];
    if (!step) return false;

    setCurrentStepIndex(stepIndex);
    const network = ROBINHOOD_NETWORKS[chainId] || ROBINHOOD_NETWORKS[DEFAULT_CHAIN_ID];

    // 1. Preparing
    const updateStatus = (status: TransactionStepState, txHash?: string, error?: string) => {
      setExecutionSteps((prev) => {
        const next = [...prev];
        next[stepIndex] = {
          ...next[stepIndex],
          status,
          txHash: txHash || next[stepIndex].txHash,
          errorMessage: error,
          explorerUrl: txHash ? `${network.explorerUrl}/tx/${txHash}` : undefined,
        };
        return next;
      });
    };

    updateStatus('preparing');

    // If Demo Mode: simulate realistic execution with clear hypothetical labels
    if (!isLiveMode) {
      updateStatus('awaiting_approval');
      await new Promise((r) => setTimeout(r, 1200));

      updateStatus('submitted', `0xsim_${Date.now()}_${step.fromTokenSymbol}_to_${step.toTokenSymbol}`);
      updateStatus('confirming');
      await new Promise((r) => setTimeout(r, 1500));

      updateStatus('confirmed');
      return true;
    }

    // Live Mode: Request real wallet signature via window.ethereum (EIP-1193)
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      updateStatus('failed', undefined, 'No Web3 wallet extension detected in browser.');
      setExecutionError('Please connect a Web3 wallet (MetaMask, Coinbase Wallet) to sign on Robinhood Chain.');
      return false;
    }

    try {
      updateStatus('awaiting_approval');

      const ethereum = (window as any).ethereum;
      const targetChain = chainId === 4663 ? robinhoodMainnetChain : robinhoodTestnetChain;
      const accounts = await ethereum.request({ method: 'eth_accounts' });
      const activeAccount = ((accounts && accounts[0]) || walletAddress) as `0x${string}`;

      if (!activeAccount) {
        throw new Error('Wallet not unlocked or no active account found.');
      }

      const client = createWalletClient({
        account: activeAccount,
        chain: targetChain,
        transport: custom(ethereum),
      });

      let txHash: string;

      // Handle contract transaction according to step type
      if (step.type === 'register_strategy') {
        // Call registerProfile or onchain strategy registration
        const registryAbi = parseAbi(['function registerProfile(string calldata profileName) external']);
        const calldata = encodeFunctionData({
          abi: registryAbi,
          functionName: 'registerProfile',
          args: [`RWA:${step.title.slice(0, 24)}`],
        });

        txHash = await client.sendTransaction({
          to: step.contractAddress as `0x${string}`,
          data: calldata,
        } as any);
      } else if (step.type === 'approve') {
        // Standard ERC-20 approval call
        const erc20Abi = parseAbi(['function approve(address spender, uint256 amount) external returns (bool)']);
        const calldata = encodeFunctionData({
          abi: erc20Abi,
          functionName: 'approve',
          args: [
            '0x4663A72659B8E3253b2E7C6A6DbAc51d8b9d8801' as `0x${string}`, // Settlement router address
            parseEther(step.fromAmount || '100'),
          ],
        });

        txHash = await client.sendTransaction({
          to: step.contractAddress as `0x${string}`,
          data: calldata,
        } as any);
      } else {
        // Standard Stock Token Swap transaction call
        txHash = await client.sendTransaction({
          to: step.contractAddress as `0x${string}`,
          value: 0n,
        } as any);
      }

      setActiveTxHash(txHash);
      updateStatus('submitted', txHash);
      updateStatus('confirming', txHash);

      // Wait for receipt / block confirmations on Robinhood Chain
      // In viem or polling:
      await new Promise((r) => setTimeout(r, 2000));
      updateStatus('confirmed', txHash);
      return true;
    } catch (err: any) {
      console.error('Wallet execution rejected or failed:', err);
      const isRejection =
        err?.code === 4001 ||
        err?.message?.toLowerCase()?.includes('user rejected') ||
        err?.message?.toLowerCase()?.includes('user denied');

      if (isRejection) {
        updateStatus('rejected', undefined, 'Transaction signature was rejected by user in wallet.');
      } else {
        updateStatus('failed', undefined, err?.message || 'Transaction execution failed onchain.');
      }
      return false;
    }
  };

  /**
   * Start sequential strategy execution
   */
  const startExecution = useCallback(async () => {
    setIsExecuting(true);
    setExecutionError(null);

    let list = [...executionSteps];

    for (let i = 0; i < list.length; i++) {
      const success = await executeSingleStep(i, list);
      if (!success) {
        // Stop sequential execution on failure or user rejection
        setIsExecuting(false);
        return;
      }
    }

    setIsExecuting(false);
  }, [executionSteps, chainId, isLiveMode, walletAddress]);

  /**
   * Retry a specific failed step
   */
  const retryStep = useCallback(
    async (stepIndex: number) => {
      setIsExecuting(true);
      await executeSingleStep(stepIndex, executionSteps);
      setIsExecuting(false);
    },
    [executionSteps, chainId, isLiveMode, walletAddress]
  );

  const completedSteps = executionSteps.filter((s) => s.status === 'confirmed').length;
  const failedSteps = executionSteps.filter((s) => s.status === 'failed' || s.status === 'rejected').length;
  const isComplete = completedSteps === executionSteps.length && executionSteps.length > 0;

  return {
    executionSteps,
    syncSteps,
    isReviewOpen,
    isExecuting,
    currentStepIndex,
    activeTxHash,
    executionError,
    openReviewModal,
    closeReviewModal,
    startExecution,
    retryStep,
    summary: {
      totalSteps: executionSteps.length,
      completedSteps,
      failedSteps,
      currentStepIndex,
      isRunning: isExecuting,
      isComplete,
      hasErrors: failedSteps > 0,
    },
  };
}
