'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Shield, Zap } from 'lucide-react';

interface MobileControlsProps {
  onMove: (x: number, y: number) => void;
  onAbility: () => void;
  abilityCooldown: number;
  abilityReady: boolean;
  abilityName: string;
}

export default function MobileControls({
  onMove,
  onAbility,
  abilityCooldown,
  abilityReady,
  abilityName,
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

  return (
    <div className="flex md:hidden w-full items-center justify-between px-6 py-4 select-none touch-none bg-zinc-950/80 border-t border-zinc-800">
      {/* Virtual Joystick */}
      <div
        ref={joystickRef}
        onTouchStart={handleJoystickStart}
        className="relative flex h-24 w-24 items-center justify-center rounded-full border-2 border-emerald-500/50 bg-zinc-900/80 shadow-[0_0_15px_rgba(34,197,94,0.2)]"
      >
        {/* Center Knob */}
        <div
          style={{ transform: `translate(${knobPos.x}px, ${knobPos.y}px)` }}
          className="h-10 w-10 rounded-full border border-emerald-400 bg-emerald-500/80 shadow-[0_0_10px_rgba(34,197,94,0.6)]"
        />
        <span className="absolute bottom-1 text-[9px] font-mono text-zinc-500">MOVE</span>
      </div>

      {/* Action / Active Ability Button */}
      <div className="flex flex-col items-center space-y-1">
        <button
          onClick={onAbility}
          disabled={!abilityReady}
          className={`flex h-20 w-20 flex-col items-center justify-center rounded-2xl border-2 font-mono transition active:scale-95 ${
            abilityReady
              ? 'border-emerald-400 bg-emerald-500/30 text-emerald-300 shadow-[0_0_20px_rgba(34,197,94,0.5)] animate-pulse'
              : 'border-zinc-700 bg-zinc-900/50 text-zinc-500 opacity-60'
          }`}
        >
          {abilityReady ? <Zap className="h-6 w-6" /> : <Shield className="h-6 w-6" />}
          <span className="mt-1 text-[10px] font-bold">
            {abilityReady ? 'ABILITY' : `${abilityCooldown}s`}
          </span>
        </button>
        <span className="text-[9px] font-mono text-zinc-400 truncate max-w-[80px]">
          {abilityName}
        </span>
      </div>
    </div>
  );
}
