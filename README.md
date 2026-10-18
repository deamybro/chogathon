# CHOG969 — The Living Cartridge Arcade

> **“Your Chog is the cartridge. Plug in any Chog. Survive its dream.”**

CHOG969 transforms Chog NFTs into playable, deterministic 60-second top-down arcade cartridges. An NFT is not merely a cosmetic avatar or a gatekept login key — **the metadata traits plus token ID mathematically generate the game itself**: biome physics, player abilities, weapon spread, hazard timing, enemy wave escalation, and score multipliers.

---

## 🕹️ Solo Judge Instant Demo (Under 60 Seconds)

1. **Visit the Arcade Landing Page (`/`)**:
   - See the three featured cartridges:
     - **#969 (Cyber Chog Prime)**: Neon Biome with hyper-lanes, twin laser beams, Royal Shield, and Midas Gold bonus.
     - **#404 (Glitch Void Spectre)**: Zero-G floaty Space Biome, heavy penetrating plasma, Shadow Warp dash, and Dimensional Glitch hazard.
     - **#77 (Glacial Titan Chog)**: Slick Ice drift, heavy Juggernaut tank armor, precision optic crits, and Titan Shockwave.
2. **Launch Flagship Cartridge #969 (`/play/969`)**:
   - Click **“START RUN (60s)”**.
   - Move with **WASD** or arrow keys (or mobile virtual touch joystick).
   - Aim with your mouse (auto-fires).
   - Press **Spacebar** to trigger the **Aegis Royal Shield** active ability.
   - Survive escalating waves for 60 seconds or defeat swarms for a high score.
3. **Inspect Cabinet Progression & Challenge Copy**:
   - When a run finishes (death or 60s survival), view your survival duration, score, personal best, and **Cabinet Skull Count** progression (*Fresh Cabinet* → *Haunted Cabinet* at 10 skulls → *Legendary Cabinet* at 50 skulls).
   - Click **“COPY CHALLENGE TEXT”** to copy:
     `I survived {seconds}s inside Chog #{tokenId}. Can you beat my cartridge? {url}`
4. **Try Token Browser (`/browse`)**:
   - Input any token ID between **#1 and #1969**.
   - Notice that entering the same token ID always generates the identical level layout, biome, and combat mechanics.

---

## 🔬 Deterministic Trait-to-Gameplay Mapping

| Trait | Category | Gameplay Parameter Impact |
| :--- | :--- | :--- |
| **Background** | Biome & Map Behavior | **Space** (low-gravity floaty inertia) • **Swamp** (viscous sludge slow zones) • **Neon** (hyper-speed overdrive lanes) • **Ice** (slick drift) • **Default** (balanced coliseum) |
| **Eyes** | Targeting & Passive | **Laser** (piercing projectiles) • **Hypno** (inflicts 50% slow on hit) • **Glasses** (+35% critical hit rate & +40% range) • **Default** (balanced standard gaze) |
| **Mouth** | Attack Pattern | **Grin** (3-way spread salvo) • **Sharp** (high fire-rate micro-blaster) • **Calm** (heavy charged penetrating plasma) • **Default** (standard twin blaster) |
| **Head** | Active Ability (Spacebar) | **Crown** (Aegis Invulnerability Shield for 3.5s) • **Hood** (Shadow Phase Dash) • **Helmet** (360° Titan Seismic Shockwave) • **Default** (Emergency Nano-Heal +35 HP) |
| **Body** | Archetype | **Suit** (Juggernaut: 150 HP, -15% speed) • **Hoodie** (Balanced: 100 HP, standard speed) • **Naked/Light** (Scout: 70 HP, +30% speed) |
| **Aura** | Global Chaos Modifier | **Flame** (periodic falling meteor hazards with telegraphs) • **Glitch** (momentary synaptic inverted controls) • **Gold** (+50% Midas score boost) • **None** (clean equilibrium) |
| **Tier** | Difficulty & Multiplier | **Common** (1.0x score) • **Rare** (1.5x score) • **Epic** (2.2x score) • **Legendary** (3.5x score multiplier) |

