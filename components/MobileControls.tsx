'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Shield, Zap, Star, Crosshair } from 'lucide-react';

interface MobileControlsProps {
  onMove: (x: number, y: number) => void;
  onAbility: () => void;
  onUltimate?: () => void;
  isUltimateReady?: boolean;
  abilityCooldown: number;
  abilityReady: boolean;
  abilityName: string;
  autoAimEnabled?: boolean;
  isAimScrambled?: boolean;
  onToggleAutoAim?: () => void;
  visible?: boolean;
}

export default function MobileControls({
  onMove,
  onAbility,
  onUltimate,
  isUltimateReady = false,
  abilityCooldown,
  abilityReady,
  abilityName,
  autoAimEnabled = true,
  isAimScrambled = false,
  onToggleAutoAim,
  visible = true,
}: MobileControlsProps) {
  const joystickRef = useRef<HTMLDivElement>(null);
  const [activeTouchId, setActiveTouchId] = useState<number | null>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if (activeTouchId === null || !joystickRef.current) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === activeTouchId) {
          if (e.cancelable) e.preventDefault();
          const rect = joystickRef.current.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;

          let dx = touch.clientX - centerX;
          let dy = touch.clientY - centerY;
          const dist = Math.hypot(dx, dy);
          const maxRadius = rect.width / 2;

          if (dist > maxRadius) {
            dx = (dx / dist) * maxRadius;
            dy = (dy / dist) * maxRadius;
          }

          setKnobPos({ x: dx, y: dy });
          onMove(dx / maxRadius, dy / maxRadius);
          break;
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (activeTouchId === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === activeTouchId) {
          setActiveTouchId(null);
          setKnobPos({ x: 0, y: 0 });
          onMove(0, 0);
          break;
        }
      }
    };

    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [activeTouchId, onMove]);

  const handleJoystickStart = (e: React.TouchEvent) => {
    if (activeTouchId !== null) return;
    const touch = e.changedTouches[0];
    setActiveTouchId(touch.identifier);

    if (joystickRef.current) {
      const rect = joystickRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      let dx = touch.clientX - centerX;
      let dy = touch.clientY - centerY;
      const dist = Math.hypot(dx, dy);
      const maxRadius = rect.width / 2;
      if (dist > maxRadius) {
        dx = (dx / dist) * maxRadius;
        dy = (dy / dist) * maxRadius;
      }
      setKnobPos({ x: dx, y: dy });
      onMove(dx / maxRadius, dy / maxRadius);
    }
  };

  const handleAbilityTap = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(25);
    }
    onAbility();
  };

  const handleUltimateTap = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([40, 20, 40]);
    }
    onUltimate?.();
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-3 left-0 right-0 z-50 flex lg:hidden items-end justify-between px-3 sm:px-6 pointer-events-none select-none touch-none">
      {/* Left Thumb: Virtual Joystick */}
      <div className="pointer-events-auto">
        <div
          ref={joystickRef}
          onTouchStart={handleJoystickStart}
          className="relative flex h-28 w-28 items-center justify-center rounded-full border-2 border-emerald-500/70 bg-black/85 shadow-[0_0_25px_rgba(34,197,94,0.35)] backdrop-blur-md active:scale-95 transition-transform"
        >
          {/* Subtle directional indicators */}
          <span className="absolute top-1 text-[8px] font-mono text-emerald-500/50">▲</span>
          <span className="absolute bottom-1 text-[8px] font-mono text-emerald-500/50">▼</span>
          <span className="absolute left-1.5 text-[8px] font-mono text-emerald-500/50">◀</span>
          <span className="absolute right-1.5 text-[8px] font-mono text-emerald-500/50">▶</span>

          {/* Center Movable Thumb Knob */}
          <div
            style={{ transform: `translate(${knobPos.x}px, ${knobPos.y}px)` }}
            className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-emerald-300 bg-gradient-to-br from-emerald-400 to-green-600 shadow-[0_0_15px_rgba(34,197,94,0.8)]"
          >
            <div className="h-3 w-3 rounded-full bg-white/70" />
          </div>
          <span className="absolute bottom-3 text-[7px] font-mono font-bold tracking-widest text-emerald-400/80">
            STEER
          </span>
        </div>
      </div>

      {/* Right Thumb: Ergonomic Action Buttons */}
      <div className="pointer-events-auto flex items-end space-x-2">
        {/* Auto-Aim Toggle Button */}
        {onToggleAutoAim && (
          <button
            type="button"
            onClick={onToggleAutoAim}
            className={`flex h-12 w-12 flex-col items-center justify-center rounded-full border font-mono transition-transform active:scale-90 backdrop-blur-md ${
              isAimScrambled
                ? 'border-red-500 bg-red-950/80 text-red-400 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                : autoAimEnabled
                ? 'border-cyan-400 bg-cyan-950/80 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                : 'border-zinc-700 bg-black/80 text-zinc-500'
            }`}
          >
            <Crosshair className={`h-4 w-4 ${isAimScrambled ? 'animate-spin' : ''}`} />
            <span className="text-[7px] font-black leading-none mt-0.5">
              {isAimScrambled ? 'EMP' : autoAimEnabled ? 'AUTO' : 'MAN'}
            </span>
          </button>
        )}

        {/* Hero Trait Ability Button */}
        <button
          type="button"
          onClick={handleAbilityTap}
          onTouchStart={handleAbilityTap}
          disabled={!abilityReady}
          className={`flex h-16 w-16 flex-col items-center justify-center rounded-full border-2 font-mono transition-all active:scale-90 backdrop-blur-md ${
            abilityReady
              ? 'border-emerald-400 bg-emerald-500/30 text-emerald-300 shadow-[0_0_20px_rgba(34,197,94,0.6)] animate-pulse'
              : 'border-zinc-800 bg-zinc-950/80 text-zinc-500 opacity-60'
          }`}
        >
          {abilityReady ? (
            <Zap className="h-6 w-6 text-emerald-400 fill-current" />
          ) : (
            <Shield className="h-5 w-5 text-zinc-500" />
          )}
          <span className="text-[9px] font-black leading-none mt-0.5">
            {abilityReady ? 'SKILL' : `${abilityCooldown}s`}
          </span>
          <span className="text-[7px] font-mono text-zinc-400 truncate max-w-[50px] leading-tight mt-0.5">
            {abilityName.split(' ')[0]}
          </span>
        </button>

        {/* Avatar Ultimate Signature Button */}
        {onUltimate && (
          <button
            type="button"
            onClick={handleUltimateTap}
            onTouchStart={handleUltimateTap}
            disabled={!isUltimateReady}
            className={`flex h-16 w-16 flex-col items-center justify-center rounded-full border-2 font-mono transition-all active:scale-90 backdrop-blur-md ${
              isUltimateReady
                ? 'border-amber-400 bg-gradient-to-br from-amber-500 to-yellow-400 text-black shadow-[0_0_30px_rgba(245,158,11,0.9)] animate-bounce font-black'
                : 'border-zinc-800 bg-zinc-950/80 text-zinc-600 opacity-40'
            }`}
          >
            <Star className={`h-6 w-6 ${isUltimateReady ? 'fill-current text-black' : ''}`} />
            <span className="text-[8px] font-black leading-none mt-0.5">
              {isUltimateReady ? 'ULT!' : 'CHARGE'}
            </span>
            <span className="text-[7px] font-mono leading-tight mt-0.5">
              {isUltimateReady ? 'READY' : 'SIGNATURE'}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
