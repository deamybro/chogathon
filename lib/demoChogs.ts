import { Chog } from '@/types/chog';

/**
 * Procedural SVG generator for stylish pixel-art arcade Chog avatars.
 * Ensures instant, zero-latency, 100% offline-reliable rendering for any Chog.
 */
export function generateChogSvg(
  tokenId: number,
  bgColors: [string, string],
  skinColor: string,
  eyeColor: string,
  accentColor: string,
  accessory: 'crown' | 'hood' | 'helmet' | 'default',
  eyes: 'laser' | 'hypno' | 'glasses' | 'default',
  mouth: 'grin' | 'sharp' | 'calm' | 'default',
  aura: 'flame' | 'glitch' | 'gold' | 'default'
): string {
  // SVG markup
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <linearGradient id="bg-${tokenId}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${bgColors[0]}"/>
      <stop offset="100%" stop-color="${bgColors[1]}"/>
    </linearGradient>
    <filter id="glow-${tokenId}" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background -->
  <rect width="200" height="200" fill="url(#bg-${tokenId})"/>
  <rect width="192" height="192" x="4" y="4" fill="none" stroke="${accentColor}" stroke-width="2" stroke-opacity="0.4" stroke-dasharray="4,4"/>

  <!-- Aura effects -->
  ${
    aura === 'flame'
      ? `<circle cx="100" cy="100" r="75" fill="none" stroke="#f97316" stroke-width="4" opacity="0.6" stroke-dasharray="8,6" filter="url(#glow-${tokenId})"/>`
      : aura === 'glitch'
      ? `<rect x="25" y="45" width="150" height="110" fill="none" stroke="#a855f7" stroke-width="2" opacity="0.5"/>
         <line x1="20" y1="90" x2="180" y2="90" stroke="#06b6d4" stroke-width="2" opacity="0.7"/>`
      : aura === 'gold'
      ? `<circle cx="100" cy="100" r="82" fill="none" stroke="#eab308" stroke-width="5" opacity="0.7" filter="url(#glow-${tokenId})"/>`
      : ''
  }

  <!-- Body -->
  <rect x="50" y="125" width="100" height="60" rx="16" fill="${skinColor}" />
  <!-- Underbelly / Clothing -->
  <rect x="70" y="140" width="60" height="45" rx="8" fill="${accentColor}" opacity="0.85" />

  <!-- Head Base -->
  <rect x="42" y="48" width="116" height="88" rx="28" fill="${skinColor}" filter="drop-shadow(0 4px 10px rgba(0,0,0,0.5))"/>

  <!-- Cheeks -->
  <circle cx="56" cy="106" r="8" fill="#f43f5e" opacity="0.5" />
  <circle cx="144" cy="106" r="8" fill="#f43f5e" opacity="0.5" />

  <!-- Head Accessory -->
  ${
    accessory === 'crown'
      ? `<!-- Crown -->
         <path d="M60 46 L75 22 L100 36 L125 22 L140 46 Z" fill="#eab308" stroke="#ca8a04" stroke-width="2" filter="url(#glow-${tokenId})"/>
         <circle cx="75" cy="22" r="3" fill="#ef4444"/>
         <circle cx="100" cy="36" r="3" fill="#3b82f6"/>
         <circle cx="125" cy="22" r="3" fill="#10b981"/>`
      : accessory === 'hood'
      ? `<!-- Hood -->
         <path d="M38 52 C45 15, 155 15, 162 52 L162 90 L148 90 L148 55 C140 38, 60 38, 52 55 L52 90 L38 90 Z" fill="#1e293b" stroke="#0f172a" stroke-width="2"/>`
      : accessory === 'helmet'
      ? `<!-- Spartan / Mech Helmet -->
         <rect x="40" y="32" width="120" height="24" rx="8" fill="#475569" stroke="#64748b" stroke-width="2"/>
         <line x1="100" y1="12" x2="100" y2="32" stroke="#ef4444" stroke-width="6" stroke-linecap="round"/>`
      : `<!-- Cute Antennas / Default Horns -->
         <circle cx="65" cy="38" r="7" fill="${accentColor}"/>
         <circle cx="135" cy="38" r="7" fill="${accentColor}"/>`
  }

  <!-- Eyes -->
  ${
    eyes === 'laser'
      ? `<!-- Laser Eyes -->
         <rect x="62" y="70" width="30" height="14" rx="7" fill="#ef4444" filter="url(#glow-${tokenId})"/>
         <rect x="108" y="70" width="30" height="14" rx="7" fill="#ef4444" filter="url(#glow-${tokenId})"/>
         <line x1="62" y1="77" x2="138" y2="77" stroke="#fee2e2" stroke-width="3"/>`
      : eyes === 'hypno'
      ? `<!-- Hypno Eyes -->
         <circle cx="76" cy="78" r="14" fill="#ffffff"/>
         <circle cx="124" cy="78" r="14" fill="#ffffff"/>
         <circle cx="76" cy="78" r="10" fill="none" stroke="#8b5cf6" stroke-width="3"/>
         <circle cx="124" cy="78" r="10" fill="none" stroke="#8b5cf6" stroke-width="3"/>
         <circle cx="76" cy="78" r="4" fill="#6d28d9"/>
         <circle cx="124" cy="78" r="4" fill="#6d28d9"/>`
      : eyes === 'glasses'
      ? `<!-- Pixel Shades / Glasses -->
         <rect x="56" y="68" width="38" height="20" rx="4" fill="#0f172a" stroke="#22d3ee" stroke-width="2"/>
         <rect x="106" y="68" width="38" height="20" rx="4" fill="#0f172a" stroke="#22d3ee" stroke-width="2"/>
         <line x1="94" y1="78" x2="106" y2="78" stroke="#22d3ee" stroke-width="3"/>
         <line x1="62" y1="72" x2="88" y2="72" stroke="#67e8f9" stroke-width="2"/>`
      : `<!-- Standard Big Chog Eyes -->
         <ellipse cx="74" cy="78" rx="13" ry="15" fill="#ffffff"/>
         <ellipse cx="126" cy="78" rx="13" ry="15" fill="#ffffff"/>
         <circle cx="77" cy="76" r="7" fill="${eyeColor}"/>
         <circle cx="123" cy="76" r="7" fill="${eyeColor}"/>
         <circle cx="79" cy="74" r="3" fill="#ffffff"/>
         <circle cx="125" cy="74" r="3" fill="#ffffff"/>`
  }

  <!-- Mouth -->
  ${
    mouth === 'grin'
      ? `<!-- Broad Tooth Grin -->
         <path d="M72 108 Q100 130 128 108 Z" fill="#ffffff" stroke="#0f172a" stroke-width="2"/>
         <line x1="86" y1="112" x2="86" y2="120" stroke="#0f172a" stroke-width="2"/>
         <line x1="100" y1="114" x2="100" y2="122" stroke="#0f172a" stroke-width="2"/>
         <line x1="114" y1="112" x2="114" y2="120" stroke="#0f172a" stroke-width="2"/>`
      : mouth === 'sharp'
      ? `<!-- Sharp Fang Mouth -->
         <path d="M75 110 Q100 126 125 110" fill="none" stroke="#0f172a" stroke-width="3"/>
         <polygon points="86,111 92,121 98,112" fill="#ffffff"/>
         <polygon points="102,112 108,121 114,111" fill="#ffffff"/>`
      : mouth === 'calm'
      ? `<!-- Chill Calm Pipe/Smile -->
         <path d="M82 114 Q100 122 118 114" fill="none" stroke="#0f172a" stroke-width="3" stroke-linecap="round"/>`
      : `<!-- Classic Chog Smile -->
         <path d="M80 110 Q100 124 120 110" fill="none" stroke="#0f172a" stroke-width="3" stroke-linecap="round"/>`
  }

  <!-- Token ID Badge in corner -->
  <rect x="8" y="8" width="56" height="20" rx="4" fill="#000000" fill-opacity="0.75" stroke="${accentColor}" stroke-width="1"/>
  <text x="36" y="22" font-family="monospace" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="middle">#${tokenId}</text>
</svg>
  `.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * 6 Curated, visually and mechanically distinct fixture Chogs.
 */
export const DEMO_CHOGS: Chog[] = [
  {
    tokenId: 969,
    name: 'Cyber Chog Prime',
    description: 'The flagship cartridge: high-speed neon hypergrid with piercing laser beams and invulnerable royal shield.',
    image: generateChogSvg(
      969,
      ['#130722', '#3b0764'],
      '#22c55e',
      '#06b6d4',
      '#ec4899',
      'crown',
      'laser',
      'grin',
      'gold'
    ),
    traits: {
      background: 'Neon Cyber',
      eyes: 'Laser Visor',
      mouth: 'Grin Spread',
      head: 'Crown',
      body: 'Hoodie',
      aura: 'Gold Radiant',
      tier: 'Legendary',
    },
    signatureSkillName: 'Aegis Prime Shield',
    signatureSkillDesc: 'Invulnerable golden barrier that deflects oncoming projectiles and shocks nearby foes',
  },
  {
    tokenId: 404,
    name: 'Glitch Void Spectre',
    description: 'Born from corrupt memory sectors in deep zero-g space with erratic dimensional warping hazards.',
    image: generateChogSvg(
      404,
      ['#09071c', '#1e1b4b'],
      '#8b5cf6',
      '#f43f5e',
      '#a855f7',
      'hood',
      'hypno',
      'calm',
      'glitch'
    ),
    traits: {
      background: 'Space Cosmos',
      eyes: 'Hypno Spiral',
      mouth: 'Calm Heavy',
      head: 'Hood Phase',
      body: 'Naked Light',
      aura: 'Glitch Warp',
      tier: 'Epic',
    },
    signatureSkillName: 'Void Phase Singularity',
    signatureSkillDesc: 'Teleports forward through space, phased out of danger while ripping open a vacuum',
  },
  {
    tokenId: 77,
    name: 'Glacial Titan Chog',
    description: 'Heavy armor juggernaut sliding across slick permafrost with seismic shockwaves.',
    image: generateChogSvg(
      77,
      ['#061923', '#0e7490'],
      '#38bdf8',
      '#10b981',
      '#06b6d4',
      'helmet',
      'glasses',
      'calm',
      'default'
    ),
    traits: {
      background: 'Ice Permafrost',
      eyes: 'Precision Glasses',
      mouth: 'Calm Blast',
      head: 'Helmet Shockwave',
      body: 'Suit Armor',
      aura: 'None',
      tier: 'Rare',
    },
    signatureSkillName: 'Glacial Seismic Stomp',
    signatureSkillDesc: 'Slams the permafrost, unleashing a crushing 360° frost shockwave',
  },
  {
    tokenId: 1337,
    name: 'Solar Fang Berzerker',
    description: 'Infernal swamp stalker raining meteor flares while tearing through swarms with rapid fang fire.',
    image: generateChogSvg(
      1337,
      ['#1c1917', '#7c2d12'],
      '#ea580c',
      '#facc15',
      '#f97316',
      'hood',
      'laser',
      'sharp',
      'flame'
    ),
    traits: {
      background: 'Toxic Swamp',
      eyes: 'Laser Beam',
      mouth: 'Sharp Fang',
      head: 'Hood Dash',
      body: 'Naked Light',
      aura: 'Flame Meteor',
      tier: 'Legendary',
    },
    signatureSkillName: 'Solar Flare Rampage',
    signatureSkillDesc: 'Ignites adrenaline thrusters, doubling movement and bullet speed with fire trails',
  },
  {
    tokenId: 42,
    name: 'Synthesized Cadet',
    description: 'A finely balanced neon scout equipped with tactical emergency healing and wide tooth spread fire.',
    image: generateChogSvg(
      42,
      ['#0f172a', '#1e293b'],
      '#10b981',
      '#38bdf8',
      '#22c55e',
      'default',
      'glasses',
      'grin',
      'default'
    ),
    traits: {
      background: 'Neon Lanes',
      eyes: 'Glasses Visor',
      mouth: 'Grin Triple',
      head: 'Nano Stim',
      body: 'Hoodie Balanced',
      aura: 'None',
      tier: 'Common',
    },
    signatureSkillName: 'Emergency Nano-Regen',
    signatureSkillDesc: 'Injects instant battlefield nano-repair stims recovering vitality on command',
  },
  {
    tokenId: 1969,
    name: 'Omega Sovereign Chog',
    description: 'The final cartridge in the 1969 collection. Sovereign crown, piercing laser gaze, and extreme Midas bounty.',
    image: generateChogSvg(
      1969,
      ['#18181b', '#854d0e'],
      '#eab308',
      '#ef4444',
      '#facc15',
      'crown',
      'laser',
      'sharp',
      'gold'
    ),
    traits: {
      background: 'Cosmic Space',
      eyes: 'Laser Piercing',
      mouth: 'Sharp Rapid',
      head: 'Crown Shield',
      body: 'Suit Juggernaut',
      aura: 'Gold Midas',
      tier: 'Legendary',
    },
    signatureSkillName: 'Midas Sovereign Overload',
    signatureSkillDesc: 'Emits a blinding golden supernova that vaporizes minor foes and awards bonus gems',
  },
];
