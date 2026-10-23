'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { RunResults } from '@/types/chog';
import { getCabinetStatus } from '@/lib/storage';
import { Trophy, Skull, Share2, RotateCcw, Compass, Check, Sparkles, Coins, Wallet } from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundSynth } from '@/game/soundEffects';
import { useWallet } from '@/context/WalletContext';

interface GameOverModalProps {
  results: RunResults;
  onRestart: () => void;
}

export default function GameOverModal({ results, onRestart }: GameOverModalProps) {
  const { shortAddress, claimBounty } = useWallet();
  const [copied, setCopied] = useState(false);
  const [claimStatus, setClaimStatus] = useState<'idle' | 'claiming' | 'claimed'>('idle');
  const cabinetStatus = getCabinetStatus(results.skullCount);

  // Micro $CHOG Bounty Calculation (Scaled by NFT Tier Multiplier)
  const tierMult = results.tierMultiplier || 1.0;
  const tierName = (results.tier || 'common').toUpperCase();
  const baseBounty = 0.005;
  const bossBounty = (results.bossesDefeated || 0) * 0.012;
  const enemyBounty = Math.min(0.012, Math.floor((results.enemiesDefeated || 0) / 10) * 0.001);
  const victoryBounty = results.victory ? 0.02 : 0;
  const rawSubtotal = (baseBounty + bossBounty + enemyBounty + victoryBounty) * tierMult;
  const totalChogReward = Number(Math.min(0.095, Math.max(0.005, rawSubtotal)).toFixed(3));

  useEffect(() => {
    if (results.victory) {
      try {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#22c55e', '#facc15', '#a855f7', '#38bdf8'],
        });
      } catch {}
    }
  }, [results.victory]);

  const handleCopyChallenge = () => {
    soundSynth.playCoin();
    const url = typeof window !== 'undefined' ? window.location.href : `https://chog969.arcade/play/${results.tokenId}`;
    const text = `I survived ${results.survivedSeconds}s inside Chog #${results.tokenId} and earned ${totalChogReward.toFixed(3)} $CHOG in the Monad Hackathon! Can you beat my high score? ${url}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      });
    }
  };

  const handleClaimReward = () => {
    if (claimStatus !== 'idle') return;
    soundSynth.playCoin();
    setClaimStatus('claiming');

    setTimeout(() => {
      setClaimStatus('claimed');
      claimBounty(totalChogReward);
      soundSynth.playVictory();
      try {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#facc15', '#fbbf24', '#f59e0b', '#10b981'],
        });
      } catch {}
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border-2 border-emerald-500/60 bg-zinc-950 p-5 sm:p-6 shadow-[0_0_50px_rgba(34,197,94,0.35)]">
        {/* Glow Header */}
        <div className="text-center">
          {results.victory ? (
            <div className="inline-flex items-center space-x-2 rounded-full border border-emerald-500/50 bg-emerald-950/40 px-4 py-1 text-xs font-mono font-bold text-emerald-400">
              <Sparkles className="h-4 w-4 text-emerald-400 animate-spin" />
              <span>CARTRIDGE CLEARED • FULL SURVIVAL</span>
            </div>
          ) : (
            <div className="inline-flex items-center space-x-2 rounded-full border border-red-500/50 bg-red-950/40 px-4 py-1 text-xs font-mono font-bold text-red-400">
              <Skull className="h-4 w-4 text-red-400" />
              <span>CARTRIDGE DEPLETED • RUN OVER</span>
            </div>
          )}

          <h2 className="mt-3 font-mono text-2xl sm:text-3xl font-black tracking-wide text-white">
            {results.victory ? 'ALL SECTORS CLEARED!' : `SURVIVED ${results.survivedSeconds}s`}
          </h2>
          <p className="mt-1 font-mono text-xs text-zinc-400">
            Cartridge #{results.tokenId} — {results.chogName}
          </p>
        </div>

        {/* Hackathon $CHOG Bounty Reward Banner (Tier Multiplier Advantage) */}
        <div className="mt-4 rounded-xl border border-amber-500/50 bg-gradient-to-r from-amber-950/30 via-zinc-900/60 to-amber-950/30 p-3 text-center shadow-[0_0_20px_rgba(245,158,11,0.2)]">
          <div className="flex items-center justify-between font-mono text-xs">
            <span className="flex items-center space-x-1.5 font-bold uppercase text-amber-400">
              <Coins className="h-4 w-4 text-amber-400 animate-bounce" />
              <span>{tierName} CARTRIDGE ({tierMult}x BOUNTY)</span>
            </span>
            <span className="rounded bg-amber-500/20 px-2 py-0.5 font-mono text-xs font-black text-amber-300 border border-amber-500/40">
              +{totalChogReward.toFixed(3)} $CHOG
            </span>
          </div>

          <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-zinc-400 border-t border-zinc-800/80 pt-2">
            <span>Base: +{(baseBounty * tierMult).toFixed(3)}</span>
            <span>Bosses: +{(bossBounty * tierMult).toFixed(3)}</span>
            <span>Minions: +{(enemyBounty * tierMult).toFixed(3)}</span>
            {results.victory && <span className="text-emerald-400 font-bold">Victory: +{(victoryBounty * tierMult).toFixed(3)}</span>}
          </div>

          <button
            type="button"
            onClick={handleClaimReward}
            disabled={claimStatus !== 'idle'}
            className={`mt-2.5 flex w-full items-center justify-center space-x-1.5 rounded-lg py-2 px-3 font-mono text-xs font-black transition cursor-pointer ${
              claimStatus === 'claimed'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                : claimStatus === 'claiming'
                ? 'bg-amber-500/40 text-amber-200 border border-amber-500/60 animate-pulse'
                : 'bg-amber-500 text-black hover:bg-amber-400 active:scale-95 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
            }`}
          >
            {claimStatus === 'claimed' ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span>CLAIMED TO {shortAddress || 'WALLET'} (+{totalChogReward.toFixed(3)} $CHOG)</span>
              </>
            ) : claimStatus === 'claiming' ? (
              <>
                <Wallet className="h-3.5 w-3.5 animate-spin" />
                <span>SIGNING MONAD CLAIM TX...</span>
              </>
            ) : (
              <>
                <Wallet className="h-3.5 w-3.5" />
                <span>CLAIM {totalChogReward.toFixed(3)} $CHOG TO {shortAddress || 'WALLET'}</span>
              </>
            )}
          </button>
        </div>

        {/* Stats Grid */}
        <div className="mt-3.5 grid grid-cols-2 gap-2.5 font-mono">
          {/* Score */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-2.5 text-center">
            <span className="text-[10px] uppercase text-zinc-500">Run Score</span>
            <p className="mt-1 text-xl sm:text-2xl font-black text-white">{results.score.toLocaleString()}</p>
          </div>

          {/* Personal Best */}
          <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-2.5 text-center">
            <span className="text-[10px] uppercase text-amber-400 flex items-center justify-center space-x-1">
              <Trophy className="h-3 w-3" />
              <span>Personal Best</span>
            </span>
            <p className="mt-1 text-xl sm:text-2xl font-black text-amber-300">
              {results.personalBest.toLocaleString()}
            </p>
          </div>

          {/* Enemies Defeated */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-2.5 text-center">
            <span className="text-[10px] uppercase text-zinc-500">Enemies Defeated</span>
            <p className="mt-1 text-lg font-bold text-zinc-200">{results.enemiesDefeated}</p>
          </div>

          {/* Cabinet Skulls */}
          <div className={`rounded-xl border p-2.5 text-center ${cabinetStatus.badgeColor}`}>
            <span className="text-[10px] uppercase flex items-center justify-center space-x-1">
              <Skull className="h-3 w-3" />
              <span>Cabinet Status</span>
            </span>
            <p className="mt-1 text-xs font-bold truncate">{cabinetStatus.milestone}</p>
            <span className="text-[10px] opacity-80">{results.skullCount} Skulls</span>
          </div>

          {/* Bosses, Skills & Overclock Row */}
          <div className="col-span-2 grid grid-cols-3 gap-2 text-center text-xs font-mono">
            <div className="rounded-lg bg-zinc-900/80 p-2 border border-zinc-800">
              <span className="text-zinc-500 text-[9px] uppercase block">Bosses Down</span>
              <span className="text-purple-400 font-bold">{results.bossesDefeated || 0}</span>
            </div>
            <div className="rounded-lg bg-zinc-900/80 p-2 border border-zinc-800">
              <span className="text-zinc-500 text-[9px] uppercase block">Skills Looted</span>
              <span className="text-cyan-400 font-bold">{results.skillsCollected || 0}</span>
            </div>
            <div className="rounded-lg bg-zinc-900/80 p-2 border border-zinc-800">
              <span className="text-zinc-500 text-[9px] uppercase block">Overclock</span>
              <span className="text-amber-400 font-bold">LVL {results.overclockLevel || 1}</span>
            </div>
          </div>
        </div>

        {/* Challenge Copy Button */}
        <div className="mt-3.5">
          <button
            type="button"
            onClick={handleCopyChallenge}
            className="flex w-full items-center justify-center space-x-2 rounded-xl border border-zinc-700 bg-zinc-900/80 py-2.5 px-4 font-mono text-xs font-bold text-zinc-200 shadow-sm transition hover:border-emerald-500 hover:text-emerald-300 hover:bg-zinc-850 active:scale-95 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-400" />
                <span className="text-emerald-400">CHALLENGE COPIED TO CLIPBOARD!</span>
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4 text-zinc-400" />
                <span>SHARE SCORE & CHALLENGE LINK</span>
              </>
            )}
          </button>
        </div>

        {/* Actions */}
        <div className="mt-3 flex flex-col sm:flex-row items-center gap-2">
          <button
            type="button"
            onClick={onRestart}
            className="flex flex-1 w-full items-center justify-center space-x-2 rounded-xl bg-emerald-500 py-3 px-4 font-mono text-xs font-bold text-black shadow-[0_0_20px_rgba(34,197,94,0.4)] transition hover:bg-emerald-400 active:scale-95 cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" />
            <span>PLAY AGAIN</span>
          </button>

          {(() => {
            const demoIds = [969, 404, 77, 1337, 42, 1969];
            const currentIdx = demoIds.indexOf(results.tokenId);
            const nextTokenId = currentIdx !== -1 ? demoIds[(currentIdx + 1) % demoIds.length] : demoIds[0];
            return (
              <Link
                href={`/play/${nextTokenId}`}
                className="flex items-center justify-center space-x-1.5 w-full sm:w-auto rounded-xl border border-purple-500/60 bg-purple-950/40 py-3 px-3.5 font-mono text-xs font-bold text-purple-300 hover:bg-purple-900/50 hover:border-purple-400 transition cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                <span>NEXT #{nextTokenId} ▶</span>
              </Link>
            );
          })()}

          <Link
            href="/browse"
            className="flex items-center justify-center space-x-1.5 w-full sm:w-auto rounded-xl border border-zinc-700 bg-zinc-900 py-3 px-4 font-mono text-xs font-semibold text-zinc-300 hover:border-zinc-500 hover:text-white transition cursor-pointer"
          >
            <Compass className="h-4 w-4" />
            <span>ALL CHOGS</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
