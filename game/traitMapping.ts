import {
  Chog,
  GameConfig,
  BiomeType,
  EyesType,
  MouthType,
  HeadType,
  BodyType,
  AuraType,
  TierType,
} from '@/types/chog';
import { deriveSeedFromChog, SeededRandom } from './seededRandom';

/**
 * Normalizes trait strings into canonical lowercase keys with safe fallback
 */
export function normalizeTrait(value: string | undefined): string {
  if (!value) return 'default';
  return value.trim().toLowerCase();
}

export function parseBiome(value: string | undefined): BiomeType {
  const norm = normalizeTrait(value);
  if (norm.includes('space') || norm.includes('cosmos') || norm.includes('galaxy')) return 'space';
  if (norm.includes('swamp') || norm.includes('toxic') || norm.includes('slime')) return 'swamp';
  if (norm.includes('neon') || norm.includes('cyber') || norm.includes('synth')) return 'neon';
  if (norm.includes('ice') || norm.includes('frost') || norm.includes('snow') || norm.includes('glacier')) return 'ice';
  return 'default';
}

export function parseEyes(value: string | undefined): EyesType {
  const norm = normalizeTrait(value);
  if (norm.includes('laser') || norm.includes('beam') || norm.includes('cyborg')) return 'laser';
  if (norm.includes('hypno') || norm.includes('spiral') || norm.includes('psycho')) return 'hypno';
  if (norm.includes('glass') || norm.includes('shades') || norm.includes('visor') || norm.includes('goggles')) return 'glasses';
  return 'default';
}

export function parseMouth(value: string | undefined): MouthType {
  const norm = normalizeTrait(value);
  if (norm.includes('grin') || norm.includes('smile') || norm.includes('teeth')) return 'grin';
  if (norm.includes('sharp') || norm.includes('fang') || norm.includes('vampire')) return 'sharp';
  if (norm.includes('calm') || norm.includes('smug') || norm.includes('pipe') || norm.includes('cigar')) return 'calm';
  return 'default';
}

export function parseHead(value: string | undefined): HeadType {
  const norm = normalizeTrait(value);
  if (norm.includes('crown') || norm.includes('tiara') || norm.includes('king')) return 'crown';
  if (norm.includes('hood') || norm.includes('ninja') || norm.includes('cloak')) return 'hood';
  if (norm.includes('helmet') || norm.includes('cap') || norm.includes('spartan') || norm.includes('visor')) return 'helmet';
  return 'default';
}

export function parseBody(value: string | undefined): BodyType {
  const norm = normalizeTrait(value);
  if (norm.includes('suit') || norm.includes('tux') || norm.includes('armor') || norm.includes('heavy')) return 'suit';
  if (norm.includes('hoodie') || norm.includes('jacket') || norm.includes('sweater')) return 'hoodie';
  if (norm.includes('naked') || norm.includes('light') || norm.includes('none') || norm.includes('bare')) return 'naked';
  return 'default';
}

export function parseAura(value: string | undefined): AuraType {
  const norm = normalizeTrait(value);
  if (norm.includes('flame') || norm.includes('fire') || norm.includes('magma') || norm.includes('burn')) return 'flame';
  if (norm.includes('glitch') || norm.includes('error') || norm.includes('void') || norm.includes('matrix')) return 'glitch';
  if (norm.includes('gold') || norm.includes('glow') || norm.includes('god') || norm.includes('radiant')) return 'gold';
  return 'default';
}

export function parseTier(value: string | undefined): TierType {
  const norm = normalizeTrait(value);
  if (norm.includes('legend') || norm.includes('mythic') || norm === '4' || norm.includes('tier 4')) return 'legendary';
  if (norm.includes('epic') || norm === '3' || norm.includes('tier 3')) return 'epic';
  if (norm.includes('rare') || norm === '2' || norm.includes('tier 2')) return 'rare';
  return 'common';
}

