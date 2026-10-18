'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DEMO_CHOGS } from '@/lib/demoChogs';
import ChogCard from '@/components/ChogCard';
import { Search, Compass, Sparkles, Filter, Info, ArrowRight } from 'lucide-react';

export default function BrowsePage() {
  const router = useRouter();
  const [tokenInput, setTokenInput] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const token = parseInt(tokenInput.trim(), 10);

    if (isNaN(token) || token < 1 || token > 1969) {
      setErrorMessage('Please enter a valid token ID between 1 and 1969.');
      return;
    }

    router.push(`/play/${token}`);
  };

  const filteredChogs = DEMO_CHOGS.filter((chog) => {
    if (selectedTier === 'all') return true;
    return chog.traits.tier.toLowerCase().includes(selectedTier.toLowerCase());
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      {/* Page Header */}
      <div className="text-center">
        <div className="inline-flex items-center space-x-1.5 rounded-full border border-emerald-500/40 bg-emerald-950/40 px-3 py-1 text-xs font-mono font-bold text-emerald-400">
          <Compass className="h-3.5 w-3.5" />
          <span>CARTRIDGE REPOSITORY</span>
        </div>
        <h1 className="mt-3 font-mono text-3xl sm:text-5xl font-black text-white">
          BROWSE CHOG CARTRIDGES
        </h1>
        <p className="mx-auto mt-2 max-w-2xl text-xs sm:text-sm text-zinc-400">
          Select any curated fixture cartridge below or enter any Token ID from <strong>#1 to #1969</strong>.
          Every token deterministically generates its own permanent arcade challenge.
        </p>
      </div>

      {/* Token ID Search Bar */}
      <div className="mx-auto mt-8 max-w-xl">
        <form
          onSubmit={handleSearch}
          className="flex flex-col sm:flex-row items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-2 shadow-[0_0_25px_rgba(0,0,0,0.5)] focus-within:border-emerald-500 transition"
        >
          <div className="relative flex flex-1 w-full items-center pl-3">
            <Search className="h-4 w-4 text-zinc-500" />
            <input
              type="number"
              min="1"
              max="1969"
              placeholder="Search Token ID (1 - 1969)"
              value={tokenInput}
              onChange={(e) => {
                setTokenInput(e.target.value);
                setErrorMessage(null);
              }}
              className="w-full bg-transparent px-3 py-2 font-mono text-sm text-white placeholder-zinc-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="flex w-full sm:w-auto items-center justify-center space-x-2 rounded-xl bg-emerald-500 px-6 py-2.5 font-mono text-xs font-bold text-black shadow-[0_0_15px_rgba(34,197,94,0.4)] transition hover:bg-emerald-400 active:scale-95"
          >
            <span>LOAD CARTRIDGE</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </form>

        {errorMessage && (
          <p className="mt-2 text-center font-mono text-xs text-red-400 animate-in fade-in">
            {errorMessage}
          </p>
        )}

        {/* Quick jump tokens */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs font-mono text-zinc-400">
          <span className="text-[11px] text-zinc-500">Quick Jump:</span>
          {[969, 404, 77, 1337, 42, 1969].map((id) => (
            <button
              key={id}
              onClick={() => router.push(`/play/${id}`)}
              className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-zinc-300 hover:border-emerald-500 hover:text-emerald-400 transition"
            >
              #{id}
            </button>
          ))}
        </div>
      </div>

      {/* Determinism Notice Banner */}
      <div className="mx-auto mt-8 max-w-4xl rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 text-xs text-zinc-400 flex items-start space-x-3">
        <Info className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-mono font-bold text-zinc-200 uppercase">
            Deterministic Cartridge Guarantee:
          </span>
          <p className="mt-0.5 leading-relaxed">
            The same Token ID always creates the identical level layout, biome momentum, weapon spread, and enemy spawn sequence.
            Any player entering the same token ID will face the exact same arcade cartridge parameters.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <h2 className="font-mono text-xl font-bold text-white flex items-center space-x-2">
          <Sparkles className="h-4 w-4 text-emerald-400" />
          <span>CURATED FIXTURE CARTRIDGES</span>
        </h2>

        <div className="flex items-center space-x-2 text-xs font-mono">
          <Filter className="h-3.5 w-3.5 text-zinc-500" />
          {['all', 'common', 'rare', 'epic', 'legendary'].map((tier) => (
            <button
              key={tier}
              onClick={() => setSelectedTier(tier)}
              className={`rounded-md px-2.5 py-1 uppercase font-semibold transition ${
                selectedTier === tier
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {tier}
            </button>
          ))}
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredChogs.map((chog) => (
          <ChogCard key={chog.tokenId} chog={chog} featured={chog.tokenId === 969} />
        ))}
      </div>
    </div>
  );
}
