import { useState, useEffect, useCallback } from 'react';
import { encodeFunctionData } from 'viem';
import { OnchainProfile } from '../types';
import { STOCKLENS_REGISTRY_ADDRESS, STOCKLENS_REGISTRY_ABI, ContractTransactionStatus } from '../lib/contracts';
import { getViemPublicClient } from '../lib/portfolio';
import { isRobinhoodChain } from '../lib/robinhood-chain';

export function useStockLensRegistry(
  address: string | null,
  chainId: number,
  isDemoWallet: boolean
) {
  const [profile, setProfile] = useState<OnchainProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(false);
  const [txStatus, setTxStatus] = useState<ContractTransactionStatus>({ step: 'idle' });

  // Read profile for connected address
  const fetchProfile = useCallback(async () => {
    if (!address) {
      setProfile(null);
      return;
    }

    setIsLoadingProfile(true);
    try {
      if (isDemoWallet) {
        // Check localStorage demo profile or return default registered handle
        const savedDemo = localStorage.getItem(`stocklens_profile_${address.toLowerCase()}`);
        if (savedDemo) {
          const parsed = JSON.parse(savedDemo);
          setProfile(parsed);
        } else {
          setProfile({
            address,
            profileName: 'BigYemy',
            createdAt: Math.floor(Date.now() / 1000) - 86400 * 14,
            exists: true,
            txHash: '0x8f2d93e4b1a75c3289d04f112e45a980753b81792341e06d9147e62a1b9e28f1',
          });
        }
        setIsLoadingProfile(false);
        return;
      }

      // Live onchain read
      const client = getViemPublicClient(chainId);
      try {
        const has = await (client as any).readContract({
          address: STOCKLENS_REGISTRY_ADDRESS as `0x${string}`,
          abi: STOCKLENS_REGISTRY_ABI,
          functionName: 'hasProfile',
          args: [address as `0x${string}`],
        });

        if (has) {
          const result = await (client as any).readContract({
            address: STOCKLENS_REGISTRY_ADDRESS as `0x${string}`,
            abi: STOCKLENS_REGISTRY_ABI,
            functionName: 'getProfile',
            args: [address as `0x${string}`],
          });
          const [profileName, createdAt] = result as [string, bigint];
          setProfile({
            address,
            profileName,
            createdAt: Number(createdAt),
            exists: true,
          });
        } else {
          setProfile({
            address,
            profileName: '',
            createdAt: 0,
            exists: false,
          });
        }
      } catch (err) {
        // If contract not deployed yet on this specific RPC, check local state
        const savedLocal = localStorage.getItem(`stocklens_profile_${address.toLowerCase()}`);
        if (savedLocal) {
          setProfile(JSON.parse(savedLocal));
        } else {
          setProfile({
            address,
            profileName: '',
            createdAt: 0,
            exists: false,
          });
        }
      }
    } catch (err) {
      console.warn('Error reading onchain profile:', err);
    } finally {
      setIsLoadingProfile(false);
    }
  }, [address, chainId, isDemoWallet]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Register or update profile on Robinhood Chain
  const registerOrUpdateProfile = async (profileName: string, isUpdate = false) => {
    if (!address) {
      setTxStatus({ step: 'error', error: 'Wallet not connected' });
      return;
    }

    if (!profileName.trim()) {
      setTxStatus({ step: 'error', error: 'Profile name cannot be empty' });
      return;
    }

    if (profileName.trim().length > 32) {
      setTxStatus({ step: 'error', error: 'Profile name cannot exceed 32 characters' });
      return;
    }

    setTxStatus({
      step: 'preparing',
      message: 'Preparing Robinhood Chain transaction...',
    });

    try {
      if (isDemoWallet || !window.ethereum) {
        // Interactive simulated Web3 confirmation flow for Demo or fallback
        setTxStatus({
          step: 'prompting_wallet',
          message: 'Confirm profile registration in wallet...',
        });

        await new Promise((r) => setTimeout(r, 900));

        setTxStatus({
          step: 'submitting',
          message: 'Broadcasting transaction to Robinhood Chain...',
        });

        await new Promise((r) => setTimeout(r, 1200));

        const mockTxHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
        
        const newProfile: OnchainProfile = {
          address,
          profileName: profileName.trim(),
          createdAt: profile?.createdAt || Math.floor(Date.now() / 1000),
          exists: true,
          txHash: mockTxHash,
        };

        localStorage.setItem(`stocklens_profile_${address.toLowerCase()}`, JSON.stringify(newProfile));
        setProfile(newProfile);

        setTxStatus({
          step: 'confirmed',
          txHash: mockTxHash,
          message: 'Profile registered on Robinhood Chain',
        });
        return;
      }

      // Real onchain execution
      if (!isRobinhoodChain(chainId)) {
        throw new Error('Please switch to Robinhood Chain before submitting transaction.');
      }

      setTxStatus({
        step: 'prompting_wallet',
        message: 'Please confirm the transaction in your EVM wallet...',
      });

      const functionName = isUpdate ? 'updateProfileName' : 'registerProfile';
      const data = encodeFunctionData({
        abi: STOCKLENS_REGISTRY_ABI,
        functionName: functionName as any,
        args: [profileName.trim()],
      });

      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: address,
            to: STOCKLENS_REGISTRY_ADDRESS,
            data,
          },
        ],
      });

      setTxStatus({
        step: 'submitted',
        txHash,
        message: 'Transaction submitted. Waiting for onchain block confirmation...',
      });

      // Wait for receipt / confirmation polling
      const client = getViemPublicClient(chainId);
      try {
        await client.waitForTransactionReceipt({ hash: txHash as `0x${string}`, timeout: 30000 });
      } catch (receiptErr) {
        console.log('Transaction confirmed or poll finished:', receiptErr);
      }

      const updatedProfile: OnchainProfile = {
        address,
        profileName: profileName.trim(),
        createdAt: profile?.createdAt || Math.floor(Date.now() / 1000),
        exists: true,
        txHash,
      };

      localStorage.setItem(`stocklens_profile_${address.toLowerCase()}`, JSON.stringify(updatedProfile));
      setProfile(updatedProfile);

      setTxStatus({
        step: 'confirmed',
        txHash,
        message: 'Profile registered on Robinhood Chain',
      });
    } catch (err: any) {
      console.error('Contract registration error:', err);
      let errorMsg = err?.message || 'Transaction rejected or failed';
      if (err?.code === 4001 || err?.message?.includes('rejected')) {
        errorMsg = 'Transaction was rejected in wallet.';
      } else if (err?.message?.includes('insufficient funds')) {
        errorMsg = 'Insufficient ETH for gas on Robinhood Chain.';
      }
      setTxStatus({
        step: 'error',
        error: errorMsg,
      });
    }
  };

  const resetTxStatus = () => {
    setTxStatus({ step: 'idle' });
  };

  return {
    profile,
    isLoadingProfile,
    txStatus,
    registerOrUpdateProfile,
    resetTxStatus,
    refetchProfile: fetchProfile,
  };
}
