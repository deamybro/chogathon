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
import StoryDialogueModal from '@/components/StoryDialogueModal';
import type { PhaserGameHandle, StarterAugmentType } from '@/components/PhaserGame';
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
  Shield,
  Bomb,
  Snowflake,
  Rocket,
  CloudLightning,
  FastForward,
  Coins,
  Magnet,
  Crosshair,
  Layers,
  Flame,
} from 'lucide-react';

export const STARTER_AUGMENTS: Record<
  StarterAugmentType,
  {
    name: string;
    shortLabel: string;
    description: string;
    statBadge: string;
    icon: string;
    color: string;
    borderActive: string;
    bgBadge: string;
  }
> = {
  speed: {
    name: 'HYPER THRUSTERS',
    shortLabel: '+30% SPEED',
    description: 'Boosts baseline movement speed by +30% for agile evasion and rapid positioning.',
    statBadge: '+30% SPEED',
    icon: 'FastForward',
    color: '#06b6d4',
    borderActive: 'border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.5)]',
    bgBadge: 'bg-cyan-500 text-black',
  },
  attack_speed: {
    name: 'OVERCLOCK CAPACITOR',
    shortLabel: '+35% FIRE RATE',
    description: 'Accelerates twin plasma cycling by +35% for rapid continuous bullet streams.',
    statBadge: '+35% FIRE RATE',
    icon: 'Flame',
    color: '#eab308',
    borderActive: 'border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.5)]',
    bgBadge: 'bg-amber-500 text-black',
  },
  damage: {
    name: 'PLASMA AMPLIFIER',
    shortLabel: '+40% DMG • +10% CRIT',
    description: 'Overcharges plasma bolts: +40% attack damage and +10% bonus critical strike rate.',
    statBadge: '+40% DMG • +10% CRIT',
    icon: 'Bomb',
    color: '#ef4444',
    borderActive: 'border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.5)]',
    bgBadge: 'bg-red-500 text-white',
  },
};

