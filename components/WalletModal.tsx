'use client';

import React from 'react';
import { useWallet } from '@/context/WalletContext';
import { MONAD_TESTNET } from '@/lib/web3/monadChain';
import { soundSynth } from '@/game/soundEffects';
import { Wallet, ShieldCheck, Zap, X, ExternalLink, Cpu } from 'lucide-react';

export default function WalletModal() {
  const { isWalletModalOpen, setIsWalletModalOpen, connectWallet, isConnecting } = useWallet();

  if (!isWalletModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border-2 border-emerald-500/50 bg-zinc-950 p-6 shadow-[0_0_50px_rgba(16,185,129,0.3)]">
        {/* Close Button */}
        <button
          onClick={() => setIsWalletModalOpen(false)}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white transition cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/50 bg-emerald-950/40 text-emerald-400 shadow-[0_0_20px_rgba(34,197,94,0.35)]">
            <Wallet className="h-7 w-7" />
          </div>

          <h3 className="mt-4 font-mono text-xl font-black uppercase text-white tracking-wide">
            Connect to Monad
          </h3>

          <p className="mt-1 text-xs text-zinc-400 font-mono">
            Connect your wallet to unlock Living Cartridges and claim $CHOG bounties.
          </p>

          <div className="mt-3 inline-flex items-center space-x-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/20 px-3 py-1 font-mono text-[10px] text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Monad Testnet • Chain ID {MONAD_TESTNET.chainId}</span>
          </div>
        </div>

        {/* Options */}
        <div className="mt-6 space-y-3 font-mono">
          {/* Injected Wallet (MetaMask, Rabby, Phantom) */}
          <button
            onClick={() => connectWallet('injected')}
            disabled={isConnecting}
            className="flex w-full items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/80 p-3.5 text-left transition hover:border-emerald-500/60 hover:bg-emerald-950/20 active:scale-98 cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800 text-emerald-400 border border-zinc-700">
                <Cpu className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Browser Wallet</p>
                <p className="text-[10px] text-zinc-400">MetaMask, Rabby, Phantom, Coinbase</p>
              </div>
            </div>
            <span className="text-xs text-emerald-400 font-bold">CONNECT →</span>
          </button>

          {/* Hackathon Judge / Demo Instant Pass */}
          <button
            onClick={() => connectWallet('judge_pass')}
            disabled={isConnecting}
            className="flex w-full items-center justify-between rounded-xl border border-purple-500/40 bg-purple-950/20 p-3.5 text-left transition hover:border-purple-400 hover:bg-purple-950/40 active:scale-98 cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-900/50 text-purple-300 border border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.3)]">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <p className="text-sm font-bold text-white">Hackathon Judge Pass</p>
                  <span className="rounded bg-purple-500/20 px-1.5 py-0.2 text-[9px] font-bold text-purple-300 border border-purple-500/40">
                    INSTANT
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400">Zero-friction demo wallet for judges & evaluators</p>
              </div>
            </div>
            <span className="text-xs text-purple-300 font-bold">1-CLICK →</span>
          </button>
        </div>

        {/* Footer info */}
        <div className="mt-5 border-t border-zinc-800/80 pt-3 text-center">
          <p className="text-[11px] text-zinc-500 font-mono">
            Don&apos;t have a Chog NFT yet? You will receive a free 7-run trial cartridge upon connecting!
          </p>
        </div>
      </div>
    </div>
  );
}
