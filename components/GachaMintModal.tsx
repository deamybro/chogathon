'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/context/WalletContext';
import { soundSynth } from '@/game/soundEffects';
import confetti from 'canvas-confetti';
import { Sparkles, Dna, BatteryCharging, Zap, ArrowRight, X, Trophy } from 'lucide-react';

export default function GachaMintModal() {
  const router = useRouter();
  const { isGachaModalOpen, setIsGachaModalOpen, mintTrialChog, lastMintedChog } = useWallet();
  const [isRolling, setIsRolling] = useState(false);
  const [revealedChog, setRevealedChog] = useState<any>(null);

  if (!isGachaModalOpen) return null;

  const handleRoll = async () => {
    setIsRolling(true);
    soundSynth.playLaser(true);

    // Simulated matrix roll delay
    setTimeout(async () => {
      const result = await mintTrialChog();
      setIsRolling(false);
      if (result) {
        setRevealedChog(result);
        soundSynth.playVictory();
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#22c55e', '#38bdf8', '#a855f7', '#facc15'],
          });
        } catch {}
      }
    }, 1400);
  };

  const handlePlugIn = () => {
    if (revealedChog?.chog) {
      setIsGachaModalOpen(false);
      router.push(`/play/${revealedChog.chog.tokenId}`);
    }
  };

  const currentChog = revealedChog?.chog || lastMintedChog?.chog;
  const currentTier = revealedChog?.tier || lastMintedChog?.tier || 'rare';

  const tierColors: Record<string, { bg: string; text: string; border: string; glow: string }> = {
    legendary: {
      bg: 'bg-amber-950/40',
      text: 'text-amber-400',
      border: 'border-amber-500',
      glow: 'shadow-[0_0_30px_rgba(245,158,11,0.5)]',
    },
    epic: {
      bg: 'bg-purple-950/40',
      text: 'text-purple-400',
      border: 'border-purple-500',
      glow: 'shadow-[0_0_30px_rgba(168,85,247,0.5)]',
    },
    rare: {
      bg: 'bg-cyan-950/40',
      text: 'text-cyan-400',
      border: 'border-cyan-500',
      glow: 'shadow-[0_0_30px_rgba(6,182,212,0.5)]',
    },
    common: {
      bg: 'bg-emerald-950/40',
      text: 'text-emerald-400',
      border: 'border-emerald-500',
      glow: 'shadow-[0_0_20px_rgba(16,185,129,0.3)]',
    },
  };

  const tierStyle = tierColors[currentTier.toLowerCase()] || tierColors.common;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`relative w-full max-w-lg overflow-hidden rounded-2xl border-2 ${tierStyle.border} bg-zinc-950 p-6 ${tierStyle.glow}`}>
        {/* Close Button */}
        <button
          onClick={() => {
            setIsGachaModalOpen(false);
            setRevealedChog(null);
          }}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white transition cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Content */}
        {!revealedChog && !isRolling ? (
          <div className="text-center font-mono">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-500/50 bg-amber-950/30 text-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.4)]">
              <Dna className="h-8 w-8 animate-pulse" />
            </div>

            <div className="mt-3 inline-flex items-center space-x-1.5 rounded-full border border-amber-500/40 bg-amber-950/30 px-3 py-0.5 text-xs font-bold text-amber-300">
              <Sparkles className="h-3.5 w-3.5" />
              <span>LUCK-BASED FREE MINT</span>
            </div>

            <h3 className="mt-3 text-2xl font-black uppercase text-white tracking-wide">
              Roll Your Living Cartridge
            </h3>

            <p className="mt-2 text-xs text-zinc-300 max-w-md mx-auto leading-relaxed">
              Synthesize a unique Chog with randomized traits on Monad. Loaded with <strong>7 Battery Charges</strong>. Burns after 7 runs unless recharged!
            </p>

            {/* Rarity Drop Rates */}
            <div className="mt-5 grid grid-cols-4 gap-2 text-center text-[10px]">
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-2">
                <p className="font-bold text-emerald-400">Common</p>
                <p className="text-zinc-400">60% Chance</p>
              </div>
              <div className="rounded-lg border border-cyan-500/30 bg-cyan-950/20 p-2">
                <p className="font-bold text-cyan-400">Rare</p>
                <p className="text-zinc-400">25% Chance</p>
              </div>
              <div className="rounded-lg border border-purple-500/30 bg-purple-950/20 p-2">
                <p className="font-bold text-purple-400">Epic</p>
                <p className="text-zinc-400">12% Chance</p>
              </div>
              <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-2">
                <p className="font-bold text-amber-400">Legendary</p>
                <p className="text-zinc-400">3% Jackpot</p>
              </div>
            </div>

            {/* Roll Button */}
            <button
              onClick={handleRoll}
              className="mt-6 flex w-full items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-400 py-3.5 px-6 font-mono text-sm font-black text-black shadow-[0_0_25px_rgba(34,197,94,0.6)] transition hover:brightness-110 active:scale-95 cursor-pointer"
            >
              <Zap className="h-5 w-5 fill-current" />
              <span>ROLL FREE TRIAL CARTRIDGE (0 MON)</span>
            </button>
          </div>
        ) : isRolling ? (
          /* Rolling Animation Screen */
          <div className="py-12 text-center font-mono">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-emerald-400 bg-emerald-950/50 text-emerald-400 shadow-[0_0_35px_rgba(34,197,94,0.7)] animate-bounce">
              <Dna className="h-10 w-10 animate-spin" />
            </div>
            <h4 className="mt-6 text-xl font-black uppercase text-white animate-pulse">
              Synthesizing Cartridge Matrix...
            </h4>
            <p className="mt-2 text-xs text-emerald-400">
              Querying Monad randomness seed • Calibrating DNA traits...
            </p>
          </div>
        ) : (
          /* Reveal Screen */
          <div className="text-center font-mono">
            <div className="inline-flex items-center space-x-1.5 rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wider mb-3 ${tierStyle.border} ${tierStyle.bg} ${tierStyle.text}">
              <Trophy className="h-3.5 w-3.5" />
              <span>{currentTier} PULL!</span>
            </div>

            {/* Cartridge Preview */}
            <div className="relative mx-auto mt-1 aspect-square w-48 overflow-hidden rounded-2xl border-2 border-zinc-700 bg-black shadow-inner">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentChog.image}
                alt={currentChog.name}
                className="h-full w-full object-cover"
              />
            </div>

            <h3 className="mt-3 text-lg font-black text-white">{currentChog.name}</h3>

            {/* Traits Row */}
            <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5 text-[10px]">
              <span className="rounded bg-zinc-900 border border-zinc-800 px-2 py-0.5 text-zinc-300">
                {currentChog.traits.background}
              </span>
              <span className="rounded bg-zinc-900 border border-zinc-800 px-2 py-0.5 text-zinc-300">
                {currentChog.traits.eyes}
              </span>
              <span className="rounded bg-zinc-900 border border-zinc-800 px-2 py-0.5 text-zinc-300">
                {currentChog.traits.head}
              </span>
              <span className="rounded bg-zinc-900 border border-zinc-800 px-2 py-0.5 text-zinc-300">
                {currentChog.traits.aura}
              </span>
            </div>

            {/* Battery Status Banner */}
            <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-500/40 bg-emerald-950/20 px-3.5 py-2 text-xs">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                <BatteryCharging className="h-4 w-4 text-emerald-400" />
                <span>CARTRIDGE BATTERY</span>
              </div>
              <span className="font-black text-emerald-300">7 / 7 RUNS LOADED</span>
            </div>

            {/* Action Buttons */}
            <div className="mt-5 flex items-center space-x-3">
              <button
                onClick={handlePlugIn}
                className="flex-1 flex items-center justify-center space-x-2 rounded-xl bg-emerald-500 py-3 px-4 font-mono text-sm font-black text-black shadow-[0_0_20px_rgba(34,197,94,0.5)] transition hover:bg-emerald-400 active:scale-95 cursor-pointer"
              >
                <span>PLUG IN & PLAY NOW</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
