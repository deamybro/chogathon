'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Chog } from '@/types/chog';
import { soundSynth } from '@/game/soundEffects';
import { FastForward, Play, ShieldAlert, Sparkles, Terminal, Volume2 } from 'lucide-react';

export interface DialogueLine {
  speaker: 'player' | 'boss';
  speakerTitle: string;
  speakerName: string;
  avatarType: 'chog' | 'boss_alpha' | 'boss_beta' | 'boss_omega';
  text: string;
  mood?: 'cocky' | 'aggressive' | 'threatening' | 'determined';
}

export const SECTOR_DIALOGUES: Record<number, DialogueLine[]> = {
  1: [
    {
      speaker: 'boss',
      speakerName: 'VOID COLOSSUS',
      speakerTitle: 'ROGUE MONAD AI • SECTOR ALPHA',
      avatarType: 'boss_alpha',
      mood: 'threatening',
      text: 'INTRUSION DETECTED IN MONAD GRID ALPHA. State your objective, biological anomaly.',
    },
    {
      speaker: 'player',
      speakerName: 'CHOG OPERATIVE',
      speakerTitle: 'GENESIS BOUNTY HUNTER',
      avatarType: 'chog',
      mood: 'cocky',
      text: 'Objective is simple, rust-bucket: I am here for the Genesis $CHOG Core. Power down your barriers and surrender the bounty peacefully.',
    },
    {
      speaker: 'boss',
      speakerName: 'VOID COLOSSUS',
      speakerTitle: 'DEFENSE GRID SENTINEL',
      avatarType: 'boss_alpha',
      mood: 'threatening',
      text: 'Impudent flesh. The Genesis Core belongs to the Dreadnought Hive. Sector Alpha defenses engaged... COMMENCE IMMEDIATE ERADICATION!',
    },
    {
      speaker: 'player',
      speakerName: 'CHOG OPERATIVE',
      speakerTitle: 'TWIN CANNONS ARMED',
      avatarType: 'chog',
      mood: 'determined',
      text: 'Just what I was hoping to hear. Charging twin plasma cannons... Let us dance!',
    },
  ],
  2: [
    {
      speaker: 'boss',
      speakerName: 'VOID COLOSSUS OVERCHARGED',
      speakerTitle: 'CYBER CORE GUARDIAN • SECTOR BETA',
      avatarType: 'boss_beta',
      mood: 'threatening',
      text: 'WARNING: Overcharge cores engaged! Deploying EMP Scramblers and Twin Lasers! Try landing a shot with your auto-targeting fried!',
    },
    {
      speaker: 'player',
      speakerName: 'CHOG OPERATIVE',
      speakerTitle: 'RADAR JAMMED • MANUAL LOCK',
      avatarType: 'chog',
      mood: 'cocky',
      text: 'Who needs auto-aim when you have pure arcade instinct? Keep those lasers coming, you are just charging up my Overclock!',
    },
  ],
  3: [
    {
      speaker: 'boss',
      speakerName: 'OMEGA DREADNOUGHT PRIME',
      speakerTitle: 'APEX SYSTEM OVERLORD • SECTOR OMEGA',
      avatarType: 'boss_omega',
      mood: 'threatening',
      text: 'CRITICAL CORE BREACH! You stand before the Omega Dreadnought Prime! All systems overclocked to 300%. Your atoms will be dissolved into raw binary code!',
    },
    {
      speaker: 'player',
      speakerName: 'CHOG OPERATIVE',
      speakerTitle: 'ULTIMATE ESSENCE AT 100%',
      avatarType: 'chog',
      mood: 'determined',
      text: 'Talk is cheap, Prime. The entire Monad ecosystem is watching this final sector. The Genesis $CHOG Bounty is mine!',
    },
  ],
  4: [
    {
      speaker: 'boss',
      speakerName: 'OMEGA DREADNOUGHT PRIME',
      speakerTitle: 'CORE COMPROMISED • CRITICAL SYSTEM FAILURE',
      avatarType: 'boss_omega',
      mood: 'threatening',
      text: 'CORE INTEGRITY ZERO PERCENT... CONTAINMENT MATRIX COLLAPSING... Impossible... How could a single arcade Operative breach the Dreadnought Hive...',
    },
    {
      speaker: 'player',
      speakerName: 'CHOG OPERATIVE',
      speakerTitle: 'MISSION ACCOMPLISHED • RETRIEVAL COMPLETE',
      avatarType: 'chog',
      mood: 'cocky',
      text: 'Because around here, piloting instincts beat raw brute force every single time! Genesis $CHOG Core is secured in the cargo hold.',
    },
    {
      speaker: 'boss',
      speakerName: 'MONAD COMMAND UPLINK',
      speakerTitle: 'AUTOMATED NETWORK TELEMETRY',
      avatarType: 'boss_alpha',
      mood: 'threatening',
      text: 'ALL 3 SECTORS SECURED. TRANSMITTING DATA LOGS TO MONAD HACKATHON PROTOCOL. BOUNTY VAULT UNLOCKED.',
    },
    {
      speaker: 'player',
      speakerName: 'CHOG OPERATIVE',
      speakerTitle: 'VICTORY SECURED',
      avatarType: 'chog',
      mood: 'determined',
      text: 'Sector liberated, Genesis payload delivered! Let us sign the transaction and claim our $CHOG bounty!',
    },
  ],
};