function renderPowerupIcon(iconName: string, className = 'h-3.5 w-3.5') {
  switch (iconName) {
    case 'Zap': return <Zap className={className} />;
    case 'Shield': return <Shield className={className} />;
    case 'Bomb': return <Bomb className={className} />;
    case 'Snowflake': return <Snowflake className={className} />;
    case 'Rocket': return <Rocket className={className} />;
    case 'CloudLightning': return <CloudLightning className={className} />;
    case 'FastForward': return <FastForward className={className} />;
    case 'Heart': return <Heart className={className} />;
    case 'Coins': return <Coins className={className} />;
    case 'Magnet': return <Magnet className={className} />;
    default: return <Sparkles className={className} />;
  }
}

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
  const [playerShield, setPlayerShield] = useState({ current: 20, max: 20 });
  const [score, setScore] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [abilityCooldown, setAbilityCooldown] = useState(0);
  const [abilityReady, setAbilityReady] = useState(true);
  const [chaosAlert, setChaosAlert] = useState<string | null>(null);
  const [comboAlert, setComboAlert] = useState<string | null>(null);
  const [bonusSkills, setBonusSkills] = useState<ActiveBonusSkill[]>([]);
  const [bossInfo, setBossInfo] = useState<{
    name: string;
    current: number;
    max: number;
    shield?: number;
    maxShield?: number;
  } | null>(null);
  const [bgmActive, setBgmActive] = useState(true);
  const [showDnaModal, setShowDnaModal] = useState(false);
  const [overclock, setOverclock] = useState<{ level: number; currentExp: number; nextExp: number }>({
    level: 1,
    currentExp: 0,
    nextExp: 250,
  });

  // Avatar Signature Ultimate Essence / Mana State
  const [essence, setEssence] = useState<{ current: number; max: number; isReady: boolean; isActive: boolean }>({
    current: 0,
    max: 100,
    isReady: false,
    isActive: false,
  });

  // Floating on-screen power-up acquired notification toast
  const [powerupToast, setPowerupToast] = useState<{
    name: string;
    description: string;
    color: string;
    icon: string;
  } | null>(null);

  // Multi-Level Sector Escalation state
  const [levelInfo, setLevelInfo] = useState<{
    current: number;
    total: number;
    name: string;
    timeInLevel: number;
  }>({
    current: 1,
    total: 3,
    name: 'Sector Alpha: Incursion',
    timeInLevel: 45,
  });

  // Auto-Aim & Jammer Scrambler state
  const [autoAim, setAutoAim] = useState<{ enabled: boolean; isScrambled: boolean }>({
    enabled: true,
    isScrambled: false,
  });

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

  // Story Mission Dialogue state
  const [showDialogue, setShowDialogue] = useState(false);
  const [dialogueSector, setDialogueSector] = useState(1);
  const [pendingVictoryResults, setPendingVictoryResults] = useState<RunResults | null>(null);

  // Starter Augment Spec state (chosen before run starts)
  const [selectedStarterAugment, setSelectedStarterAugment] = useState<StarterAugmentType>('attack_speed');

  // Start run
  const handleStartRun = useCallback((aug?: StarterAugmentType) => {
    const augmentToUse = aug || selectedStarterAugment;
    setHasStarted(true);
    if (gameHandleRef.current) {
      gameHandleRef.current.startRun(augmentToUse);
    }
  }, [selectedStarterAugment]);

  // Launch button triggers Sector 1 pre-mission dialogue
  const handleLaunchClick = useCallback((aug?: StarterAugmentType) => {
    if (aug) {
      setSelectedStarterAugment(aug);
    }
    setDialogueSector(1);
    setShowDialogue(true);
  }, []);

  const handleDialogueComplete = useCallback(() => {
    setShowDialogue(false);
    if (!hasStarted) {
      handleStartRun();
    } else if (pendingVictoryResults) {
      setRunResults(pendingVictoryResults);
      setPendingVictoryResults(null);
    } else {
      gameHandleRef.current?.setPaused(false);
    }
  }, [hasStarted, handleStartRun, pendingVictoryResults]);

  const handleDialogueSkip = useCallback(() => {
    setShowDialogue(false);
    if (!hasStarted) {
      handleStartRun();
    } else if (pendingVictoryResults) {
      setRunResults(pendingVictoryResults);
      setPendingVictoryResults(null);
    } else {
      gameHandleRef.current?.setPaused(false);
    }
  }, [hasStarted, handleStartRun, pendingVictoryResults]);

  // Restart run
  const handleRestart = () => {
    setShowDialogue(false);
    setPendingVictoryResults(null);
    setRunResults(null);
    setHasStarted(false);
    setScore(0);
    setTimeRemaining(45);
    setLevelInfo({
      current: 1,
      total: 3,
      name: 'Sector Alpha: Incursion',
      timeInLevel: 45,
    });
    setAutoAim({ enabled: true, isScrambled: false });
    setAbilityCooldown(0);
    setAbilityReady(true);
    setEssence({ current: 0, max: 100, isReady: false, isActive: false });
    setPowerupToast(null);
    setChaosAlert(null);
    setComboAlert(null);
    setBonusSkills([]);
    setBossInfo(null);
    setPlayerShield({ current: 20, max: 20 });
    setOverclock({ level: 1, currentExp: 0, nextExp: 250 });
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

  // Toggle Auto-Aim
  const handleToggleAutoAim = useCallback(() => {
    if (gameHandleRef.current) {
      const next = gameHandleRef.current.toggleAutoAim();
      setAutoAim((prev) => ({ ...prev, enabled: next }));
    }
  }, []);

  // Trigger active ability
  const handleTriggerAbility = useCallback(() => {
    setAbilityTriggerCount((c) => c + 1);
    if (gameHandleRef.current) {
      gameHandleRef.current.triggerAbility();
    }
  }, []);

  // Trigger avatar signature ultimate
  const handleTriggerUltimate = useCallback(() => {
    if (gameHandleRef.current) {
      gameHandleRef.current.triggerUltimate();
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
      onHpUpdate: (current: number, max: number, shield = 0, maxShield = 0) => {
        setHp(current);
        setMaxHp(max);
        setPlayerShield({ current: Math.round(shield), max: Math.round(maxShield) });
      },
      onScoreUpdate: (newScore: number) => {
        setScore(newScore);
      },
      onTimeUpdate: (seconds: number) => {
        setTimeRemaining(seconds);
      },
      onLevelUpdate: (currentLevel: number, totalLevels: number, levelName: string, timeInLevel: number) => {
        setLevelInfo({ current: currentLevel, total: totalLevels, name: levelName, timeInLevel });
      },
      onAutoAimStatus: (enabled: boolean, isScrambled: boolean) => {
        setAutoAim({ enabled, isScrambled });
      },
      onAbilityState: (cooldown: number, ready: boolean) => {
        setAbilityCooldown(cooldown);
        setAbilityReady(ready);
      },
      onEssenceUpdate: (current: number, max: number, isReady: boolean, isActive: boolean) => {
        setEssence({ current, max, isReady, isActive });
      },
      onPowerupPicked: (name: string, description: string, color: string, icon: string) => {
        setPowerupToast({ name, description, color, icon });
        setTimeout(() => setPowerupToast(null), 1400);
      },
      onGameStart: () => {
        setHasStarted(true);
      },
      onBonusSkillsUpdate: (skills: ActiveBonusSkill[]) => {
        setBonusSkills(skills);
      },
      onBossHpUpdate: (
        bossName: string | null,
        currentHp: number,
        maxHp: number,
        currentShield?: number,
        maxShield?: number
      ) => {
        if (!bossName || (currentHp <= 0 && (!currentShield || currentShield <= 0))) {
          setBossInfo(null);
        } else {
          setBossInfo({
            name: bossName,
            current: currentHp,
            max: maxHp,
            shield: currentShield,
            maxShield: maxShield,
          });
        }
      },
      onComboAlert: (text: string) => {
        setComboAlert(text);
        setTimeout(() => setComboAlert(null), 2000);
      },
      onOverclockUpdate: (level: number, currentExp: number, nextExp: number) => {
        setOverclock({ level, currentExp, nextExp });
      },
      onSectorAdvance: (newLevel: number) => {
        setDialogueSector(newLevel);
        setShowDialogue(true);
        if (gameHandleRef.current) {
          gameHandleRef.current.setPaused(true);
        }
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

        const fullResults: RunResults = {
          ...results,
          skullCount: currentSkulls,
          personalBest: newBest,
        };

        // Trigger Conclusion Dialogue (Sector 4) before showing victory results
        setPendingVictoryResults(fullResults);
        setDialogueSector(4);
        setShowDialogue(true);
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
          <div className="order-2 lg:order-1 p-3.5 sm:p-4 lg:col-span-3 flex flex-col justify-between space-y-4">
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
                type="button"
                onClick={() => setShowDnaModal(true)}
                className="flex items-center justify-center space-x-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-900/80 py-2 text-xs font-mono font-semibold text-zinc-300 hover:border-emerald-500 hover:text-emerald-400 hover:bg-zinc-850 transition cursor-pointer"
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
          <div className="order-1 lg:order-2 relative lg:col-span-6 flex flex-col bg-black">
            {/* TOP DOCKED COMBAT DASHBOARD (Always visible during gameplay, zero canvas overlap!) */}
            {hasStarted && !runResults && (
              <div className="w-full bg-zinc-950/95 border-b border-zinc-800 px-3 py-1.5 z-20">
                <div className="flex flex-wrap items-center justify-between gap-2 max-w-xl mx-auto">
                  {/* Vitality & Kinetic Shield Gauges */}
                  <div className="flex items-center space-x-2.5">
                    {/* Vitality Gauge */}
                    <div className="flex items-center space-x-1.5">
                      <div className="flex items-center space-x-1 text-red-400 font-mono text-[10px] sm:text-xs font-black">
                        <Heart className="h-3.5 w-3.5 fill-current text-red-500 shrink-0" />
                        <span>{Math.round(hp)}/{maxHp}</span>
                      </div>
                      <div className="h-2 w-16 sm:w-20 overflow-hidden rounded-full bg-zinc-900 border border-zinc-800">
                        <div
                          style={{ width: `${hpPercent}%` }}
                          className={`h-full transition-all duration-150 ${
                            hpPercent > 50
                              ? 'bg-gradient-to-r from-emerald-500 to-green-400'
                              : hpPercent > 25
                              ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                              : 'bg-gradient-to-r from-red-600 to-red-400 animate-pulse'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Kinetic Barrier Shield Gauge */}
                    {playerShield.max > 0 && (
                      <div className="flex items-center space-x-1.5">
                        <div className="flex items-center space-x-1 text-cyan-400 font-mono text-[10px] sm:text-xs font-black">
                          <Shield className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                          <span>{Math.round(playerShield.current)}/{playerShield.max}</span>
                        </div>
                        <div className="h-2 w-12 sm:w-16 overflow-hidden rounded-full bg-zinc-900 border border-cyan-800/80">
                          <div
                            style={{ width: `${Math.max(0, Math.min(100, (playerShield.current / playerShield.max) * 100))}%` }}
                            className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_8px_rgba(56,189,248,0.7)] transition-all duration-150"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Ultimate Charge / Ready Trigger */}
                  <div>
                    {essence.isReady && !essence.isActive ? (
                      <button
                        type="button"
                        onClick={handleTriggerUltimate}
                        className="flex items-center space-x-1.5 rounded-full border border-amber-400 bg-amber-500/20 px-3 py-0.5 font-mono text-[10px] sm:text-xs font-black text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.6)] animate-pulse hover:bg-amber-500/30 transition cursor-pointer"
                      >
                        <Sparkles className="h-3 w-3 fill-current text-amber-400" />
                        <span>ULTIMATE READY [F/SPACE]</span>
                      </button>
                    ) : essence.isActive ? (
                      <div className="flex items-center space-x-1.5 rounded-full border border-amber-400 bg-black/90 px-2.5 py-0.5 font-mono text-[10px] font-black text-amber-300 animate-pulse">
                        <Flame className="h-3 w-3 text-amber-400" />
                        <span>BURNING ULTIMATE</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1 text-cyan-400 font-mono text-[10px] sm:text-xs font-black">
                          <Star className="h-3 w-3 text-cyan-400 shrink-0" />
                          <span>ULT {essence.current}%</span>
                        </div>
                        <div className="h-2 w-16 sm:w-20 overflow-hidden rounded-full bg-zinc-900 border border-zinc-800">
                          <div
                            style={{ width: `${essence.current}%` }}
                            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-150"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sector Timer & Starter Perk */}
                  <div className="flex items-center space-x-2 font-mono text-[10px] sm:text-xs">
                    <span className="text-zinc-500">S{levelInfo.current}:</span>
                    <span className={`font-black ${timeRemaining <= 10 ? 'text-red-400 animate-pulse' : 'text-purple-300'}`}>
                      {timeRemaining}s
                    </span>
                    {selectedStarterAugment && (
                      <span className={`rounded px-1.5 py-0.5 text-[8px] font-black ${STARTER_AUGMENTS[selectedStarterAugment].bgBadge}`}>
                        {STARTER_AUGMENTS[selectedStarterAugment].shortLabel}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="relative flex flex-col items-center justify-center bg-black min-h-[380px] sm:min-h-[420px]">
              {/* Boss Health & Barrier Shield Bar Overlay */}
              {bossInfo && (
                <div className="absolute top-2 left-3 right-3 sm:left-4 sm:right-4 z-30 rounded-xl border-2 border-purple-500 bg-black/95 p-2 sm:p-2.5 backdrop-blur-md shadow-[0_0_25px_rgba(168,85,247,0.7)] animate-in fade-in">
                  <div className="flex items-center justify-between font-mono text-[10px] sm:text-[11px] font-black">
                    <span className="flex items-center space-x-1.5 sm:space-x-2 text-red-400 truncate max-w-[55%] sm:max-w-none">
                      <span className="h-2 w-2 rounded-full bg-red-500 animate-ping shrink-0" />
                      <span className="truncate">⚠️ BOSS: {bossInfo.name}</span>
                    </span>
                    <div className="flex items-center space-x-2 text-[9px] sm:text-[10px]">
                      {bossInfo.shield !== undefined && bossInfo.maxShield && bossInfo.shield > 0 && (
                        <span className="text-cyan-300 font-bold flex items-center space-x-1">
                          <Shield className="h-3 w-3 inline text-cyan-400" />
                          <span>{Math.round(bossInfo.shield)} SHIELD</span>
                        </span>
                      )}
                      <span className="text-purple-300 font-bold">
                        {Math.round(bossInfo.current)} / {bossInfo.max} HP
                      </span>
                    </div>
                  </div>

                  {/* Kinetic Barrier Shield Bar */}
                  {bossInfo.shield !== undefined && bossInfo.maxShield && bossInfo.shield > 0 && (
                    <div className="mt-1 h-1.5 sm:h-2 w-full overflow-hidden rounded-full bg-zinc-900 border border-cyan-500/50">
                      <div
                        style={{ width: `${Math.max(0, Math.min(100, (bossInfo.shield / bossInfo.maxShield) * 100))}%` }}
                        className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_10px_rgba(56,189,248,0.8)] transition-all duration-150"
                      />
                    </div>
                  )}

                  {/* HP Core Bar */}
                  <div className="mt-1 h-2 sm:h-2.5 w-full overflow-hidden rounded-full bg-zinc-900 border border-purple-500/40">
                    <div
                      style={{ width: `${Math.max(0, (bossInfo.current / bossInfo.max) * 100)}%` }}
                      className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 transition-all duration-150"
                    />
                  </div>
                </div>
              )}

              {/* Targeting Scrambler EMP Glitch Warning Banner */}
              {autoAim.isScrambled && (
                <div className="absolute top-12 z-30 flex items-center space-x-2 rounded-xl border-2 border-red-500 bg-black/95 px-4 py-1.5 font-mono text-xs font-black text-red-400 shadow-[0_0_25px_rgba(239,68,68,0.8)] animate-pulse">
                  <AlertTriangle className="h-4 w-4 text-red-500 animate-spin" />
                  <span>⚠️ EMP: TARGETING JAMMED! MANUAL AIM ACTIVE!</span>
                </div>
              )}

              {/* Floating Combo Alert */}
              {comboAlert && (
                <div className="absolute top-12 left-1/2 -translate-x-1/2 z-30 animate-bounce rounded-lg border border-amber-400 bg-black/90 px-3 py-1 font-mono text-xs font-black text-amber-300 shadow-[0_0_15px_rgba(250,204,21,0.5)]">
                  {comboAlert}
                </div>
              )}

              {/* Non-intrusive Top-Right Power-up Notification */}
              {powerupToast && (
                <div
                  style={{ borderColor: powerupToast.color, boxShadow: `0 0 15px ${powerupToast.color}40` }}
                  className="absolute top-2 right-2 z-40 max-w-[220px] flex items-center space-x-2 rounded-xl border bg-black/90 px-2.5 py-1 backdrop-blur-md animate-in fade-in slide-in-from-top-1 duration-150"
                >
                  <div
                    style={{ backgroundColor: `${powerupToast.color}25`, color: powerupToast.color }}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-white/20"
                  >
                    {renderPowerupIcon(powerupToast.icon, 'h-3.5 w-3.5')}
                  </div>
                  <div className="text-left font-mono truncate">
                    <div className="text-[10px] font-black truncate" style={{ color: powerupToast.color }}>
                      {powerupToast.name.toUpperCase()}
                    </div>
                  </div>
                </div>
              )}

              {/* Chaos Alert Banner */}
              {chaosAlert && !bossInfo && (
                <div className="absolute top-2 z-30 animate-bounce rounded-lg border border-pink-500 bg-black/90 px-3 py-1 font-mono text-xs font-black text-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.5)]">
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
                  starterAugment={selectedStarterAugment}
                  triggerAbilityCount={abilityTriggerCount}
                  touchVector={touchVector}
                />
              </div>

            {/* Pre-Run Start Overlay */}
            {!hasStarted && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90 p-4 sm:p-6 backdrop-blur-sm overflow-y-auto">
                <div className="text-center max-w-md w-full">
                  <div className="inline-flex items-center space-x-1.5 rounded-full border border-emerald-500/40 bg-emerald-950/50 px-3 py-1 font-mono text-[11px] font-bold text-emerald-400">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>CARTRIDGE READY</span>
                  </div>

                  <h3 className="mt-2 font-mono text-2xl font-black text-white">
                    {initialChog.name}
                  </h3>
                  <p className="mt-0.5 font-mono text-xs text-zinc-400">
                    Choose your starter augment before entering Sector Alpha.
                  </p>

                  {/* Starter Augment Selector */}
                  <div className="mt-4 text-left">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-1">
                        <Sparkles className="h-3 w-3" />
                        <span>SELECT STARTER AUGMENT (CHOOSE 1)</span>
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500">1 PER RUN</span>
                    </div>

                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {(Object.keys(STARTER_AUGMENTS) as StarterAugmentType[]).map((key) => {
                        const aug = STARTER_AUGMENTS[key];
                        const isSelected = selectedStarterAugment === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setSelectedStarterAugment(key)}
                            className={`flex flex-col justify-between rounded-xl border-2 p-2.5 text-left transition-all cursor-pointer ${
                              isSelected
                                ? `${aug.borderActive} bg-zinc-900 shadow-[0_0_20px_rgba(255,255,255,0.1)] scale-[1.02]`
                                : 'border-zinc-800 bg-zinc-950/80 hover:border-zinc-700 opacity-60 hover:opacity-100'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between">
                                <span className={`rounded px-1.5 py-0.5 text-[8px] font-mono font-black uppercase ${aug.bgBadge}`}>
                                  {aug.statBadge}
                                </span>
                                {isSelected && (
                                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-black">
                                    <Check className="h-3 w-3" />
                                  </span>
                                )}
                              </div>
                              <h4 className="mt-1.5 font-mono text-xs font-black text-white leading-tight">{aug.name}</h4>
                              <p className="mt-1 text-[10px] text-zinc-300 font-sans leading-tight">{aug.description}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    onClick={() => handleLaunchClick()}
                    className="mt-4 flex w-full items-center justify-center space-x-2 rounded-xl bg-emerald-500 py-3.5 px-6 font-mono text-sm font-black text-black shadow-[0_0_25px_rgba(34,197,94,0.6)] transition hover:bg-emerald-400 active:scale-95 cursor-pointer"
                  >
                    <Play className="h-5 w-5 fill-current" />
                    <span>LAUNCH RUN ({STARTER_AUGMENTS[selectedStarterAugment].statBadge})</span>
                  </button>

                  {/* Controls hint */}
                  <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-900/60 p-2 text-[10px] font-mono text-zinc-400 text-left space-y-0.5">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Move / Aim:</span>
                      <span className="text-zinc-200">WASD / Arrow Keys • Mouse Aim</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Hero Ability:</span>
                      <span className="text-emerald-400">Spacebar ({gameConfig.signatureSkill.name})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Avatar Ultimate:</span>
                      <span className="text-amber-400">[F] / Spacebar at 100% Charge</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Targeting:</span>
                      <span className="text-cyan-300">[T] Toggle Auto / Manual</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            </div>
          </div>

          {/* RIGHT PANEL: HUD, BONUS SKILLS & RUN CONTROLS (col-span-3) */}
          <div className="order-3 lg:order-3 p-3.5 sm:p-4 lg:col-span-3 flex flex-col justify-between space-y-3">
            <div className="space-y-3">
              {/* Multi-Level Sector Escalation Block */}
              <div className="rounded-xl border border-purple-500/40 bg-purple-950/20 p-2.5">
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="flex items-center space-x-1.5 font-bold uppercase text-purple-300">
                    <Layers className="h-3.5 w-3.5 text-purple-400" />
                    <span>Sector {levelInfo.current} / {levelInfo.total}</span>
                  </span>
                  <span className={`text-base font-black ${timeRemaining <= 10 ? 'text-red-400 animate-pulse' : 'text-purple-300'}`}>
                    {timeRemaining}s
                  </span>
                </div>
                <p className="mt-0.5 text-[10px] font-mono font-bold text-zinc-300 truncate">
                  {levelInfo.name}
                </p>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-zinc-800 border border-purple-500/30">
                  <div
                    style={{
                      width: `${Math.min(100, Math.max(0, (timeRemaining / (levelInfo.current === 1 ? 60 : levelInfo.current === 2 ? 90 : 120)) * 100))}%`,
                    }}
                    className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-amber-400 transition-all duration-300"
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

              {/* Avatar Signature Ultimate Essence / Mana Charge Bar */}
              <div className={`rounded-xl border p-2.5 transition-all ${
                essence.isActive
                  ? 'border-amber-400 bg-amber-950/40 shadow-[0_0_20px_rgba(251,191,36,0.4)] animate-pulse'
                  : essence.isReady
                  ? 'border-emerald-400 bg-emerald-950/40 shadow-[0_0_20px_rgba(52,211,153,0.4)]'
                  : 'border-zinc-800 bg-zinc-900/60'
              }`}>
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="flex items-center space-x-1.5 font-bold uppercase text-zinc-400">
                    <Star className={`h-3.5 w-3.5 ${essence.isReady || essence.isActive ? 'text-amber-400 fill-current' : 'text-zinc-500'}`} />
                    <span>Ultimate Essence</span>
                  </span>
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-black ${
                    essence.isActive
                      ? 'bg-amber-500 text-black animate-pulse'
                      : essence.isReady
                      ? 'bg-emerald-500 text-black animate-bounce'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    {essence.isActive ? 'BURNING ACTIVE' : essence.isReady ? 'READY [SPACE/F]' : `${essence.current}% CHARGED`}
                  </span>
                </div>

                <div className="mt-1 flex items-center justify-between">
                  <p className="font-mono text-xs font-black text-white truncate max-w-[170px]">
                    {gameConfig.signatureSkill.name}
                  </p>
                  <span className="text-[9px] font-mono text-zinc-400">
                    {essence.isActive ? 'Draining...' : 'Charge via kills/gems'}
                  </span>
                </div>

                {/* Essence Bar */}
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-zinc-800 border border-zinc-700/50">
                  <div
                    style={{ width: `${essence.current}%` }}
                    className={`h-full transition-all duration-150 ${
                      essence.isActive
                        ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-red-500'
                        : essence.isReady
                        ? 'bg-gradient-to-r from-emerald-400 to-amber-300 animate-pulse'
                        : 'bg-gradient-to-r from-blue-500 to-cyan-400'
                    }`}
                  />
                </div>

                {/* One-click button if ready */}
                {essence.isReady && !essence.isActive && (
                  <button
                    type="button"
                    onClick={handleTriggerUltimate}
                    className="mt-2 flex items-center justify-center space-x-1 w-full rounded-lg bg-emerald-500 py-1 font-mono text-[10px] font-black text-black hover:bg-emerald-400 transition shadow-[0_0_15px_rgba(16,185,129,0.5)] active:scale-95 cursor-pointer"
                  >
                    <Zap className="h-3 w-3 fill-current" />
                    <span>UNLEASH AVATAR ULTIMATE</span>
                  </button>
                )}
              </div>

              {/* In-Run Overclock Evolution HUD */}
              <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-2.5">
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="text-amber-400 uppercase font-black flex items-center space-x-1">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Overclock Tier</span>
                  </span>
                  <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-black text-amber-300 border border-amber-500/40">
                    {overclock.level >= 4 ? 'MAX ASCENSION' : `LVL ${overclock.level}`}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                  <div
                    style={{
                      width: `${overclock.level >= 4 ? 100 : Math.min(100, (overclock.currentExp / overclock.nextExp) * 100)}%`,
                    }}
                    className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-300"
                  />
                </div>
                <span className="mt-1 block text-[9px] font-mono text-zinc-400">
                  {overclock.level === 1
                    ? 'Loot gems to unlock Spread Matrix'
                    : overclock.level === 2
                    ? 'Spread Matrix Active • Next: Explosive Plasma'
                    : overclock.level === 3
                    ? 'Explosive Plasma Active • Next: God Mode'
                    : '🔥 Full Ascended Overclock God Mode'}
                </span>
              </div>

              {/* Inherent Active Ability Cooldown HUD */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-2.5">
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="text-zinc-500 uppercase font-bold flex items-center space-x-1">
                    <Zap className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Trait Ability</span>
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
                  {gameConfig.ability.name}
                </p>
              </div>

              {/* Active Starter Augment Card */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-2.5">
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="text-zinc-500 uppercase font-bold flex items-center space-x-1">
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                    <span>Starter Augment</span>
                  </span>
                  <span className={`rounded px-1.5 py-0.5 text-[9px] font-mono font-black uppercase ${STARTER_AUGMENTS[selectedStarterAugment].bgBadge}`}>
                    {STARTER_AUGMENTS[selectedStarterAugment].statBadge}
                  </span>
                </div>
                <p className="mt-1 font-mono text-xs font-bold text-white">
                  {STARTER_AUGMENTS[selectedStarterAugment].name}
                </p>
                <p className="mt-0.5 text-[9px] text-zinc-400 leading-tight font-sans">
                  {STARTER_AUGMENTS[selectedStarterAugment].description}
                </p>
              </div>

              {/* In-Game Picked Up Bonus Skills Panel (10 Varieties with Icons) */}
              <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-2.5 text-xs">
                <div className="flex items-center justify-between font-mono text-[11px] text-cyan-300 font-bold">
                  <span className="flex items-center space-x-1">
                    <Sparkles className="h-3 w-3" />
                    <span>Looted Bonus Skills</span>
                  </span>
                  <span className="text-[10px] text-zinc-400">{bonusSkills.length} active</span>
                </div>
                {bonusSkills.length === 0 ? (
                  <p className="mt-1 text-[10px] text-zinc-500 font-mono">
                    Move and touch glowing crates on the floor to loot 10 power-ups!
                  </p>
                ) : (
                  <div className="mt-1.5 space-y-1">
                    {bonusSkills.map((bs) => (
                      <div
                        key={bs.type}
                        style={{ borderColor: `${bs.color}50` }}
                        className="flex items-center justify-between rounded bg-black/80 px-2 py-1 border font-mono text-[10px]"
                      >
                        <div className="flex items-center space-x-1.5 truncate max-w-[150px]">
                          <span style={{ color: bs.color }}>
                            {renderPowerupIcon(bs.icon, 'h-3.5 w-3.5 shrink-0')}
                          </span>
                          <span style={{ color: bs.color }} className="font-bold truncate">
                            {bs.name}
                          </span>
                        </div>
                        <span className="text-white font-black shrink-0">{bs.remainingSeconds}s</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Auto-Aim Optional Toggle Button */}
              <button
                onClick={handleToggleAutoAim}
                className={`flex items-center justify-between w-full rounded-xl border p-2 text-xs font-mono transition cursor-pointer ${
                  autoAim.isScrambled
                    ? 'border-red-500 bg-red-950/40 text-red-400 animate-pulse'
                    : autoAim.enabled
                    ? 'border-cyan-500/40 bg-cyan-950/20 text-cyan-300 hover:border-cyan-400 hover:bg-cyan-950/40'
                    : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                <span className="flex items-center space-x-1.5">
                  <Crosshair className={`h-3.5 w-3.5 ${autoAim.isScrambled ? 'text-red-400 animate-spin' : autoAim.enabled ? 'text-cyan-400' : 'text-zinc-500'}`} />
                  <span>Auto-Aim [T]</span>
                </span>
                <span className={`text-[10px] font-black rounded px-1.5 py-0.5 ${
                  autoAim.isScrambled
                    ? 'bg-red-500 text-black'
                    : autoAim.enabled
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {autoAim.isScrambled ? 'JAMMED (EMP)' : autoAim.enabled ? 'ENABLED' : 'MANUAL'}
                </span>
              </button>

              {/* BGM Audio Toggle */}
              <button
                type="button"
                onClick={toggleBgm}
                className="flex items-center justify-between w-full rounded-xl border border-zinc-800 bg-zinc-900/60 p-2 text-xs font-mono text-zinc-300 hover:border-zinc-600 hover:text-white hover:bg-zinc-850 transition cursor-pointer"
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
                type="button"
                onClick={handleRestart}
                className="flex w-full items-center justify-center space-x-2 rounded-xl border border-zinc-700 bg-zinc-900 py-2.5 px-4 font-mono text-xs font-bold text-zinc-200 hover:border-zinc-500 hover:text-white hover:bg-zinc-850 transition cursor-pointer"
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
                    className="flex w-full items-center justify-center space-x-2 rounded-xl border border-purple-500/40 bg-purple-950/20 py-2 px-4 font-mono text-xs font-bold text-purple-300 hover:bg-purple-900/40 hover:border-purple-400 hover:text-purple-200 transition cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                    <span>NEXT CARTRIDGE #{nextTokenId} ▶</span>
                  </Link>
                );
              })()}

              <Link
                href="/browse"
                className="flex w-full items-center justify-center space-x-2 rounded-xl bg-zinc-800/60 py-2 px-4 font-mono text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition cursor-pointer"
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
          onUltimate={handleTriggerUltimate}
          isUltimateReady={essence.isReady}
          abilityCooldown={abilityCooldown}
          abilityReady={abilityReady}
          abilityName={gameConfig.signatureSkill.name}
          autoAimEnabled={autoAim.enabled}
          isAimScrambled={autoAim.isScrambled}
          onToggleAutoAim={handleToggleAutoAim}
        />
      </ArcadeCabinetFrame>

      {/* STORY DIALOGUE MODAL */}
      <StoryDialogueModal
        isOpen={showDialogue}
        chog={initialChog}
        sector={dialogueSector}
        onComplete={handleDialogueComplete}
        onSkip={handleDialogueSkip}
      />

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
