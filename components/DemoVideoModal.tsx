'use client';

import React from 'react';
import { X, Film, Download, ShieldCheck, Sparkles, ExternalLink } from 'lucide-react';
import { soundSynth } from '@/game/soundEffects';

interface DemoVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DemoVideoModal({ isOpen, onClose }: DemoVideoModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 sm:p-6 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl overflow-hidden rounded-2xl border-2 border-emerald-500/80 bg-zinc-950 p-4 sm:p-6 shadow-[0_0_50px_rgba(34,197,94,0.3)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3 font-mono">
          <div className="flex items-center space-x-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              <Film className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wider">
                Chog 969 Official Hackathon Demo Showcase
              </h3>
              <p className="text-[10px] text-emerald-400">
                Full 1080p 60s Showcase • AI Voiceover • Monad Mainnet Vault
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundSynth.playLaser(false);
              onClose();
            }}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-white transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Video Player */}
        <div className="relative mt-4 aspect-video w-full overflow-hidden rounded-xl border border-zinc-800 bg-black shadow-inner">
          <video
            src="/chog969_demo_showcase.mp4"
            controls
            autoPlay
            playsInline
            className="h-full w-full object-contain"
          >
            Your browser does not support the video tag.
          </video>
        </div>

        {/* Video Footer Info & Actions */}
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-xs text-zinc-400">
          <div className="flex items-center space-x-2 text-[11px]">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Monad Mainnet Vault: <code className="text-emerald-300">0x4c2d...7f9d</code> (400 $CHOG)</span>
          </div>

          <div className="flex items-center space-x-2">
            <a
              href="/chog969_demo_showcase.mp4"
              download="CHOG969_Monad_Hackathon_Showcase.mp4"
              className="flex items-center space-x-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 font-bold text-zinc-200 hover:border-emerald-500 hover:text-white transition cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download MP4 (2MB)</span>
            </a>

            <button
              onClick={() => {
                soundSynth.playLaser(false);
                onClose();
              }}
              className="rounded-lg bg-emerald-500 px-3.5 py-1.5 font-black text-black hover:bg-emerald-400 transition cursor-pointer"
            >
              Play Game
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
