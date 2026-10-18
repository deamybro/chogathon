import { describe, it, expect } from 'vitest';
import { deriveGameConfig, parseBiome, parseEyes, parseMouth, parseHead, parseBody, parseAura, parseTier } from '@/game/traitMapping';
import { SeededRandom } from '@/game/seededRandom';
import { Chog } from '@/types/chog';
import { DemoChogProvider } from '@/lib/chogProvider';

describe('CHOG969 — Deterministic Cartridge Engine', () => {
  const sampleChogA: Chog = {
    tokenId: 969,
    name: 'Cyber Chog Prime',
    image: 'data:image/svg+xml,...',
    traits: {
      background: 'Neon Cyber',
      eyes: 'Laser Visor',
      mouth: 'Grin Spread',
      head: 'Crown',
      body: 'Hoodie',
      aura: 'Gold Radiant',
      tier: 'Legendary',
    },
  };

  const sampleChogB: Chog = {
    tokenId: 404,
    name: 'Glitch Void Spectre',
    image: 'data:image/svg+xml,...',
    traits: {
      background: 'Space Cosmos',
      eyes: 'Hypno Spiral',
      mouth: 'Calm Heavy',
      head: 'Hood Phase',
      body: 'Naked Light',
      aura: 'Glitch Warp',
      tier: 'Epic',
    },
  };

  it('same Chog traits + token ID produce identical game configuration', () => {
    const config1 = deriveGameConfig(sampleChogA, false);
    const config2 = deriveGameConfig(sampleChogA, false);

    expect(config1.seed).toBe(config2.seed);
    expect(config1.biome.type).toBe(config2.biome.type);
    expect(config1.attack.pattern).toBe(config2.attack.pattern);
    expect(config1.ability.key).toBe(config2.ability.key);
    expect(config1.archetype.type).toBe(config2.archetype.type);
    expect(config1.chaos.key).toBe(config2.chaos.key);
    expect(config1.difficulty.difficultyMultiplier).toBe(config2.difficulty.difficultyMultiplier);
    expect(config1.signatureSkill.name).toBe(config2.signatureSkill.name);
    expect(config1.signatureSkill.description).toBe(config2.signatureSkill.description);
    expect(config1.signatureSkill.cooldownSeconds).toBe(config2.signatureSkill.cooldownSeconds);
    expect(config1).toEqual(config2);
  });

  it('different token IDs create differing seeded configurations', () => {
    const configA = deriveGameConfig(sampleChogA, false);
    const configB = deriveGameConfig(sampleChogB, false);

    expect(configA.seed).not.toBe(configB.seed);
    expect(configA.tokenId).not.toBe(configB.tokenId);
    expect(configA.biome.type).not.toBe(configB.biome.type);
    expect(configA.attack.pattern).not.toBe(configB.attack.pattern);
    expect(configA.ability.key).not.toBe(configB.ability.key);
    expect(configA.signatureSkill.name).not.toBe(configB.signatureSkill.name);
  });

  it('custom avatar signature skill overrides ability label deterministically', () => {
    const customChog: Chog = {
      ...sampleChogA,
      signatureSkillName: 'Overclocked Cyber Ward',
      signatureSkillDesc: 'Deploys an invulnerable energy matrix reflecting all projectile damage.',
    };
    const config = deriveGameConfig(customChog, false);
    expect(config.signatureSkill.name).toBe('Overclocked Cyber Ward');
    expect(config.signatureSkill.description).toContain('invulnerable energy matrix');
    expect(config.signatureSkill.cooldownSeconds).toBe(14);
  });

  it('unknown or malformed trait values fall back safely to balanced defaults', () => {
    const unknownChog: Chog = {
      tokenId: 888,
      name: 'Mystery Chog',
      image: '',
      traits: {
        background: 'gibberish_xyz_99',
        eyes: 'radioactive_eyeballs',
        mouth: 'invisible_whisper',
        head: 'disco_ball',
        body: 'cybernetic_centaur',
        aura: 'dark_matter_flux',
        tier: 'unranked',
      },
    };

    const config = deriveGameConfig(unknownChog, false);

    expect(config.biome.type).toBe('default');
    expect(config.targeting.type).toBe('default');
    expect(config.attack.pattern).toBe('single');
    expect(config.ability.key).toBe('default');
    expect(config.archetype.type).toBe('default');
    expect(config.chaos.key).toBe('default');
    expect(config.difficulty.tier).toBe('common');
    expect(config.seed).toBeGreaterThan(0);
  });

  it('trait parser functions are case-insensitive and tolerate whitespace', () => {
    expect(parseBiome('  NEON CYBER  ')).toBe('neon');
    expect(parseBiome('SPACE COSMOS')).toBe('space');
    expect(parseBiome('TOXIC SWAMP')).toBe('swamp');
    expect(parseBiome('ICE GLACIER')).toBe('ice');

    expect(parseEyes('LASER BEAM')).toBe('laser');
    expect(parseEyes('Hypno Spiral')).toBe('hypno');
    expect(parseEyes('PRECISION GLASSES')).toBe('glasses');

    expect(parseMouth('GRIN SMILE')).toBe('grin');
    expect(parseMouth('Sharp Fangs')).toBe('sharp');
    expect(parseMouth('CALM PIPE')).toBe('calm');

    expect(parseHead('ROYAL CROWN')).toBe('crown');
    expect(parseHead('Ninja Hood')).toBe('hood');
    expect(parseHead('HELMET SPARTAN')).toBe('helmet');

    expect(parseBody('Heavy Armor Suit')).toBe('suit');
    expect(parseBody('Naked Bare')).toBe('naked');
    expect(parseBody('Streetwear Hoodie')).toBe('hoodie');

    expect(parseAura('Solar Flame')).toBe('flame');
    expect(parseAura('Glitch Void Matrix')).toBe('glitch');
    expect(parseAura('Radiant Gold God')).toBe('gold');

    expect(parseTier('Legendary Mythic')).toBe('legendary');
    expect(parseTier('Epic')).toBe('epic');
    expect(parseTier('Rare')).toBe('rare');
    expect(parseTier('Common')).toBe('common');
  });

  it('daily modifier is stable for the same date/token combination, and differs on different dates', () => {
    const date1 = '2026-10-16';
    const date2 = '2026-10-17';

    const dailyRun1A = deriveGameConfig(sampleChogA, true, date1);
    const dailyRun1B = deriveGameConfig(sampleChogA, true, date1);
    const dailyRun2 = deriveGameConfig(sampleChogA, true, date2);

    expect(dailyRun1A.seed).toBe(dailyRun1B.seed);
    expect(dailyRun1A.dailyDream.modifierName).toBe(dailyRun1B.dailyDream.modifierName);
    expect(dailyRun1A.dailyDream.enemySpeedMultiplier).toBe(dailyRun1B.dailyDream.enemySpeedMultiplier);

    // Different date yields different seed
    expect(dailyRun1A.seed).not.toBe(dailyRun2.seed);
  });

  it('SeededRandom PRNG produces identical reproducible sequence from same seed', () => {
    const seed = 123456789;
    const rng1 = new SeededRandom(seed);
    const rng2 = new SeededRandom(seed);

    const stream1 = Array.from({ length: 10 }, () => rng1.next());
    const stream2 = Array.from({ length: 10 }, () => rng2.next());

    expect(stream1).toEqual(stream2);
    expect(rng1.nextInt(1, 100)).toBe(rng2.nextInt(1, 100));
  });

  it('DemoChogProvider supplies curated fixtures and handles procedural fallback', async () => {
    const provider = new DemoChogProvider();
    const demoChogs = provider.getDemoChogs();

    expect(demoChogs.length).toBeGreaterThanOrEqual(6);

    const chog969 = await provider.getChog(969);
    expect(chog969.tokenId).toBe(969);
    expect(chog969.isFallback).toBe(false);

    // Non-fixture token generates procedural Chog deterministically
    const chog1234 = await provider.getChog(1234);
    expect(chog1234.tokenId).toBe(1234);
    expect(chog1234.isFallback).toBe(true);

    const chog1234Again = await provider.getChog(1234);
    expect(chog1234.traits).toEqual(chog1234Again.traits);
  });
});