### 🌟 Inherent Avatar Signature Skills
Every Chog character possesses a unique inherent hero ability derived from its metadata DNA:
- **Cyber Chog Prime (#969)**: *Overclocked Cyber Ward* — Aegis invulnerability reflecting incoming fire.
- **Glitch Void Spectre (#404)**: *Phase Warp Dash* — Quantum micro-teleport with phase damage immunity.
- **Toxic Toad Marauder (#77)**: *Slime Shock Nova* — 360° seismic detonation knocking back swarms.
- **Neon Synth Stalker (#1337)**: *Chrono Phase Shift* — Speed surge with local chronofield enemy slow.
- **Frost Yeti Warden (#42)**: *Cryo Shield Aegis* — High-capacity kinetic absorption barrier.
- **Golden Monarch (#1969)**: *Midas Sovereign Overload* — Blinding golden blast vaporizing foes into bonus gems.

### ⚡ Field Skill Drops & Milestone Boss Encounter
- **6 Droppable Bonus Skills**: Defeating enemy swarms can yield illuminated skill orbs:
  - ⚡ **Tesla Chain Arc** (Chain lightning hits up to 4 targets)
  - 🛡️ **Orbital Deflectors** (Dual energy shields shredding foes on contact)
  - 🚀 **Micro-Missiles** (Homing rocket salvos tracking highest-threat targets)
  - ❄️ **Cryo Blast** (Freezes all on-screen enemies in frost stasis for 2.5s)
  - ⏱️ **Adrenaline Overdrive** (+45% movement speed and +35% fire rate)
  - 🧲 **Graviton Magnet** (Vaccum pulls all distant score gems across the arena)
- **30s Void Colossus Boss**: At the 30-second mark, a giant Void Colossus emerges with a dedicated glowing HUD Boss Health Bar and 10-way radial bullet barrages. Defeating the Colossus yields guaranteed rare skill drops and massive bonus score gems.

### Deterministic Seed Generation
```typescript
seed = hashStringToSeed(`token:${tokenId}|traits:${normalizedSortedTraits}`);
```
A pure **Mulberry32 PRNG** is initialized with this seed. `Math.random()` is strictly bypassed for all level spawning, wave timing, and hazard intervals, ensuring 100% deterministic reproducibility.

---

## 🛠️ Tech Stack & Architecture

- **Framework**: Next.js 16 (App Router, Turbopack, Partial Prerendering)
- **Language**: TypeScript (strict types for all Chog metadata, traits, and game configurations)
- **Styling**: Tailwind CSS (dark arcade cabinet aesthetic, scanlines, CRT glow, accessible contrast)
- **Game Engine**: Phaser 3 (top-down 2D canvas, Arcade physics, procedural particle systems)
- **Audio**: Web Audio API procedural synthesizer (8-bit chiptune laser, explosion, ability, warning, and fanfare sounds without external audio assets)
- **Unit Testing**: Vitest (7 comprehensive determinism and trait mapping tests)
- **Persistence**: `localStorage` (personal best scores, failed run Skull Counts, cabinet milestones)

---

## ⚙️ Configuration & Live Metadata Provider

The app includes an enterprise-grade `HybridChogProvider` that seamlessly falls back to procedural cartridges if no live metadata is supplied or if network calls fail.

To connect live on-chain/IPFS/HTTP Chog metadata:
Create or edit `.env.local`:
```bash
NEXT_PUBLIC_CHOG_METADATA_URL_TEMPLATE="https://api.example.com/metadata/{tokenId}.json"
```
The provider substitutes `{tokenId}` and maps attributes into canonical traits. If remote artwork or metadata fails, it falls back gracefully with a visible **“Demo cartridge”** badge, never crashing the game.

---

## 🚀 Installation & Commands

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Deterministic Unit Tests
```bash
npm run test
```

### 3. Run Linter
```bash
npm run lint
```

### 4. Build for Production
```bash
npm run build
```

### 5. Start Production Server
```bash
npm run start
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🏆 Hackathon Compliance Checklist

- [x] Full solo playability without wallet connection, gas, or transaction delays
- [x] Zero gambling, staking, paid entry, or financial loops
- [x] 4 complete routes: `/`, `/play/[tokenId]`, `/browse`, `/about`
- [x] 6 curated high-variety fixture Chogs + infinite deterministic generator for tokens #1–#1969
- [x] Escalating 60-second top-down survival game in Phaser 3
- [x] Pure deterministic Mulberry32 PRNG
- [x] Daily Dream date-based modifier toggle
- [x] Cabinet Skull Count progression (Fresh → Haunted → Legendary)
- [x] Mobile virtual joystick and touch ability controls
- [x] Web Audio retro sound synthesizer with toggle
- [x] 100% green tests, clean lint, and production build pass
