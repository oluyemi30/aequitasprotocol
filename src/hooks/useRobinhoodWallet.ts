import { useState, useEffect, useCallback } from 'react';
import { ROBINHOOD_NETWORKS, DEFAULT_CHAIN_ID, isRobinhoodChain } from '../lib/robinhood-chain';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export interface WalletState {
  address: string | null;
  chainId: number;
  isConnected: boolean;
  isConnecting: boolean;
  isDemoWallet: boolean;
  ethBalance: number;
  error: string | null;
}

export function useRobinhoodWallet() {
  const [walletState, setWalletState] = useState<WalletState>({
    address: null,
    chainId: DEFAULT_CHAIN_ID,
    isConnected: false,
    isConnecting: false,
    isDemoWallet: false,
    ethBalance: 0,
    error: null,
  });

  // Check if wallet was previously connected
  useEffect(() => {
    const savedMode = localStorage.getItem('stocklens_wallet_mode');
    if (savedMode === 'demo') {
      connectDemoWallet();
    } else if (window.ethereum && savedMode === 'injected') {
      checkConnectedAccounts();
    }
  }, []);

  const checkConnectedAccounts = async () => {
    if (!window.ethereum) return;
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts && accounts.length > 0) {
        const rawChainId = await window.ethereum.request({ method: 'eth_chainId' });
        const chainId = parseInt(rawChainId, 16);
        setWalletState((prev) => ({
          ...prev,
          address: accounts[0],
          chainId: isNaN(chainId) ? DEFAULT_CHAIN_ID : chainId,
          isConnected: true,
          isDemoWallet: false,
          error: null,
        }));
      }
    } catch (err) {
      console.warn('Error checking connected accounts:', err);
    }
  };

  // Connect injected EVM wallet (MetaMask, Coinbase, etc.)
  const connectInjected = async () => {
    if (!window.ethereum) {
      setWalletState((prev) => ({
        ...prev,
        error: 'No EVM wallet found in browser. You can use the Demo Wallet to test all features.',
      }));
      return;
    }

    setWalletState((prev) => ({ ...prev, isConnecting: true, error: null }));
    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts selected');
      }

      const rawChainId = await window.ethereum.request({ method: 'eth_chainId' });
      const currentChainId = parseInt(rawChainId, 16);

      setWalletState({
        address: accounts[0],
        chainId: isNaN(currentChainId) ? DEFAULT_CHAIN_ID : currentChainId,
        isConnected: true,
        isConnecting: false,
        isDemoWallet: false,
        ethBalance: 0,
        error: null,
      });

      localStorage.setItem('stocklens_wallet_mode', 'injected');

      // If on wrong chain, prompt to switch
      if (!isRobinhoodChain(currentChainId)) {
        await switchNetwork(DEFAULT_CHAIN_ID);
      }
    } catch (err: any) {
      console.error('Wallet connection error:', err);
      setWalletState((prev) => ({
        ...prev,
        isConnecting: false,
        error: err?.message || 'Failed to connect wallet',
      }));
    }
  };

  // Connect Demo Wallet for instant full interactive experience
  const connectDemoWallet = useCallback(() => {
    setWalletState({
      address: '0x123479B8206dFA02cD7E36968B4bC3F08b2611A8',
      chainId: DEFAULT_CHAIN_ID,
      isConnected: true,
      isConnecting: false,
      isDemoWallet: true,
      ethBalance: 0.842,
      error: null,
    });
    localStorage.setItem('stocklens_wallet_mode', 'demo');
  }, []);

  // Disconnect
  const disconnect = useCallback(() => {
    setWalletState({
      address: null,
      chainId: DEFAULT_CHAIN_ID,
      isConnected: false,
      isConnecting: false,
      isDemoWallet: false,
      ethBalance: 0,
      error: null,
    });
    localStorage.removeItem('stocklens_wallet_mode');
  }, []);

  // Switch Robinhood Chain network (Mainnet: 4663 or Testnet: 46630)
  const switchNetwork = async (targetChainId: number) => {
    const targetNetwork = ROBINHOOD_NETWORKS[targetChainId];
    if (!targetNetwork) return;

    if (walletState.isDemoWallet || !window.ethereum) {
      setWalletState((prev) => ({ ...prev, chainId: targetChainId }));
      return;
    }

    const hexChainId = `0x${targetChainId.toString(16)}`;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: hexChainId }],
      });
      setWalletState((prev) => ({ ...prev, chainId: targetChainId }));
    } catch (switchError: any) {
      // Chain not added to wallet (4902)
      if (switchError.code === 4902 || switchError?.data?.originalError?.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: hexChainId,
                chainName: targetNetwork.name,
                rpcUrls: [targetNetwork.rpcUrl],
                nativeCurrency: targetNetwork.nativeCurrency,
                blockExplorerUrls: [targetNetwork.explorerUrl],
              },
            ],
          });
          setWalletState((prev) => ({ ...prev, chainId: targetChainId }));
        } catch (addError: any) {
          console.error('Failed to add Robinhood Chain:', addError);
          setWalletState((prev) => ({ ...prev, error: 'Failed to add Robinhood Chain to wallet' }));
        }
      } else {
        console.error('Failed to switch network:', switchError);
      }
    }
  };

  // Listen for account/chain changes in window.ethereum
  useEffect(() => {
    if (!window.ethereum || walletState.isDemoWallet) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setWalletState((prev) => ({ ...prev, address: accounts[0] }));
      }
    };

    const handleChainChanged = (chainIdHex: string) => {
      const newChainId = parseInt(chainIdHex, 16);
      setWalletState((prev) => ({ ...prev, chainId: newChainId }));
    };

    window.ethereum.on?.('accountsChanged', handleAccountsChanged);
    window.ethereum.on?.('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener?.('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener?.('chainChanged', handleChainChanged);
    };
  }, [walletState.isDemoWallet, disconnect]);

  return {
    ...walletState,
    isCorrectNetwork: isRobinhoodChain(walletState.chainId),
    connectInjected,
    connectDemoWallet,
    disconnect,
    switchNetwork,
  };
}
