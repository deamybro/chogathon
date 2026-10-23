export type BiomeType = 'space' | 'swamp' | 'neon' | 'ice' | 'default';
export type EyesType = 'laser' | 'hypno' | 'glasses' | 'default';
export type MouthType = 'grin' | 'sharp' | 'calm' | 'default';
export type HeadType = 'crown' | 'hood' | 'helmet' | 'default';
export type BodyType = 'suit' | 'hoodie' | 'naked' | 'default';
export type AuraType = 'flame' | 'glitch' | 'gold' | 'default';
export type TierType = 'common' | 'rare' | 'epic' | 'legendary';

export type BonusSkillType =
  | 'hyper_firerate'
  | 'orbital_shield'
  | 'nuke_bomb'
  | 'cryo_blast'
  | 'homing_missiles'
  | 'chain_lightning'
  | 'speed_warp'
  | 'vampire_heal'
  | 'midas_jackpot'
  | 'magnet_overdrive';

export interface ActiveBonusSkill {
  type: BonusSkillType;
  name: string;
  icon: string;
  durationSeconds: number;
  remainingSeconds: number;
  description: string;
  color: string;
}

export interface ChogTraits {
  background: string;
  eyes: string;
  mouth: string;
  head: string;
  body: string;
  aura: string;
  tier: string;
}

export interface CartridgeBattery {
  maxRuns: number; // e.g. 7 for trial, Infinity for permanent
  runsRemaining: number; // 7 -> 0
  isBurned: boolean;
  isTrial: boolean;
}

export interface Chog {
  tokenId: number;
  name: string;
  image: string;
  traits: ChogTraits;
  isFallback?: boolean;
  description?: string;
  signatureSkillName?: string;
  signatureSkillDesc?: string;
  battery?: CartridgeBattery;
}

export interface ActiveAbilityConfig {
  name: string;
  key: HeadType;
  description: string;
  cooldownSeconds: number;
  durationSeconds: number;
  icon: string;
  isSignature?: boolean;
}

export interface ChaosModifierConfig {
  name: string;
  key: AuraType;
  description: string;
  intervalSeconds: number;
}

export interface GameConfig {
  seed: number;
  tokenId: number;
  signatureSkill: {
    name: string;
    description: string;
    icon: string;
    cooldownSeconds: number;
  };
  biome: {
    type: BiomeType;
    name: string;
    description: string;
    bgColor: number;
    accentColor: number;
    friction: number;
    speedModifier: number;
    specialZone: 'none' | 'slow_patches' | 'speed_lanes' | 'ice_drift';
  };
  targeting: {
    type: EyesType;
    name: string;
    piercing: boolean;
    slowOnHit: boolean;
    critChance: number;
    rangeModifier: number;
  };
  attack: {
    type: MouthType;
    name: string;
    pattern: 'single' | 'spread' | 'rapid' | 'charge';
    fireRateMs: number;
    damage: number;
    projectileSpeed: number;
    bulletColor: number;
  };
  ability: ActiveAbilityConfig;
  archetype: {
    type: BodyType;
    name: string;
    maxHealth: number;
    moveSpeed: number;
  };
  chaos: ChaosModifierConfig;
  difficulty: {
    tier: TierType;
    difficultyMultiplier: number;
    scoreMultiplier: number;
    label: string;
  };
  dailyDream: {
    active: boolean;
    dateKey: string;
    modifierName: string;
    enemySpeedMultiplier: number;
    spawnRateMultiplier: number;
  };
}

export interface RunResults {
  tokenId: number;
  chogName: string;
  survivedSeconds: number;
  score: number;
  enemiesDefeated: number;
  bossesDefeated: number;
  skillsCollected: number;
  overclockLevel?: number;
  levelReached?: number;
  victory: boolean;
  personalBest: number;
  skullCount: number;
  timestamp: number;
  traitsSummary: string;
}
