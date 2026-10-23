import { Chog, ChogTraits } from '@/types/chog';
import { DEMO_CHOGS, generateChogSvg } from './demoChogs';
import { SeededRandom } from '@/game/seededRandom';
import { getCartridgeBattery } from './web3/batteryStorage';

export interface ChogProvider {
  getChog(tokenId: number): Promise<Chog>;
  getDemoChogs(): Chog[];
}

/**
 * Procedurally generates a deterministic fallback Chog for any token ID (1 to 1969 or beyond)
 * so that every valid integer token ID produces a unique, consistent, repeatable Chog cartridge.
 */
export function generateProceduralChog(tokenId: number, isFallback = true): Chog {
  const rng = new SeededRandom(tokenId * 7919);

  const backgrounds = ['Space Cosmos', 'Toxic Swamp', 'Neon Cyber', 'Ice Permafrost', 'Arena Arena'];
  const eyes = ['Laser Visor', 'Hypno Spiral', 'Precision Glasses', 'Standard Gaze'];
  const mouths = ['Grin Spread', 'Sharp Fang', 'Calm Blast', 'Standard Dual'];
  const heads = ['Crown', 'Hood Phase', 'Helmet Shockwave', 'Nano Stim'];
  const bodies = ['Suit Heavy', 'Hoodie Balanced', 'Naked Striker'];
  const auras = ['Flame Meteor', 'Glitch Distortion', 'Gold Midas', 'None'];
  const tiers = ['Common', 'Rare', 'Epic', 'Legendary'];

  const bg = rng.pick(backgrounds);
  const eye = rng.pick(eyes);
  const mouth = rng.pick(mouths);
  const head = rng.pick(heads);
  const body = rng.pick(bodies);
  const aura = rng.pick(auras);
  const tier = rng.pick(tiers);

  const colorPalettes: [string, string][] = [
    ['#09071c', '#2e1065'],
    ['#061923', '#083344'],
    ['#130722', '#581c87'],
    ['#14532d', '#052e16'],
    ['#1c1917', '#44403c'],
  ];
  const bgColors = rng.pick(colorPalettes);

  const skinColors = ['#22c55e', '#38bdf8', '#a855f7', '#f43f5e', '#eab308', '#ec4899'];
  const skin = rng.pick(skinColors);

  const eyeAccessories: ('laser' | 'hypno' | 'glasses' | 'default')[] = [
    eye.toLowerCase().includes('laser') ? 'laser' :
    eye.toLowerCase().includes('hypno') ? 'hypno' :
    eye.toLowerCase().includes('glass') ? 'glasses' : 'default',
  ];
  const headAccessories: ('crown' | 'hood' | 'helmet' | 'default')[] = [
    head.toLowerCase().includes('crown') ? 'crown' :
    head.toLowerCase().includes('hood') ? 'hood' :
    head.toLowerCase().includes('helmet') ? 'helmet' : 'default',
  ];
  const mouthTypes: ('grin' | 'sharp' | 'calm' | 'default')[] = [
    mouth.toLowerCase().includes('grin') ? 'grin' :
    mouth.toLowerCase().includes('sharp') ? 'sharp' :
    mouth.toLowerCase().includes('calm') ? 'calm' : 'default',
  ];
  const auraTypes: ('flame' | 'glitch' | 'gold' | 'default')[] = [
    aura.toLowerCase().includes('flame') ? 'flame' :
    aura.toLowerCase().includes('glitch') ? 'glitch' :
    aura.toLowerCase().includes('gold') ? 'gold' : 'default',
  ];

  const svg = generateChogSvg(
    tokenId,
    bgColors,
    skin,
    '#ffffff',
    skin,
    headAccessories[0],
    eyeAccessories[0],
    mouthTypes[0],
    auraTypes[0]
  );

  return {
    tokenId,
    name: `Chog #${tokenId}`,
    description: `Procedural living cartridge derived from Token #${tokenId}.`,
    image: svg,
    traits: {
      background: bg,
      eyes: eye,
      mouth: mouth,
      head: head,
      body: body,
      aura: aura,
      tier: tier,
    },
    isFallback,
    battery: getCartridgeBattery(tokenId),
  };
}

/**
 * Standard Demo Provider providing curated and procedural demo cartridges.
 */
export class DemoChogProvider implements ChogProvider {
  getDemoChogs(): Chog[] {
    return DEMO_CHOGS;
  }

  async getChog(tokenId: number): Promise<Chog> {
    const fixture = DEMO_CHOGS.find((c) => c.tokenId === tokenId);
    if (fixture) {
      return { ...fixture, isFallback: false };
    }
    // Return deterministic procedural Chog
    return generateProceduralChog(tokenId, true);
  }
}

/**
 * Hybrid Live / Fallback Provider.
 * Queries NEXT_PUBLIC_CHOG_METADATA_URL_TEMPLATE if provided,
 * otherwise gracefully falls back to deterministic demo data.
 */
export class HybridChogProvider implements ChogProvider {
  private demoProvider: DemoChogProvider;
  private urlTemplate?: string;

  constructor() {
    this.demoProvider = new DemoChogProvider();
    this.urlTemplate = process.env.NEXT_PUBLIC_CHOG_METADATA_URL_TEMPLATE;
  }

  getDemoChogs(): Chog[] {
    return this.demoProvider.getDemoChogs();
  }

  async getChog(tokenId: number): Promise<Chog> {
    // Check fixtures first for lightning-fast matching
    const fixture = DEMO_CHOGS.find((c) => c.tokenId === tokenId);
    if (fixture && !this.urlTemplate) {
      return { ...fixture, isFallback: false };
    }

    if (this.urlTemplate) {
      try {
        const url = this.urlTemplate.replace('{tokenId}', tokenId.toString());
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          // Extract traits from attributes or standard OpenSea metadata format
          const attributes: Array<{ trait_type: string; value: string | number }> =
            data.attributes || data.traits || [];

          const getTrait = (type: string): string => {
            const attr = attributes.find(
              (a) => a.trait_type.toLowerCase() === type.toLowerCase()
            );
            return attr ? String(attr.value) : 'Default';
          };

          const traits: ChogTraits = {
            background: getTrait('background') || getTrait('bg'),
            eyes: getTrait('eyes'),
            mouth: getTrait('mouth'),
            head: getTrait('head'),
            body: getTrait('body'),
            aura: getTrait('aura'),
            tier: getTrait('tier'),
          };

          return {
            tokenId,
            name: data.name || `Chog #${tokenId}`,
            description: data.description || `Live Chog NFT Cartridge #${tokenId}`,
            image: data.image || fixture?.image || generateProceduralChog(tokenId).image,
            traits,
            isFallback: false,
          };
        }
      } catch (err) {
        // Silently catch and fall back safely as required
        console.warn(`[ChogProvider] Live metadata unavailable for #${tokenId}, using deterministic fallback.`, err);
      }
    }

    // Graceful fallback to fixture or procedural Chog
    if (fixture) {
      return { ...fixture, isFallback: false };
    }
    return generateProceduralChog(tokenId, true);
  }
}

export const defaultChogProvider = new HybridChogProvider();
