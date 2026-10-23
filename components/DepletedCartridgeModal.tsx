'use client';

import React from 'react';
import { useWallet } from '@/context/WalletContext';
import { MONAD_TESTNET } from '@/lib/web3/monadChain';
import { soundSynth } from '@/game/soundEffects';
import { Flame, ShoppingCart, RefreshCw, X, ShieldAlert, Sparkles, ExternalLink } from 'lucide-react';

export default function DepletedCartridgeModal() {
  const {
    isDepletedModalOpen,
    setIsDepletedModalOpen,
    depletedTokenId,
    recharge,
    setIsGachaModalOpen,
  } = useWallet();

  if (!isDepletedModalOpen) return null;

  const handleRecharge = () => {
    if (depletedTokenId) {
      recharge(depletedTokenId);
      soundSynth.playVictory();
      setIsDepletedModalOpen(false);
    }
  };

  const handleRollNew = () => {
    setIsDepletedModalOpen(false);
    setIsGachaModalOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border-2 border-rose-500/60 bg-zinc-950 p-6 shadow-[0_0_50px_rgba(244,63,94,0.4)]">
        {/* Close Button */}
        <button
          onClick={() => setIsDepletedModalOpen(false)}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white transition cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="text-center font-mono">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-rose-500/60 bg-rose-950/40 text-rose-400 shadow-[0_0_25px_rgba(244,63,94,0.5)]">
            <Flame className="h-8 w-8 animate-bounce text-rose-500" />
          </div>

          <div className="mt-3 inline-flex items-center space-x-1.5 rounded-full border border-rose-500/40 bg-rose-950/40 px-3 py-0.5 text-xs font-bold text-rose-300">
            <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
            <span>CARTRIDGE BATTERY MELTED</span>
          </div>

          <h3 className="mt-3 text-xl font-black uppercase text-white tracking-wide">
            7 / 7 Runs Consumed!
          </h3>

          <p className="mt-2 text-xs text-zinc-300 leading-relaxed font-sans">
            Your free trial cartridge #{depletedTokenId} has exhausted all 7 operational charges.
            To unlock <strong>permanent unlimited plays</strong> and maximized $CHOG bounty payouts, pick up an official Chog on the Monad marketplace!
          </p>

          {/* Value comparison */}
          <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 text-left space-y-1.5 text-[11px]">
            <div className="flex justify-between items-center text-zinc-400">
              <span>Trial Cartridge:</span>
              <span className="text-rose-400 font-bold">7 Runs (Depleted)</span>
            </div>
            <div className="flex justify-between items-center text-zinc-200">
              <span className="flex items-center space-x-1 text-amber-400 font-bold">
                <Sparkles className="h-3 w-3" />
                <span>Official Chog NFT:</span>
              </span>
              <span className="text-emerald-400 font-bold">♾️ Unlimited Plays Forever</span>
            </div>
          </div>

          {/* Primary Action: Buy on Marketplace */}
          <a
            href={MONAD_TESTNET.marketplaceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 flex w-full items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 py-3.5 px-4 font-mono text-sm font-black text-black shadow-[0_0_25px_rgba(245,158,11,0.5)] transition hover:brightness-110 active:scale-95 cursor-pointer"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>BUY OFFICIAL CHOG ON MARKETPLACE</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>

          {/* Hackathon Safety Valve Options */}
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={handleRecharge}
              className="flex items-center justify-center space-x-1.5 rounded-lg border border-emerald-500/40 bg-emerald-950/20 py-2 px-3 font-mono font-bold text-emerald-400 hover:bg-emerald-950/40 transition cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>RECHARGE (+7 RUNS)</span>
            </button>

            <button
              onClick={handleRollNew}
              className="flex items-center justify-center space-x-1.5 rounded-lg border border-purple-500/40 bg-purple-950/20 py-2 px-3 font-mono font-bold text-purple-300 hover:bg-purple-950/40 transition cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>ROLL NEW TRIAL</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
