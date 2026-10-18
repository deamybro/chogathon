import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-zinc-800/80 bg-zinc-950/90 py-8 text-zinc-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div>
            <p className="font-mono text-sm font-bold text-white tracking-wide">
              CHOG969 — THE LIVING CARTRIDGE ARCADE
            </p>
            <p className="mt-1 text-xs text-zinc-500 max-w-md">
              Every Chog NFT is an authentic 60-second top-down arcade cartridge. Deterministic mechanics generated from on-chain traits + token ID.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-medium">
            <Link href="/" className="hover:text-emerald-400 transition">
              Home
            </Link>
            <Link href="/browse" className="hover:text-emerald-400 transition">
              Cartridge Browser
            </Link>
            <Link href="/play/969" className="hover:text-emerald-400 transition">
              Play #969
            </Link>
            <Link href="/about" className="hover:text-emerald-400 transition">
              Judging & Architecture
            </Link>
          </div>
        </div>

        <div className="mt-6 border-t border-zinc-900 pt-4 flex flex-col sm:flex-row items-center justify-between text-[11px] text-zinc-600">
          <span>Solo-playable instantly. Zero wallet connection required. No staking or gambling.</span>
          <span className="font-mono mt-2 sm:mt-0">Token Range: #1 – #1969</span>
        </div>
      </div>
    </footer>
  );
}
