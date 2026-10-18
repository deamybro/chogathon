'use client';

import React, { useState, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Chog, RunResults, ActiveBonusSkill } from '@/types/chog';
import { deriveGameConfig } from '@/game/traitMapping';
import {
  getBestScore,
  recordScore,
  getSkullCount,
  incrementSkullCount,
  getCabinetStatus,
  CabinetStatus,
} from '@/lib/storage';
import { soundSynth } from '@/game/soundEffects';
import dynamic from 'next/dynamic';
import ArcadeCabinetFrame from '@/components/ArcadeCabinetFrame';
import TraitBadge from '@/components/TraitBadge';
import GameOverModal from '@/components/GameOverModal';
import MobileControls from '@/components/MobileControls';
import type { PhaserGameHandle } from '@/components/PhaserGame';
import {
  Play,
  RotateCcw,
  Compass,
  AlertTriangle,
  Sparkles,
  Zap,
  Heart,
  Calendar,
  AlertCircle,
  Star,
  Music,
  Dna,
  X,
  Check,
} from 'lucide-react';

const PhaserGame = dynamic(() => import('@/components/PhaserGame'), {
  ssr: false,
  loading: () => (
    <div className="flex aspect-[4/3] w-full max-h-[600px] items-center justify-center bg-black font-mono text-xs text-emerald-400">
      <span className="animate-pulse">CONNECTING CARTRIDGE HARDWARE...</span>
    </div>
  ),
});

interface PlayClientProps {
  initialTokenId: number;
  initialChog: Chog | null;
  isInvalidToken: boolean;
}

