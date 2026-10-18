'use client';

import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import Phaser from 'phaser';
import { GameConfig } from '@/types/chog';
import { GameCallbacks, ChogScene } from '@/game/ChogScene';
import { createPhaserGame } from '@/game/gameConfig';

export interface PhaserGameHandle {
  startRun: () => void;
  triggerAbility: () => void;
  triggerUltimate: () => void;
  setTouchMovement: (x: number, y: number) => void;
  toggleAutoAim: () => boolean;
}

export interface PhaserGameProps {
  config: GameConfig;
  callbacks: GameCallbacks;
  isStarted?: boolean;
  triggerAbilityCount?: number;
  touchVector?: { x: number; y: number };
}

const PhaserGame = forwardRef<PhaserGameHandle, PhaserGameProps>(
  ({ config, callbacks, isStarted = false, triggerAbilityCount = 0, touchVector }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const gameRef = useRef<Phaser.Game | null>(null);

    useImperativeHandle(ref, () => ({
      startRun: () => {
        if (gameRef.current) {
          const scene = gameRef.current.scene.getScene('ChogScene') as ChogScene;
          if (scene) {
            scene.startRun();
          }
        }
      },
      triggerAbility: () => {
        if (gameRef.current) {
          const scene = gameRef.current.scene.getScene('ChogScene') as ChogScene;
          if (scene) {
            scene.triggerActiveAbility();
          }
        }
      },
      triggerUltimate: () => {
        if (gameRef.current) {
          const scene = gameRef.current.scene.getScene('ChogScene') as ChogScene;
          if (scene) {
            scene.triggerUltimate();
          }
        }
      },
      setTouchMovement: (x: number, y: number) => {
        if (gameRef.current) {
          const scene = gameRef.current.scene.getScene('ChogScene') as ChogScene;
          if (scene) {
            scene.setTouchMovement(x, y);
          }
        }
      },
      toggleAutoAim: () => {
        if (gameRef.current) {
          const scene = gameRef.current.scene.getScene('ChogScene') as ChogScene;
          if (scene) {
            return scene.toggleAutoAim();
          }
        }
        return false;
      },
    }));

    // Boot game
    useEffect(() => {
      if (containerRef.current && !gameRef.current) {
        const game = createPhaserGame(containerRef.current, config, callbacks);
        gameRef.current = game;
      }

      return () => {
        if (gameRef.current) {
          gameRef.current.destroy(true);
          gameRef.current = null;
        }
      };
    }, [config, callbacks]);

    // Reactively trigger startRun when isStarted prop becomes true
    useEffect(() => {
      if (isStarted && gameRef.current) {
        const scene = gameRef.current.scene.getScene('ChogScene') as ChogScene;
        if (scene) {
          scene.startRun();
        }
      }
    }, [isStarted]);

    // Reactively trigger ability when count increments
    useEffect(() => {
      if (triggerAbilityCount > 0 && gameRef.current) {
        const scene = gameRef.current.scene.getScene('ChogScene') as ChogScene;
        if (scene) {
          scene.triggerActiveAbility();
        }
      }
    }, [triggerAbilityCount]);

    // Reactively update touch movement
    useEffect(() => {
      if (touchVector && gameRef.current) {
        const scene = gameRef.current.scene.getScene('ChogScene') as ChogScene;
        if (scene) {
          scene.setTouchMovement(touchVector.x, touchVector.y);
        }
      }
    }, [touchVector]);

    return (
      <div className="relative flex w-full items-center justify-center overflow-hidden bg-black aspect-[4/3] max-h-[600px]">
        <div ref={containerRef} className="w-full h-full flex items-center justify-center" />
      </div>
    );
  }
);

PhaserGame.displayName = 'PhaserGame';

export default PhaserGame;
