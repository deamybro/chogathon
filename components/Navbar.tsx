'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Volume2, VolumeX, Sparkles, Gamepad2, Compass, Info, Wallet, Coins, Dna, LogOut, ChevronDown } from 'lucide-react';
import { soundSynth } from '@/game/soundEffects';
import { getSoundEnabled, setSoundEnabled, getLucidDreamEnabled, setLucidDreamEnabled } from '@/lib/storage';
import { useWallet } from '@/context/WalletContext';

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

  const {
    walletAddress,
    shortAddress,
    isConnected,
    setIsWalletModalOpen,
    setIsGachaModalOpen,
    disconnectWallet,
    userChogs,
    claimedBountyBalance,
  } = useWallet();

  const [walletMenuOpen, setWalletMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-emerald-500/20 bg-black/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3">
        {/* Brand */}
        <Link href="/" className="group flex items-center space-x-2.5 sm:space-x-3">
          <div className="relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg border border-emerald-500/50 bg-emerald-950/40 shadow-[0_0_15px_rgba(34,197,94,0.3)] transition group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(34,197,94,0.6)]">
            <Gamepad2 className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-400" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <span className="font-mono text-lg sm:text-xl font-black tracking-wider text-white">
                CHOG<span className="text-emerald-400">969</span>
              </span>
              <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold tracking-widest text-emerald-400 border border-emerald-500/30">
                ARCADE
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] font-medium text-zinc-400 hidden xs:block">The Living Cartridge</p>
          </div>
        </Link>

        {/* Navigation & Web3 Actions */}
        <nav className="flex items-center space-x-1 sm:space-x-2.5">
          <Link
            href="/"
            className={`flex items-center space-x-1 rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${
              pathname === '/'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            <Gamepad2 className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Play</span>
          </Link>

          <Link
            href="/browse"
            className={`flex items-center space-x-1 rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${
              pathname === '/browse'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            <Compass className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Browse</span>
          </Link>

          {/* 400 $CHOG Bounty Pool Pill */}
          <div className="hidden lg:flex items-center space-x-1.5 rounded-full border border-amber-500/40 bg-amber-950/20 px-2.5 py-1 font-mono text-[10px] text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.15)]">
            <Coins className="h-3 w-3 text-amber-400 animate-pulse" />
            <span className="font-bold">400 $CHOG POOL</span>
          </div>

          {/* Roll Free Trial Cartridge Button */}
          <button
            onClick={() => {
              soundSynth.playLaser(false);
              setIsGachaModalOpen(true);
            }}
            className="flex items-center space-x-1 rounded-lg border border-purple-500/50 bg-gradient-to-r from-purple-950/40 to-pink-950/30 px-2 sm:px-2.5 py-1.5 font-mono text-xs font-bold text-purple-300 hover:border-purple-400 hover:text-white transition shadow-[0_0_15px_rgba(168,85,247,0.25)] cursor-pointer"
          >
            <Dna className="h-3.5 w-3.5 text-purple-400" />
            <span className="hidden xs:inline">Roll Trial</span>
            <span className="rounded bg-purple-500/30 px-1 text-[9px] text-purple-200">7 Runs</span>
          </button>

          {/* Web3 Connect Wallet Button */}
          {!isConnected ? (
            <button
              onClick={() => {
                soundSynth.playLaser(false);
                setIsWalletModalOpen(true);
              }}
              className="flex items-center space-x-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 px-3 py-1.5 font-mono text-xs font-bold text-black shadow-[0_0_15px_rgba(34,197,94,0.4)] active:scale-95 transition cursor-pointer"
            >
              <Wallet className="h-3.5 w-3.5 fill-current" />
              <span>CONNECT</span>
            </button>
          ) : (
            <div className="relative">
              <button
                onClick={() => setWalletMenuOpen(!walletMenuOpen)}
                className="flex items-center space-x-1.5 rounded-lg border border-emerald-500/50 bg-emerald-950/30 px-2.5 py-1.5 font-mono text-xs font-bold text-emerald-300 hover:border-emerald-400 transition cursor-pointer"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{shortAddress}</span>
                <ChevronDown className="h-3 w-3 text-emerald-400" />
              </button>

              {walletMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-zinc-800 bg-zinc-950 p-2 shadow-2xl font-mono text-xs z-50 animate-in fade-in">
                  <div className="px-2 py-1.5 border-b border-zinc-800">
                    <p className="text-[10px] text-zinc-400">NETWORK</p>
                    <p className="font-bold text-emerald-400">Monad Testnet</p>
                  </div>

                  {claimedBountyBalance > 0 && (
                    <div className="px-2 py-1.5 border-b border-zinc-800">
                      <p className="text-[10px] text-zinc-400">CLAIMED $CHOG</p>
                      <p className="font-bold text-amber-400">+{claimedBountyBalance.toFixed(3)} $CHOG</p>
                    </div>
                  )}

                  {userChogs.length > 0 && (
                    <div className="px-2 py-1.5 border-b border-zinc-800">
                      <p className="text-[10px] text-zinc-400">MY TRIAL CHOGS</p>
                      <p className="font-bold text-purple-300">{userChogs.length} Cartridge(s)</p>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      disconnectWallet();
                      setWalletMenuOpen(false);
                    }}
                    className="mt-1 flex w-full items-center space-x-1.5 rounded-lg px-2 py-1.5 text-red-400 hover:bg-red-950/30 transition text-left cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Disconnect</span>
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="h-4 w-px bg-zinc-800 hidden sm:block" />

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            title={soundOn ? 'Mute 8-bit Audio' : 'Unmute 8-bit Audio'}
            aria-label={soundOn ? 'Mute Sound' : 'Unmute Sound'}
            className="rounded-md border border-zinc-700 bg-zinc-900/80 p-1.5 text-zinc-300 hover:border-zinc-500 hover:text-white transition cursor-pointer"
          >
            {soundOn ? <Volume2 className="h-3.5 w-3.5 text-emerald-400" /> : <VolumeX className="h-3.5 w-3.5 text-zinc-500" />}
          </button>
        </nav>
      </div>
    </header>
  );
}