interface StoryDialogueModalProps {
  isOpen: boolean;
  chog: Chog;
  sector?: number;
  onComplete: () => void;
  onSkip: () => void;
}

export default function StoryDialogueModal({
  isOpen,
  chog,
  sector = 1,
  onComplete,
  onSkip,
}: StoryDialogueModalProps) {
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Reset line index when opening a new sector
  useEffect(() => {
    if (isOpen) {
      setCurrentLineIndex(0);
    }
  }, [isOpen, sector]);

  const lines = SECTOR_DIALOGUES[sector] || SECTOR_DIALOGUES[1];
  const currentLine = lines[currentLineIndex] || lines[0];

  // Typewriter effect
  useEffect(() => {
    if (!isOpen) return;

    if (typingTimerRef.current) {
      clearInterval(typingTimerRef.current);
    }

    const fullText = currentLine.text;
    setDisplayedText('');
    setIsTyping(true);
    let charIndex = 0;

    typingTimerRef.current = setInterval(() => {
      charIndex++;
      setDisplayedText(fullText.slice(0, charIndex));

      // Gentle voice blip sound every few characters
      if (charIndex % 3 === 0) {
        soundSynth.playLaser(false);
      }

      if (charIndex >= fullText.length) {
        if (typingTimerRef.current) clearInterval(typingTimerRef.current);
        setIsTyping(false);
      }
    }, 22);

    return () => {
      if (typingTimerRef.current) clearInterval(typingTimerRef.current);
    };
  }, [isOpen, currentLineIndex, currentLine.text]);

  const handleNext = useCallback(() => {
    soundSynth.playCoin();
    if (isTyping) {
      // If still typing, complete the text instantly
      if (typingTimerRef.current) clearInterval(typingTimerRef.current);
      setDisplayedText(currentLine.text);
      setIsTyping(false);
    } else {
      // Advance to next line or complete dialogue
      if (currentLineIndex < lines.length - 1) {
        setCurrentLineIndex((prev) => prev + 1);
      } else {
        onComplete();
      }
    }
  }, [isTyping, currentLine.text, currentLineIndex, lines.length, onComplete]);

  // Keyboard navigation: Space/Enter = Next, Escape = Skip
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        handleNext();
      } else if (e.code === 'Escape') {
        e.preventDefault();
        onSkip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNext, onSkip]);

  if (!isOpen) return null;

  const isPlayer = currentLine.speaker === 'player';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 p-3 sm:p-6 backdrop-blur-md animate-in fade-in duration-200">
      <div
        onClick={handleNext}
        className="relative w-full max-w-3xl overflow-hidden rounded-2xl border-2 border-emerald-500/50 bg-zinc-950 p-4 sm:p-6 shadow-[0_0_50px_rgba(16,185,129,0.3)] cursor-pointer select-none"
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3 font-mono text-xs">
          <div className="flex items-center space-x-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold uppercase tracking-wider text-emerald-400 flex items-center space-x-1.5">
              <Terminal className="h-3.5 w-3.5" />
              <span>
                {sector === 4
                  ? 'MISSION ACCOMPLISHED • GENESIS CORE SECURED'
                  : `TRANSMISSION DECRYPTED • SECTOR ${sector} STORY BRIEFING`}
              </span>
            </span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSkip();
            }}
            className="flex items-center space-x-1 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-[11px] font-mono text-zinc-400 hover:border-zinc-500 hover:text-white transition cursor-pointer"
          >
            <FastForward className="h-3 w-3" />
            <span>SKIP (ESC)</span>
          </button>
        </div>

        {/* Character Hologram Portals (Left: Player, Right: Boss) */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-6 items-center">
          {/* Player Hologram Portrait */}
          <div
            className={`flex items-center space-x-3 rounded-xl border p-2 sm:p-3 transition-all duration-300 ${
              isPlayer
                ? 'border-cyan-400 bg-cyan-950/30 shadow-[0_0_25px_rgba(6,182,212,0.4)] scale-[1.02]'
                : 'border-zinc-800 bg-zinc-900/40 opacity-40 grayscale'
            }`}
          >
            <div className="relative h-14 w-14 sm:h-18 sm:w-18 shrink-0 overflow-hidden rounded-xl border-2 border-cyan-400 bg-zinc-900">
              {chog.image ? (
                <Image
                  src={chog.image}
                  alt={chog.name}
                  width={72}
                  height={72}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-mono font-bold text-cyan-400">
                  #{chog.tokenId}
                </div>
              )}
              {isPlayer && (
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 border border-black animate-ping" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1">
                <span className="rounded bg-cyan-500/20 px-1.5 py-0.5 font-mono text-[9px] font-black text-cyan-300 border border-cyan-500/40">
                  CHOG #{chog.tokenId}
                </span>
              </div>
              <p className="mt-1 font-mono text-xs sm:text-sm font-black text-white truncate">
                {chog.name}
              </p>
              <p className="text-[10px] font-mono text-cyan-400/80 truncate">
                {sector === 4 ? 'LIBERATOR HERO' : 'GENESIS BOUNTY HUNTER'}
              </p>
            </div>
          </div>

          {/* Boss Hologram Portrait */}
          <div
            className={`flex items-center space-x-3 rounded-xl border p-2 sm:p-3 transition-all duration-300 ${
              !isPlayer
                ? 'border-red-500 bg-red-950/30 shadow-[0_0_25px_rgba(239,68,68,0.5)] scale-[1.02]'
                : 'border-zinc-800 bg-zinc-900/40 opacity-40 grayscale'
            }`}
          >
            <div className="relative flex h-14 w-14 sm:h-18 sm:w-18 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-red-500 bg-black">
              {/* Animated Rogue AI Eye Visual */}
              <div className="relative flex items-center justify-center">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-red-600/30 animate-ping" />
                <div className="absolute h-6 w-6 sm:h-8 sm:w-8 rounded-full border border-amber-400 bg-red-900" />
                <div className="absolute h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-amber-300 animate-pulse" />
              </div>
              {!isPlayer && (
                <span className="absolute top-1 right-1 flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1">
                <span className="rounded bg-red-500/20 px-1.5 py-0.5 font-mono text-[9px] font-black text-red-300 border border-red-500/40">
                  {sector === 4 ? 'SECURED' : sector === 3 ? 'OMEGA BOSS' : sector === 2 ? 'OVERCHARGED BOSS' : 'SECTOR 1 BOSS'}
                </span>
              </div>
              <p className="mt-1 font-mono text-xs sm:text-sm font-black text-red-400 truncate">
                {sector === 4
                  ? 'GENESIS CORE SECURED'
                  : sector === 3
                  ? 'OMEGA DREADNOUGHT'
                  : sector === 2
                  ? 'COLOSSUS BETA'
                  : 'VOID COLOSSUS'}
              </p>
              <p className="text-[10px] font-mono text-zinc-400 truncate">
                {sector === 4 ? 'SYSTEM RESTORED' : 'ROGUE MONAD MAINFRAME'}
              </p>
            </div>
          </div>
        </div>

        {/* Dialogue Terminal Box */}
        <div className="mt-4 rounded-xl border-2 border-zinc-800 bg-black/90 p-3.5 sm:p-5 relative min-h-[110px] flex flex-col justify-between">
          <div>
            {/* Speaker Label */}
            <div className="flex items-center space-x-2 font-mono text-xs font-black">
              <span className={`inline-block h-2 w-2 rounded-full ${isPlayer ? 'bg-cyan-400' : 'bg-red-500 animate-pulse'}`} />
              <span className={isPlayer ? 'text-cyan-400' : 'text-red-400'}>
                {currentLine.speakerName}
              </span>
              <span className="text-zinc-600">•</span>
              <span className="text-[10px] text-zinc-400 font-normal">
                {currentLine.speakerTitle}
              </span>
            </div>

            {/* Typewriter Text */}
            <p className="mt-2 font-mono text-sm sm:text-base text-zinc-100 leading-relaxed min-h-[48px]">
              {displayedText}
              {isTyping && <span className="inline-block w-2 h-4 ml-1 bg-emerald-400 animate-pulse" />}
            </p>
          </div>

          {/* Bottom Action Hint */}
          <div className="mt-3 flex items-center justify-between border-t border-zinc-800/80 pt-2 font-mono text-[11px] text-zinc-400">
            <span className="text-zinc-500 text-[10px]">
              Line {currentLineIndex + 1} of {lines.length}
            </span>

            <div className="flex items-center space-x-1.5 text-emerald-400 font-bold hover:text-emerald-300 transition">
              <span>{currentLineIndex < lines.length - 1 ? 'CONTINUE [SPACE / TAP]' : 'COMMENCE INVASION [SPACE / TAP]'}</span>
              <Play className="h-3 w-3 fill-current inline" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
