import Phaser from 'phaser';
import { GameConfig, RunResults, BonusSkillType, ActiveBonusSkill } from '@/types/chog';
import { SeededRandom } from './seededRandom';
import { soundSynth } from './soundEffects';

export interface GameCallbacks {
  onHpUpdate: (hp: number, maxHp: number) => void;
  onScoreUpdate: (score: number) => void;
  onTimeUpdate: (secondsRemaining: number) => void;
  onAbilityState: (cooldownSeconds: number, isReady: boolean) => void;
  onEssenceUpdate?: (current: number, max: number, isReady: boolean, isActive: boolean) => void;
  onBonusSkillsUpdate?: (skills: ActiveBonusSkill[]) => void;
  onPowerupPicked?: (name: string, description: string, color: string, icon: string) => void;
  onBossHpUpdate?: (
    bossName: string | null,
    currentHp: number,
    maxHp: number,
    currentShield?: number,
    maxShield?: number
  ) => void;
  onComboAlert?: (text: string) => void;
  onOverclockUpdate?: (level: number, currentExp: number, nextExp: number) => void;
  onGameOver: (results: RunResults) => void;
  onVictory: (results: RunResults) => void;
  onChaosAlert: (message: string) => void;
  onGameStart?: () => void;
  onLevelUpdate?: (currentLevel: number, totalLevels: number, levelName: string, timeInLevel: number) => void;
  onAutoAimStatus?: (enabled: boolean, isScrambled: boolean) => void;
}

interface Projectile {
  sprite: Phaser.GameObjects.Arc | Phaser.GameObjects.Rectangle;
  vx: number;
  vy: number;
  damage: number;
  piercing: boolean;
  slowOnHit: boolean;
  crit: boolean;
  life: number;
  maxLife: number;
  hitsLeft: number;
  chain?: boolean;
  explosive?: boolean;
}

interface Enemy {
  sprite: Phaser.GameObjects.Container;
  type: 'drone' | 'wasp' | 'brute' | 'boss' | 'subboss_stalker' | 'subboss_siege';
  hp: number;
  maxHp: number;
  shield?: number;
  maxShield?: number;
  shieldSprite?: Phaser.GameObjects.Arc;
  speed: number;
  scoreValue: number;
  slowTimer: number;
  frozenTimer: number;
  isBoss?: boolean;
  isSubBoss?: boolean;
  bossSkillTimer?: number;
  cheatSkillTimer?: number;
  cheatSkillTimer2?: number;
  bossName?: string;
}

interface Hazard {
  circle: Phaser.GameObjects.Arc;
  timer: number;
  x: number;
  y: number;
  radius: number;
}

interface SkillPickup {
  container: Phaser.GameObjects.Container;
  type: BonusSkillType;
  x: number;
  y: number;
  meta: { name: string; icon: string; description: string; duration: number; color: number; hex: string };
}

interface GemPickup {
  sprite: Phaser.GameObjects.Arc;
  x: number;
  y: number;
  value: number;
}

interface OrbitalOrb {
  sprite: Phaser.GameObjects.Arc;
  angle: number;
}

const BONUS_SKILL_META: Record<
  BonusSkillType,
  { name: string; icon: string; description: string; duration: number; color: number; hex: string }
> = {
  hyper_firerate: {
    name: 'Hyper Overdrive',
    icon: 'Zap',
    description: 'Blaster fire rate surges by +80% rapid-fire',
    duration: 10,
    color: 0xf59e0b,
    hex: '#f59e0b',
  },
  orbital_shield: {
    name: 'Aegis Deflectors',
    icon: 'Shield',
    description: 'Dual kinetic barrier spheres orbit and shred enemies on contact',
    duration: 14,
    color: 0x22c55e,
    hex: '#22c55e',
  },
  nuke_bomb: {
    name: 'Tactical Nuke',
    icon: 'Bomb',
    description: 'Instant screen-wide seismic shockwave obliterating minor swarms',
    duration: 0,
    color: 0xef4444,
    hex: '#ef4444',
  },
  cryo_blast: {
    name: 'Sub-Zero Stasis',
    icon: 'Snowflake',
    description: 'Cryogenic blast freezes all active hostiles in absolute zero for 4s',
    duration: 4,
    color: 0x06b6d4,
    hex: '#06b6d4',
  },
  homing_missiles: {
    name: 'Micro-Missile Salvo',
    icon: 'Rocket',
    description: 'Launches swarms of seeking heat-guided micro-rockets at priority targets',
    duration: 12,
    color: 0xf43f5e,
    hex: '#f43f5e',
  },
  chain_lightning: {
    name: 'Tesla Arc Storm',
    icon: 'CloudLightning',
    description: 'Projectiles discharge high-voltage lightning jumping across 4 targets',
    duration: 12,
    color: 0x38bdf8,
    hex: '#38bdf8',
  },
  speed_warp: {
    name: 'Chrono Speed Warp',
    icon: 'FastForward',
    description: 'Hyper-accelerates player movement by +70% leaving phase light trails',
    duration: 10,
    color: 0xa855f7,
    hex: '#a855f7',
  },
  vampire_heal: {
    name: 'Vampiric Leech',
    icon: 'Heart',
    description: 'Instantly recovers 35 HP plus drains health from enemy hits',
    duration: 8,
    color: 0xec4899,
    hex: '#ec4899',
  },
  midas_jackpot: {
    name: 'Midas Gold Rush',
    icon: 'Coins',
    description: 'Doubles all score gains and spawns radiant golden gem clusters',
    duration: 10,
    color: 0xeab308,
    hex: '#eab308',
  },
  magnet_overdrive: {
    name: 'Graviton Siphon',
    icon: 'Magnet',
    description: 'Creates a colossal gravitational vortex pulling all gems to player',
    duration: 12,
    color: 0x8b5cf6,
    hex: '#8b5cf6',
  },
};

export class ChogScene extends Phaser.Scene {
  private configData!: GameConfig;
  private callbacks!: GameCallbacks;
  private rng!: SeededRandom;

  // Player state
  private playerContainer!: Phaser.GameObjects.Container;
  private playerShieldGlow!: Phaser.GameObjects.Arc;
  private hp!: number;
  private maxHp!: number;
  private vx = 0;
  private vy = 0;
  private aimAngle = 0;
  private lastFireTime = 0;
  private abilityTimer = 0;
  private abilityActiveDuration = 0;
  private isShielded = false;
  private controlsInverted = false;
  private controlsInversionTimer = 0;
  private chaosTimer = 0;

  // Active Bonus Skills state
  private activeBonusSkills: Map<BonusSkillType, { remaining: number; maxDuration: number }> = new Map();
  private orbitalOrbs: OrbitalOrb[] = [];
  private orbitalContainer!: Phaser.GameObjects.Container;
  private missileTimer = 0;
  private cryoTimer = 0;

  // Essence / Mana & Avatar Signature Ultimate state
  private essence = 0;
  private maxEssence = 100;
  private isUltimateReady = false;
  private isUltimateActive = false;
  private ultimateDurationTimer = 0;
  private ultimateMaxDuration = 6.0;
  private ultimateBeamGraphics!: Phaser.GameObjects.Graphics;
  private lastReportedEssence = -1;
  private lastReportedUltimateReady = false;
  private lastReportedUltimateActive = false;

  // Redesigned Twin Cannon Barrels state
  private fireBarrelToggle = false;
  private barrelLeft!: Phaser.GameObjects.Rectangle;
  private barrelRight!: Phaser.GameObjects.Rectangle;
  private muzzleFlashLeft!: Phaser.GameObjects.Arc;
  private muzzleFlashRight!: Phaser.GameObjects.Arc;

  // Combos & Tracking
  private score = 0;
  private enemiesDefeated = 0;
  private bossesDefeated = 0;
  private skillsCollected = 0;
  private timeRemaining = 45;
  private isFinished = false;
  private isGameStarted = false;
  private isPaused = false;
  private comboStreak = 0;
  private lastKillTime = 0;

  // Multi-Level Sector Progression state
  private currentLevel = 1;
  private totalLevels = 3;
  private levelTimeRemaining = 60;
  private totalSurvivedSeconds = 0;
  private readonly levelNames = [
    'Sector Alpha: Incursion',
    'Sector Beta: Overcharge',
    'Sector Omega: Dreadnought Core',
  ];
  private subBoss1Spawned = false;
  private subBoss2Spawned = false;
  private mainBossSpawned = false;
  private bossSupernovaTimer = 0;

  // Auto-Aim & Targeting Scrambler EMP state
  private autoAimEnabled = true;
  private isAimScrambled = false;
  private scrambleTimer = 0;

  // Boss state
  private activeBoss: Enemy | null = null;
  private bossSpawned = false;

  // In-run Overclock Evolution state
  private overclockLevel = 1;
  private overclockExp = 0;
  private nextOverclockExp = 250;
  private hyperSurgeTriggered = false;
  private muzzleFlash!: Phaser.GameObjects.Arc;
  private overclockAura!: Phaser.GameObjects.Arc;

  // Pools / Lists
  private projectiles: Projectile[] = [];
  private enemies: Enemy[] = [];
  private hazards: Hazard[] = [];
  private particles: Phaser.GameObjects.Arc[] = [];
  private skillPickups: SkillPickup[] = [];
  private gems: GemPickup[] = [];

  // Keys
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyW!: Phaser.Input.Keyboard.Key;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyS!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private keySpace!: Phaser.Input.Keyboard.Key;
  private keyF!: Phaser.Input.Keyboard.Key;
  private keyT!: Phaser.Input.Keyboard.Key;
  private keyP!: Phaser.Input.Keyboard.Key;
  private keyR!: Phaser.Input.Keyboard.Key;

  // Touch virtual inputs
  private touchMoveX = 0;
  private touchMoveY = 0;
  private isTouchAiming = false;
  private touchAimX = 0;
  private touchAimY = 0;

  // Callback throttling to prevent 60fps React render choke
  private lastReportedTime = -1;
  private lastReportedAbilityCooldown = -1;
  private lastReportedAbilityReady = true;

  constructor() {
    super({ key: 'ChogScene' });
  }

  init(data?: { config?: GameConfig; callbacks?: GameCallbacks }) {
    if (!data || !data.config || !data.callbacks) return;
    this.configData = data.config;
    this.callbacks = data.callbacks;
    this.rng = new SeededRandom(this.configData.seed);

    this.lastReportedTime = -1;
    this.lastReportedAbilityCooldown = -1;
    this.lastReportedAbilityReady = true;
    this.lastReportedEssence = -1;
    this.lastReportedUltimateReady = false;
    this.lastReportedUltimateActive = false;

    this.maxHp = this.configData.archetype.maxHealth;
    this.hp = this.maxHp;
    this.score = 0;
    this.enemiesDefeated = 0;
    this.bossesDefeated = 0;
    this.skillsCollected = 0;
    this.timeRemaining = 60;
    this.currentLevel = 1;
    this.levelTimeRemaining = 60;
    this.totalSurvivedSeconds = 0;
    this.subBoss1Spawned = false;
    this.subBoss2Spawned = false;
    this.mainBossSpawned = false;
    this.bossSupernovaTimer = 0;
    this.autoAimEnabled = true;
    this.isAimScrambled = false;
    this.scrambleTimer = 0;
    this.isFinished = false;
    this.isGameStarted = false;
    this.isPaused = false;
    this.abilityTimer = 0;
    this.abilityActiveDuration = 0;
    this.isShielded = false;
    this.controlsInverted = false;
    this.controlsInversionTimer = 0;
    this.chaosTimer = 0;
    this.comboStreak = 0;
    this.lastKillTime = 0;
    this.vx = 0;
    this.vy = 0;
    this.activeBoss = null;
    this.bossSpawned = false;
    this.overclockLevel = 1;
    this.overclockExp = 0;
    this.nextOverclockExp = 250;
    this.hyperSurgeTriggered = false;
    this.essence = 0;
    this.isUltimateReady = false;
    this.isUltimateActive = false;
    this.ultimateDurationTimer = 0;
    this.fireBarrelToggle = false;
    this.activeBonusSkills.clear();
    this.orbitalOrbs = [];
    this.projectiles = [];
    this.enemies = [];
    this.hazards = [];
    this.particles = [];
    this.skillPickups = [];
    this.gems = [];
  }

