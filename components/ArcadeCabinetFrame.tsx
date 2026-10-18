import React from 'react';
import { CabinetStatus } from '@/lib/storage';
import { Skull, Trophy } from 'lucide-react';

interface ArcadeCabinetFrameProps {
  children: React.ReactNode;
  cabinetStatus: CabinetStatus;
  bestScore?: number;
  tokenId?: number;
}

export default function ArcadeCabinetFrame({
  children,
  cabinetStatus,
  bestScore = 0,
  tokenId,
}: ArcadeCabinetFrameProps) {
  return (
    <div className={`relative mx-auto w-full max-w-5xl rounded-2xl border-4 bg-zinc-950 p-2 sm:p-4 transition duration-500 ${cabinetStatus.glowClass}`}>
      {/* Cabinet Marquee / Header Bar */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
        {/* Left: Coin & Title */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-[11px] font-mono text-zinc-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>SOLO FREEPLAY</span>
          </div>

          {tokenId && (
            <span className="font-mono text-sm font-bold text-white tracking-wider">
              CARTRIDGE <span className="text-emerald-400">#{tokenId}</span>
            </span>
          )}
        </div>

        {/* Right: Cabinet Milestone & Best Score */}
        <div className="flex items-center space-x-3 text-xs font-mono">
          {/* Skull / Cabinet Status */}
          <div className={`flex items-center space-x-1.5 rounded-md border px-2.5 py-1 ${cabinetStatus.badgeColor}`}>
            <Skull className="h-3.5 w-3.5" />
            <span className="font-semibold">{cabinetStatus.milestone}</span>
            <span className="text-[10px] opacity-80">({cabinetStatus.skullCount} skulls)</span>
          </div>

          {/* Personal Best */}
          <div className="hidden sm:flex items-center space-x-1.5 rounded-md border border-amber-500/40 bg-amber-950/20 px-2.5 py-1 text-amber-300">
            <Trophy className="h-3.5 w-3.5 text-amber-400" />
            <span>BEST: {bestScore.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Screen CRT Housing */}
      <div className="relative overflow-hidden rounded-xl border border-zinc-800 bg-black shadow-inner">
        {/* Hardware-accelerated CRT edge vignette */}
        <div className="pointer-events-none absolute inset-0 z-20 shadow-[inset_0_0_35px_rgba(0,0,0,0.85)]" />

        {/* Content */}
        {children}
      </div>

      {/* Cabinet Bottom Control Decal / Vent */}
      <div className="mt-3 flex items-center justify-between px-2 text-[10px] font-mono text-zinc-600">
        <div className="flex items-center space-x-2">
          <span>STEREO AUDIO</span>
          <span>•</span>
          <span>DETERMINISTIC PRNG 32</span>
        </div>
        <div>
          <span>MODEL: CHOG-969-REV4</span>
        </div>
      </div>
    </div>
  );
}
