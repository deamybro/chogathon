import React from 'react';
import Link from 'next/link';
import { Play, CheckCircle2, Cpu, Code2, Sparkles, Layers, Award } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      {/* Header */}
      <div className="text-center">
        <span className="rounded-full border border-emerald-500/40 bg-emerald-950/40 px-3 py-1 font-mono text-xs font-bold text-emerald-400">
          JUDGING & ARCHITECTURE BRIEF
        </span>
        <h1 className="mt-4 font-mono text-3xl sm:text-5xl font-black text-white">
          CHOG969 — THE LIVING CARTRIDGE ARCADE
        </h1>
        <p className="mx-auto mt-2 max-w-2xl text-xs sm:text-sm text-zinc-400">
          A full-stack, solo-playable web arcade where the NFT is the game cartridge itself.
        </p>
      </div>

      {/* 60-Second Judge Quick-Test Guide */}
      <div className="mt-8 rounded-2xl border-2 border-emerald-500/60 bg-emerald-950/20 p-6 shadow-[0_0_30px_rgba(34,197,94,0.15)]">
        <div className="flex items-center space-x-2 text-emerald-400 font-mono font-bold text-sm">
          <Sparkles className="h-5 w-5" />
          <span>JUDGE EVALUATION IN UNDER 60 SECONDS</span>
        </div>
        <ol className="mt-4 space-y-2 text-xs sm:text-sm text-zinc-200 list-decimal list-inside font-sans">
          <li>
            <strong>Plug in Flagship Cartridge #969:</strong> Click “Play Cartridge” to launch Cyber Chog Prime. Notice the Neon Biome with hyper-lanes, twin laser targeting, and Royal Shield.
          </li>
          <li>
            <strong>Compare with Void Cartridge #404:</strong> Load #404. Notice how the biome shifts to Zero-G floaty space, the mouth switches to a heavy plasma blast, and the aura introduces dimensional glitches!
          </li>
          <li>
            <strong>Test Determinism:</strong> Reload the page or enter token #969 again in a new tab. The seed, wave spawn cadence, and weapon attributes are mathematically identical every time.
          </li>
        </ol>
        <div className="mt-4 pt-3 border-t border-emerald-500/20 flex items-center justify-between">
          <span className="text-xs font-mono text-emerald-400">Zero wallet connection required. Zero waiting.</span>
          <Link
            href="/play/969"
            className="inline-flex items-center space-x-1.5 rounded-lg bg-emerald-500 px-4 py-2 font-mono text-xs font-bold text-black hover:bg-emerald-400 transition"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>LAUNCH #969 NOW</span>
          </Link>
        </div>
      </div>

      {/* What it is */}
      <div className="mt-12 space-y-4">
        <h2 className="font-mono text-xl font-bold text-white flex items-center space-x-2">
          <Cpu className="h-5 w-5 text-emerald-400" />
          <span>1. WHAT IT IS</span>
        </h2>
        <p className="text-sm text-zinc-300 leading-relaxed">
          CHOG969 is a fast-paced 60-second top-down survival arcade. In typical Web3 games, NFTs serve only as cosmetic skins or paid entry passes. In CHOG969,
          <strong> every Chog NFT is an authentic 60-second arcade cartridge</strong>. Its on-chain traits and token ID mathematically dictate its level, biome friction, player attributes, weapon firing spread, active ability, and enemy wave escalation.
        </p>
      </div>

      {/* Why Chog NFT is essential */}
      <div className="mt-10 space-y-4">
        <h2 className="font-mono text-xl font-bold text-white flex items-center space-x-2">
          <Award className="h-5 w-5 text-emerald-400" />
          <span>2. WHY THE CHOG NFT IS ESSENTIAL</span>
        </h2>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-3 text-sm text-zinc-300">
          <p>
            Without the NFT, the game has no cartridge identity. The Chog’s traits act as the genetic DNA of the cartridge:
          </p>
          <ul className="space-y-2 pl-4 list-disc text-xs text-zinc-400">
            <li><strong>Deterministic DNA:</strong> Token ID + normalized traits feed directly into a pure Mulberry32 PRNG seed.</li>
            <li><strong>Permuted Combinations:</strong> With 5 biomes, 4 targeting passives, 4 attack patterns, 4 active abilities, 3 archetypes, and 4 chaos rules, there are thousands of distinct cartridge combat experiences.</li>
            <li><strong>Shareable Challenges:</strong> Players challenge friends with their cartridge link (e.g. <code>/play/969</code>), allowing others to play the exact same generated dream.</li>
          </ul>
        </div>
      </div>

      {/* How traits map into game mechanics */}
      <div className="mt-10 space-y-4">
        <h2 className="font-mono text-xl font-bold text-white flex items-center space-x-2">
          <Layers className="h-5 w-5 text-emerald-400" />
          <span>3. TRAIT-TO-GAMEPLAY MAPPING MATRIX</span>
        </h2>

        <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950">
          <table className="w-full text-left text-xs font-mono text-zinc-300">
            <thead className="border-b border-zinc-800 bg-zinc-900/80 text-[11px] uppercase text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-bold">Trait Category</th>
                <th className="px-4 py-3 font-bold">Trait Values</th>
                <th className="px-4 py-3 font-bold">Gameplay Parameter Impact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              <tr>
                <td className="px-4 py-3 font-bold text-cyan-400">Background</td>
                <td className="px-4 py-3">Space, Swamp, Neon, Ice, Default</td>
                <td className="px-4 py-3">Biome physics: friction, floaty gravity, sludge slow zones, hyper-speed lanes.</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-bold text-blue-400">Eyes</td>
                <td className="px-4 py-3">Laser, Hypno, Glasses, Default</td>
                <td className="px-4 py-3">Targeting/passive: piercing projectiles, slow-on-hit, high critical hit rate & range.</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-bold text-amber-400">Mouth</td>
                <td className="px-4 py-3">Grin, Sharp, Calm, Default</td>
                <td className="px-4 py-3">Weapon attack: 3-way spread salvo, rapid micro-blaster, heavy penetrating energy blast.</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-bold text-emerald-400">Head</td>
                <td className="px-4 py-3">Crown, Hood, Helmet, Default</td>
                <td className="px-4 py-3">Active Ability (Spacebar): Aegis invulnerability, Shadow warp dash, Titan shockwave, Nano-heal.</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-bold text-purple-400">Body</td>
                <td className="px-4 py-3">Suit, Hoodie, Naked/Light, Default</td>
                <td className="px-4 py-3">Combat Archetype: Juggernaut Tank (150 HP), Balanced (100 HP), Agile Scout (70 HP).</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-bold text-pink-400">Aura</td>
                <td className="px-4 py-3">Flame, Glitch, Gold, None</td>
                <td className="px-4 py-3">Chaos Modifier: periodic meteor hazards, inverted controls glitch, +50% Midas score boost.</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-bold text-yellow-400">Tier</td>
                <td className="px-4 py-3">Common, Rare, Epic, Legendary</td>
                <td className="px-4 py-3">Difficulty escalation and score multiplier scaling (up to 3.5x).</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Technical Architecture */}
      <div className="mt-10 space-y-4">
        <h2 className="font-mono text-xl font-bold text-white flex items-center space-x-2">
          <Code2 className="h-5 w-5 text-emerald-400" />
          <span>4. TECHNICAL ARCHITECTURE</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
            <h3 className="font-bold text-emerald-400 text-sm">Next.js App Router & Tailwind</h3>
            <p className="mt-2 text-zinc-400 font-sans leading-relaxed">
              Modern server/client architecture with route-based dynamic params (<code>/play/[tokenId]</code>), responsive dark arcade styling, and zero hydration mismatches.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
            <h3 className="font-bold text-emerald-400 text-sm">Phaser 3 Canvas & Clean Cleanup</h3>
            <p className="mt-2 text-zinc-400 font-sans leading-relaxed">
              Top-down 60 FPS physics canvas with auto-scaling, dynamic projectile pooling, floating combat text, and guaranteed <code>game.destroy(true)</code> on unmount.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
            <h3 className="font-bold text-emerald-400 text-sm">Mulberry32 Deterministic PRNG</h3>
            <p className="mt-2 text-zinc-400 font-sans leading-relaxed">
              Pure mathematical pseudorandom generator. <code>Math.random()</code> is completely avoided for all game spawning, ensuring 100% deterministic reproducibility.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
            <h3 className="font-bold text-emerald-400 text-sm">Local Progression & Safe Metadata</h3>
            <p className="mt-2 text-zinc-400 font-sans leading-relaxed">
              Cabinet Skull Count and personal high scores persist in <code>localStorage</code>. Hybrid NFT adapter supports live templates with seamless deterministic fallbacks.
            </p>
          </div>
        </div>
      </div>

      {/* Statement on Determinism */}
      <div className="mt-10 rounded-xl border border-zinc-800 bg-zinc-950 p-6 text-center">
        <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400" />
        <h3 className="mt-3 font-mono text-base font-bold text-white uppercase">
          Guaranteed Determinism
        </h3>
        <p className="mx-auto mt-2 max-w-xl text-xs text-zinc-400 font-sans leading-relaxed">
          Gameplay is 100% deterministic from traits + token ID. Two players loading the same Chog will experience the exact same enemy sequences, projectile patterns, and hazard intervals.
        </p>
      </div>
    </div>
  );
}
