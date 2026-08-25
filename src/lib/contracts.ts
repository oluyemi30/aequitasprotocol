import { parseAbi } from 'viem';

export const STOCKLENS_REGISTRY_ADDRESS = 
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_STOCKLENS_REGISTRY_ADDRESS) ||
  '0x4663A72659B8E3253b2E7C6A6DbAc51d8b9d8801';

export const STOCKLENS_REGISTRY_ABI = parseAbi([
  'function registerProfile(string calldata profileName) external',
  'function updateProfileName(string calldata newProfileName) external',
  'function getProfile(address user) external view returns (string memory profileName, uint256 createdAt)',
  'function hasProfile(address user) external view returns (bool)',
  'function totalProfiles() external view returns (uint256)',
  'event ProfileRegistered(address indexed user, string profileName, uint256 createdAt)',
  'event ProfileUpdated(address indexed user, string newProfileName, uint256 updatedAt)',
]);

export interface ContractTransactionStatus {
  step: 'idle' | 'preparing' | 'prompting_wallet' | 'submitting' | 'submitted' | 'confirmed' | 'error';
  txHash?: string;
  error?: string;
  message?: string;
}
