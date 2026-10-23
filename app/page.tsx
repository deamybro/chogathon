'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DEMO_CHOGS } from '@/lib/demoChogs';
import ChogCard from '@/components/ChogCard';
import DemoVideoModal from '@/components/DemoVideoModal';
import { useWallet } from '@/context/WalletContext';
import { Play, Compass, ArrowRight, Zap, Shield, Sparkles, Terminal, Flame, Eye, Layers, Dna, BatteryCharging, Coins, Film } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { isConnected, setIsGachaModalOpen, setIsWalletModalOpen, userChogs } = useWallet();
  const [inputTokenId, setInputTokenId] = useState('');
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const featuredChogs = DEMO_CHOGS.slice(0, 3); // 969, 404, 77

  const handleQuickPlay = (e: React.FormEvent) => {
    e.preventDefault();
    const token = parseInt(inputTokenId.trim(), 10);
    if (!isNaN(token) && token > 0) {
      router.push(`/play/${token}`);
    } else {
      router.push('/play/969');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center">
      {/* HERO SECTION */}
      <section className="relative w-full overflow-hidden border-b border-emerald-500/20 py-16 sm:py-24">
        {/* Ambient Glows */}
        <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-emerald-500/15 blur-[120px]" />
        <div className="pointer-events-none absolute top-1/2 right-10 h-80 w-80 rounded-full bg-purple-600/15 blur-[100px]" />

        <div className="relative mx-auto max-w-5xl px-4 text-center sm:px-6">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 rounded-full border border-emerald-500/40 bg-emerald-950/40 px-3.5 py-1 text-xs font-mono font-bold text-emerald-400 shadow-[0_0_15px_rgba(34,197,94,0.25)]">
            <Sparkles className="h-3.5 w-3.5" />
            <span>THE 60-SECOND LIVING CARTRIDGE ARCADE</span>
          </div>

          {/* Core Pitches */}
          <h1 className="mt-6 font-mono text-4xl sm:text-6xl font-black tracking-tight text-white uppercase leading-tight">
            Your Chog is <br className="hidden sm:inline" />
            <span className="text-emerald-400 neon-glow-green">the cartridge.</span>
          </h1>

          <p className="mx-auto mt-4 max-w-2xl font-mono text-base sm:text-lg text-zinc-300">
            “Plug in any Chog. Survive its dream.”
          </p>

          <p className="mx-auto mt-2 max-w-2xl text-xs sm:text-sm text-zinc-400">
            A Chog’s real metadata traits plus token ID deterministically generate its biome,
            player abilities, weapon style, hazards, enemy sequence, and score multiplier.
            The NFT is not a cosmetic login skin: <strong>it is the game cartridge.</strong>
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => {
                if (!isConnected) {
                  setIsWalletModalOpen(true);
                } else {
                  setIsGachaModalOpen(true);
                }
              }}
              className="flex w-full sm:w-auto items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3.5 font-mono text-sm font-black text-white shadow-[0_0_25px_rgba(168,85,247,0.5)] transition hover:brightness-110 active:scale-95 cursor-pointer"
            >
              <Dna className="h-4 w-4" />
              <span>ROLL FREE TRIAL CARTRIDGE (7 RUNS)</span>
            </button>

            <Link
              href="/play/969"
              className="flex w-full sm:w-auto items-center justify-center space-x-2 rounded-xl bg-emerald-500 px-6 py-3.5 font-mono text-sm font-bold text-black shadow-[0_0_25px_rgba(34,197,94,0.45)] transition hover:bg-emerald-400 active:scale-95 cursor-pointer"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>PLAY DEMO #969</span>
            </Link>

            <Link
              href="/browse"
              className="flex w-full sm:w-auto items-center justify-center space-x-2 rounded-xl border border-zinc-700 bg-zinc-900/80 px-6 py-3.5 font-mono text-sm font-bold text-zinc-200 transition hover:border-zinc-500 hover:text-white cursor-pointer"
            >
              <Compass className="h-4 w-4" />
              <span>BROWSE ALL</span>
            </Link>

            <button
              onClick={() => setIsVideoModalOpen(true)}
              className="flex w-full sm:w-auto items-center justify-center space-x-2 rounded-xl border border-emerald-500/50 bg-emerald-950/30 px-5 py-3.5 font-mono text-sm font-bold text-emerald-300 shadow-[0_0_20px_rgba(34,197,94,0.2)] transition hover:bg-emerald-500/20 hover:text-white cursor-pointer"
            >
              <Film className="h-4 w-4 text-emerald-400" />
              <span>WATCH DEMO (64s)</span>
            </button>
          </div>

          {/* Quick Token Jump Bar */}
          <form
            onSubmit={handleQuickPlay}
            className="mx-auto mt-8 flex max-w-sm items-center rounded-xl border border-zinc-800 bg-zinc-900/60 p-1.5 focus-within:border-emerald-500 transition"
          >
            <div className="flex items-center pl-3 pr-2 text-zinc-500">
              <Terminal className="h-4 w-4" />
              <span className="ml-1 font-mono text-xs font-bold">#</span>
            </div>
            <input
              type="number"
              min="1"
              max="1969"
              placeholder="Enter Token ID (e.g. 404)"
              value={inputTokenId}
              onChange={(e) => setInputTokenId(e.target.value)}
              className="w-full bg-transparent px-2 font-mono text-xs text-white placeholder-zinc-500 focus:outline-none"
            />
            <button
              type="submit"
              className="flex items-center space-x-1 rounded-lg bg-emerald-500/20 px-3 py-1.5 font-mono text-xs font-bold text-emerald-300 hover:bg-emerald-500 hover:text-black transition"
            >
              <span>PLUG IN</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </form>

          <p className="mt-2 text-[11px] font-mono text-zinc-500">
            Fully solo playable by any judge. No wallet, no gas, no waiting.
          </p>
        </div>
      </section>

      {/* USER'S MINTED TRIAL CARTRIDGES (If any) */}
      {userChogs.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-12 sm:px-6 w-full">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-purple-500/30 pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="h-2 w-2 rounded-full bg-purple-400 animate-pulse" />
                <h2 className="font-mono text-2xl font-black text-white tracking-wide">
                  YOUR TRIAL CARTRIDGES ({userChogs.length})
                </h2>
              </div>
              <p className="mt-1 text-xs text-purple-300 font-mono">
                Luck-rolled trial cartridges on Monad. Track your remaining battery before they burn!
              </p>
            </div>
            <button
              onClick={() => setIsGachaModalOpen(true)}
              className="flex items-center space-x-1.5 rounded-lg border border-purple-500/50 bg-purple-950/30 px-3 py-1.5 font-mono text-xs font-bold text-purple-300 hover:bg-purple-950/50 transition cursor-pointer"
            >
              <Dna className="h-3.5 w-3.5 text-purple-400" />
              <span>ROLL ANOTHER TRIAL</span>
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {userChogs.map((chog) => (
              <ChogCard key={chog.tokenId} chog={chog} featured={false} />
            ))}
          </div>
        </section>
      )}

      {/* FEATURED DEMO CARTRIDGES */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 w-full">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div>
            <h2 className="font-mono text-2xl font-black text-white tracking-wide">
              FEATURED DEMO CARTRIDGES
            </h2>
            <p className="mt-1 text-xs text-zinc-400">
              Three visually and mechanically distinct cartridges ready for instant play.
            </p>
          </div>
          <Link
            href="/browse"
            className="flex items-center space-x-1 text-xs font-mono font-bold text-emerald-400 hover:text-emerald-300"
          >
            <span>VIEW ALL 6 FIXTURES + GENERATOR</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredChogs.map((chog) => (
            <ChogCard key={chog.tokenId} chog={chog} featured={chog.tokenId === 969} />
          ))}
        </div>
      </section>

      {/* TRAITS CREATE THE GAME SECTION */}
      <section className="w-full border-y border-zinc-800 bg-zinc-950/60 py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center">
            <span className="rounded bg-emerald-500/10 px-2.5 py-1 font-mono text-[11px] font-bold text-emerald-400 border border-emerald-500/30">
              DETERMINISTIC ARCHITECTURE
            </span>
            <h2 className="mt-3 font-mono text-2xl sm:text-3xl font-black text-white">
              “Traits create the game: biome, weapon, movement, chaos, and difficulty.”
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-xs sm:text-sm text-zinc-400">
              Every on-chain trait maps directly into an arcade gameplay parameter.
              No two different Chogs play the same, yet the same Chog always creates the identical level.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Background */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
              <div className="flex items-center space-x-2 text-cyan-400">
                <Layers className="h-4 w-4" />
                <span className="font-mono text-xs font-bold uppercase">Background → Biome</span>
              </div>
              <p className="mt-2 text-xs text-zinc-300 font-medium">
                Space brings low-gravity floaty momentum; Swamp adds viscous sludge slow zones;
                Neon grants hyper-lanes; Ice enables high-friction drifts.
              </p>
            </div>

            {/* Eyes */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
              <div className="flex items-center space-x-2 text-blue-400">
                <Eye className="h-4 w-4" />
                <span className="font-mono text-xs font-bold uppercase">Eyes → Targeting</span>
              </div>
              <p className="mt-2 text-xs text-zinc-300 font-medium">
                Laser eyes pierce through ranks of foes; Hypno eyes slow targeted enemies;
                Glasses impart high critical strike multipliers and extended range.
              </p>
            </div>

            {/* Mouth */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
              <div className="flex items-center space-x-2 text-amber-400">
                <Flame className="h-4 w-4" />
                <span className="font-mono text-xs font-bold uppercase">Mouth → Attack Pattern</span>
              </div>
              <p className="mt-2 text-xs text-zinc-300 font-medium">
                Grin mouths fire 3-way spread salvos; Sharp mouths fire rapid micro-plasma;
                Calm mouths charge heavy penetrating energy blasts.
              </p>
            </div>

            {/* Head */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
              <div className="flex items-center space-x-2 text-emerald-400">
                <Shield className="h-4 w-4" />
                <span className="font-mono text-xs font-bold uppercase">Head → Active Ability</span>
              </div>
              <p className="mt-2 text-xs text-zinc-300 font-medium">
                Crown grants temporary invulnerability; Hood triggers shadow phase dashes;
                Helmet emits a 360° knockback shockwave; Default injects emergency nano-heals.
              </p>
            </div>

            {/* Body */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
              <div className="flex items-center space-x-2 text-purple-400">
                <Zap className="h-4 w-4" />
                <span className="font-mono text-xs font-bold uppercase">Body → Archetype</span>
              </div>
              <p className="mt-2 text-xs text-zinc-300 font-medium">
                Suit grants tanky 150 HP at slight speed cost; Naked/light creates high-velocity
                glass-cannon scouts; Hoodie delivers balanced all-around stats.
              </p>
            </div>

            {/* Aura & Tier */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
              <div className="flex items-center space-x-2 text-pink-400">
                <Sparkles className="h-4 w-4" />
                <span className="font-mono text-xs font-bold uppercase">Aura → Chaos Modifier</span>
              </div>
              <p className="mt-2 text-xs text-zinc-300 font-medium">
                Flame calls down periodic meteor strikes; Glitch momentarily inverts controls;
                Gold boosts score by +50%; Higher tiers scale difficulty and rewards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW CHOG MATTERS SECTION */}
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/20 p-6 sm:p-8">
          <h3 className="font-mono text-xl font-bold text-white flex items-center space-x-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>HOW CHOG MATTERS: The Living Cartridge Paradigm</span>
          </h3>

          <div className="mt-4 space-y-3 text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans">
            <p>
              In traditional web3 gaming, NFTs are treated as cosmetic skins or gatekept entry tickets.
              <strong> CHOG969 reverses this paradigm: the NFT is the cartridge itself.</strong>
            </p>
            <p>
              When a player plugs in Chog #969 or Chog #404, the browser passes the verified metadata
              into a pure, mathematical derivation engine. The PRNG seed creates the exact same 60-second
              swarm escalation, hazard timing, and biome inertia every time.
            </p>
            <p>
              Players don’t just share high scores — they share <em>cartridges</em>.
              If you survive 60 seconds on an Overclocked Epic cartridge, your friends can enter the exact
              same token ID to face the exact same dream.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-4 pt-4 border-t border-emerald-500/20 text-xs font-mono">
            <span className="text-emerald-400">✓ Deterministic Mulberry32 PRNG</span>
            <span className="text-emerald-400">✓ 100% Solo Playable</span>
            <span className="text-emerald-400">✓ Local Cabinet Skull Progression</span>
            <span className="text-emerald-400">✓ Zero Wallet Gate</span>
          </div>
        </div>
      </section>

      {/* Demo Video Modal */}
      <DemoVideoModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
      />
    </div>
  );
}
