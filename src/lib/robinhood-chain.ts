import { defineChain } from 'viem';
import { RobinhoodNetwork } from '../types';

export const ROBINHOOD_NETWORKS: Record<number, RobinhoodNetwork> = {
  4663: {
    chainId: 4663,
    name: 'Robinhood Chain Mainnet',
    shortName: 'Robinhood',
    rpcUrl: 'https://rpc.mainnet.chain.robinhood.com',
    explorerUrl: 'https://robinhoodchain.blockscout.com',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    isTestnet: false,
  },
  46630: {
    chainId: 46630,
    name: 'Robinhood Chain Testnet',
    shortName: 'Robinhood Testnet',
    rpcUrl: 'https://rpc.testnet.chain.robinhood.com',
    explorerUrl: 'https://explorer.testnet.chain.robinhood.com',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    isTestnet: true,
  },
};

export const DEFAULT_CHAIN_ID = 46630; // Default to TESTNET during development as requested

export const robinhoodMainnetChain = defineChain({
  id: 4663,
  name: 'Robinhood Chain',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.mainnet.chain.robinhood.com'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Robinhood Chain Blockscout',
      url: 'https://robinhoodchain.blockscout.com',
    },
  },
});

export const robinhoodTestnetChain = defineChain({
  id: 46630,
  name: 'Robinhood Chain Testnet',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.testnet.chain.robinhood.com'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Robinhood Testnet Explorer',
      url: 'https://explorer.testnet.chain.robinhood.com',
    },
  },
  testnet: true,
});

export function getRobinhoodNetwork(chainId: number): RobinhoodNetwork {
  return ROBINHOOD_NETWORKS[chainId] || ROBINHOOD_NETWORKS[DEFAULT_CHAIN_ID];
}

export function isRobinhoodChain(chainId: number): boolean {
  return chainId === 4663 || chainId === 46630;
}

export function formatAddress(address: string, chars = 4): string {
  if (!address) return '';
  if (address.length <= chars * 2 + 2) return address;
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
}

export function getBlockscoutUrl(
  identifier: string,
  chainId: number = DEFAULT_CHAIN_ID,
  type: 'address' | 'tx' | 'token' = 'address'
): string {
  const network = getRobinhoodNetwork(chainId);
  const baseUrl = network.explorerUrl.replace(/\/$/, '');
  
  if (type === 'tx') {
    return `${baseUrl}/tx/${identifier}`;
  }
  if (type === 'token') {
    return `${baseUrl}/token/${identifier}`;
  }
  return `${baseUrl}/address/${identifier}`;
}
