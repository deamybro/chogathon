'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Volume2, VolumeX, Sparkles, Gamepad2, Compass, Info } from 'lucide-react';
import { soundSynth } from '@/game/soundEffects';
import { getSoundEnabled, setSoundEnabled, getLucidDreamEnabled, setLucidDreamEnabled } from '@/lib/storage';

export default function Navbar() {
  const pathname = usePathname();
  const [soundOn, setSoundOn] = useState(() => getSoundEnabled());
  const [lucidDream, setLucidDream] = useState(() => getLucidDreamEnabled());

  useEffect(() => {
    soundSynth.enabled = soundOn;
  }, [soundOn]);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    soundSynth.enabled = next;
    if (next) soundSynth.playLaser();
  };

  const toggleLucidDream = () => {
    const next = !lucidDream;
    setLucidDream(next);
    setLucidDreamEnabled(next);
    if (next) {
      document.documentElement.classList.add('lucid-theme');
    } else {
      document.documentElement.classList.remove('lucid-theme');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-emerald-500/20 bg-black/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand */}
        <Link href="/" className="group flex items-center space-x-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-500/50 bg-emerald-950/40 shadow-[0_0_15px_rgba(34,197,94,0.3)] transition group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(34,197,94,0.6)]">
            <Gamepad2 className="h-6 w-6 text-emerald-400" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xl font-black tracking-wider text-white">
                CHOG<span className="text-emerald-400">969</span>
              </span>
              <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold tracking-widest text-emerald-400 border border-emerald-500/30">
                ARCADE
              </span>
            </div>
            <p className="text-[11px] font-medium text-zinc-400">The Living Cartridge</p>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center space-x-1 sm:space-x-3">
          <Link
            href="/"
            className={`flex items-center space-x-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              pathname === '/'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            <Gamepad2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Play</span>
          </Link>

          <Link
            href="/browse"
            className={`flex items-center space-x-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              pathname === '/browse'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            <Compass className="h-3.5 w-3.5" />
            <span>Browse</span>
          </Link>

          <Link
            href="/about"
            className={`flex items-center space-x-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              pathname === '/about'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            <Info className="h-3.5 w-3.5" />
            <span>About</span>
          </Link>

          <div className="h-4 w-px bg-zinc-800" />

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            title={soundOn ? 'Mute 8-bit Audio' : 'Unmute 8-bit Audio'}
            aria-label={soundOn ? 'Mute Sound' : 'Unmute Sound'}
            className="rounded-md border border-zinc-700 bg-zinc-900/80 p-2 text-zinc-300 hover:border-zinc-500 hover:text-white transition"
          >
            {soundOn ? <Volume2 className="h-4 w-4 text-emerald-400" /> : <VolumeX className="h-4 w-4 text-zinc-500" />}
          </button>

          {/* Lucid Dream Theme (Optional cosmetic, non-financial) */}
          <button
            onClick={toggleLucidDream}
            title="Cosmetic Lucid Dream Mode (non-financial theme)"
            aria-label="Toggle Lucid Dream Theme"
            className={`hidden sm:flex items-center space-x-1 rounded-md border px-2.5 py-1.5 text-xs font-medium transition ${
              lucidDream
                ? 'border-purple-500 bg-purple-950/40 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="h-3 w-3" />
            <span className="text-[11px]">Lucid</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
