'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { RunResults } from '@/types/chog';
import { getCabinetStatus } from '@/lib/storage';
import { Trophy, Skull, Share2, RotateCcw, Compass, Check, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface GameOverModalProps {
  results: RunResults;
  onRestart: () => void;
}

export default function GameOverModal({ results, onRestart }: GameOverModalProps) {
  const [copied, setCopied] = useState(false);
  const cabinetStatus = getCabinetStatus(results.skullCount);

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
    const url = typeof window !== 'undefined' ? window.location.href : `https://chog969.arcade/play/${results.tokenId}`;
    const text = `I survived ${results.survivedSeconds}s inside Chog #${results.tokenId}. Can you beat my cartridge? ${url}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border-2 border-emerald-500/60 bg-zinc-950 p-6 shadow-[0_0_50px_rgba(34,197,94,0.35)]">
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

          <h2 className="mt-3 font-mono text-3xl font-black tracking-wide text-white">
            {results.victory ? '60 SECONDS SURVIVED' : `SURVIVED ${results.survivedSeconds}s`}
          </h2>
          <p className="mt-1 font-mono text-xs text-zinc-400">
            Cartridge #{results.tokenId} — {results.chogName}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="mt-6 grid grid-cols-2 gap-3 font-mono">
          {/* Score */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 text-center">
            <span className="text-[10px] uppercase text-zinc-500">Run Score</span>
            <p className="mt-1 text-2xl font-black text-white">{results.score.toLocaleString()}</p>
          </div>

          {/* Personal Best */}
          <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-3 text-center">
            <span className="text-[10px] uppercase text-amber-400 flex items-center justify-center space-x-1">
              <Trophy className="h-3 w-3" />
              <span>Personal Best</span>
            </span>
            <p className="mt-1 text-2xl font-black text-amber-300">
              {results.personalBest.toLocaleString()}
            </p>
          </div>

          {/* Enemies Defeated */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 text-center">
            <span className="text-[10px] uppercase text-zinc-500">Enemies Defeated</span>
            <p className="mt-1 text-xl font-bold text-zinc-200">{results.enemiesDefeated}</p>
          </div>

          {/* Cabinet Skulls */}
          <div className={`rounded-xl border p-3 text-center ${cabinetStatus.badgeColor}`}>
            <span className="text-[10px] uppercase flex items-center justify-center space-x-1">
              <Skull className="h-3 w-3" />
              <span>Cabinet Status</span>
            </span>
            <p className="mt-1 text-xs font-bold truncate">{cabinetStatus.milestone}</p>
            <span className="text-[10px] opacity-80">{results.skullCount} Skulls</span>
          </div>

          {/* Bosses & Skills Row */}
          <div className="col-span-2 grid grid-cols-2 gap-2 text-center text-xs font-mono">
            <div className="rounded-lg bg-zinc-900/80 p-2 border border-zinc-800">
              <span className="text-zinc-500 text-[10px] uppercase block">Colossus Bosses Down</span>
              <span className="text-purple-400 font-bold">{results.bossesDefeated || 0}</span>
            </div>
            <div className="rounded-lg bg-zinc-900/80 p-2 border border-zinc-800">
              <span className="text-zinc-500 text-[10px] uppercase block">Bonus Skills Looted</span>
              <span className="text-cyan-400 font-bold">{results.skillsCollected || 0}</span>
            </div>
          </div>
        </div>

        {/* Trait Summary */}
        <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-900/40 p-3 text-xs text-zinc-300">
          <span className="block font-mono text-[10px] uppercase font-bold text-zinc-500">
            Generated Trait Architecture
          </span>
          <p className="mt-1 font-mono text-xs text-emerald-400">{results.traitsSummary}</p>
        </div>

        {/* Challenge Copy Button */}
        <div className="mt-5">
          <button
            onClick={handleCopyChallenge}
            className="flex w-full items-center justify-center space-x-2 rounded-xl border border-purple-500/60 bg-purple-950/40 py-3 px-4 font-mono text-xs font-bold text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.3)] transition hover:bg-purple-900/60 active:scale-95"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-400" />
                <span className="text-emerald-400">CHALLENGE COPIED TO CLIPBOARD!</span>
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4" />
                <span>COPY CHALLENGE TEXT</span>
              </>
            )}
          </button>
        </div>

        {/* Actions */}
        <div className="mt-3 flex flex-col sm:flex-row items-center gap-2">
          <button
            onClick={onRestart}
            className="flex flex-1 w-full items-center justify-center space-x-2 rounded-xl bg-emerald-500 py-3 px-4 font-mono text-xs font-bold text-black shadow-[0_0_20px_rgba(34,197,94,0.4)] transition hover:bg-emerald-400 active:scale-95"
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
                className="flex items-center justify-center space-x-1.5 w-full sm:w-auto rounded-xl border border-purple-500/60 bg-purple-950/40 py-3 px-3.5 font-mono text-xs font-bold text-purple-300 hover:bg-purple-900/50 transition"
              >
                <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                <span>NEXT #{nextTokenId} ▶</span>
              </Link>
            );
          })()}

          <Link
            href="/browse"
            className="flex items-center justify-center space-x-1.5 w-full sm:w-auto rounded-xl border border-zinc-700 bg-zinc-900 py-3 px-4 font-mono text-xs font-semibold text-zinc-300 hover:border-zinc-500 hover:text-white transition"
          >
            <Compass className="h-4 w-4" />
            <span>ALL CHOGS</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