/**
 * Gets the current UTC date string YYYY-MM-DD
 */
export function getUtcDateString(date?: Date): string {
  const d = date || new Date();
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Pure function: Deterministically derives the full GameConfig from a Chog NFT and optional Daily Dream toggle.
 */
export function deriveGameConfig(
  chog: Chog,
  dailyDreamEnabled: boolean = false,
  customDate?: string
): GameConfig {
  const traits = chog.traits;
  const dateKey = dailyDreamEnabled ? (customDate || getUtcDateString()) : 'STANDARD';
  const seed = deriveSeedFromChog(
    chog.tokenId,
    traits as unknown as Record<string, string>,
    dailyDreamEnabled ? dateKey : undefined
  );

  const biomeType = parseBiome(traits.background);
  const eyesType = parseEyes(traits.eyes);
  const mouthType = parseMouth(traits.mouth);
  const headType = parseHead(traits.head);
  const bodyType = parseBody(traits.body);
  const auraType = parseAura(traits.aura);
  const tierType = parseTier(traits.tier);

  // Biome Configuration
  const biomeMap = {
    space: {
      type: 'space' as const,
      name: 'Zero-G Void',
      description: 'Low-gravity floaty inertia. Projectiles drift farther.',
      bgColor: 0x09071c,
      accentColor: 0x8b5cf6,
      friction: 0.96, // slippery / floaty
      speedModifier: 1.05,
      specialZone: 'none' as const,
    },
    swamp: {
      type: 'swamp' as const,
      name: 'Toxic Morass',
      description: 'Viscous sludge zones that hinder movement.',
      bgColor: 0x0c1a11,
      accentColor: 0x10b981,
      friction: 0.88,
      speedModifier: 0.95,
      specialZone: 'slow_patches' as const,
    },
    neon: {
      type: 'neon' as const,
      name: 'Cyber Hypergrid',
      description: 'High-speed luminous overdrive lanes.',
      bgColor: 0x130722,
      accentColor: 0xec4899,
      friction: 0.91,
      speedModifier: 1.15,
      specialZone: 'speed_lanes' as const,
    },
    ice: {
      type: 'ice' as const,
      name: 'Glacial Permafrost',
      description: 'Slick sub-zero ice drift with high momentum.',
      bgColor: 0x061923,
      accentColor: 0x06b6d4,
      friction: 0.985, // very slippery
      speedModifier: 1.0,
      specialZone: 'ice_drift' as const,
    },
    default: {
      type: 'default' as const,
      name: 'Chog Coliseum',
      description: 'Standard balanced retro battle arena.',
      bgColor: 0x0f172a,
      accentColor: 0x22c55e,
      friction: 0.90,
      speedModifier: 1.0,
      specialZone: 'none' as const,
    },
  };

  // Eyes (Targeting & Passive)
  const targetingMap = {
    laser: {
      type: 'laser' as const,
      name: 'Twin Laser Beam',
      piercing: true,
      slowOnHit: false,
      critChance: 0.15,
      rangeModifier: 1.25,
    },
    hypno: {
      type: 'hypno' as const,
      name: 'Hypno Waves',
      piercing: false,
      slowOnHit: true,
      critChance: 0.1,
      rangeModifier: 1.0,
    },
    glasses: {
      type: 'glasses' as const,
      name: 'Precision Optics',
      piercing: false,
      slowOnHit: false,
      critChance: 0.35, // High crit
      rangeModifier: 1.4,
    },
    default: {
      type: 'default' as const,
      name: 'Tactical Gaze',
      piercing: false,
      slowOnHit: false,
      critChance: 0.1,
      rangeModifier: 1.0,
    },
  };

  // Mouth (Attack Pattern)
  const attackMap = {
    grin: {
      type: 'grin' as const,
      name: 'Triple Grin Spread',
      pattern: 'spread' as const,
      fireRateMs: 280,
      damage: 18,
      projectileSpeed: 450,
      bulletColor: 0xfacc15, // Golden yellow
    },
    sharp: {
      type: 'sharp' as const,
      name: 'Fang Micro-Blaster',
      pattern: 'rapid' as const,
      fireRateMs: 130, // Very fast
      damage: 10,
      projectileSpeed: 600,
      bulletColor: 0xef4444, // Crimson red
    },
    calm: {
      type: 'calm' as const,
      name: 'Heavy Plasma Cannon',
      pattern: 'charge' as const,
      fireRateMs: 420,
      damage: 48, // High damage
      projectileSpeed: 380,
      bulletColor: 0x38bdf8, // Sky blue
    },
    default: {
      type: 'default' as const,
      name: 'Dual Chog Blaster',
      pattern: 'single' as const,
      fireRateMs: 240,
      damage: 22,
      projectileSpeed: 480,
      bulletColor: 0x4ade80, // Neon green
    },
  };

  // Head (Active Ability)
  const abilityMap = {
    crown: {
      name: 'Aegis of the Crown',
      key: 'crown' as const,
      description: 'Invulnerable barrier for 4s, restores 20 Kinetic Shield, and emits a Holy Aegis Shockwave.',
      cooldownSeconds: 14,
      durationSeconds: 4.0,
      icon: 'Crown',
    },
    hood: {
      name: 'Shadow Warp Dash',
      key: 'hood' as const,
      description: 'High-speed phase dash that phases through enemies.',
      cooldownSeconds: 7,
      durationSeconds: 0.6,
      icon: 'Zap',
    },
    helmet: {
      name: 'Titan Shockwave',
      key: 'helmet' as const,
      description: 'Emits a 360° seismic wave that knocks back and damages all nearby enemies.',
      cooldownSeconds: 10,
      durationSeconds: 0.5,
      icon: 'ShieldAlert',
    },
    default: {
      name: 'Nano Repair Injection',
      key: 'default' as const,
      description: 'Emergency stim recovering 30 HP and 15 Kinetic Shield.',
      cooldownSeconds: 15,
      durationSeconds: 0,
      icon: 'HeartPulse',
    },
  };

  // Body (Archetype)
  const bodyMap = {
    suit: {
      type: 'suit' as const,
      name: 'Juggernaut Suit',
      maxHealth: 135, // Armored but vulnerable to heavy blows
      moveSpeed: 210, // Slower
    },
    hoodie: {
      type: 'hoodie' as const,
      name: 'Streetwear Operative',
      maxHealth: 100, // Balanced arcade standard
      moveSpeed: 240,
    },
    naked: {
      type: 'naked' as const,
      name: 'Aerodynamic Striker',
      maxHealth: 75, // High agility, low margin for error
      moveSpeed: 290, // Fast
    },
    default: {
      type: 'default' as const,
      name: 'Standard Combat Chog',
      maxHealth: 100,
      moveSpeed: 240,
    },
  };

  // Aura (Global Chaos Modifier)
  const chaosMap = {
    flame: {
      name: 'Solar Flare Meteors',
      key: 'flame' as const,
      description: 'Periodic falling meteor hazards with telegraph indicators.',
      intervalSeconds: 6,
    },
    glitch: {
      name: 'Reality Distortion',
      key: 'glitch' as const,
      description: 'Intermittent synaptic glitch reversing player steering for 2 seconds.',
      intervalSeconds: 12,
    },
    gold: {
      name: 'Midas Bounty',
      key: 'gold' as const,
      description: 'Golden arcade aura granting a +50% score boost!',
      intervalSeconds: 0,
    },
    default: {
      name: 'Harmonic Equilibrium',
      key: 'default' as const,
      description: 'Stable atmospheric conditions. Pure arcade skill.',
      intervalSeconds: 0,
    },
  };

  // Tier (Equal High Stage Challenge + NFT Combat & Reward Advantage)
  const tierMap = {
    common: {
      tier: 'common' as const,
      difficultyMultiplier: 1.0, // Standardized high arcade swarm difficulty for everyone
      scoreMultiplier: 1.0,
      playerDamageMultiplier: 1.0,
      playerCritBonus: 0.0,
      playerShieldBonus: 0,
      label: 'Common (Baseline Gear • 1.0x Rewards)',
    },
    rare: {
      tier: 'rare' as const,
      difficultyMultiplier: 1.0,
      scoreMultiplier: 1.6,
      playerDamageMultiplier: 1.25,
      playerCritBonus: 0.08,
      playerShieldBonus: 20,
      label: 'Rare (+25% DMG • +20 Shield • 1.6x Rewards)',
    },
    epic: {
      tier: 'epic' as const,
      difficultyMultiplier: 1.0,
      scoreMultiplier: 2.4,
      playerDamageMultiplier: 1.50,
      playerCritBonus: 0.16,
      playerShieldBonus: 45,
      label: 'Epic (+50% DMG • +45 Shield • 2.4x Rewards)',
    },
    legendary: {
      tier: 'legendary' as const,
      difficultyMultiplier: 1.0,
      scoreMultiplier: 3.8,
      playerDamageMultiplier: 1.80,
      playerCritBonus: 0.25,
      playerShieldBonus: 75,
      label: 'Legendary (+80% Overcharged DMG • +75 Shield • 3.8x Rewards)',
    },
  };

  // Daily Dream Modifiers
  let dailyMod = {
    active: false,
    dateKey,
    modifierName: 'Standard Reality',
    enemySpeedMultiplier: 1.0,
    spawnRateMultiplier: 1.0,
  };

  if (dailyDreamEnabled) {
    const dailyRng = new SeededRandom(seed ^ 0xabcdef);
    const modifiers = [
      { name: 'Overcharged Horde', speed: 1.2, spawn: 1.25 },
      { name: 'Sluggish Swarm', speed: 0.85, spawn: 1.4 },
      { name: 'Hyper Velocity Dream', speed: 1.35, spawn: 1.0 },
      { name: 'Bounty Cascade', speed: 1.1, spawn: 1.15 },
    ];
    const picked = dailyRng.pick(modifiers);
    dailyMod = {
      active: true,
      dateKey,
      modifierName: picked.name,
      enemySpeedMultiplier: picked.speed,
      spawnRateMultiplier: picked.spawn,
    };
  }

  const selectedTier = tierMap[tierType] || tierMap.common;
  const auraBonusScore = auraType === 'gold' ? 1.5 : 1.0;
  const selectedAbility = abilityMap[headType] || abilityMap.default;

  const signatureSkill = {
    name: chog.signatureSkillName || selectedAbility.name,
    description: chog.signatureSkillDesc || selectedAbility.description,
    icon: selectedAbility.icon,
    cooldownSeconds: selectedAbility.cooldownSeconds,
  };

  return {
    seed,
    tokenId: chog.tokenId,
    signatureSkill,
    biome: biomeMap[biomeType] || biomeMap.default,
    targeting: targetingMap[eyesType] || targetingMap.default,
    attack: attackMap[mouthType] || attackMap.default,
    ability: selectedAbility,
    archetype: bodyMap[bodyType] || bodyMap.default,
    chaos: chaosMap[auraType] || chaosMap.default,
    difficulty: {
      tier: selectedTier.tier,
      difficultyMultiplier: selectedTier.difficultyMultiplier * dailyMod.enemySpeedMultiplier,
      scoreMultiplier: Math.round(selectedTier.scoreMultiplier * auraBonusScore * 100) / 100,
      playerDamageMultiplier: selectedTier.playerDamageMultiplier,
      playerCritBonus: selectedTier.playerCritBonus,
      playerShieldBonus: selectedTier.playerShieldBonus,
      label: selectedTier.label,
    },
    dailyDream: dailyMod,
  };
}
