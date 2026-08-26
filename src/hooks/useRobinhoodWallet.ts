import { useState, useEffect, useCallback } from 'react';
import { ROBINHOOD_NETWORKS, DEFAULT_CHAIN_ID, isRobinhoodChain } from '../lib/robinhood-chain';
import { getViemPublicClient } from '../lib/portfolio';

export interface EIP6963ProviderInfo {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
}

export interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo;
  provider: any;
}

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
  isWatchOnly: boolean;
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
    isWatchOnly: false,
    ethBalance: 0,
    error: null,
  });

  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [discoveredProviders, setDiscoveredProviders] = useState<EIP6963ProviderDetail[]>([]);
  const [activeProvider, setActiveProvider] = useState<any>(null);

  // EIP-6963 Provider Discovery
  useEffect(() => {
    const handleAnnounceProvider = (event: any) => {
      if (!event.detail) return;
      setDiscoveredProviders((prev) => {
        const exists = prev.some((p) => p.info.uuid === event.detail.info.uuid);
        if (exists) return prev;
        return [...prev, event.detail];
      });
    };

    window.addEventListener('eip6963:announceProvider', handleAnnounceProvider);
    window.dispatchEvent(new Event('eip6963:requestProvider'));

    return () => {
      window.removeEventListener('eip6963:announceProvider', handleAnnounceProvider);
    };
  }, []);

  // Fetch ETH balance for connected address
  const fetchEthBalance = useCallback(async (addr: string, chainId: number) => {
    try {
      const client = getViemPublicClient(chainId);
      const rawBalance = await client.getBalance({ address: addr as `0x${string}` });
      const eth = Number(rawBalance) / 1e18;
      setWalletState((prev) => ({
        ...prev,
        ethBalance: Number(eth.toFixed(4)),
      }));
    } catch (err) {
      console.warn('Failed to fetch onchain ETH balance:', err);
    }
  }, []);

  // Check previously saved connection mode
  useEffect(() => {
    const savedMode = localStorage.getItem('aequitas_wallet_mode') || localStorage.getItem('stocklens_wallet_mode');
    const savedAddress = localStorage.getItem('aequitas_wallet_address');

    if (savedMode === 'demo') {
      connectDemoWallet();
    } else if (savedMode === 'custom' && savedAddress) {
      connectCustomAddress(savedAddress);
    } else if (savedMode === 'injected' && window.ethereum) {
      checkConnectedAccounts();
    }
  }, []);

  const checkConnectedAccounts = async (provider = window.ethereum) => {
    if (!provider) return;
    try {
      const accounts = await provider.request({ method: 'eth_accounts' });
      if (accounts && accounts.length > 0) {
        const rawChainId = await provider.request({ method: 'eth_chainId' });
        const chainId = parseInt(rawChainId, 16);
        const resolvedChainId = isNaN(chainId) ? DEFAULT_CHAIN_ID : chainId;
        
        setActiveProvider(provider);
        setWalletState((prev) => ({
          ...prev,
          address: accounts[0],
          chainId: resolvedChainId,
          isConnected: true,
          isDemoWallet: false,
          isWatchOnly: false,
          error: null,
        }));

        fetchEthBalance(accounts[0], resolvedChainId);
      }
    } catch (err) {
      console.warn('Error checking connected accounts:', err);
    }
  };

  // Connect injected EVM wallet (MetaMask, Rabby, Coinbase, etc.)
  const connectInjected = async (customProvider?: any) => {
    const provider = customProvider || activeProvider || window.ethereum;

    if (!provider) {
      setWalletState((prev) => ({
        ...prev,
        isConnecting: false,
        error: 'No Web3 wallet detected in browser. If you are inside the preview window, open the app in a new tab or use the 1-Click Demo Sandbox.',
      }));
      setIsConnectModalOpen(true);
      return;
    }

    setWalletState((prev) => ({ ...prev, isConnecting: true, error: null }));
    try {
      const accounts = await provider.request({
        method: 'eth_requestAccounts',
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts selected');
      }

      const rawChainId = await provider.request({ method: 'eth_chainId' });
      const currentChainId = parseInt(rawChainId, 16);
      const resolvedChain = isNaN(currentChainId) ? DEFAULT_CHAIN_ID : currentChainId;

      setActiveProvider(provider);
      setWalletState({
        address: accounts[0],
        chainId: resolvedChain,
        isConnected: true,
        isConnecting: false,
        isDemoWallet: false,
        isWatchOnly: false,
        ethBalance: 0,
        error: null,
      });

      localStorage.setItem('aequitas_wallet_mode', 'injected');
      setIsConnectModalOpen(false);

      fetchEthBalance(accounts[0], resolvedChain);

      // If on wrong chain, prompt to switch
      if (!isRobinhoodChain(resolvedChain)) {
        await switchNetwork(DEFAULT_CHAIN_ID, provider);
      }
    } catch (err: any) {
      console.error('Wallet connection error:', err);
      let errorMsg = 'Failed to connect wallet';
      if (err?.code === 4001) {
        errorMsg = 'Connection request was cancelled by user';
      } else if (err?.message) {
        errorMsg = err.message;
      }
      setWalletState((prev) => ({
        ...prev,
        isConnecting: false,
        error: errorMsg,
      }));
      setIsConnectModalOpen(true);
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
      isWatchOnly: false,
      ethBalance: 0.842,
      error: null,
    });
    localStorage.setItem('aequitas_wallet_mode', 'demo');
    setIsConnectModalOpen(false);
  }, []);

  // Connect Custom EVM Address (Read-only onchain inspection)
  const connectCustomAddress = useCallback((customAddr: string) => {
    const clean = customAddr.trim();
    if (!clean.startsWith('0x') || clean.length !== 42) {
      setWalletState((prev) => ({
        ...prev,
        error: 'Invalid Ethereum address format (must be 42 characters starting with 0x)',
      }));
      return;
    }

    setWalletState({
      address: clean,
      chainId: DEFAULT_CHAIN_ID,
      isConnected: true,
      isConnecting: false,
      isDemoWallet: false,
      isWatchOnly: true,
      ethBalance: 0,
      error: null,
    });
    localStorage.setItem('aequitas_wallet_mode', 'custom');
    localStorage.setItem('aequitas_wallet_address', clean);
    setIsConnectModalOpen(false);

    fetchEthBalance(clean, DEFAULT_CHAIN_ID);
  }, [fetchEthBalance]);

  // Disconnect
  const disconnect = useCallback(() => {
    setWalletState({
      address: null,
      chainId: DEFAULT_CHAIN_ID,
      isConnected: false,
      isConnecting: false,
      isDemoWallet: false,
      isWatchOnly: false,
      ethBalance: 0,
      error: null,
    });
    localStorage.removeItem('aequitas_wallet_mode');
    localStorage.removeItem('stocklens_wallet_mode');
    localStorage.removeItem('aequitas_wallet_address');
  }, []);

  // Switch Robinhood Chain network (Mainnet: 4663 or Testnet: 46630)
  const switchNetwork = async (targetChainId: number, customProvider?: any) => {
    const targetNetwork = ROBINHOOD_NETWORKS[targetChainId];
    if (!targetNetwork) return;

    const provider = customProvider || activeProvider || window.ethereum;

    if (walletState.isDemoWallet || walletState.isWatchOnly || !provider) {
      setWalletState((prev) => ({ ...prev, chainId: targetChainId }));
      if (walletState.address) {
        fetchEthBalance(walletState.address, targetChainId);
      }
      return;
    }

    const hexChainId = `0x${targetChainId.toString(16)}`;

    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: hexChainId }],
      });
      setWalletState((prev) => ({ ...prev, chainId: targetChainId, error: null }));
      if (walletState.address) {
        fetchEthBalance(walletState.address, targetChainId);
      }
    } catch (switchError: any) {
      // Chain not added to wallet (4902)
      if (switchError.code === 4902 || switchError?.data?.originalError?.code === 4902) {
        try {
          await provider.request({
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
          setWalletState((prev) => ({ ...prev, chainId: targetChainId, error: null }));
          if (walletState.address) {
            fetchEthBalance(walletState.address, targetChainId);
          }
        } catch (addError: any) {
          console.error('Failed to add Robinhood Chain:', addError);
          setWalletState((prev) => ({ ...prev, error: 'Failed to add Robinhood Chain to wallet' }));
        }
      } else {
        console.error('Failed to switch network:', switchError);
      }
    }
  };

  // Direct helper to add network
  const addRobinhoodChain = async (targetChainId: number) => {
    await switchNetwork(targetChainId);
  };

  // Listen for account/chain changes in active provider or window.ethereum
  useEffect(() => {
    const provider = activeProvider || window.ethereum;
    if (!provider || walletState.isDemoWallet || walletState.isWatchOnly) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (!accounts || accounts.length === 0) {
        disconnect();
      } else {
        setWalletState((prev) => ({ ...prev, address: accounts[0] }));
        fetchEthBalance(accounts[0], walletState.chainId);
      }
    };

    const handleChainChanged = (chainIdHex: string) => {
      const newChainId = parseInt(chainIdHex, 16);
      const resolved = isNaN(newChainId) ? DEFAULT_CHAIN_ID : newChainId;
      setWalletState((prev) => ({ ...prev, chainId: resolved }));
      if (walletState.address) {
        fetchEthBalance(walletState.address, resolved);
      }
    };

    provider.on?.('accountsChanged', handleAccountsChanged);
    provider.on?.('chainChanged', handleChainChanged);

    return () => {
      provider.removeListener?.('accountsChanged', handleAccountsChanged);
      provider.removeListener?.('chainChanged', handleChainChanged);
    };
  }, [activeProvider, walletState.isDemoWallet, walletState.isWatchOnly, walletState.chainId, walletState.address, disconnect, fetchEthBalance]);

  return {
    ...walletState,
    isCorrectNetwork: isRobinhoodChain(walletState.chainId),
    isConnectModalOpen,
    openConnectModal: () => setIsConnectModalOpen(true),
    closeConnectModal: () => setIsConnectModalOpen(false),
    discoveredProviders,
    connectInjected,
    connectDemoWallet,
    connectCustomAddress,
    disconnect,
    switchNetwork,
    addRobinhoodChain,
  };
}
