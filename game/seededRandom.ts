/**
 * Seeded Pseudo-Random Number Generator (PRNG)
 * Uses Mulberry32 algorithm for ultra-fast, robust, 32-bit deterministic randomness.
 * Guarantees that given the exact same seed, the random sequence is identical across any machine.
 */
export class SeededRandom {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  /**
   * Returns a float in [0, 1)
   */
  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Returns an integer between min (inclusive) and max (inclusive)
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Returns a float between min and max
   */
  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }

  /**
   * Returns a random element from an array
   */
  pick<T>(array: T[]): T {
    if (array.length === 0) {
      throw new Error('Cannot pick from empty array');
    }
    const index = Math.floor(this.next() * array.length);
    return array[index];
  }
}

/**
 * Creates a 32-bit integer seed from a string using Jenkins/DJB2-like hashing.
 */
export function hashStringToSeed(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Derives a deterministic seed from Chog token ID and traits.
 */
export function deriveSeedFromChog(
  tokenId: number,
  traits: Record<string, string>,
  dailyDreamDate?: string
): number {
  const normalizedTraits = Object.entries(traits)
    .sort(([k1], [k2]) => k1.localeCompare(k2))
    .map(([k, v]) => `${k.toLowerCase()}:${(v || '').trim().toLowerCase()}`)
    .join('|');

  const payload = `token:${tokenId}|traits:${normalizedTraits}${
    dailyDreamDate ? `|daily:${dailyDreamDate}` : ''
  }`;

  return hashStringToSeed(payload);
}
