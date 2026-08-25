import React, { useState, useEffect } from 'react';
import { 
  X, 
  UserCheck, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ShieldCheck, 
  Sparkles,
  Zap
} from 'lucide-react';
import { OnchainProfile } from '../../types';
import { ContractTransactionStatus, STOCKLENS_REGISTRY_ADDRESS } from '../../lib/contracts';
import { getBlockscoutUrl, formatAddress } from '../../lib/robinhood-chain';

interface OnchainProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  address: string | null;
  chainId: number;
  profile: OnchainProfile | null;
  txStatus: ContractTransactionStatus;
  onRegisterOrUpdate: (name: string, isUpdate: boolean) => Promise<void>;
  onResetTx: () => void;
}

export const OnchainProfileModal: React.FC<OnchainProfileModalProps> = ({
  isOpen,
  onClose,
  address,
  chainId,
  profile,
  txStatus,
  onRegisterOrUpdate,
  onResetTx,
}) => {
  const [profileNameInput, setProfileNameInput] = useState('');

  useEffect(() => {
    if (profile?.profileName) {
      setProfileNameInput(profile.profileName);
    } else {
      setProfileNameInput('');
    }
  }, [profile, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileNameInput.trim()) return;
    await onRegisterOrUpdate(profileNameInput.trim(), !!profile?.exists);
  };

  const isPending = ['preparing', 'prompting_wallet', 'submitting', 'submitted'].includes(txStatus.step);
  const isSuccess = txStatus.step === 'confirmed';
  const isError = txStatus.step === 'error';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-[#050505] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between glass-panel">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#ADF802]/10 border border-[#ADF802]/30 flex items-center justify-center text-[#ADF802] shadow-md shadow-[#ADF802]/5">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                {profile?.exists ? 'Manage Onchain Profile' : 'Register Profile Onchain'}
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                AequitasRegistry • Robinhood Chain
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              onResetTx();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          
          {/* Smart contract info banner */}
          <div className="p-3.5 rounded-xl glass-panel border border-white/10 text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="font-bold uppercase text-[10px] tracking-wider text-[#ADF802]">
                Onchain Registry Contract
              </span>
              <span className="font-mono text-[10px] text-slate-500">ERC-Solidity</span>
            </div>
            <div className="font-mono text-[11px] text-slate-300 break-all select-all">
              {STOCKLENS_REGISTRY_ADDRESS}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-white/5 font-mono">
              <span>Connected: <strong className="text-white font-mono">{address ? formatAddress(address) : 'None'}</strong></span>
              <a
                href={getBlockscoutUrl(STOCKLENS_REGISTRY_ADDRESS, chainId, 'address')}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#ADF802] hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Explorer</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Profile Handle / Display Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={32}
                  value={profileNameInput}
                  onChange={(e) => setProfileNameInput(e.target.value)}
                  disabled={isPending}
                  placeholder="e.g. BigYemy, AlphaQuant, BullTrader"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#ADF802]/60 font-medium"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500">
                  {profileNameInput.length}/32
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Your handle will be permanently written to Robinhood Chain and associated with your wallet address.
              </p>
            </div>

            {/* Transaction Progress Tracker */}
            {isPending && (
              <div className="p-3.5 rounded-xl bg-[#ADF802]/10 border border-[#ADF802]/30 flex items-center gap-3 text-xs text-[#ADF802] animate-pulse">
                <RefreshCw className="w-4 h-4 animate-spin text-[#ADF802] shrink-0" />
                <div>
                  <div className="font-bold">{txStatus.message || 'Processing transaction...'}</div>
                  {txStatus.txHash && (
                    <div className="font-mono text-[10px] text-slate-400 mt-0.5 break-all">
                      Tx: {txStatus.txHash}
                    </div>
                  )}
                </div>
              </div>
            )}

            {isSuccess && (
              <div className="p-3.5 rounded-xl bg-[#ADF802]/10 border border-[#ADF802]/30 text-xs text-[#ADF802] space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-[#ADF802]" />
                  Profile Registered on Robinhood Chain!
                </div>
                {txStatus.txHash && (
                  <div className="pt-1 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-mono">Tx Hash:</span>
                    <a
                      href={getBlockscoutUrl(txStatus.txHash, chainId, 'tx')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#ADF802] hover:underline flex items-center gap-1 font-mono font-semibold"
                    >
                      <span>View on Blockscout</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            )}

            {isError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Transaction Failed</div>
                  <div className="text-[11px] text-rose-200 mt-0.5">{txStatus.error}</div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  onResetTx();
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-bold transition-colors"
              >
                {isSuccess ? 'Done' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={!profileNameInput.trim() || isPending}
                className="px-5 py-2 rounded-xl bg-[#ADF802] hover:bg-[#9ee002] text-black text-xs font-bold shadow-lg shadow-[#ADF802]/15 disabled:opacity-50 transition-colors flex items-center gap-1.5"
              >
                {isPending && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{profile?.exists ? 'Update Onchain Handle' : 'Sign & Register'}</span>
              </button>
            </div>
          </form>

        </div>

      </div>
    </div>
  );
};
