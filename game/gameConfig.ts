import Phaser from 'phaser';
import { ChogScene } from './ChogScene';
import { GameConfig } from '@/types/chog';
import { GameCallbacks } from './ChogScene';

export function createPhaserGame(
  parentEl: HTMLElement,
  config: GameConfig,
  callbacks: GameCallbacks
): Phaser.Game {
  const phaserConfig: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: parentEl,
    width: 800,
    height: 600,
    backgroundColor: config.biome.bgColor,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 800,
      height: 600,
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    // No scene in array so we can pass data directly on boot via game.scene.add
  };

  const game = new Phaser.Game(phaserConfig);
  game.scene.add('ChogScene', ChogScene, true, { config, callbacks });

  return game;
}
