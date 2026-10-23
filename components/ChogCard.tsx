'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Chog } from '@/types/chog';
import { deriveGameConfig } from '@/game/traitMapping';
import { getCartridgeBattery } from '@/lib/web3/batteryStorage';
import { Play, Sparkles, AlertCircle, BatteryCharging, Flame } from 'lucide-react';

interface ChogCardProps {
  chog: Chog;
  featured?: boolean;
}

export default function ChogCard({ chog, featured = false }: ChogCardProps) {
  const [imgError, setImgError] = useState(false);
  const config = deriveGameConfig(chog);
  const battery = chog.battery || getCartridgeBattery(chog.tokenId);

  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-xl border bg-zinc-900/90 transition duration-300 hover:-translate-y-1 ${
        featured
          ? 'border-emerald-500/60 shadow-[0_0_25px_rgba(34,197,94,0.25)] hover:shadow-[0_0_35px_rgba(34,197,94,0.45)]'
          : 'border-zinc-800 hover:border-emerald-500/50 hover:shadow-[0_0_20px_rgba(34,197,94,0.15)]'
      }`}
    >
      {/* Top Banner & Status */}
      <div className="absolute top-3 left-3 z-10 flex items-center space-x-1.5">
        <span className="rounded-md border border-emerald-500/40 bg-black/80 px-2 py-0.5 font-mono text-xs font-bold text-emerald-400 backdrop-blur-md">
          #{chog.tokenId}
        </span>
        {battery.isTrial ? (
          <span
            className={`flex items-center space-x-1 rounded-md border px-2 py-0.5 text-[10px] font-mono font-bold backdrop-blur-md ${
              battery.isBurned
                ? 'border-rose-500/60 bg-rose-950/80 text-rose-300'
                : battery.runsRemaining <= 2
                ? 'border-amber-500/60 bg-amber-950/80 text-amber-300'
                : 'border-emerald-500/50 bg-black/80 text-emerald-400'
            }`}
          >
            {battery.isBurned ? (
              <>
                <Flame className="h-3 w-3 text-rose-400" />
                <span>0/7 (MELTED)</span>
              </>
            ) : (
              <>
                <BatteryCharging className="h-3 w-3" />
                <span>{battery.runsRemaining}/7 RUNS</span>
              </>
            )}
          </span>
        ) : (
          <span className="flex items-center space-x-1 rounded-md border border-amber-500/50 bg-black/80 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-300 backdrop-blur-md">
            <span>PERMANENT ♾️</span>
          </span>
        )}
      </div>

      <div className="absolute top-3 right-3 z-10">
        <span className="rounded-md border border-purple-500/40 bg-black/80 px-2 py-0.5 font-mono text-[10px] font-bold text-purple-300 backdrop-blur-md">
          {config.difficulty.tier.toUpperCase()}
        </span>
      </div>

      {/* Chog Image / Visual Avatar */}
      <div className="relative aspect-square w-full overflow-hidden bg-zinc-950">
        {imgError ? (
          <div className="flex h-full w-full items-center justify-center bg-zinc-900 text-zinc-500">
            <div className="text-center p-4">
              <Sparkles className="mx-auto h-8 w-8 text-emerald-400 mb-2" />
              <p className="font-mono text-xs text-zinc-300">Cartridge #{chog.tokenId}</p>
            </div>
          </div>
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={chog.image}
            alt={chog.name}
            onError={() => setImgError(true)}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-60" />
      </div>

      {/* Metadata & Traits */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-mono text-base font-bold text-white group-hover:text-emerald-400 transition">
          {chog.name}
        </h3>
        {chog.description && (
          <p className="mt-1 line-clamp-2 text-xs text-zinc-400">{chog.description}</p>
        )}

        <div className="mt-3 grid grid-cols-2 gap-1.5 text-[11px]">
          <div className="rounded bg-zinc-800/60 p-1.5 border border-zinc-700/50">
            <span className="text-zinc-500 block text-[9px] uppercase font-bold">Biome</span>
            <span className="text-zinc-200 font-medium truncate block">{config.biome.name}</span>
          </div>
          <div className="rounded bg-zinc-800/60 p-1.5 border border-zinc-700/50">
            <span className="text-zinc-500 block text-[9px] uppercase font-bold">Attack</span>
            <span className="text-zinc-200 font-medium truncate block">{config.attack.name}</span>
          </div>
          <div className="rounded bg-zinc-800/60 p-1.5 border border-zinc-700/50">
            <span className="text-zinc-500 block text-[9px] uppercase font-bold">Active Ability</span>
            <span className="text-zinc-200 font-medium truncate block">{config.ability.name}</span>
          </div>
          <div className="rounded bg-zinc-800/60 p-1.5 border border-zinc-700/50">
            <span className="text-zinc-500 block text-[9px] uppercase font-bold">Chaos Rule</span>
            <span className="text-zinc-200 font-medium truncate block">{config.chaos.name}</span>
          </div>
        </div>

        <div className="mt-2.5 rounded-md bg-amber-500/10 px-2 py-1.5 border border-amber-500/30 text-[10px] font-mono">
          <span className="text-[9px] uppercase font-black text-amber-400 block">HERO SIGNATURE SKILL</span>
          <span className="font-bold text-white truncate block">{config.signatureSkill.name}</span>
        </div>

        {/* Action Button */}
        <div className="mt-4 pt-2">
          <Link
            href={`/play/${chog.tokenId}`}
            className="flex w-full items-center justify-center space-x-2 rounded-lg bg-emerald-500 py-2.5 px-4 font-mono text-xs font-bold text-black shadow-[0_0_15px_rgba(34,197,94,0.4)] transition hover:bg-emerald-400 active:scale-95 cursor-pointer"
          >
            <Play className="h-4 w-4 fill-current" />
            <span>PLAY CARTRIDGE</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