export default function PlayClient({
  initialTokenId,
  initialChog,
  isInvalidToken,
}: PlayClientProps) {
  const gameHandleRef = useRef<PhaserGameHandle | null>(null);

  // Cartridge & Config state
  const [dailyDream, setDailyDream] = useState(false);
  const [gameKey, setGameKey] = useState(0);

  // Live Game State from Phaser callbacks
  const [hasStarted, setHasStarted] = useState(false);
  const [hp, setHp] = useState(100);
  const [maxHp, setMaxHp] = useState(100);
  const [score, setScore] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [abilityCooldown, setAbilityCooldown] = useState(0);
  const [abilityReady, setAbilityReady] = useState(true);
  const [chaosAlert, setChaosAlert] = useState<string | null>(null);
  const [comboAlert, setComboAlert] = useState<string | null>(null);
  const [bonusSkills, setBonusSkills] = useState<ActiveBonusSkill[]>([]);
  const [bossInfo, setBossInfo] = useState<{ name: string; current: number; max: number } | null>(null);
  const [bgmActive, setBgmActive] = useState(true);
  const [showDnaModal, setShowDnaModal] = useState(false);

  // Input & reactive control triggers
  const [abilityTriggerCount, setAbilityTriggerCount] = useState(0);
  const [touchVector, setTouchVector] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Cabinet & Progression state initialized lazily
  const [bestScore, setBestScore] = useState<number>(() => {
    return initialChog ? getBestScore(initialChog.tokenId) : 0;
  });
  const [cabinetStatus, setCabinetStatus] = useState<CabinetStatus>(() => {
    const skulls = initialChog ? getSkullCount(initialChog.tokenId) : 0;
    return getCabinetStatus(skulls);
  });

  // End of run results
  const [runResults, setRunResults] = useState<RunResults | null>(null);

  // Derive Game Config
  const gameConfig = useMemo(() => {
    if (!initialChog) return null;
    return deriveGameConfig(initialChog, dailyDream);
  }, [initialChog, dailyDream]);

  // Start run
  const handleStartRun = () => {
    setHasStarted(true);
    if (gameHandleRef.current) {
      gameHandleRef.current.startRun();
    }
  };

  // Restart run
  const handleRestart = () => {
    setRunResults(null);
    setHasStarted(false);
    setScore(0);
    setTimeRemaining(60);
    setAbilityCooldown(0);
    setAbilityReady(true);
    setChaosAlert(null);
    setComboAlert(null);
    setBonusSkills([]);
    setBossInfo(null);
    setGameKey((prev) => prev + 1);
  };

  // Toggle BGM
  const toggleBgm = () => {
    const next = !bgmActive;
    setBgmActive(next);
    soundSynth.bgmEnabled = next;
    if (next && hasStarted && !runResults) {
      soundSynth.startBgm();
    } else {
      soundSynth.stopBgm();
    }
  };

  // Trigger active ability
  const handleTriggerAbility = useCallback(() => {
    setAbilityTriggerCount((c) => c + 1);
    if (gameHandleRef.current) {
      gameHandleRef.current.triggerAbility();
    }
  }, []);

  // Mobile movement
  const handleMobileMove = useCallback((x: number, y: number) => {
    setTouchVector({ x, y });
    if (gameHandleRef.current) {
      gameHandleRef.current.setTouchMovement(x, y);
    }
  }, []);

  // Callbacks passed to Phaser
  const phaserCallbacks = useMemo(
    () => ({
      onHpUpdate: (current: number, max: number) => {
        setHp(current);
        setMaxHp(max);
      },
      onScoreUpdate: (newScore: number) => {
        setScore(newScore);
      },
      onTimeUpdate: (seconds: number) => {
        setTimeRemaining(seconds);
      },
      onAbilityState: (cooldown: number, ready: boolean) => {
        setAbilityCooldown(cooldown);
        setAbilityReady(ready);
      },
      onGameStart: () => {
        setHasStarted(true);
      },
      onBonusSkillsUpdate: (skills: ActiveBonusSkill[]) => {
        setBonusSkills(skills);
      },
      onBossHpUpdate: (bossName: string | null, currentHp: number, maxHp: number) => {
        if (!bossName || currentHp <= 0) {
          setBossInfo(null);
        } else {
          setBossInfo({ name: bossName, current: currentHp, max: maxHp });
        }
      },
      onComboAlert: (text: string) => {
        setComboAlert(text);
        setTimeout(() => setComboAlert(null), 2000);
      },
      onGameOver: (results: RunResults) => {
        const newSkulls = incrementSkullCount(results.tokenId);
        const newBest = recordScore(results.tokenId, results.score);
        setBestScore(newBest);
        setCabinetStatus(getCabinetStatus(newSkulls));

        setRunResults({
          ...results,
          skullCount: newSkulls,
          personalBest: newBest,
        });
      },
      onVictory: (results: RunResults) => {
        const newBest = recordScore(results.tokenId, results.score);
        const currentSkulls = getSkullCount(results.tokenId);
        setBestScore(newBest);

        setRunResults({
          ...results,
          skullCount: currentSkulls,
          personalBest: newBest,
        });
      },
      onChaosAlert: (msg: string) => {
        setChaosAlert(msg);
        setTimeout(() => setChaosAlert(null), 2500);
      },
    }),
    []
  );

  // If token is invalid, show inline friendly fallback
  if (isInvalidToken || !initialChog || !gameConfig) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/50 bg-red-950/40 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h1 className="mt-6 font-mono text-2xl font-bold text-white">
          INVALID CARTRIDGE TOKEN
        </h1>
        <p className="mt-2 text-xs text-zinc-400 leading-relaxed font-mono">
          Token ID #{initialTokenId} is not a valid Chog cartridge. Supported tokens are from #1 to #1969.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/play/969"
            className="flex w-full sm:w-auto items-center justify-center space-x-2 rounded-xl bg-emerald-500 px-6 py-2.5 font-mono text-xs font-bold text-black hover:bg-emerald-400 transition"
          >
            <Play className="h-4 w-4 fill-current" />
            <span>PLAY DEMO #969</span>
          </Link>
          <Link
            href="/browse"
            className="flex w-full sm:w-auto items-center justify-center space-x-2 rounded-xl border border-zinc-700 bg-zinc-900 px-6 py-2.5 font-mono text-xs font-semibold text-zinc-300 hover:text-white transition"
          >
            <Compass className="h-4 w-4" />
            <span>BROWSE CARTRIDGES</span>
          </Link>
        </div>
      </div>
    );
  }

  const hpPercent = Math.max(0, Math.min(100, (hp / maxHp) * 100));

  return (
    <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6">
      <ArcadeCabinetFrame
        cabinetStatus={cabinetStatus}
        bestScore={bestScore}
        tokenId={initialChog.tokenId}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-zinc-800 bg-zinc-950">
          {/* LEFT PANEL: NFT ART & SIGNATURE SKILL (col-span-3) */}
          <div className="p-4 lg:col-span-3 flex flex-col justify-between space-y-4">
            <div>
              {/* Token Header */}
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-emerald-400">
                  CARTRIDGE #{initialChog.tokenId}
                </span>
                {initialChog.isFallback && (
                  <span className="flex items-center space-x-1 rounded bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold text-amber-300 border border-amber-500/30">
                    <AlertCircle className="h-3 w-3" />
                    <span>Demo cartridge</span>
                  </span>
                )}
              </div>

              <h2 className="mt-1 font-mono text-lg font-black text-white truncate">
                {initialChog.name}
              </h2>

              {/* NFT Image */}
              <div className="relative mt-3 aspect-square w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-inner">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={initialChog.image}
                  alt={initialChog.name}
                  className="h-full w-full object-cover"
                />
              </div>

              {/* Inherent Hero Signature Skill Badge */}
              <div className="mt-3 rounded-xl border border-amber-500/50 bg-amber-950/20 p-2.5 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                <div className="flex items-center space-x-1.5 text-amber-300 font-mono font-bold text-[10px]">
                  <Star className="h-3.5 w-3.5 text-amber-400 fill-current" />
                  <span>UNIQUE SIGNATURE HERO SKILL</span>
                </div>
                <p className="mt-1 font-mono text-xs font-black text-white">
                  {gameConfig.signatureSkill.name}
                </p>
                <p className="mt-0.5 text-[10px] text-zinc-300 font-sans leading-tight">
                  {gameConfig.signatureSkill.description}
                </p>
              </div>

              {/* Trait-Derived Ability Summary */}
              <div className="mt-3 space-y-1.5">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                  Cartridge DNA
                </span>

                <TraitBadge
                  category="background"
                  value={initialChog.traits.background}
                  effectSummary={gameConfig.biome.description}
                />
                <TraitBadge
                  category="mouth"
                  value={initialChog.traits.mouth}
                  effectSummary={`${gameConfig.attack.name} • ${gameConfig.attack.damage} DMG`}
                />
                <TraitBadge
                  category="eyes"
                  value={initialChog.traits.eyes}
                  effectSummary={`${gameConfig.targeting.name} • ${(gameConfig.targeting.critChance * 100).toFixed(0)}% Crit`}
                />
              </div>
            </div>

            {/* Inspect DNA & Daily Dream */}
            <div className="space-y-2">
              <button
                onClick={() => setShowDnaModal(true)}
                className="flex items-center justify-center space-x-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-900/80 py-2 text-xs font-mono font-semibold text-zinc-300 hover:border-emerald-500 hover:text-emerald-400 transition"
              >
                <Dna className="h-3.5 w-3.5" />
                <span>INSPECT CARTRIDGE DNA</span>
              </button>

              <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1 text-purple-300 font-mono font-bold text-[10px]">
                    <Calendar className="h-3 w-3" />
                    <span>Daily Dream Mode</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDailyDream(!dailyDream);
                      handleRestart();
                    }}
                    className={`relative inline-flex h-4 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      dailyDream ? 'bg-purple-600' : 'bg-zinc-800'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        dailyDream ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
                <p className="mt-1 text-[9px] text-zinc-400 font-mono">
                  {dailyDream
                    ? `Active: ${gameConfig.dailyDream.modifierName}`
                    : 'Standard reality mode. Toggle for daily modifier.'}
                </p>
              </div>
            </div>
          </div>

          {/* CENTER: PHASER CANVAS (col-span-6) */}
          <div className="relative lg:col-span-6 flex flex-col items-center justify-center bg-black min-h-[420px]">
            {/* Boss Health Bar Overlay */}
            {bossInfo && (
              <div className="absolute top-3 left-4 right-4 z-30 rounded-xl border-2 border-purple-500 bg-black/90 p-2.5 backdrop-blur-md shadow-[0_0_25px_rgba(168,85,247,0.7)] animate-in fade-in">
                <div className="flex items-center justify-between font-mono text-[11px] font-black">
                  <span className="flex items-center space-x-2 text-red-400">
                    <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                    <span>⚠️ BOSS DETECTED: {bossInfo.name}</span>
                  </span>
                  <span className="text-purple-300">
                    {Math.round(bossInfo.current)} / {bossInfo.max} HP
                  </span>
                </div>
                <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-zinc-900 border border-purple-500/40">
                  <div
                    style={{ width: `${Math.max(0, (bossInfo.current / bossInfo.max) * 100)}%` }}
                    className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 transition-all duration-150"
                  />
                </div>
              </div>
            )}

            {/* Floating Combo Alert */}
            {comboAlert && (
              <div className="absolute top-16 z-30 animate-bounce rounded-lg border border-amber-400 bg-black/90 px-4 py-1.5 font-mono text-sm font-black text-amber-300 shadow-[0_0_20px_rgba(250,204,21,0.6)]">
                {comboAlert}
              </div>
            )}

            {/* Chaos Alert Banner */}
            {chaosAlert && !bossInfo && (
              <div className="absolute top-4 z-30 animate-bounce rounded-lg border border-pink-500 bg-black/90 px-4 py-1.5 font-mono text-xs font-black text-pink-400 shadow-[0_0_20px_rgba(236,72,153,0.6)]">
                {chaosAlert}
              </div>
            )}

            {/* Phaser Game Canvas */}
            <div className="w-full flex justify-center">
              <PhaserGame
                key={gameKey}
                ref={gameHandleRef}
                config={gameConfig}
                callbacks={phaserCallbacks}
                isStarted={hasStarted}
                triggerAbilityCount={abilityTriggerCount}
                touchVector={touchVector}
              />
            </div>

            {/* Pre-Run Start Overlay */}
            {!hasStarted && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/85 p-6 backdrop-blur-sm">
                <div className="text-center max-w-sm">
                  <div className="inline-flex items-center space-x-1.5 rounded-full border border-emerald-500/40 bg-emerald-950/50 px-3 py-1 font-mono text-[11px] font-bold text-emerald-400">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>CARTRIDGE READY</span>
                  </div>

                  <h3 className="mt-3 font-mono text-2xl font-black text-white">
                    {initialChog.name}
                  </h3>
                  <p className="mt-1 font-mono text-xs text-zinc-400">
                    Survive for 60 seconds. Defeat escalating swarms & bosses.
                  </p>

                  <button
                    onClick={handleStartRun}
                    className="mt-6 flex w-full items-center justify-center space-x-2 rounded-xl bg-emerald-500 py-3.5 px-6 font-mono text-sm font-black text-black shadow-[0_0_25px_rgba(34,197,94,0.6)] transition hover:bg-emerald-400 active:scale-95"
                  >
                    <Play className="h-5 w-5 fill-current" />
                    <span>START RUN (60s)</span>
                  </button>

                  {/* Controls hint */}
                  <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-900/60 p-2.5 text-[11px] font-mono text-zinc-400 text-left space-y-1">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Movement:</span>
                      <span className="text-zinc-200">WASD / Arrow Keys</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Aim & Fire:</span>
                      <span className="text-zinc-200">Mouse Aim (Auto-fire)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Hero Ability:</span>
                      <span className="text-emerald-400">Spacebar ({gameConfig.signatureSkill.name})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Hotkeys:</span>
                      <span className="text-zinc-400">[P] Pause • [R] Restart</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT PANEL: HUD, BONUS SKILLS & RUN CONTROLS (col-span-3) */}
          <div className="p-4 lg:col-span-3 flex flex-col justify-between space-y-3">
            <div className="space-y-3">
              {/* Timer Block */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-2.5">
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="text-zinc-500 uppercase font-bold">Survive Timer</span>
                  <span className={`text-xl font-black ${timeRemaining <= 10 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
                    {timeRemaining}s
                  </span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                  <div
                    style={{ width: `${(timeRemaining / 60) * 100}%` }}
                    className="h-full bg-emerald-500 transition-all duration-300"
                  />
                </div>
              </div>

              {/* Health Block */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-2.5">
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="text-zinc-500 uppercase font-bold flex items-center space-x-1">
                    <Heart className="h-3.5 w-3.5 text-red-400 fill-current" />
                    <span>Vitality</span>
                  </span>
                  <span className="font-bold text-white text-xs">
                    {hp} / {maxHp} HP
                  </span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                  <div
                    style={{ width: `${hpPercent}%` }}
                    className={`h-full transition-all duration-200 ${
                      hpPercent > 50 ? 'bg-emerald-400' : hpPercent > 25 ? 'bg-amber-400' : 'bg-red-500'
                    }`}
                  />
                </div>
              </div>

              {/* Live Score */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-2.5">
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="text-zinc-500 uppercase font-bold">Score</span>
                  <span className="text-[10px] text-amber-400">
                    {gameConfig.difficulty.scoreMultiplier}x MULT
                  </span>
                </div>
                <p className="mt-0.5 font-mono text-2xl font-black text-white">
                  {score.toLocaleString()}
                </p>
              </div>

              {/* Inherent Active Ability Cooldown HUD */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-2.5">
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="text-zinc-500 uppercase font-bold flex items-center space-x-1">
                    <Zap className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Hero Skill</span>
                  </span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                      abilityReady
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {abilityReady ? 'READY [SPACE]' : `${abilityCooldown}s CD`}
                  </span>
                </div>
                <p className="mt-1 font-mono text-xs font-bold text-zinc-200">
                  {gameConfig.signatureSkill.name}
                </p>
              </div>

              {/* In-Game Picked Up Bonus Skills Panel */}
              <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-2.5 text-xs">
                <div className="flex items-center justify-between font-mono text-[11px] text-cyan-300 font-bold">
                  <span className="flex items-center space-x-1">
                    <Sparkles className="h-3 w-3" />
                    <span>Field Bonus Skills</span>
                  </span>
                  <span className="text-[10px] text-zinc-400">{bonusSkills.length} active</span>
                </div>
                {bonusSkills.length === 0 ? (
                  <p className="mt-1 text-[10px] text-zinc-500 font-mono">
                    Defeat swarms to loot random skill drops!
                  </p>
                ) : (
                  <div className="mt-1.5 space-y-1">
                    {bonusSkills.map((bs) => (
                      <div
                        key={bs.type}
                        className="flex items-center justify-between rounded bg-black/70 px-2 py-1 border border-cyan-500/30 font-mono text-[10px]"
                      >
                        <span style={{ color: bs.color }} className="font-bold truncate max-w-[130px]">
                          {bs.name}
                        </span>
                        <span className="text-white font-black">{bs.remainingSeconds}s</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* BGM Audio Toggle */}
              <button
                onClick={toggleBgm}
                className="flex items-center justify-between w-full rounded-xl border border-zinc-800 bg-zinc-900/60 p-2 text-xs font-mono text-zinc-300 hover:border-zinc-600 transition"
              >
                <span className="flex items-center space-x-1.5">
                  <Music className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Chiptune BGM</span>
                </span>
                <span className={`text-[11px] font-bold ${bgmActive ? 'text-emerald-400' : 'text-zinc-500'}`}>
                  {bgmActive ? 'ON' : 'OFF'}
                </span>
              </button>
            </div>

            {/* Run Actions */}
            <div className="space-y-1.5 pt-2 border-t border-zinc-800">
              <button
                onClick={handleRestart}
                className="flex w-full items-center justify-center space-x-2 rounded-xl border border-zinc-700 bg-zinc-900 py-2.5 px-4 font-mono text-xs font-bold text-zinc-200 hover:border-zinc-500 hover:text-white transition"
              >
                <RotateCcw className="h-4 w-4" />
                <span>RESTART [R]</span>
              </button>

              {(() => {
                const demoIds = [969, 404, 77, 1337, 42, 1969];
                const currentIdx = demoIds.indexOf(initialChog.tokenId);
                const nextTokenId = currentIdx !== -1 ? demoIds[(currentIdx + 1) % demoIds.length] : demoIds[0];
                return (
                  <Link
                    href={`/play/${nextTokenId}`}
                    className="flex w-full items-center justify-center space-x-2 rounded-xl border border-purple-500/40 bg-purple-950/20 py-2 px-4 font-mono text-xs font-bold text-purple-300 hover:bg-purple-900/40 transition"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                    <span>NEXT CARTRIDGE #{nextTokenId} ▶</span>
                  </Link>
                );
              })()}

              <Link
                href="/browse"
                className="flex w-full items-center justify-center space-x-2 rounded-xl bg-zinc-800/60 py-2 px-4 font-mono text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
              >
                <Compass className="h-4 w-4" />
                <span>ALL CARTRIDGES</span>
              </Link>
            </div>
          </div>
        </div>

        {/* MOBILE ON-SCREEN TOUCH CONTROLS */}
        <MobileControls
          onMove={handleMobileMove}
          onAbility={handleTriggerAbility}
          abilityCooldown={abilityCooldown}
          abilityReady={abilityReady}
          abilityName={gameConfig.signatureSkill.name}
        />
      </ArcadeCabinetFrame>

      {/* GAME OVER / RUN RESULTS MODAL */}
      {runResults && (
        <GameOverModal results={runResults} onRestart={handleRestart} />
      )}

      {/* CARTRIDGE DNA INSPECT MODAL */}
      {showDnaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-xl rounded-2xl border-2 border-emerald-500/70 bg-zinc-950 p-6 shadow-[0_0_50px_rgba(34,197,94,0.35)]">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center space-x-2 font-mono text-sm font-bold text-emerald-400">
                <Dna className="h-4 w-4" />
                <span>CARTRIDGE DNA PROTOCOL — #{initialChog.tokenId}</span>
              </div>
              <button
                onClick={() => setShowDnaModal(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 font-mono text-xs text-zinc-300">
              <div className="rounded-lg bg-black p-3 border border-zinc-800 space-y-1">
                <span className="text-zinc-500 text-[10px] uppercase">Cryptographic Seed (Mulberry32)</span>
                <p className="text-emerald-400 font-bold text-sm select-all">0x{gameConfig.seed.toString(16).toUpperCase()}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="rounded bg-zinc-900 p-2 border border-zinc-800">
                  <span className="text-zinc-500 block text-[9px]">BIOME FRICTION</span>
                  <span className="text-white font-bold">{gameConfig.biome.friction}</span>
                </div>
                <div className="rounded bg-zinc-900 p-2 border border-zinc-800">
                  <span className="text-zinc-500 block text-[9px]">DIFFICULTY TIER</span>
                  <span className="text-white font-bold">{gameConfig.difficulty.label}</span>
                </div>
                <div className="rounded bg-zinc-900 p-2 border border-zinc-800">
                  <span className="text-zinc-500 block text-[9px]">BASE HP</span>
                  <span className="text-white font-bold">{gameConfig.archetype.maxHealth} HP</span>
                </div>
                <div className="rounded bg-zinc-900 p-2 border border-zinc-800">
                  <span className="text-zinc-500 block text-[9px]">ATTACK CYCLE</span>
                  <span className="text-white font-bold">{gameConfig.attack.fireRateMs}ms</span>
                </div>
              </div>

              <div className="rounded bg-zinc-900/60 p-3 border border-zinc-800 text-[11px] space-y-1 font-sans">
                <p className="font-mono text-xs font-bold text-emerald-400 flex items-center space-x-1">
                  <Check className="h-3.5 w-3.5" />
                  <span>Deterministic Verification Guarantee</span>
                </p>
                <p className="text-zinc-400 leading-relaxed text-[11px]">
                  All wave sequences, hazard intervals, and pickup drops derive strictly from the Mulberry32 generator seeded with this token ID. Any player on any machine entering token #{initialChog.tokenId} will play the exact identical game.
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-800 flex justify-end">
              <button
                onClick={() => setShowDnaModal(false)}
                className="rounded-lg bg-emerald-500 px-4 py-1.5 font-mono text-xs font-bold text-black hover:bg-emerald-400 transition"
              >
                CLOSE INSPECTOR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