  create() {
    if (!this.configData) return;
    const { width, height } = this.scale;

    // Arena Background
    this.cameras.main.setBackgroundColor(this.configData.biome.bgColor);

    // Grid lines / Biome decoration
    this.add.grid(
      width / 2,
      height / 2,
      width,
      height,
      40,
      40,
      undefined,
      undefined,
      this.configData.biome.accentColor,
      0.12
    );

    // Biome hazard zones
    if (this.configData.biome.specialZone === 'speed_lanes') {
      for (let i = 0; i < 3; i++) {
        const lane = this.add.rectangle(
          width / 2,
          120 + i * 180,
          width,
          40,
          this.configData.biome.accentColor,
          0.18
        );
        this.tweens.add({
          targets: lane,
          alpha: 0.05,
          duration: 900,
          yoyo: true,
          repeat: -1,
        });
      }
    } else if (this.configData.biome.specialZone === 'slow_patches') {
      for (let i = 0; i < 4; i++) {
        const rx = this.rng.nextInt(100, width - 100);
        const ry = this.rng.nextInt(100, height - 100);
        const sludge = this.add.circle(rx, ry, 55, 0x10b981, 0.22);
        this.tweens.add({
          targets: sludge,
          scale: 1.15,
          duration: 1500 + i * 300,
          yoyo: true,
          repeat: -1,
        });
      }
    }

    // Ambient Biome Atmospheric FX
    if (this.configData.biome.type === 'space') {
      for (let i = 0; i < 35; i++) {
        const star = this.add.circle(
          this.rng.nextInt(10, width - 10),
          this.rng.nextInt(10, height - 10),
          this.rng.nextInt(1, 2.5),
          0xffffff,
          this.rng.next() * 0.7 + 0.2
        );
        this.tweens.add({
          targets: star,
          alpha: 0.1,
          duration: 1000 + this.rng.nextInt(500, 1500),
          yoyo: true,
          repeat: -1,
        });
      }
    } else if (this.configData.biome.type === 'neon') {
      for (let i = 0; i < 5; i++) {
        const line = this.add.rectangle(
          width / 2,
          this.rng.nextInt(30, height - 30),
          width,
          2,
          0x06b6d4,
          0.15
        );
        this.tweens.add({
          targets: line,
          alpha: 0.03,
          duration: 800 + i * 200,
          yoyo: true,
          repeat: -1,
        });
      }
    } else if (this.configData.biome.type === 'swamp') {
      for (let i = 0; i < 20; i++) {
        const spore = this.add.circle(
          this.rng.nextInt(20, width - 20),
          this.rng.nextInt(20, height - 20),
          this.rng.nextInt(2, 4),
          0x10b981,
          0.3
        );
        this.tweens.add({
          targets: spore,
          y: spore.y - 25,
          alpha: 0.05,
          duration: 2000 + this.rng.nextInt(500, 1500),
          yoyo: true,
          repeat: -1,
        });
      }
    } else if (this.configData.biome.type === 'ice') {
      for (let i = 0; i < 25; i++) {
        const flake = this.add.circle(
          this.rng.nextInt(20, width - 20),
          this.rng.nextInt(20, height - 20),
          this.rng.nextInt(1.5, 3),
          0xe0f2fe,
          0.4
        );
        this.tweens.add({
          targets: flake,
          y: flake.y + 30,
          duration: 1800 + this.rng.nextInt(500, 1500),
          repeat: -1,
        });
      }
    }

    // Player visual representation with styled avatar traits
    this.playerContainer = this.add.container(width / 2, height / 2);

    // Shield aura
    this.playerShieldGlow = this.add.circle(0, 0, 32, 0x38bdf8, 0);
    this.playerShieldGlow.setStrokeStyle(3, 0x67e8f9);

    // Overclock Ascension Ring
    this.overclockAura = this.add.circle(0, 0, 30, 0xfacc15, 0);
    this.overclockAura.setStrokeStyle(2.5, 0xfde047);

    // Twin Plasma Cannon Barrels with alternating recoil & flashes
    this.barrelLeft = this.add.rectangle(15, -8, 14, 5, 0x1e293b);
    this.barrelLeft.setStrokeStyle(1.5, 0x475569);
    this.barrelRight = this.add.rectangle(15, 8, 14, 5, 0x1e293b);
    this.barrelRight.setStrokeStyle(1.5, 0x475569);
    const tipLeft = this.add.rectangle(21, -8, 4, 4, this.configData.attack.bulletColor);
    const tipRight = this.add.rectangle(21, 8, 4, 4, this.configData.attack.bulletColor);

    this.muzzleFlashLeft = this.add.circle(24, -8, 7, 0xffffff, 0);
    this.muzzleFlashRight = this.add.circle(24, 8, 7, 0xffffff, 0);
    this.muzzleFlash = this.add.circle(24, 0, 9, 0xffffff, 0);

    // Body
    const bodyColor = this.configData.archetype.type === 'suit' ? 0x475569 :
                      this.configData.archetype.type === 'naked' ? 0xf43f5e : 0x22c55e;
    const bodyShape = this.add.circle(0, 0, 20, bodyColor);
    bodyShape.setStrokeStyle(2, 0xffffff);

    // Head accessory visual
    if (this.configData.ability.key === 'crown') {
      const crown = this.add.triangle(0, -22, -10, 8, 0, -6, 10, 8, 0xeab308);
      this.playerContainer.add(crown);
    } else if (this.configData.ability.key === 'hood') {
      const hood = this.add.circle(0, -4, 18, 0x1e293b, 0.7);
      this.playerContainer.add(hood);
    } else if (this.configData.ability.key === 'helmet') {
      const helm = this.add.rectangle(0, -14, 24, 6, 0x94a3b8);
      this.playerContainer.add(helm);
    }

    // Eyes visual
    const eyeColor = this.configData.targeting.type === 'laser' ? 0xef4444 :
                     this.configData.targeting.type === 'hypno' ? 0xa855f7 :
                     this.configData.targeting.type === 'glasses' ? 0x06b6d4 : 0xffffff;
    const leftEye = this.add.circle(8, -5, 4.5, eyeColor);
    const rightEye = this.add.circle(8, 5, 4.5, eyeColor);

    // Core chassis cockpit glow
    const coreGlow = this.add.circle(3, 0, 6, this.configData.attack.bulletColor, 0.4);

    this.playerContainer.add([
      this.playerShieldGlow,
      this.overclockAura,
      this.barrelLeft,
      this.barrelRight,
      tipLeft,
      tipRight,
      bodyShape,
      coreGlow,
      leftEye,
      rightEye,
      this.muzzleFlashLeft,
      this.muzzleFlashRight,
      this.muzzleFlash,
    ]);

    // Orbital orbs container
    this.orbitalContainer = this.add.container(width / 2, height / 2);

    // Ultimate Beam Graphics layer
    this.ultimateBeamGraphics = this.add.graphics();

    // Setup input keys
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
      this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
      this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
      this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
      this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      this.keyF = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
      this.keyT = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.T);
      this.keyP = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
      this.keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);

      this.keySpace.on('down', () => {
        if (this.isUltimateReady && !this.isUltimateActive) {
          this.triggerUltimate();
        } else {
          this.triggerActiveAbility();
        }
      });

      this.keyF.on('down', () => {
        this.triggerUltimate();
      });

      this.keyT.on('down', () => {
        this.toggleAutoAim();
      });

      this.keyP.on('down', () => {
        this.togglePause();
      });

      this.keyR.on('down', () => {
        this.scene.restart();
      });
    }

    // Pointer aim & fire tracking
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown || !this.sys.game.device.os.desktop) {
        this.touchAimX = pointer.x;
        this.touchAimY = pointer.y;
        this.isTouchAiming = true;
      }
    });

    // Auto-start run on any user interaction
    this.input.on('pointerdown', () => {
      this.startRun();
    });

    if (this.input.keyboard) {
      this.input.keyboard.on('keydown', () => {
        this.startRun();
      });
    }

    // Notify React of initial state
    this.callbacks.onHpUpdate(this.hp, this.maxHp);
    this.callbacks.onScoreUpdate(this.score);
    this.callbacks.onTimeUpdate(this.levelTimeRemaining);
    this.callbacks.onLevelUpdate?.(
      this.currentLevel,
      this.totalLevels,
      this.levelNames[this.currentLevel - 1],
      Math.ceil(this.levelTimeRemaining)
    );
    this.callbacks.onAutoAimStatus?.(this.autoAimEnabled, this.isAimScrambled);
    this.callbacks.onAbilityState(0, true);
    this.callbacks.onEssenceUpdate?.(0, this.maxEssence, false, false);
    this.emitBonusSkillsUpdate();
  }

  public toggleAutoAim(): boolean {
    this.autoAimEnabled = !this.autoAimEnabled;
    soundSynth.playCoin();
    this.callbacks.onComboAlert?.(this.autoAimEnabled ? '🎯 AUTO-AIM ACTIVATED' : '🎯 MANUAL AIM ACTIVATED');
    this.callbacks.onAutoAimStatus?.(this.autoAimEnabled, this.isAimScrambled);
    return this.autoAimEnabled;
  }

  public togglePause(): void {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.callbacks.onChaosAlert('GAME PAUSED [P]');
      soundSynth.stopBgm();
    } else {
      this.callbacks.onChaosAlert('RESUMED');
      if (this.isGameStarted && !this.isFinished) {
        soundSynth.startBgm();
      }
    }
  }

  public startRun(): void {
    if (this.isGameStarted) return;
    this.isGameStarted = true;
    this.lastFireTime = this.time ? this.time.now : 0;
    soundSynth.startBgm();
    if (this.callbacks?.onGameStart) {
      this.callbacks.onGameStart();
    }
  }

  public setTouchMovement(x: number, y: number): void {
    this.touchMoveX = x;
    this.touchMoveY = y;
  }

  public triggerActiveAbility(): void {
    if (!this.isGameStarted || this.isFinished || this.isPaused) return;

    // If ultimate is ready and not active, unleash Signature Ultimate!
    if (this.isUltimateReady && !this.isUltimateActive) {
      this.triggerUltimate();
      return;
    }

    if (this.abilityTimer > 0) return;

    soundSynth.playAbility();
    soundSynth.triggerHaptic(50);
    const ab = this.configData.ability;
    this.abilityTimer = ab.cooldownSeconds;

    if (ab.key === 'crown') {
      // Royal Shield: invulnerable for 3.5s
      this.isShielded = true;
      this.abilityActiveDuration = ab.durationSeconds;
      this.playerShieldGlow.setAlpha(0.75);
      this.callbacks.onChaosAlert('AEGIS SHIELD ACTIVATED!');
    } else if (ab.key === 'hood') {
      // Shadow Dash: huge speed burst
      this.isShielded = true;
      this.abilityActiveDuration = ab.durationSeconds;
      const angle = this.aimAngle;
      this.vx += Math.cos(angle) * 650;
      this.vy += Math.sin(angle) * 650;
      this.spawnParticleRing(this.playerContainer.x, this.playerContainer.y, 0xa855f7);
      this.callbacks.onChaosAlert('SHADOW PHASE DASH!');
    } else if (ab.key === 'helmet') {
      // Shockwave: pushes back and damages all nearby enemies
      this.spawnParticleRing(this.playerContainer.x, this.playerContainer.y, 0xef4444, 120);
      this.enemies.forEach((enemy) => {
        const dx = enemy.sprite.x - this.playerContainer.x;
        const dy = enemy.sprite.y - this.playerContainer.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 190) {
          enemy.hp -= 50;
          enemy.sprite.x += (dx / dist) * 130;
          enemy.sprite.y += (dy / dist) * 130;
          this.showDamageText(enemy.sprite.x, enemy.sprite.y, 50, false);
        }
      });
      this.callbacks.onChaosAlert('TITAN SHOCKWAVE!');
    } else {
      // Emergency Stim: heal
      this.hp = Math.min(this.maxHp, this.hp + 35);
      this.callbacks.onHpUpdate(this.hp, this.maxHp);
      this.spawnParticleRing(this.playerContainer.x, this.playerContainer.y, 0x22c55e);
      this.callbacks.onChaosAlert('NANO REPAIR +35 HP!');
    }

    this.lastReportedAbilityCooldown = Math.ceil(this.abilityTimer);
    this.lastReportedAbilityReady = false;
    this.callbacks.onAbilityState(this.lastReportedAbilityCooldown, false);
  }

  public addEssence(amount: number): void {
    if (this.isUltimateActive) return;
    this.essence = Math.min(this.maxEssence, this.essence + amount);
    const isReady = this.essence >= this.maxEssence;
    if (isReady && !this.isUltimateReady) {
      this.isUltimateReady = true;
      soundSynth.playUltimateReady();
      soundSynth.triggerHaptic(80);
      this.callbacks.onComboAlert?.('🔥 SIGNATURE ULTIMATE CHARGED! [SPACE/F]');
    }
    this.emitEssenceUpdate();
  }

  private emitEssenceUpdate(): void {
    const rounded = Math.round(this.essence);
    if (
      rounded !== this.lastReportedEssence ||
      this.isUltimateReady !== this.lastReportedUltimateReady ||
      this.isUltimateActive !== this.lastReportedUltimateActive
    ) {
      this.lastReportedEssence = rounded;
      this.lastReportedUltimateReady = this.isUltimateReady;
      this.lastReportedUltimateActive = this.isUltimateActive;
      this.callbacks.onEssenceUpdate?.(
        rounded,
        this.maxEssence,
        this.isUltimateReady,
        this.isUltimateActive
      );
    }
  }

  public triggerUltimate(): void {
    if (!this.isUltimateReady || this.isUltimateActive || !this.isGameStarted || this.isFinished || this.isPaused) return;

    this.isUltimateActive = true;
    this.isUltimateReady = false;
    this.ultimateDurationTimer = this.ultimateMaxDuration;

    soundSynth.playLaser(true);
    soundSynth.triggerHaptic(120);
    this.cameras.main.shake(500, 0.03);
    this.cameras.main.flash(250, 255, 255, 255);
    this.spawnParticleRing(this.playerContainer.x, this.playerContainer.y, 0xfacc15, 60);

    const tokenId = this.configData.tokenId;
    const sigName = this.configData.signatureSkill.name;

    this.callbacks.onComboAlert?.(`⚡ ${sigName.toUpperCase()} UNLEASHED!`);

    // Individual avatar signature ultimate behavior
    if (tokenId === 969) {
      // Solar Orbital Lance: Screen-spanning cosmic death beam
      this.callbacks.onChaosAlert('☀️ SOLAR ORBITAL LANCE ENGAGED');
      this.isShielded = true;
      this.abilityActiveDuration = this.ultimateMaxDuration;
    } else if (tokenId === 404) {
      // Void Phase Singularity: pull all enemies to center & crush them
      this.callbacks.onChaosAlert('🌀 VOID SINGULARITY CRUSH');
      this.isShielded = true;
      this.abilityActiveDuration = this.ultimateMaxDuration;
      const { width, height } = this.scale;
      this.enemies.forEach((enemy) => {
        enemy.hp -= 150;
        this.showDamageText(enemy.sprite.x, enemy.sprite.y, 150, true);
        this.tweens.add({
          targets: enemy.sprite,
          x: width / 2,
          y: height / 2,
          duration: 350,
        });
      });
    } else if (tokenId === 77) {
      // Glacial Seismic Stomp: absolute freeze + shatter
      this.callbacks.onChaosAlert('❄️ GLACIAL ZERO STOMP');
      this.enemies.forEach((enemy) => {
        enemy.frozenTimer = 5.0;
        enemy.hp -= 140;
        this.showDamageText(enemy.sprite.x, enemy.sprite.y, 140, true);
      });
    } else if (tokenId === 1337) {
      // Solar Flare Rampage: extreme speed boost + piercing overdrive
      this.callbacks.onChaosAlert('🔥 SOLAR FLARE OVERDRIVE');
      this.isShielded = true;
      this.abilityActiveDuration = this.ultimateMaxDuration;
      this.vx += Math.cos(this.aimAngle) * 550;
      this.vy += Math.sin(this.aimAngle) * 550;
    } else if (tokenId === 1969) {
      // Midas Sovereign Overload: turn all minor enemies to gold gems!
      this.callbacks.onChaosAlert('👑 MIDAS TRANSCENDENCE SUPERNOVA');
      this.isShielded = true;
      this.abilityActiveDuration = this.ultimateMaxDuration;
      for (let i = this.enemies.length - 1; i >= 0; i--) {
        const e = this.enemies[i];
        if (!e.isBoss) {
          this.spawnGem(e.sprite.x, e.sprite.y, 250);
          this.score += 500;
          e.sprite.destroy();
          this.enemies.splice(i, 1);
        } else {
          e.hp -= 200;
          this.showDamageText(e.sprite.x, e.sprite.y, 200, true);
        }
      }
      this.callbacks.onScoreUpdate(this.score);
    } else {
      // Titan Overload: Invulnerability + health regen
      this.callbacks.onChaosAlert('⚡ TITAN OVERLOAD OVERDRIVE');
      this.isShielded = true;
      this.abilityActiveDuration = this.ultimateMaxDuration;
      this.hp = Math.min(this.maxHp, this.hp + 50);
      this.callbacks.onHpUpdate(this.hp, this.maxHp);
    }

    this.emitEssenceUpdate();
  }

  update(time: number, delta: number) {
    if (!this.isGameStarted || this.isFinished || this.isPaused) return;

    const dt = delta / 1000;
    this.totalSurvivedSeconds += dt;

    // Scrambler EMP Timer Tick
    if (this.isAimScrambled) {
      this.scrambleTimer -= dt;
      if (this.scrambleTimer <= 0) {
        this.isAimScrambled = false;
        this.scrambleTimer = 0;
        this.callbacks.onChaosAlert('TARGETING RE-CALIBRATED');
        this.callbacks.onAutoAimStatus?.(this.autoAimEnabled, this.isAimScrambled);
      }
    }

    // 1. Level time countdown (Throttled callback)
    this.levelTimeRemaining -= dt;
    if (this.levelTimeRemaining <= 0) {
      if (this.currentLevel < this.totalLevels) {
        this.advanceToNextLevel();
      } else {
        this.levelTimeRemaining = 0;
        this.callbacks.onTimeUpdate(0);
        this.callbacks.onLevelUpdate?.(
          this.currentLevel,
          this.totalLevels,
          this.levelNames[this.currentLevel - 1],
          0
        );
        this.handleVictory();
        return;
      }
    }

    const currentCeilTime = Math.ceil(this.levelTimeRemaining);
    if (currentCeilTime !== this.lastReportedTime) {
      this.lastReportedTime = currentCeilTime;
      this.callbacks.onTimeUpdate(currentCeilTime);
      this.callbacks.onLevelUpdate?.(
        this.currentLevel,
        this.totalLevels,
        this.levelNames[this.currentLevel - 1],
        currentCeilTime
      );
    }

    // Milestones per level:
    // Level 1: Sector Alpha (60s) -> Boss at 30s
    if (this.currentLevel === 1) {
      if (this.levelTimeRemaining <= 30 && !this.mainBossSpawned) {
        this.mainBossSpawned = true;
        this.spawnMainBoss(1);
      }
    }
    // Level 2: Sector Beta (90s) -> Sub-Boss 1 (Voidstalker) at 60s, Main Boss at 35s
    else if (this.currentLevel === 2) {
      if (this.levelTimeRemaining <= 60 && !this.subBoss1Spawned) {
        this.subBoss1Spawned = true;
        this.spawnSubBossStalker();
      }
      if (this.levelTimeRemaining <= 35 && !this.mainBossSpawned) {
        this.mainBossSpawned = true;
        this.spawnMainBoss(2);
      }
    }
    // Level 3: Sector Omega Core (120s) -> Sub-Boss 1 at 90s, Sub-Boss 2 (Siegebeast) at 60s, Supreme Boss at 35s
    else if (this.currentLevel === 3) {
      if (this.levelTimeRemaining <= 90 && !this.subBoss1Spawned) {
        this.subBoss1Spawned = true;
        this.spawnSubBossStalker();
      }
      if (this.levelTimeRemaining <= 60 && !this.subBoss2Spawned) {
        this.subBoss2Spawned = true;
        this.spawnSubBossSiege();
      }
      if (this.levelTimeRemaining <= 35 && !this.mainBossSpawned) {
        this.mainBossSpawned = true;
        this.spawnMainBoss(3);
      }
    }

    // Final 10 seconds of current level: Hyper Survival Surge
    if (this.levelTimeRemaining <= 10 && !this.hyperSurgeTriggered) {
      this.triggerHyperSurge();
    }

    // 2. Ability Cooldown & Active Durations (Throttled callback)
    if (this.abilityTimer > 0) {
      this.abilityTimer = Math.max(0, this.abilityTimer - dt);
      const currentCeilAbility = Math.ceil(this.abilityTimer);
      const isReady = this.abilityTimer === 0;
      if (currentCeilAbility !== this.lastReportedAbilityCooldown || isReady !== this.lastReportedAbilityReady) {
        this.lastReportedAbilityCooldown = currentCeilAbility;
        this.lastReportedAbilityReady = isReady;
        this.callbacks.onAbilityState(currentCeilAbility, isReady);
      }
    }

    if (this.abilityActiveDuration > 0) {
      this.abilityActiveDuration -= dt;
      if (this.abilityActiveDuration <= 0) {
        this.isShielded = false;
        this.playerShieldGlow.setAlpha(0);
      }
    }

    // 2.5 Active Signature Ultimate Duration & Continuous Tick
    if (this.isUltimateActive) {
      this.ultimateDurationTimer -= dt;
      this.essence = Math.max(0, (this.ultimateDurationTimer / this.ultimateMaxDuration) * 100);

      // Active continuous beam for #969 Solar Orbital Lance
      if (this.configData.tokenId === 969) {
        this.ultimateBeamGraphics.clear();
        this.ultimateBeamGraphics.lineStyle(10, 0xfacc15, 0.9);
        this.ultimateBeamGraphics.strokeLineShape(
          new Phaser.Geom.Line(
            this.playerContainer.x,
            this.playerContainer.y,
            this.playerContainer.x + Math.cos(this.aimAngle) * 750,
            this.playerContainer.y + Math.sin(this.aimAngle) * 750
          )
        );
        this.ultimateBeamGraphics.lineStyle(4, 0xffffff, 1.0);
        this.ultimateBeamGraphics.strokeLineShape(
          new Phaser.Geom.Line(
            this.playerContainer.x,
            this.playerContainer.y,
            this.playerContainer.x + Math.cos(this.aimAngle) * 750,
            this.playerContainer.y + Math.sin(this.aimAngle) * 750
          )
        );
        // Melt hostiles along line
        this.enemies.forEach((enemy) => {
          const dist = Math.hypot(enemy.sprite.x - this.playerContainer.x, enemy.sprite.y - this.playerContainer.y);
          const angleToEnemy = Math.atan2(enemy.sprite.y - this.playerContainer.y, enemy.sprite.x - this.playerContainer.x);
          const angleDiff = Math.abs(Phaser.Math.Angle.Normalize(this.aimAngle - angleToEnemy));
          if (angleDiff < 0.22 && dist < 750) {
            enemy.hp -= 120 * dt;
            this.showDamageText(enemy.sprite.x, enemy.sprite.y, Math.round(120 * dt), false);
          }
        });
      }

      if (this.ultimateDurationTimer <= 0) {
        this.isUltimateActive = false;
        this.essence = 0;
        this.ultimateBeamGraphics.clear();
        this.callbacks.onChaosAlert('ULTIMATE CONCLUDED');
      }

      this.emitEssenceUpdate();
    }

    // 3. Update Bonus Skills
    this.updateBonusSkills(dt);

    // 4. Chaos Modifier Periodic Tick
    this.updateChaos(dt);

    // 5. Player Input & Physics
    this.updatePlayerMovement(dt);

    // 6. Automatic Aiming & Firing
    this.updateWeaponFiring(time);

    // 7. Projectiles
    this.updateProjectiles(dt);

    // 8. Enemy Wave Spawning & Updates
    this.updateEnemies(dt);

    // 9. Hazard Updates
    this.updateHazards(dt);

    // 10. Gem Magnet & Pickups
    this.updatePickups(dt);

    // 11. Particle Updates
    this.updateParticles(dt);
  }

  private updateBonusSkills(dt: number) {
    let changed = false;
    for (const [skill, state] of this.activeBonusSkills.entries()) {
      state.remaining -= dt;
      if (state.remaining <= 0) {
        this.activeBonusSkills.delete(skill);
        changed = true;
        if (skill === 'orbital_shield') {
          this.orbitalContainer.removeAll(true);
          this.orbitalOrbs = [];
        }
      }
    }

    if (changed) {
      this.emitBonusSkillsUpdate();
    }

    // Orbital shields logic
    if (this.activeBonusSkills.has('orbital_shield')) {
      this.orbitalContainer.setPosition(this.playerContainer.x, this.playerContainer.y);
      this.orbitalOrbs.forEach((orb) => {
        orb.angle += 3.5 * dt;
        const rad = 42;
        orb.sprite.setPosition(Math.cos(orb.angle) * rad, Math.sin(orb.angle) * rad);

        // Contact damage with enemies
        const globalX = this.playerContainer.x + orb.sprite.x;
        const globalY = this.playerContainer.y + orb.sprite.y;
        this.enemies.forEach((enemy) => {
          const dist = Math.hypot(enemy.sprite.x - globalX, enemy.sprite.y - globalY);
          if (dist < 26) {
            enemy.hp -= 28 * dt * 5;
            soundSynth.playHit();
          }
        });
      });
    }

    // Homing missiles periodic fire
    if (this.activeBonusSkills.has('homing_missiles')) {
      this.missileTimer += dt;
      if (this.missileTimer >= 1.2 && this.enemies.length > 0) {
        this.missileTimer = 0;
        this.fireHomingMissiles();
      }
    }

    // Cryo wave periodic pulse
    if (this.activeBonusSkills.has('cryo_blast')) {
      this.cryoTimer += dt;
      if (this.cryoTimer >= 3.0) {
        this.cryoTimer = 0;
        this.pulseCryoWave();
      }
    }
  }

  private emitBonusSkillsUpdate() {
    if (this.callbacks.onBonusSkillsUpdate) {
      const list: ActiveBonusSkill[] = [];
      this.activeBonusSkills.forEach((val, type) => {
        const meta = BONUS_SKILL_META[type];
        list.push({
          type,
          name: meta.name,
          icon: meta.icon,
          durationSeconds: meta.duration,
          remainingSeconds: Math.ceil(val.remaining),
          description: meta.description,
          color: meta.hex,
        });
      });
      this.callbacks.onBonusSkillsUpdate(list);
    }
  }

  private grantBonusSkill(type: BonusSkillType) {
    this.skillsCollected++;
    soundSynth.triggerHaptic(60);
    const meta = BONUS_SKILL_META[type];

    // On-screen notifications
    this.callbacks.onPowerupPicked?.(meta.name, meta.description, meta.hex, meta.icon);
    this.callbacks.onComboAlert?.(`⚡ POWER-UP: ${meta.name.toUpperCase()}`);
    this.showDamageText(this.playerContainer.x, this.playerContainer.y - 30, `+${meta.name}`, true);
    this.spawnParticleRing(this.playerContainer.x, this.playerContainer.y, meta.color, 30);

    if (type === 'nuke_bomb') {
      soundSynth.playNuke();
      this.cameras.main.shake(500, 0.035);
      this.cameras.main.flash(200, 255, 255, 255);
      this.enemies.forEach((enemy) => {
        if (enemy.isBoss) {
          enemy.hp -= 350;
          this.showDamageText(enemy.sprite.x, enemy.sprite.y, 350, true);
        } else {
          this.showDamageText(enemy.sprite.x, enemy.sprite.y, enemy.hp, true);
          enemy.hp = 0;
        }
      });
      return;
    }

    if (type === 'vampire_heal') {
      soundSynth.playHeal();
      this.hp = Math.min(this.maxHp, this.hp + 35);
      this.callbacks.onHpUpdate(this.hp, this.maxHp);
      this.showDamageText(this.playerContainer.x, this.playerContainer.y - 45, '+35 HP HEAL', true);
    } else if (type === 'speed_warp') {
      soundSynth.playSpeedWarp();
    } else if (type === 'midas_jackpot') {
      soundSynth.playCoin();
      for (let i = 0; i < 10; i++) {
        const rad = (i / 10) * Math.PI * 2;
        this.spawnGem(this.playerContainer.x + Math.cos(rad) * 45, this.playerContainer.y + Math.sin(rad) * 45, 150);
      }
    } else if (type === 'orbital_shield') {
      soundSynth.playPowerup();
      this.orbitalContainer.removeAll(true);
      this.orbitalOrbs = [];
      for (let i = 0; i < 2; i++) {
        const orb = this.add.circle(0, 0, 8, 0x22c55e);
        orb.setStrokeStyle(1.5, 0x86efac);
        this.orbitalContainer.add(orb);
        this.orbitalOrbs.push({ sprite: orb, angle: (Math.PI * 2 * i) / 2 });
      }
    } else if (type === 'cryo_blast') {
      soundSynth.playPowerup();
      this.pulseCryoWave();
    } else {
      soundSynth.playPowerup();
    }

    this.activeBonusSkills.set(type, { remaining: meta.duration, maxDuration: meta.duration });
    this.emitBonusSkillsUpdate();
  }

  private pulseCryoWave() {
    soundSynth.playHit();
    this.spawnParticleRing(this.playerContainer.x, this.playerContainer.y, 0x06b6d4, 30);
    this.enemies.forEach((enemy) => {
      const dist = Math.hypot(enemy.sprite.x - this.playerContainer.x, enemy.sprite.y - this.playerContainer.y);
      if (dist < 220) {
        enemy.frozenTimer = 2.5; // Frozen in place
        enemy.hp -= 20;
        this.showDamageText(enemy.sprite.x, enemy.sprite.y, 20, false);
      }
    });
  }

  private fireHomingMissiles() {
    soundSynth.playLaser(true);
    for (let i = 0; i < 2; i++) {
      const angle = this.aimAngle + (i === 0 ? -0.4 : 0.4);
      const bullet = this.add.circle(this.playerContainer.x, this.playerContainer.y, 6, 0xf43f5e);
      bullet.setStrokeStyle(1.5, 0xffffff);

      this.projectiles.push({
        sprite: bullet,
        vx: Math.cos(angle) * 520,
        vy: Math.sin(angle) * 520,
        damage: 35,
        piercing: false,
        slowOnHit: false,
        crit: true,
        life: 0,
        maxLife: 2.0,
        hitsLeft: 1,
      });
    }
  }

  private updateChaos(dt: number) {
    const chaos = this.configData.chaos;
    this.chaosTimer += dt;

    if (chaos.key === 'flame') {
      if (this.chaosTimer >= chaos.intervalSeconds) {
        this.chaosTimer = 0;
        const targetX = Phaser.Math.Clamp(
          this.playerContainer.x + this.rng.nextInt(-160, 160),
          60,
          this.scale.width - 60
        );
        const targetY = Phaser.Math.Clamp(
          this.playerContainer.y + this.rng.nextInt(-160, 160),
          60,
          this.scale.height - 60
        );
        this.spawnMeteorHazard(targetX, targetY);
      }
    } else if (chaos.key === 'glitch') {
      if (this.controlsInversionTimer > 0) {
        this.controlsInversionTimer -= dt;
        if (this.controlsInversionTimer <= 0) {
          this.controlsInverted = false;
          this.callbacks.onChaosAlert('CONTROLS NORMALIZED');
        }
      } else if (this.chaosTimer >= chaos.intervalSeconds) {
        this.chaosTimer = 0;
        this.controlsInverted = true;
        this.controlsInversionTimer = 2.0;
        soundSynth.playWarning();
        this.cameras.main.shake(200, 0.008);
        this.callbacks.onChaosAlert('DIMENSIONAL GLITCH: REVERSED CONTROLS!');
      }
    }
  }

  private spawnMeteorHazard(x: number, y: number) {
    soundSynth.playWarning();
    const radius = 50;
    const telegraph = this.add.circle(x, y, radius, 0xef4444, 0.25);
    telegraph.setStrokeStyle(2, 0xf97316);

    this.tweens.add({
      targets: telegraph,
      alpha: 0.6,
      scale: 1.1,
      duration: 350,
      yoyo: true,
      repeat: 2,
    });

    this.hazards.push({
      circle: telegraph,
      timer: 1.2,
      x,
      y,
      radius,
    });
  }

  private updateHazards(dt: number) {
    for (let i = this.hazards.length - 1; i >= 0; i--) {
      const h = this.hazards[i];
      h.timer -= dt;
      if (h.timer <= 0) {
        soundSynth.playExplosion();
        this.spawnParticleRing(h.x, h.y, 0xf97316, 50);

        const distP = Math.hypot(this.playerContainer.x - h.x, this.playerContainer.y - h.y);
        if (distP <= h.radius && !this.isShielded) {
          this.takeDamage(20);
        }

        this.enemies.forEach((enemy) => {
          const distE = Math.hypot(enemy.sprite.x - h.x, enemy.sprite.y - h.y);
          if (distE <= h.radius) {
            enemy.hp -= 60;
            this.showDamageText(enemy.sprite.x, enemy.sprite.y, 60, true);
          }
        });

        h.circle.destroy();
        this.hazards.splice(i, 1);
      }
    }
  }

  private updatePlayerMovement(dt: number) {
    let inputX = 0;
    let inputY = 0;

    if (this.cursors.left.isDown || this.keyA?.isDown) inputX -= 1;
    if (this.cursors.right.isDown || this.keyD?.isDown) inputX += 1;
    if (this.cursors.up.isDown || this.keyW?.isDown) inputY -= 1;
    if (this.cursors.down.isDown || this.keyS?.isDown) inputY += 1;

    inputX += this.touchMoveX;
    inputY += this.touchMoveY;

    if (this.controlsInverted) {
      inputX = -inputX;
      inputY = -inputY;
    }

    const len = Math.hypot(inputX, inputY);
    if (len > 1) {
      inputX /= len;
      inputY /= len;
    }

    const speedWarpBonus = this.activeBonusSkills.has('speed_warp') ? 1.7 : 1.0;
    const baseSpeed = this.configData.archetype.moveSpeed * this.configData.biome.speedModifier * speedWarpBonus;
    const accel = 1800;
    this.vx += inputX * accel * dt;
    this.vy += inputY * accel * dt;

    const friction = this.configData.biome.friction;
    this.vx *= Math.pow(friction, dt * 60);
    this.vy *= Math.pow(friction, dt * 60);

    const currentSpeed = Math.hypot(this.vx, this.vy);
    if (currentSpeed > baseSpeed) {
      this.vx = (this.vx / currentSpeed) * baseSpeed;
      this.vy = (this.vy / currentSpeed) * baseSpeed;
    }

    this.playerContainer.x += this.vx * dt;
    this.playerContainer.y += this.vy * dt;

    // Speed warp phase trail
    if (this.activeBonusSkills.has('speed_warp') && Math.random() < 0.4) {
      const trail = this.add.circle(this.playerContainer.x, this.playerContainer.y, 14, 0xa855f7, 0.4);
      this.tweens.add({
        targets: trail,
        alpha: 0,
        scale: 0.2,
        duration: 200,
        onComplete: () => trail.destroy(),
      });
    }

    const pad = 25;
    this.playerContainer.x = Phaser.Math.Clamp(this.playerContainer.x, pad, this.scale.width - pad);
    this.playerContainer.y = Phaser.Math.Clamp(this.playerContainer.y, pad, this.scale.height - pad);

    if (this.isTouchAiming) {
      this.aimAngle = Math.atan2(
        this.touchAimY - this.playerContainer.y,
        this.touchAimX - this.playerContainer.x
      );
    } else {
      const pointer = this.input.activePointer;
      if (pointer) {
        this.aimAngle = Math.atan2(
          pointer.y - this.playerContainer.y,
          pointer.x - this.playerContainer.x
        );
      }
    }

    this.playerContainer.setRotation(this.aimAngle);
  }

  private updateWeaponFiring(time: number) {
    const atk = this.configData.attack;
    const hyperFireMod = this.activeBonusSkills.has('hyper_firerate') ? 0.45 : 1.0;
    const ultimateFireMod = this.isUltimateActive ? 0.65 : 1.0;
    const effectiveRate = atk.fireRateMs * hyperFireMod * ultimateFireMod;

    if (time - this.lastFireTime >= effectiveRate) {
      this.lastFireTime = time;

      let fireAngle = this.aimAngle;
      const canAutoAim = this.autoAimEnabled && !this.isAimScrambled;
      if (canAutoAim && this.enemies.length > 0 && !this.input.activePointer.isDown && !this.isTouchAiming) {
        let nearestDist = Infinity;
        let nearestEnemy: Enemy | null = null;
        for (const e of this.enemies) {
          const d = Math.hypot(e.sprite.x - this.playerContainer.x, e.sprite.y - this.playerContainer.y);
          if (d < nearestDist) {
            nearestDist = d;
            nearestEnemy = e;
          }
        }
        if (nearestEnemy) {
          fireAngle = Math.atan2(
            nearestEnemy.sprite.y - this.playerContainer.y,
            nearestEnemy.sprite.x - this.playerContainer.x
          );
        }
      }

      const isCrit = Math.random() < this.configData.targeting.critChance;
      const damage = isCrit ? atk.damage * 2 : atk.damage;

      soundSynth.playLaser(isCrit);

      // Alternating Twin Barrel Recoil & Muzzle Flash Animation
      this.fireBarrelToggle = !this.fireBarrelToggle;
      const activeBarrel = this.fireBarrelToggle ? this.barrelLeft : this.barrelRight;
      const activeFlash = this.fireBarrelToggle ? this.muzzleFlashLeft : this.muzzleFlashRight;

      if (activeBarrel) {
        activeBarrel.x = 9; // kick back
        this.tweens.add({
          targets: activeBarrel,
          x: 15,
          duration: 45,
          ease: 'Power1',
        });
      }

      if (activeFlash) {
        activeFlash.setAlpha(1.0);
        this.tweens.add({
          targets: activeFlash,
          alpha: 0,
          duration: 45,
        });
      }

      // If hyper overdrive or ultimate is active, both barrels blaze with central spark
      if (this.activeBonusSkills.has('hyper_firerate') || this.isUltimateActive) {
        if (this.muzzleFlash) {
          this.muzzleFlash.setAlpha(0.9);
          this.tweens.add({
            targets: this.muzzleFlash,
            alpha: 0,
            duration: 40,
          });
        }
      }

      // Projectile lateral barrel offset
      const sideOffset = this.fireBarrelToggle ? -8 : 8;
      const normalAngle = fireAngle + Math.PI / 2;
      const barrelOriginX = this.playerContainer.x + Math.cos(fireAngle) * 23 + Math.cos(normalAngle) * sideOffset;
      const barrelOriginY = this.playerContainer.y + Math.sin(fireAngle) * 23 + Math.sin(normalAngle) * sideOffset;

      if (atk.pattern === 'spread' || this.overclockLevel >= 2) {
        const spreadCount = (atk.pattern === 'spread' ? 3 : 2) + (this.overclockLevel >= 4 ? 2 : 0);
        const offsets = spreadCount === 2 ? [-0.12, 0.12] : spreadCount === 3 ? [-0.22, 0, 0.22] : [-0.35, -0.18, 0, 0.18, 0.35];
        offsets.forEach((offset) => {
          this.spawnProjectile(fireAngle + offset, damage, isCrit, barrelOriginX, barrelOriginY);
        });
      } else {
        this.spawnProjectile(fireAngle, damage, isCrit, barrelOriginX, barrelOriginY);
      }
    }
  }

  private spawnProjectile(angle: number, damage: number, crit: boolean, originX?: number, originY?: number) {
    const atk = this.configData.attack;
    const tgt = this.configData.targeting;

    const speed = atk.projectileSpeed * (this.overclockLevel >= 2 ? 1.2 : 1.0);
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;

    const startX = originX !== undefined ? originX : this.playerContainer.x + Math.cos(angle) * 22;
    const startY = originY !== undefined ? originY : this.playerContainer.y + Math.sin(angle) * 22;

    const radius = crit ? 6 : 4;
    const bullet = this.add.circle(startX, startY, radius, crit ? 0xfacc15 : atk.bulletColor);
    bullet.setStrokeStyle(1, 0xffffff);

    const isPiercing = this.overclockLevel >= 4 || tgt.piercing;
    const isExplosive = this.overclockLevel >= 3;

    this.projectiles.push({
      sprite: bullet,
      vx,
      vy,
      damage,
      piercing: isPiercing,
      slowOnHit: tgt.slowOnHit,
      crit,
      life: 0,
      maxLife: 1.4 * tgt.rangeModifier,
      hitsLeft: isPiercing ? 3 : 1,
      chain: this.activeBonusSkills.has('chain_lightning'),
      explosive: isExplosive,
    });
  }

  private updateProjectiles(dt: number) {
    const atk = this.configData.attack;
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life += dt;
      p.sprite.x += p.vx * dt;
      p.sprite.y += p.vy * dt;

      // Projectile trail particles
      if (Math.random() < 0.3) {
        const trail = this.add.circle(p.sprite.x, p.sprite.y, p.crit ? 3 : 2, p.crit ? 0xfacc15 : atk.bulletColor, 0.5);
        this.tweens.add({
          targets: trail,
          scale: 0.1,
          alpha: 0,
          duration: 140,
          onComplete: () => trail.destroy(),
        });
      }

      let hasHit = false;
      for (const enemy of this.enemies) {
        const dist = Math.hypot(p.sprite.x - enemy.sprite.x, p.sprite.y - enemy.sprite.y);
        const hitRadius = enemy.isBoss ? 38 : 18;

        if (dist < hitRadius) {
          this.damageEnemy(enemy, p.damage, p.crit);

          // Kinetic hit flash on enemy
          this.tweens.add({
            targets: enemy.sprite,
            scale: enemy.isBoss ? 1.08 : 1.25,
            duration: 45,
            yoyo: true,
          });

          // Explosive plasma splash
          if (p.explosive) {
            this.spawnParticleRing(enemy.sprite.x, enemy.sprite.y, 0xf97316, 8);
            this.enemies.forEach((other) => {
              if (other !== enemy) {
                const splashDist = Math.hypot(other.sprite.x - enemy.sprite.x, other.sprite.y - enemy.sprite.y);
                if (splashDist < 70) {
                  const splashDmg = Math.round(p.damage * 0.45);
                  this.damageEnemy(other, splashDmg, false);
                }
              }
            });
          }

          if (p.slowOnHit) {
            enemy.slowTimer = 2.0;
          }

          // Tesla Chain Lightning Arc
          if (p.chain) {
            this.triggerChainArc(enemy.sprite.x, enemy.sprite.y);
          }

          p.hitsLeft--;
          if (p.hitsLeft <= 0) {
            hasHit = true;
            break;
          }
        }
      }

      if (hasHit || p.life >= p.maxLife) {
        p.sprite.destroy();
        this.projectiles.splice(i, 1);
      }
    }
  }

  private triggerChainArc(originX: number, originY: number) {
    let targets = 0;
    this.enemies.forEach((enemy) => {
      if (targets < 2) {
        const dist = Math.hypot(enemy.sprite.x - originX, enemy.sprite.y - originY);
        if (dist > 10 && dist < 160) {
          targets++;
          enemy.hp -= 18;
          this.showDamageText(enemy.sprite.x, enemy.sprite.y, 18, false);

          // Draw lightning bolt line
          const lightning = this.add.line(0, 0, originX, originY, enemy.sprite.x, enemy.sprite.y, 0x38bdf8);
          lightning.setLineWidth(2);
          this.time.delayedCall(120, () => lightning.destroy());
        }
      }
    });
  }

  private nextSpawnTime = 0;
  private updateEnemies(dt: number) {
    const now = this.time.now;
    const elapsed = this.getLevelDuration(this.currentLevel) - this.levelTimeRemaining;

    // Faster spawn intervals and higher enemy density in higher sectors
    const densityMult = this.currentLevel === 1 ? 1.0 : this.currentLevel === 2 ? 1.35 : 1.6;
    const spawnInterval = Phaser.Math.Clamp(
      ((1.4 - (elapsed / 60) * 1.0) / (this.configData.dailyDream.spawnRateMultiplier * densityMult)),
      0.25,
      1.8
    ) * 1000;

    if (now >= this.nextSpawnTime) {
      this.nextSpawnTime = now + spawnInterval;
      this.spawnWaveEnemy(elapsed);
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];

      // Check if dead
      if (enemy.hp <= 0) {
        soundSynth.playExplosion(enemy.isBoss || enemy.isSubBoss);
        this.enemiesDefeated++;

        // Combo counter
        const timeSinceLastKill = now - this.lastKillTime;
        if (timeSinceLastKill < 1800) {
          this.comboStreak++;
          if (this.comboStreak === 3) this.callbacks.onComboAlert?.('TRIPLE COMBO!');
          if (this.comboStreak === 5) this.callbacks.onComboAlert?.('RAMPAGE x5!');
          if (this.comboStreak === 10) this.callbacks.onComboAlert?.('ULTRA STREAK x10!');
        } else {
          this.comboStreak = 1;
        }
        this.lastKillTime = now;

        const midasMult = this.activeBonusSkills.has('midas_jackpot') ? 2.0 : 1.0;
        const points = Math.round(enemy.scoreValue * this.configData.difficulty.scoreMultiplier * midasMult);
        this.score += points;
        this.callbacks.onScoreUpdate(this.score);
        this.showScoreText(enemy.sprite.x, enemy.sprite.y, points, enemy.isBoss || enemy.isSubBoss);
        this.spawnParticleRing(enemy.sprite.x, enemy.sprite.y, enemy.isBoss ? 0xa855f7 : enemy.isSubBoss ? 0x06b6d4 : 0xef4444);

        // Charge Avatar Ultimate Essence (Boss: 25, Sub-Boss: 14, Minion: 4)
        this.addEssence(enemy.isBoss ? 25 : enemy.isSubBoss ? 14 : 4.0);

        // Spawn gem
        this.spawnGem(enemy.sprite.x, enemy.sprite.y, enemy.isBoss ? 500 : enemy.isSubBoss ? 250 : 50);

        // Guaranteed skill drop on Bosses & Sub-Bosses; scaled drop rate for normal enemies per level:
        // Sector 1: 6%, Sector 2: 10%, Sector 3: 15%
        const levelDropRates = [0.06, 0.10, 0.15];
        const baseDropRate = levelDropRates[this.currentLevel - 1] ?? 0.10;
        const isHighValue = enemy.isBoss || enemy.isSubBoss;
        if (isHighValue || this.rng.next() < baseDropRate) {
          this.spawnSkillPickup(enemy.sprite.x, enemy.sprite.y);
        }

        if (enemy.isSubBoss) {
          this.callbacks.onComboAlert?.(`⚔️ SUB-BOSS ${enemy.bossName ?? ''} ELIMINATED!`);
          this.cameras.main.shake(250, 0.015);
          this.spawnParticleRing(enemy.sprite.x, enemy.sprite.y, 0x22d3ee, 24);
        }

        if (enemy.isBoss) {
          this.bossesDefeated++;
          this.activeBoss = null;
          this.callbacks.onBossHpUpdate?.(null, 0, 0);
          this.callbacks.onComboAlert?.(`👑 ${enemy.bossName ?? 'BOSS'} VANQUISHED! +${points.toLocaleString()}`);
          this.cameras.main.shake(400, 0.025);
          this.spawnParticleRing(enemy.sprite.x, enemy.sprite.y, 0xfacc15, 36);
          this.spawnParticleRing(enemy.sprite.x, enemy.sprite.y, 0xa855f7, 24);
        }

        enemy.sprite.destroy();
        this.enemies.splice(i, 1);
        continue;
      }

      // Check frozen
      if (enemy.frozenTimer > 0) {
        enemy.frozenTimer -= dt;
        continue; // Do not move while frozen!
      }

      // Boss Cheat Skills & Attacks
      if (enemy.isBoss) {
        enemy.bossSkillTimer = (enemy.bossSkillTimer || 0) + dt;
        if (enemy.bossSkillTimer >= 4.0) {
          enemy.bossSkillTimer = 0;
          this.triggerBossRadialBarrage(enemy.sprite.x, enemy.sprite.y);
        }

        // Sector 1 Boss Cheat Skill: Singularity Vortex Pulse
        if (this.currentLevel === 1) {
          enemy.cheatSkillTimer = (enemy.cheatSkillTimer || 0) + dt;
          if (enemy.cheatSkillTimer >= 6.0) {
            enemy.cheatSkillTimer = 0;
            this.triggerBoss1Singularity(enemy.sprite.x, enemy.sprite.y);
          }
        }

        // Sector 2 Boss Cheat Skills: Scrambler EMP (10s) + NEW Twin Laser Sweep (8s)
        if (this.currentLevel === 2) {
          enemy.cheatSkillTimer = (enemy.cheatSkillTimer || 0) + dt;
          if (enemy.cheatSkillTimer >= 10.0) {
            enemy.cheatSkillTimer = 0;
            this.triggerBossScramblerEMP();
          }

          enemy.cheatSkillTimer2 = (enemy.cheatSkillTimer2 || 0) + dt;
          if (enemy.cheatSkillTimer2 >= 8.0) {
            enemy.cheatSkillTimer2 = 0;
            this.triggerBoss2LaserSweep(enemy);
          }
        }

        // Sector 3 Boss Cheat Skills: Scrambler EMP (10s) + Doomsday Missiles (7s) + Supernova (13s) + Core Pull
        if (this.currentLevel === 3) {
          enemy.cheatSkillTimer = (enemy.cheatSkillTimer || 0) + dt;
          if (enemy.cheatSkillTimer >= 10.0) {
            enemy.cheatSkillTimer = 0;
            this.triggerBossScramblerEMP();
          }

          enemy.cheatSkillTimer2 = (enemy.cheatSkillTimer2 || 0) + dt;
          if (enemy.cheatSkillTimer2 >= 7.0) {
            enemy.cheatSkillTimer2 = 0;
            this.triggerBoss3MissileSwarm(enemy);
          }

          this.bossSupernovaTimer = (this.bossSupernovaTimer || 0) + dt;
          if (this.bossSupernovaTimer >= 13.0) {
            this.bossSupernovaTimer = 0;
            this.triggerBoss3Supernova(enemy);
          }

          const pullDx = enemy.sprite.x - this.playerContainer.x;
          const pullDy = enemy.sprite.y - this.playerContainer.y;
          const pullDist = Math.hypot(pullDx, pullDy);
          if (pullDist > 40 && pullDist < 420) {
            this.vx += (pullDx / pullDist) * 35 * dt;
            this.vy += (pullDy / pullDist) * 35 * dt;
          }
        }
      }

      // Sub-Boss 1 (Apex Voidstalker): Phase Blink Ambush
      if (enemy.type === 'subboss_stalker') {
        enemy.bossSkillTimer = (enemy.bossSkillTimer || 0) + dt;
        if (enemy.bossSkillTimer >= 5.5) {
          enemy.bossSkillTimer = 0;
          this.triggerVoidstalkerBlink(enemy);
        }
      }

      // Sub-Boss 2 (Infernal Siegebeast): Cluster Mine Barrage
      if (enemy.type === 'subboss_siege') {
        enemy.bossSkillTimer = (enemy.bossSkillTimer || 0) + dt;
        if (enemy.bossSkillTimer >= 6.0) {
          enemy.bossSkillTimer = 0;
          this.triggerSiegeMines(enemy);
        }
      }

      // Handle slow timer and progressive level speed scaling
      const levelSpeedMult = this.currentLevel === 1 ? 1.0 : this.currentLevel === 2 ? 1.35 : 1.70;
      const isHyperRush = this.levelTimeRemaining <= 10;
      const rushSpeedMult = isHyperRush ? 1.5 : 1.0;
      let speed = enemy.speed * this.configData.difficulty.difficultyMultiplier * levelSpeedMult * rushSpeedMult;

      if (enemy.slowTimer > 0) {
        enemy.slowTimer -= dt;
        speed *= 0.55;
      }

      // Move toward player
      const dx = this.playerContainer.x - enemy.sprite.x;
      const dy = this.playerContainer.y - enemy.sprite.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 5) {
        enemy.sprite.x += (dx / dist) * speed * dt;
        enemy.sprite.y += (dy / dist) * speed * dt;
      }

      // Damage player on contact
      const contactRadius = enemy.isBoss ? 44 : enemy.isSubBoss ? 32 : 22;
      if (dist < contactRadius) {
        if (!this.isShielded) {
          const dmg = enemy.isBoss ? 30 : enemy.isSubBoss ? 20 : 12;
          this.takeDamage(dmg);
        }
        this.vx += (dx / dist) * 120;
        this.vy += (dy / dist) * 120;
      }
    }
  }

  private getLevelDuration(level: number): number {
    if (level === 1) return 60;
    if (level === 2) return 90;
    return 120;
  }

  private advanceToNextLevel() {
    this.currentLevel++;
    const duration = this.getLevelDuration(this.currentLevel);
    this.levelTimeRemaining = duration;
    this.lastReportedTime = duration;

    // Reset boss / sub-boss states for the new sector
    this.subBoss1Spawned = false;
    this.subBoss2Spawned = false;
    this.mainBossSpawned = false;
    this.bossSpawned = false;
    this.activeBoss = null;
    this.hyperSurgeTriggered = false;
    this.bossSupernovaTimer = 0;

    // Sector Completion Bonus Score & HP Repair
    const bonusPoints = this.currentLevel === 2 ? 3500 : 6000;
    this.score += bonusPoints;
    this.callbacks.onScoreUpdate(this.score);

    this.hp = Math.min(this.maxHp, this.hp + 35);
    this.callbacks.onHpUpdate(this.hp, this.maxHp);

    soundSynth.playLevelUp();
    soundSynth.triggerHaptic(100);
    this.cameras.main.flash(350, 255, 255, 255);
    this.cameras.main.shake(400, 0.025);

    this.callbacks.onComboAlert?.(`🚀 ADVANCED TO SECTOR ${this.currentLevel}! +${bonusPoints.toLocaleString()} PTS`);
    this.callbacks.onChaosAlert(`WARP: ${this.levelNames[this.currentLevel - 1].toUpperCase()}`);
    this.callbacks.onLevelUpdate?.(
      this.currentLevel,
      this.totalLevels,
      this.levelNames[this.currentLevel - 1],
      Math.ceil(this.levelTimeRemaining)
    );

    // Vaporize minor non-boss enemies to give breathing room for the new sector
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (!e.isBoss && !e.isSubBoss) {
        e.sprite.destroy();
        this.enemies.splice(i, 1);
      }
    }
  }

  private spawnSubBossStalker() {
    soundSynth.playBossAlert();
    this.cameras.main.shake(350, 0.02);
    this.callbacks.onComboAlert?.('⚠️ SUB-BOSS ALERT: APEX VOIDSTALKER INBOUND!');

    const { width } = this.scale;
    const x = this.rng.next() < 0.5 ? 90 : width - 90;
    const y = 90;

    const container = this.add.container(x, y);

    // Neon cyan & violet hunter aesthetic
    const aura = this.add.circle(0, 0, 32, 0x06b6d4, 0.3);
    const body = this.add.polygon(0, 0, [
      0, -24,
      18, 0,
      10, 20,
      -10, 20,
      -18, 0
    ], 0x4f46e5);
    body.setStrokeStyle(2, 0x22d3ee);

    const eye = this.add.circle(0, -6, 7, 0xf43f5e);
    eye.setStrokeStyle(1.5, 0xffffff);

    // Kinetic barrier shield ring
    const shieldGlow = this.add.circle(0, 0, 38, 0x38bdf8, 0.25);
    shieldGlow.setStrokeStyle(2, 0x38bdf8, 0.85);

    const label = this.add.text(0, -32, 'APEX VOIDSTALKER', {
      fontFamily: 'monospace',
      fontSize: '8px',
      fontStyle: 'bold',
      color: '#22d3ee',
    });
    label.setOrigin(0.5);

    container.add([shieldGlow, aura, body, eye, label]);

    this.tweens.add({
      targets: shieldGlow,
      scale: 1.15,
      alpha: 0.1,
      duration: 650,
      yoyo: true,
      repeat: -1,
    });

    const hp = Math.round(400 * this.configData.difficulty.difficultyMultiplier * (this.currentLevel === 3 ? 1.25 : 1.0));
    const shield = Math.round(220 * this.configData.difficulty.difficultyMultiplier);

    const enemy: Enemy = {
      sprite: container,
      type: 'subboss_stalker',
      hp,
      maxHp: hp,
      shield,
      maxShield: shield,
      shieldSprite: shieldGlow,
      speed: 110,
      scoreValue: 1800,
      slowTimer: 0,
      frozenTimer: 0,
      isSubBoss: true,
      bossSkillTimer: 0,
      bossName: 'APEX VOIDSTALKER',
    };

    this.enemies.push(enemy);
  }

  private spawnSubBossSiege() {
    soundSynth.playBossAlert();
    this.cameras.main.shake(400, 0.025);
    this.callbacks.onComboAlert?.('💣 SUB-BOSS ALERT: INFERNAL SIEGEBEAST DEPLOYED!');

    const { width, height } = this.scale;
    const x = width / 2;
    const y = height - 90;

    const container = this.add.container(x, y);

    // Armored crimson heavy dread-brute
    const aura = this.add.circle(0, 0, 38, 0xef4444, 0.35);
    const body = this.add.rectangle(0, 0, 46, 46, 0x991b1b);
    body.setStrokeStyle(3, 0xf97316);

    const core = this.add.circle(0, 0, 12, 0xfacc15);
    core.setStrokeStyle(2, 0xffffff);

    // Kinetic barrier shield ring
    const shieldGlow = this.add.circle(0, 0, 46, 0x38bdf8, 0.25);
    shieldGlow.setStrokeStyle(2, 0x38bdf8, 0.85);

    const label = this.add.text(0, -32, 'INFERNAL SIEGEBEAST', {
      fontFamily: 'monospace',
      fontSize: '8px',
      fontStyle: 'bold',
      color: '#f97316',
    });
    label.setOrigin(0.5);

    container.add([shieldGlow, aura, body, core, label]);

    this.tweens.add({
      targets: shieldGlow,
      scale: 1.15,
      alpha: 0.1,
      duration: 650,
      yoyo: true,
      repeat: -1,
    });

    const hp = Math.round(600 * this.configData.difficulty.difficultyMultiplier);
    const shield = Math.round(300 * this.configData.difficulty.difficultyMultiplier);

    const enemy: Enemy = {
      sprite: container,
      type: 'subboss_siege',
      hp,
      maxHp: hp,
      shield,
      maxShield: shield,
      shieldSprite: shieldGlow,
      speed: 55,
      scoreValue: 2200,
      slowTimer: 0,
      frozenTimer: 0,
      isSubBoss: true,
      bossSkillTimer: 0,
      bossName: 'INFERNAL SIEGEBEAST',
    };

    this.enemies.push(enemy);
  }

  private spawnMainBoss(level: number) {
    this.bossSpawned = true;
    soundSynth.playBossSiren();
    this.cameras.main.shake(450, 0.025);

    const { width } = this.scale;
    const bx = width / 2;
    const by = 80;

    const bossContainer = this.add.container(bx, by);

    const isOmega = level === 3;
    const isBeta = level === 2;

    const bossName = isOmega
      ? 'OMEGA DREADNOUGHT PRIME'
      : isBeta
      ? 'VOID COLOSSUS OVERCHARGED'
      : 'VOID COLOSSUS';

    this.callbacks.onComboAlert?.(`⚠️ WARNING: ${bossName} EMERGES!`);

    // Aura & Body styling per sector
    const auraColor = isOmega ? 0xef4444 : isBeta ? 0x06b6d4 : 0xa855f7;
    const bodyColor = isOmega ? 0x450a0a : isBeta ? 0x083344 : 0x581c87;
    const strokeColor = isOmega ? 0xfacc15 : isBeta ? 0x38bdf8 : 0xd8b4fe;

    const aura = this.add.circle(0, 0, isOmega ? 58 : 48, auraColor, 0.35);
    const body = this.add.rectangle(0, 0, isOmega ? 68 : 56, isOmega ? 68 : 56, bodyColor);
    body.setStrokeStyle(3, strokeColor);

    const eye = this.add.circle(0, 0, isOmega ? 18 : 14, isOmega ? 0xfacc15 : 0xef4444);
    eye.setStrokeStyle(2, 0xffffff);

    // Glowing Kinetic Barrier Shield
    const shieldRadius = isOmega ? 70 : 58;
    const shieldGlow = this.add.circle(0, 0, shieldRadius, 0x38bdf8, 0.3);
    shieldGlow.setStrokeStyle(2.5, 0x38bdf8, 0.9);

    const label = this.add.text(0, isOmega ? -46 : -38, bossName, {
      fontFamily: 'monospace',
      fontSize: '8px',
      fontStyle: 'bold',
      color: `#${strokeColor.toString(16).padStart(6, '0')}`,
    });
    label.setOrigin(0.5);

    bossContainer.add([shieldGlow, aura, body, eye, label]);

    this.tweens.add({
      targets: shieldGlow,
      scale: 1.15,
      alpha: 0.12,
      duration: 700,
      yoyo: true,
      repeat: -1,
    });

    const baseHp = isOmega ? 2000 : isBeta ? 1350 : 800;
    const baseShield = isOmega ? 900 : isBeta ? 600 : 350;

    const bossHp = Math.round(baseHp * this.configData.difficulty.difficultyMultiplier);
    const bossShield = Math.round(baseShield * this.configData.difficulty.difficultyMultiplier);

    const bossEnemy: Enemy = {
      sprite: bossContainer,
      type: 'boss',
      hp: bossHp,
      maxHp: bossHp,
      shield: bossShield,
      maxShield: bossShield,
      shieldSprite: shieldGlow,
      speed: isOmega ? 52 : 48,
      scoreValue: isOmega ? 5000 : isBeta ? 3500 : 2500,
      slowTimer: 0,
      frozenTimer: 0,
      isBoss: true,
      bossSkillTimer: 0,
      cheatSkillTimer: 0,
      cheatSkillTimer2: 0,
      bossName,
    };

    this.activeBoss = bossEnemy;
    this.enemies.push(bossEnemy);

    if (this.callbacks.onBossHpUpdate) {
      this.callbacks.onBossHpUpdate(bossName, bossHp, bossHp, bossShield, bossShield);
    }
  }

  // Boss 1 Cheat Skill: Singularity Vortex Pulse
  private triggerBoss1Singularity(bx: number, by: number) {
    soundSynth.playLaser(true);
    soundSynth.triggerHaptic(60);
    this.cameras.main.shake(250, 0.015);
    this.callbacks.onChaosAlert('⚠️ VOID SINGULARITY ORBS DEPLOYED!');

    const baseAngle = Math.atan2(this.playerContainer.y - by, this.playerContainer.x - bx);
    [-0.3, 0, 0.3].forEach((offset) => {
      const angle = baseAngle + offset;
      const orb = this.add.circle(bx, by, 12, 0x7c3aed, 0.7);
      orb.setStrokeStyle(2, 0xc084fc);
      const core = this.add.circle(bx, by, 5, 0x000000);

      this.hazards.push({
        circle: orb,
        timer: 3.5,
        x: bx,
        y: by,
        radius: 16,
      });

      this.tweens.add({
        targets: [orb, core],
        x: bx + Math.cos(angle) * 420,
        y: by + Math.sin(angle) * 420,
        duration: 2600,
        onUpdate: () => {
          // Gravitational pull on player
          const d = Math.hypot(this.playerContainer.x - orb.x, this.playerContainer.y - orb.y);
          if (d > 20 && d < 180) {
            this.vx += ((orb.x - this.playerContainer.x) / d) * 40 * (1 / 60);
            this.vy += ((orb.y - this.playerContainer.y) / d) * 40 * (1 / 60);
          }
          if (d < 22 && !this.isShielded) {
            this.takeDamage(20);
            this.spawnParticleRing(orb.x, orb.y, 0x7c3aed, 16);
            orb.destroy();
            core.destroy();
          }
        },
        onComplete: () => {
          orb.destroy();
          core.destroy();
        },
      });
    });
  }

  // Boss 2 NEW Cheat Skill: Twin Hyper Laser Sweepers
  private triggerBoss2LaserSweep(boss: Enemy) {
    soundSynth.playLaser(true);
    soundSynth.triggerHaptic(80);
    this.cameras.main.shake(300, 0.02);
    this.callbacks.onChaosAlert('⚡ DUAL LASER SWEEPERS ENGAGED! DODGE!');

    const { width, height } = this.scale;
    const sweepGraphics = this.add.graphics();
    let currentSweepAngle = 0;

    const sweepTween = this.tweens.addCounter({
      from: 0,
      to: Math.PI * 1.1,
      duration: 2200,
      onUpdate: () => {
        if (!boss.sprite.active) {
          sweepGraphics.clear();
          sweepTween.stop();
          return;
        }

        currentSweepAngle = sweepTween.getValue() ?? 0;
        sweepGraphics.clear();

        const bx = boss.sprite.x;
        const by = boss.sprite.y;

        // Beam 1 & Beam 2
        [currentSweepAngle, currentSweepAngle + Math.PI].forEach((angle) => {
          const endX = bx + Math.cos(angle) * 600;
          const endY = by + Math.sin(angle) * 600;

          sweepGraphics.lineStyle(6, 0x06b6d4, 0.7);
          sweepGraphics.strokeLineShape(new Phaser.Geom.Line(bx, by, endX, endY));
          sweepGraphics.lineStyle(2, 0xffffff, 1.0);
          sweepGraphics.strokeLineShape(new Phaser.Geom.Line(bx, by, endX, endY));

          // Check distance between player and beam line
          const line = new Phaser.Geom.Line(bx, by, endX, endY);
          const pt = new Phaser.Geom.Point(this.playerContainer.x, this.playerContainer.y);
          const closest = Phaser.Geom.Line.GetNearestPoint(line, pt);
          const distToBeam = Math.hypot(this.playerContainer.x - closest.x, this.playerContainer.y - closest.y);

          if (distToBeam < 16 && !this.isShielded) {
            this.takeDamage(18);
            this.spawnParticleRing(this.playerContainer.x, this.playerContainer.y, 0x06b6d4, 10);
          }
        });
      },
      onComplete: () => {
        sweepGraphics.clear();
        sweepGraphics.destroy();
      },
    });
  }

  // Boss 3 NEW Cheat Skill 1: Doomsday Cluster Missile Swarm
  private triggerBoss3MissileSwarm(boss: Enemy) {
    soundSynth.playLaser(true);
    soundSynth.triggerHaptic(75);
    this.callbacks.onChaosAlert('🚀 DOOMSDAY MISSILE SALVO LOCKING ON!');

    const count = 5;
    for (let i = 0; i < count; i++) {
      this.time.delayedCall(i * 140, () => {
        if (!boss.sprite.active) return;
        const missile = this.add.circle(boss.sprite.x, boss.sprite.y, 6, 0xef4444);
        missile.setStrokeStyle(1.5, 0xfacc15);

        let missileLife = 0;
        let mvx = (Math.random() - 0.5) * 150;
        let mvy = 60 + Math.random() * 80;

        const updateEvent = this.time.addEvent({
          delay: 35,
          repeat: 70,
          callback: () => {
            if (!missile.active) {
              updateEvent.remove();
              return;
            }
            missileLife += 0.035;

            // Homing trajectory
            const targetDx = this.playerContainer.x - missile.x;
            const targetDy = this.playerContainer.y - missile.y;
            const targetDist = Math.hypot(targetDx, targetDy);

            if (targetDist > 10) {
              mvx += (targetDx / targetDist) * 320 * 0.035;
              mvy += (targetDy / targetDist) * 320 * 0.035;
            }

            const curSpeed = Math.hypot(mvx, mvy);
            const maxSpeed = 220;
            if (curSpeed > maxSpeed) {
              mvx = (mvx / curSpeed) * maxSpeed;
              mvy = (mvy / curSpeed) * maxSpeed;
            }

            missile.x += mvx * 0.035;
            missile.y += mvy * 0.035;

            // Collision check
            if (targetDist < 18) {
              updateEvent.remove();
              soundSynth.playExplosion(false);
              this.spawnParticleRing(missile.x, missile.y, 0xef4444, 16);
              if (!this.isShielded) {
                this.takeDamage(18);
              }
              missile.destroy();
            } else if (missileLife >= 2.5) {
              updateEvent.remove();
              missile.destroy();
            }
          },
        });
      });
    }
  }

  // Boss 3 NEW Cheat Skill 2: Hyper Singularity Supernova
  private triggerBoss3Supernova(boss: Enemy) {
    soundSynth.playBossAlert();
    this.cameras.main.flash(400, 239, 68, 68);
    this.cameras.main.shake(500, 0.03);
    this.callbacks.onChaosAlert('🌌 OMEGA SUPERNOVA FORMING AT CORE!');
    this.callbacks.onComboAlert?.('⚠️ GRAVITATIONAL SINGULARITY: EVACUATE CORE!');

    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    const singularity = this.add.circle(cx, cy, 20, 0x450a0a, 0.8);
    singularity.setStrokeStyle(3, 0xfacc15);

    const pullTimer = this.time.addEvent({
      delay: 50,
      repeat: 55,
      callback: () => {
        if (!singularity.active) return;
        const pdx = cx - this.playerContainer.x;
        const pdy = cy - this.playerContainer.y;
        const pdist = Math.hypot(pdx, pdy);
        if (pdist > 25 && pdist < 450) {
          this.vx += (pdx / pdist) * 90 * (1 / 20);
          this.vy += (pdy / pdist) * 90 * (1 / 20);
        }
      },
    });

    this.tweens.add({
      targets: singularity,
      scale: 3.5,
      alpha: 0.95,
      duration: 2700,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        pullTimer.remove();
        soundSynth.playExplosion(true);
        this.cameras.main.flash(300, 255, 255, 255);
        this.cameras.main.shake(400, 0.025);
        this.spawnParticleRing(cx, cy, 0xfacc15, 36);

        // 16-bullet nova burst
        const bulletCount = 16;
        for (let b = 0; b < bulletCount; b++) {
          const bAngle = (b / bulletCount) * Math.PI * 2;
          const bullet = this.add.circle(cx, cy, 6, 0xef4444);
          bullet.setStrokeStyle(1.5, 0xffffff);

          this.hazards.push({
            circle: bullet,
            timer: 2.5,
            x: cx,
            y: cy,
            radius: 12,
          });

          this.tweens.add({
            targets: bullet,
            x: cx + Math.cos(bAngle) * 450,
            y: cy + Math.sin(bAngle) * 450,
            duration: 2000,
            onUpdate: () => {
              const d = Math.hypot(this.playerContainer.x - bullet.x, this.playerContainer.y - bullet.y);
              if (d < 18 && !this.isShielded) {
                this.takeDamage(16);
                bullet.destroy();
              }
            },
            onComplete: () => bullet.destroy(),
          });
        }

        singularity.destroy();
      },
    });
  }

  private triggerVoidstalkerBlink(stalker: Enemy) {
    soundSynth.playLaser(true);
    soundSynth.triggerHaptic(60);
    this.cameras.main.shake(200, 0.015);

    // Particle flash at origin
    this.spawnParticleRing(stalker.sprite.x, stalker.sprite.y, 0x06b6d4, 18);

    // Teleport 95px behind player's movement trajectory
    const moveLen = Math.hypot(this.vx, this.vy);
    const dirAngle = moveLen > 10 ? Math.atan2(this.vy, this.vx) : this.aimAngle;
    const behindAngle = dirAngle + Math.PI;

    const { width, height } = this.scale;
    const targetX = Phaser.Math.Clamp(this.playerContainer.x + Math.cos(behindAngle) * 95, 60, width - 60);
    const targetY = Phaser.Math.Clamp(this.playerContainer.y + Math.sin(behindAngle) * 95, 60, height - 60);

    stalker.sprite.setPosition(targetX, targetY);
    this.spawnParticleRing(targetX, targetY, 0xf43f5e, 22);

    this.callbacks.onChaosAlert('⚠️ VOIDSTALKER PHASE BLINKED BEHIND YOU!');

    // Fire 3 fast plasma bolts at the player's back
    const angleToPlayer = Math.atan2(this.playerContainer.y - targetY, this.playerContainer.x - targetX);
    [-0.2, 0, 0.2].forEach((offset) => {
      const bullet = this.add.circle(targetX, targetY, 5, 0x22d3ee);
      bullet.setStrokeStyle(1.5, 0xffffff);
      this.hazards.push({
        circle: bullet,
        timer: 2.5,
        x: targetX,
        y: targetY,
        radius: 10,
      });
      this.tweens.add({
        targets: bullet,
        x: targetX + Math.cos(angleToPlayer + offset) * 450,
        y: targetY + Math.sin(angleToPlayer + offset) * 450,
        duration: 1500,
        onUpdate: () => {
          const d = Math.hypot(this.playerContainer.x - bullet.x, this.playerContainer.y - bullet.y);
          if (d < 18 && !this.isShielded) {
            this.takeDamage(15);
            bullet.destroy();
          }
        },
        onComplete: () => bullet.destroy(),
      });
    });
  }

  private triggerSiegeMines(siege: Enemy) {
    soundSynth.playExplosion(false);
    this.cameras.main.shake(250, 0.015);
    this.callbacks.onChaosAlert('💣 SIEGEBEAST DEPLOYED CLUSTER MINES!');

    const { width, height } = this.scale;
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + (Math.random() * 0.4 - 0.2);
      const dist = 90 + Math.random() * 40;
      const mx = Phaser.Math.Clamp(this.playerContainer.x + Math.cos(angle) * dist, 50, width - 50);
      const my = Phaser.Math.Clamp(this.playerContainer.y + Math.sin(angle) * dist, 50, height - 50);

      const mine = this.add.circle(mx, my, 8, 0xef4444);
      mine.setStrokeStyle(2, 0xfacc15);

      const warningRing = this.add.circle(mx, my, 28, 0xef4444, 0.18);
      warningRing.setStrokeStyle(1.5, 0xf97316);

      this.tweens.add({
        targets: [mine, warningRing],
        scale: 1.25,
        alpha: 0.4,
        duration: 400,
        yoyo: true,
        repeat: 5,
        onComplete: () => {
          mine.destroy();
          warningRing.destroy();
        },
      });

      this.hazards.push({
        circle: mine,
        timer: 3.2,
        x: mx,
        y: my,
        radius: 26,
      });

      const checkTimer = this.time.addEvent({
        delay: 80,
        repeat: 35,
        callback: () => {
          if (!mine.active) return;
          const d = Math.hypot(this.playerContainer.x - mine.x, this.playerContainer.y - mine.y);
          if (d < 28) {
            checkTimer.remove();
            soundSynth.playExplosion(false);
            this.spawnParticleRing(mine.x, mine.y, 0xef4444, 20);
            if (!this.isShielded) {
              this.takeDamage(24);
            }
            mine.destroy();
            warningRing.destroy();
          }
        },
      });
    }
  }

  private triggerBossScramblerEMP() {
    this.isAimScrambled = true;
    this.scrambleTimer = 7.0;

    soundSynth.playBossAlert();
    soundSynth.triggerHaptic(90);
    this.cameras.main.flash(300, 239, 68, 68);
    this.cameras.main.shake(400, 0.025);

    this.callbacks.onChaosAlert('⚠️ EMP SCRAMBLER ACTIVATED! MANUAL AIM ONLY!');
    this.callbacks.onComboAlert?.('⚡ AUTO-AIM JAMMED FOR 7 SECONDS!');
    this.callbacks.onAutoAimStatus?.(this.autoAimEnabled, true);

    if (this.activeBoss) {
      for (let i = 0; i < 3; i++) {
        this.time.delayedCall(i * 180, () => {
          if (!this.activeBoss) return;
          const ring = this.add.circle(this.activeBoss.sprite.x, this.activeBoss.sprite.y, 30, 0xef4444, 0.5);
          ring.setStrokeStyle(3, 0xfacc15);
          this.tweens.add({
            targets: ring,
            scale: 14,
            alpha: 0,
            duration: 800,
            onComplete: () => ring.destroy(),
          });
        });
      }
    }
  }

  private triggerHyperSurge() {
    this.hyperSurgeTriggered = true;
    soundSynth.playBossAlert();
    this.cameras.main.shake(400, 0.02);
    this.callbacks.onComboAlert?.('⚠️ HYPER SURGE: FINAL 10 SECONDS!');

    const { width, height } = this.scale;
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const x = width / 2 + Math.cos(angle) * (width * 0.45);
      const y = height / 2 + Math.sin(angle) * (height * 0.45);

      const container = this.add.container(x, y);
      const waspBody = this.add.triangle(0, 0, 0, -12, 12, 12, -12, 12, 0xef4444);
      waspBody.setStrokeStyle(1.5, 0xffffff);
      container.add(waspBody);

      this.enemies.push({
        sprite: container,
        type: 'wasp',
        hp: 20,
        maxHp: 20,
        speed: 160,
        scoreValue: 400,
        slowTimer: 0,
        frozenTimer: 0,
      });

      this.spawnParticleRing(x, y, 0xef4444, 10);
    }
  }

  private levelUpOverclock() {
    this.overclockLevel++;
    if (this.overclockLevel === 2) {
      this.nextOverclockExp = 750;
      this.callbacks.onComboAlert?.('⚡ OVERCLOCK LVL 2: SPREAD MATRIX!');
    } else if (this.overclockLevel === 3) {
      this.nextOverclockExp = 1800;
      this.callbacks.onComboAlert?.('🔥 OVERCLOCK LVL 3: EXPLOSIVE PLASMA!');
    } else if (this.overclockLevel >= 4) {
      this.overclockLevel = 4;
      this.nextOverclockExp = 999999;
      this.callbacks.onComboAlert?.('🌟 MAX OVERCLOCK GOD MODE!');
    }

    soundSynth.playLevelUp();
    this.cameras.main.shake(250, 0.015);
    this.spawnParticleRing(this.playerContainer.x, this.playerContainer.y, 0xfacc15, 24);

    if (this.overclockAura) {
      this.overclockAura.setAlpha(0.7);
      this.tweens.add({
        targets: this.overclockAura,
        scale: 1.35,
        alpha: 0.3,
        duration: 500,
        yoyo: true,
        repeat: -1,
      });
    }

    this.callbacks.onOverclockUpdate?.(this.overclockLevel, this.overclockExp, this.nextOverclockExp);
  }

  private triggerBossRadialBarrage(bx: number, by: number) {
    soundSynth.playLaser(true);
    const count = 10;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const bullet = this.add.circle(bx, by, 7, 0xef4444);
      bullet.setStrokeStyle(1.5, 0xffffff);

      this.hazards.push({
        circle: bullet,
        timer: 3.0,
        x: bx,
        y: by,
        radius: 12,
      });

      this.tweens.add({
        targets: bullet,
        x: bx + Math.cos(angle) * 500,
        y: by + Math.sin(angle) * 500,
        duration: 2500,
        onUpdate: () => {
          const dist = Math.hypot(this.playerContainer.x - bullet.x, this.playerContainer.y - bullet.y);
          if (dist < 22 && !this.isShielded) {
            this.takeDamage(18);
            bullet.destroy();
          }
        },
        onComplete: () => bullet.destroy(),
      });
    }
  }

  private spawnSkillPickup(x: number, y: number) {
    const skills: BonusSkillType[] = [
      'hyper_firerate',
      'orbital_shield',
      'nuke_bomb',
      'cryo_blast',
      'homing_missiles',
      'chain_lightning',
      'speed_warp',
      'vampire_heal',
      'midas_jackpot',
      'magnet_overdrive',
    ];
    const picked = this.rng.pick(skills);
    const meta = BONUS_SKILL_META[picked];

    // Ensure power-up crate never spawns off-screen or unreachable at the edge
    const clampedX = Phaser.Math.Clamp(x, 65, this.scale.width - 65);
    const clampedY = Phaser.Math.Clamp(y, 65, this.scale.height - 65);

    const container = this.add.container(clampedX, clampedY);

    // Outer pulsating beacon ring
    const beacon = this.add.circle(0, 0, 24, meta.color, 0.25);
    beacon.setStrokeStyle(2, meta.color, 0.8);

    // High-tech diamond crystal crate
    const diamond = this.add.rectangle(0, 0, 22, 22, meta.color);
    diamond.setAngle(45);
    diamond.setStrokeStyle(2, 0xffffff);

    // Inner glowing core
    const centerCore = this.add.circle(0, 0, 5, 0xffffff);

    // Floating text label badge above pickup
    const badgeBg = this.add.rectangle(0, -22, 110, 14, 0x000000, 0.85);
    badgeBg.setStrokeStyle(1, meta.color);
    const label = this.add.text(0, -22, meta.name.toUpperCase(), {
      fontFamily: 'monospace',
      fontSize: '8px',
      fontStyle: 'bold',
      color: meta.hex,
    });
    label.setOrigin(0.5);

    container.add([beacon, diamond, centerCore, badgeBg, label]);

    // Bobbing and pulse tweens
    this.tweens.add({
      targets: beacon,
      scale: 1.4,
      alpha: 0.1,
      duration: 750,
      yoyo: true,
      repeat: -1,
    });

    this.tweens.add({
      targets: [diamond, centerCore],
      y: -4,
      duration: 650,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.skillPickups.push({ container, type: picked, x: clampedX, y: clampedY, meta });
  }

  private spawnGem(x: number, y: number, value: number) {
    const clampedX = Phaser.Math.Clamp(x, 40, this.scale.width - 40);
    const clampedY = Phaser.Math.Clamp(y, 40, this.scale.height - 40);
    const gem = this.add.circle(clampedX, clampedY, 4, 0xfacc15);
    gem.setStrokeStyle(1, 0xffffff);
    this.gems.push({ sprite: gem, x: clampedX, y: clampedY, value });
  }

  private updatePickups(dt: number) {
    const magnetRange = this.activeBonusSkills.has('magnet_overdrive') ? 650 : 120;
    const px = this.playerContainer.x;
    const py = this.playerContainer.y;

    // Gems magnet & collection
    for (let i = this.gems.length - 1; i >= 0; i--) {
      const g = this.gems[i];
      const dist = Math.hypot(px - g.sprite.x, py - g.sprite.y);

      if (dist < magnetRange) {
        // Fly towards player
        const speed = 400 + (magnetRange - dist);
        g.sprite.x += ((px - g.sprite.x) / dist) * speed * dt;
        g.sprite.y += ((py - g.sprite.y) / dist) * speed * dt;
      }

      if (dist < 24) {
        soundSynth.playCoin();
        const midasMult = this.activeBonusSkills.has('midas_jackpot') ? 2.0 : 1.0;
        const val = Math.round(g.value * midasMult);
        this.score += val;
        this.callbacks.onScoreUpdate(this.score);
        this.showScoreText(g.sprite.x, g.sprite.y, val, val >= 500);

        // Essence charging from gem
        this.addEssence(g.value >= 500 ? 12 : 1.2);

        // Overclock EXP Progression
        this.overclockExp += g.value;
        if (this.overclockLevel < 4 && this.overclockExp >= this.nextOverclockExp) {
          this.levelUpOverclock();
        } else {
          this.callbacks.onOverclockUpdate?.(this.overclockLevel, this.overclockExp, this.nextOverclockExp);
        }

        g.sprite.destroy();
        this.gems.splice(i, 1);
      }
    }

    // Skill Pickups: require physical player collision (NO MAGNET SUCTION)
    for (let i = this.skillPickups.length - 1; i >= 0; i--) {
      const p = this.skillPickups[i];
      const dist = Math.hypot(px - p.container.x, py - p.container.y);

      // Player must physically move to and touch the crate to collect it
      if (dist < 32) {
        this.grantBonusSkill(p.type);
        p.container.destroy();
        this.skillPickups.splice(i, 1);
      }
    }
  }

  private spawnWaveEnemy(elapsedSeconds: number) {
    const { width, height } = this.scale;

    const edge = this.rng.nextInt(0, 3);
    let x = 0;
    let y = 0;
    if (edge === 0) {
      x = this.rng.nextInt(0, width);
      y = -20;
    } else if (edge === 1) {
      x = width + 20;
      y = this.rng.nextInt(0, height);
    } else if (edge === 2) {
      x = this.rng.nextInt(0, width);
      y = height + 20;
    } else {
      x = -20;
      y = this.rng.nextInt(0, height);
    }

    let type: 'drone' | 'wasp' | 'brute' = 'drone';
    if (elapsedSeconds >= 45) {
      const roll = this.rng.next();
      type = roll < 0.35 ? 'brute' : roll < 0.65 ? 'wasp' : 'drone';
    } else if (elapsedSeconds >= 30) {
      const roll = this.rng.next();
      type = roll < 0.25 ? 'brute' : roll < 0.65 ? 'wasp' : 'drone';
    } else if (elapsedSeconds >= 15) {
      type = this.rng.next() < 0.4 ? 'wasp' : 'drone';
    }

    const container = this.add.container(x, y);

    const levelSpeedFactor = this.currentLevel === 1 ? 1.0 : this.currentLevel === 2 ? 1.3 : 1.5;
    let hp = 15;
    let speed = 90 * levelSpeedFactor;
    let scoreVal = 100;

    if (type === 'wasp') {
      hp = 12;
      speed = 145 * levelSpeedFactor;
      scoreVal = 150;
      const waspBody = this.add.triangle(0, 0, 0, -12, 12, 12, -12, 12, 0xf59e0b);
      container.add(waspBody);
    } else if (type === 'brute') {
      hp = 65;
      speed = 60 * levelSpeedFactor;
      scoreVal = 300;
      const bruteBody = this.add.rectangle(0, 0, 28, 28, 0xef4444);
      bruteBody.setStrokeStyle(2, 0xffffff);
      container.add(bruteBody);
    } else {
      hp = 18;
      speed = 95 * levelSpeedFactor;
      scoreVal = 100;
      const droneBody = this.add.circle(0, 0, 12, 0x8b5cf6);
      droneBody.setStrokeStyle(1.5, 0xc084fc);
      container.add(droneBody);
    }

    this.enemies.push({
      sprite: container,
      type,
      hp,
      maxHp: hp,
      speed,
      scoreValue: scoreVal,
      slowTimer: 0,
      frozenTimer: 0,
    });
  }

  private takeDamage(amount: number) {
    if (this.isShielded || this.isFinished) return;

    this.hp = Math.max(0, this.hp - amount);
    this.callbacks.onHpUpdate(this.hp, this.maxHp);
    soundSynth.playHit();
    soundSynth.triggerHaptic(40);
    this.cameras.main.shake(120, 0.01);

    if (this.hp <= this.maxHp * 0.25 && this.hp > 0) {
      soundSynth.playHeartbeat();
      this.cameras.main.flash(120, 255, 0, 0);
    }

    if (this.hp <= 0) {
      this.handleGameOver();
    }
  }

  private damageEnemy(enemy: Enemy, amount: number, crit = false) {
    let dealtDamage = amount;
    if (enemy.shield && enemy.shield > 0) {
      if (enemy.shield >= dealtDamage) {
        enemy.shield -= dealtDamage;
        this.showDamageText(enemy.sprite.x, enemy.sprite.y, `SHIELD -${Math.round(dealtDamage)}`, false, '#38bdf8');
        this.spawnParticleRing(enemy.sprite.x, enemy.sprite.y, 0x38bdf8, 6);
        soundSynth.playHit();
        dealtDamage = 0;
      } else {
        dealtDamage -= enemy.shield;
        enemy.shield = 0;
        this.showDamageText(enemy.sprite.x, enemy.sprite.y, 'SHIELD BROKEN!', true, '#38bdf8');
        this.spawnParticleRing(enemy.sprite.x, enemy.sprite.y, 0x38bdf8, 20);
        soundSynth.playExplosion(false);
        this.cameras.main.shake(150, 0.015);
        if (enemy.shieldSprite) {
          enemy.shieldSprite.destroy();
          enemy.shieldSprite = undefined;
        }
      }
    }

    if (dealtDamage > 0) {
      enemy.hp -= dealtDamage;
      this.showDamageText(enemy.sprite.x, enemy.sprite.y, Math.round(dealtDamage), crit);
      soundSynth.playHit();
    }

    if (enemy.isBoss && this.callbacks.onBossHpUpdate) {
      this.callbacks.onBossHpUpdate(
        enemy.bossName ?? 'BOSS',
        Math.max(0, enemy.hp),
        enemy.maxHp,
        enemy.shield,
        enemy.maxShield
      );
    }
  }

  private showDamageText(x: number, y: number, textOrDmg: number | string, crit: boolean, customColor?: string) {
    const display = typeof textOrDmg === 'number' ? (crit ? `CRIT! -${textOrDmg}` : `-${textOrDmg}`) : textOrDmg;
    const color = customColor || (crit ? '#facc15' : '#ffffff');
    const text = this.add.text(x, y - 10, display, {
      fontFamily: 'monospace',
      fontSize: crit ? '14px' : '11px',
      color,
      fontStyle: crit ? 'bold' : 'normal',
    });
    text.setOrigin(0.5);

    this.tweens.add({
      targets: text,
      y: y - 30,
      alpha: 0,
      duration: 650,
      onComplete: () => {
        text.destroy();
      },
    });
  }

  private showScoreText(x: number, y: number, points: number, isMajor = false) {
    const text = this.add.text(x, y - 8, `+${points.toLocaleString()}`, {
      fontFamily: 'monospace',
      fontSize: isMajor ? '15px' : '11px',
      color: isMajor ? '#facc15' : '#34d399',
      fontStyle: 'bold',
    });
    text.setOrigin(0.5);

    this.tweens.add({
      targets: text,
      y: y - 34,
      alpha: 0,
      duration: 750,
      onComplete: () => {
        text.destroy();
      },
    });
  }

  private spawnParticleRing(x: number, y: number, color: number, count = 12) {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const p = this.add.circle(x, y, 3, color);
      const dist = Phaser.Math.Between(25, 60);
      this.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        scale: 0.1,
        duration: 450,
        onComplete: () => p.destroy(),
      });
    }
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.alpha -= dt * 2;
      if (p.alpha <= 0) {
        p.destroy();
        this.particles.splice(i, 1);
      }
    }
  }

  private handleGameOver() {
    this.isFinished = true;
    soundSynth.stopBgm();
    soundSynth.playGameOver();
    soundSynth.triggerHaptic(80);
    const survived = Math.round(this.totalSurvivedSeconds);

    const results: RunResults = {
      tokenId: this.configData.tokenId,
      chogName: `Chog #${this.configData.tokenId}`,
      survivedSeconds: survived,
      score: this.score,
      enemiesDefeated: this.enemiesDefeated,
      bossesDefeated: this.bossesDefeated,
      skillsCollected: this.skillsCollected,
      overclockLevel: this.overclockLevel,
      levelReached: this.currentLevel,
      victory: false,
      personalBest: 0,
      skullCount: 0,
      timestamp: Date.now(),
      traitsSummary: `${this.configData.biome.name} • ${this.configData.attack.name} • ${this.configData.signatureSkill.name}`,
    };

    this.callbacks.onGameOver(results);
  }

  private handleVictory() {
    this.isFinished = true;
    soundSynth.stopBgm();
    soundSynth.playVictory();
    soundSynth.triggerHaptic(100);

    const results: RunResults = {
      tokenId: this.configData.tokenId,
      chogName: `Chog #${this.configData.tokenId}`,
      survivedSeconds: Math.round(this.totalSurvivedSeconds),
      score: this.score + 10000,
      enemiesDefeated: this.enemiesDefeated,
      bossesDefeated: this.bossesDefeated,
      skillsCollected: this.skillsCollected,
      overclockLevel: this.overclockLevel,
      levelReached: this.currentLevel,
      victory: true,
      personalBest: 0,
      skullCount: 0,
      timestamp: Date.now(),
      traitsSummary: `${this.configData.biome.name} • ${this.configData.attack.name} • ${this.configData.signatureSkill.name}`,
    };

    this.callbacks.onVictory(results);
  }
}
