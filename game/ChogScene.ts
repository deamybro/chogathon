import Phaser from 'phaser';
import { GameConfig, RunResults, BonusSkillType, ActiveBonusSkill } from '@/types/chog';
import { SeededRandom } from './seededRandom';
import { soundSynth } from './soundEffects';

export interface GameCallbacks {
  onHpUpdate: (hp: number, maxHp: number) => void;
  onScoreUpdate: (score: number) => void;
  onTimeUpdate: (secondsRemaining: number) => void;
  onAbilityState: (cooldownSeconds: number, isReady: boolean) => void;
  onBonusSkillsUpdate?: (skills: ActiveBonusSkill[]) => void;
  onBossHpUpdate?: (bossName: string | null, currentHp: number, maxHp: number) => void;
  onComboAlert?: (text: string) => void;
  onGameOver: (results: RunResults) => void;
  onVictory: (results: RunResults) => void;
  onChaosAlert: (message: string) => void;
  onGameStart?: () => void;
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
}

interface Enemy {
  sprite: Phaser.GameObjects.Container;
  type: 'drone' | 'wasp' | 'brute' | 'boss';
  hp: number;
  maxHp: number;
  speed: number;
  scoreValue: number;
  slowTimer: number;
  frozenTimer: number;
  isBoss?: boolean;
  bossSkillTimer?: number;
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
  chain_lightning: {
    name: 'Tesla Chain Arc',
    icon: 'Zap',
    description: 'Blaster bolts arc high-voltage lightning into nearby swarms',
    duration: 12,
    color: 0x38bdf8,
    hex: '#38bdf8',
  },
  orbital_shield: {
    name: 'Orbital Deflectors',
    icon: 'Shield',
    description: 'Energy spheres orbit around your Chog, vaporizing contact foes',
    duration: 14,
    color: 0x22c55e,
    hex: '#22c55e',
  },
  homing_missiles: {
    name: 'Micro-Missile Salvo',
    icon: 'Rocket',
    description: 'Automatically fires seeking heat-guided rockets at elite targets',
    duration: 12,
    color: 0xf43f5e,
    hex: '#f43f5e',
  },
  cryo_blast: {
    name: 'Sub-Zero Cryo Wave',
    icon: 'Snowflake',
    description: 'Emits a freezing shockwave that stops all nearby enemies cold',
    duration: 10,
    color: 0x06b6d4,
    hex: '#06b6d4',
  },
  adrenaline_stim: {
    name: 'Adrenaline Overdrive',
    icon: 'Flame',
    description: 'Supercharges movement speed and attack velocity by +40%',
    duration: 8,
    color: 0xf59e0b,
    hex: '#f59e0b',
  },
  magnet_overdrive: {
    name: 'Graviton Siphon',
    icon: 'Magnet',
    description: 'Massively expands collection magnet across the entire arena',
    duration: 12,
    color: 0xa855f7,
    hex: '#a855f7',
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

  // Combos & Tracking
  private score = 0;
  private enemiesDefeated = 0;
  private bossesDefeated = 0;
  private skillsCollected = 0;
  private timeRemaining = 60;
  private isFinished = false;
  private isGameStarted = false;
  private isPaused = false;
  private comboStreak = 0;
  private lastKillTime = 0;

  // Boss state
  private activeBoss: Enemy | null = null;
  private bossSpawned = false;

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

    this.maxHp = this.configData.archetype.maxHealth;
    this.hp = this.maxHp;
    this.score = 0;
    this.enemiesDefeated = 0;
    this.bossesDefeated = 0;
    this.skillsCollected = 0;
    this.timeRemaining = 60;
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

    // Player visual representation with styled avatar traits
    this.playerContainer = this.add.container(width / 2, height / 2);

    // Shield aura
    this.playerShieldGlow = this.add.circle(0, 0, 32, 0x38bdf8, 0);
    this.playerShieldGlow.setStrokeStyle(3, 0x67e8f9);

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

    // Mouth / blaster nozzle
    const mouthIndicator = this.add.rectangle(16, 0, 8, 5, this.configData.attack.bulletColor);

    this.playerContainer.add([
      this.playerShieldGlow,
      bodyShape,
      leftEye,
      rightEye,
      mouthIndicator,
    ]);

    // Orbital orbs container
    this.orbitalContainer = this.add.container(width / 2, height / 2);

    // Setup input keys
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
      this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
      this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
      this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
      this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      this.keyP = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
      this.keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);

      this.keySpace.on('down', () => {
        this.triggerActiveAbility();
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
    this.callbacks.onTimeUpdate(this.timeRemaining);
    this.callbacks.onAbilityState(0, true);
    this.emitBonusSkillsUpdate();
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

  update(time: number, delta: number) {
    if (!this.isGameStarted || this.isFinished || this.isPaused) return;

    const dt = delta / 1000;

    // 1. Time countdown (Throttled callback)
    this.timeRemaining -= dt;
    if (this.timeRemaining <= 0) {
      this.timeRemaining = 0;
      this.callbacks.onTimeUpdate(0);
      this.handleVictory();
      return;
    }
    const currentCeilTime = Math.ceil(this.timeRemaining);
    if (currentCeilTime !== this.lastReportedTime) {
      this.lastReportedTime = currentCeilTime;
      this.callbacks.onTimeUpdate(currentCeilTime);
    }

    // Check 30s milestone for Boss Entrance
    if (this.timeRemaining <= 30 && !this.bossSpawned) {
      this.spawnMidBoss();
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
    soundSynth.playPowerup();
    soundSynth.triggerHaptic(60);
    const meta = BONUS_SKILL_META[type];
    this.activeBonusSkills.set(type, { remaining: meta.duration, maxDuration: meta.duration });

    this.showDamageText(this.playerContainer.x, this.playerContainer.y - 30, `+SKILL: ${meta.name}`, true);
    this.spawnParticleRing(this.playerContainer.x, this.playerContainer.y, meta.color, 24);

    if (type === 'orbital_shield') {
      this.orbitalContainer.removeAll(true);
      this.orbitalOrbs = [];
      for (let i = 0; i < 2; i++) {
        const orb = this.add.circle(0, 0, 8, 0x22c55e);
        orb.setStrokeStyle(1.5, 0x86efac);
        this.orbitalContainer.add(orb);
        this.orbitalOrbs.push({ sprite: orb, angle: (Math.PI * 2 * i) / 2 });
      }
    } else if (type === 'cryo_blast') {
      this.pulseCryoWave();
    }

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

  private spawnMidBoss() {
    this.bossSpawned = true;
    soundSynth.playBossAlert();
    this.cameras.main.shake(350, 0.015);
    this.callbacks.onChaosAlert('WARNING: VOID COLOSSUS BOSS ENTERS!');

    const { width } = this.scale;
    const container = this.add.container(width / 2, -60);

    // Boss Visual (Imposing multi-layered mechanical titan)
    const bossCore = this.add.circle(0, 0, 34, 0x7c3aed);
    bossCore.setStrokeStyle(3, 0xa78bfa);
    const bossEye = this.add.circle(0, 0, 14, 0xef4444);
    const bossSpikes = this.add.rectangle(0, 0, 76, 8, 0xef4444);
    bossSpikes.setRotation(0.78);

    container.add([bossCore, bossEye, bossSpikes]);

    const bossHp = 280 * this.configData.difficulty.difficultyMultiplier;
    this.activeBoss = {
      sprite: container,
      type: 'boss',
      hp: bossHp,
      maxHp: bossHp,
      speed: 70,
      scoreValue: 2500,
      slowTimer: 0,
      frozenTimer: 0,
      isBoss: true,
      bossSkillTimer: 0,
    };

    this.enemies.push(this.activeBoss);
    if (this.callbacks.onBossHpUpdate) {
      this.callbacks.onBossHpUpdate('VOID COLOSSUS', bossHp, bossHp);
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

    const adrenalineBonus = this.activeBonusSkills.has('adrenaline_stim') ? 1.4 : 1.0;
    const baseSpeed = this.configData.archetype.moveSpeed * this.configData.biome.speedModifier * adrenalineBonus;
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
    const adrenalineFireMod = this.activeBonusSkills.has('adrenaline_stim') ? 0.65 : 1.0;
    const effectiveRate = atk.fireRateMs * adrenalineFireMod;

    if (time - this.lastFireTime >= effectiveRate) {
      this.lastFireTime = time;

      let fireAngle = this.aimAngle;
      if (this.enemies.length > 0 && !this.input.activePointer.isDown && !this.isTouchAiming) {
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

      if (atk.pattern === 'spread') {
        const spreadAngles = [-0.22, 0, 0.22];
        spreadAngles.forEach((offset) => {
          this.spawnProjectile(fireAngle + offset, damage, isCrit);
        });
      } else {
        this.spawnProjectile(fireAngle, damage, isCrit);
      }
    }
  }

  private spawnProjectile(angle: number, damage: number, crit: boolean) {
    const atk = this.configData.attack;
    const tgt = this.configData.targeting;

    const speed = atk.projectileSpeed;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;

    const startX = this.playerContainer.x + Math.cos(angle) * 22;
    const startY = this.playerContainer.y + Math.sin(angle) * 22;

    const radius = crit ? 6 : 4;
    const bullet = this.add.circle(startX, startY, radius, crit ? 0xfacc15 : atk.bulletColor);
    bullet.setStrokeStyle(1, 0xffffff);

    this.projectiles.push({
      sprite: bullet,
      vx,
      vy,
      damage,
      piercing: tgt.piercing,
      slowOnHit: tgt.slowOnHit,
      crit,
      life: 0,
      maxLife: 1.4 * tgt.rangeModifier,
      hitsLeft: tgt.piercing ? 3 : 1,
      chain: this.activeBonusSkills.has('chain_lightning'),
    });
  }

  private updateProjectiles(dt: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life += dt;
      p.sprite.x += p.vx * dt;
      p.sprite.y += p.vy * dt;

      let hasHit = false;
      for (const enemy of this.enemies) {
        const dist = Math.hypot(p.sprite.x - enemy.sprite.x, p.sprite.y - enemy.sprite.y);
        const hitRadius = enemy.isBoss ? 38 : 18;

        if (dist < hitRadius) {
          enemy.hp -= p.damage;
          this.showDamageText(enemy.sprite.x, enemy.sprite.y, p.damage, p.crit);
          soundSynth.playHit();

          if (enemy.isBoss && this.callbacks.onBossHpUpdate) {
            this.callbacks.onBossHpUpdate('VOID COLOSSUS', Math.max(0, enemy.hp), enemy.maxHp);
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
    const elapsed = 60 - this.timeRemaining;

    const spawnInterval = Phaser.Math.Clamp(
      (1.5 - (elapsed / 60) * 1.1) / this.configData.dailyDream.spawnRateMultiplier,
      0.35,
      2.0
    ) * 1000;

    if (now >= this.nextSpawnTime) {
      this.nextSpawnTime = now + spawnInterval;
      this.spawnWaveEnemy(elapsed);
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];

      // Check if dead
      if (enemy.hp <= 0) {
        soundSynth.playExplosion(enemy.isBoss);
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

        const points = Math.round(enemy.scoreValue * this.configData.difficulty.scoreMultiplier);
        this.score += points;
        this.callbacks.onScoreUpdate(this.score);
        this.showScoreText(enemy.sprite.x, enemy.sprite.y, points, enemy.isBoss);
        this.spawnParticleRing(enemy.sprite.x, enemy.sprite.y, enemy.isBoss ? 0xa855f7 : 0xef4444);

        // Spawn gem
        this.spawnGem(enemy.sprite.x, enemy.sprite.y, enemy.isBoss ? 500 : 50);

        // Chance to spawn skill drop (Guaranteed on Boss, 14% on normal enemies)
        const skillDropRoll = this.rng.next();
        if (enemy.isBoss || skillDropRoll < 0.14) {
          this.spawnSkillPickup(enemy.sprite.x, enemy.sprite.y);
        }

        if (enemy.isBoss) {
          this.bossesDefeated++;
          this.activeBoss = null;
          this.callbacks.onBossHpUpdate?.(null, 0, 0);
          this.callbacks.onComboAlert?.('BOSS VANQUISHED! +2,500');
          this.cameras.main.shake(350, 0.02);
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

      // Boss Special Abilities
      if (enemy.isBoss) {
        enemy.bossSkillTimer = (enemy.bossSkillTimer || 0) + dt;
        if (enemy.bossSkillTimer >= 4.0) {
          enemy.bossSkillTimer = 0;
          this.triggerBossRadialBarrage(enemy.sprite.x, enemy.sprite.y);
        }
      }

      // Handle slow timer
      let speed = enemy.speed * this.configData.difficulty.difficultyMultiplier;
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
      const contactRadius = enemy.isBoss ? 42 : 22;
      if (dist < contactRadius) {
        if (!this.isShielded) {
          const dmg = enemy.isBoss ? 30 : 12;
          this.takeDamage(dmg);
        }
        this.vx += (dx / dist) * 120;
        this.vy += (dy / dist) * 120;
      }
    }
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
      'chain_lightning',
      'orbital_shield',
      'homing_missiles',
      'cryo_blast',
      'adrenaline_stim',
      'magnet_overdrive',
    ];
    const picked = this.rng.pick(skills);
    const meta = BONUS_SKILL_META[picked];

    const container = this.add.container(x, y);
    const glow = this.add.circle(0, 0, 14, meta.color, 0.4);
    const orb = this.add.circle(0, 0, 9, meta.color);
    orb.setStrokeStyle(2, 0xffffff);
    container.add([glow, orb]);

    this.tweens.add({
      targets: [glow, orb],
      scale: 1.25,
      alpha: 0.8,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    this.skillPickups.push({ container, type: picked, x, y });
  }

  private spawnGem(x: number, y: number, value: number) {
    const gem = this.add.circle(x, y, 4, 0xfacc15);
    gem.setStrokeStyle(1, 0xffffff);
    this.gems.push({ sprite: gem, x, y, value });
  }

  private updatePickups(dt: number) {
    const magnetRange = this.activeBonusSkills.has('magnet_overdrive') ? 600 : 120;
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
        this.score += g.value;
        this.callbacks.onScoreUpdate(this.score);
        this.showScoreText(g.sprite.x, g.sprite.y, g.value, g.value >= 500);
        g.sprite.destroy();
        this.gems.splice(i, 1);
      }
    }

    // Skill Pickups
    for (let i = this.skillPickups.length - 1; i >= 0; i--) {
      const p = this.skillPickups[i];
      const dist = Math.hypot(px - p.container.x, py - p.container.y);

      if (dist < magnetRange * 0.8) {
        p.container.x += ((px - p.container.x) / dist) * 320 * dt;
        p.container.y += ((py - p.container.y) / dist) * 320 * dt;
      }

      if (dist < 28) {
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

    let hp = 15;
    let speed = 90;
    let scoreVal = 100;

    if (type === 'wasp') {
      hp = 12;
      speed = 145;
      scoreVal = 150;
      const waspBody = this.add.triangle(0, 0, 0, -12, 12, 12, -12, 12, 0xf59e0b);
      container.add(waspBody);
    } else if (type === 'brute') {
      hp = 65;
      speed = 60;
      scoreVal = 300;
      const bruteBody = this.add.rectangle(0, 0, 28, 28, 0xef4444);
      bruteBody.setStrokeStyle(2, 0xffffff);
      container.add(bruteBody);
    } else {
      hp = 18;
      speed = 95;
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

    if (this.hp <= 0) {
      this.handleGameOver();
    }
  }

  private showDamageText(x: number, y: number, textOrDmg: number | string, crit: boolean) {
    const display = typeof textOrDmg === 'number' ? (crit ? `CRIT! -${textOrDmg}` : `-${textOrDmg}`) : textOrDmg;
    const text = this.add.text(x, y - 10, display, {
      fontFamily: 'monospace',
      fontSize: crit ? '14px' : '11px',
      color: crit ? '#facc15' : '#ffffff',
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
    const survived = Math.round(60 - this.timeRemaining);

    const results: RunResults = {
      tokenId: this.configData.tokenId,
      chogName: `Chog #${this.configData.tokenId}`,
      survivedSeconds: survived,
      score: this.score,
      enemiesDefeated: this.enemiesDefeated,
      bossesDefeated: this.bossesDefeated,
      skillsCollected: this.skillsCollected,
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
      survivedSeconds: 60,
      score: this.score + 5000,
      enemiesDefeated: this.enemiesDefeated,
      bossesDefeated: this.bossesDefeated,
      skillsCollected: this.skillsCollected,
      victory: true,
      personalBest: 0,
      skullCount: 0,
      timestamp: Date.now(),
      traitsSummary: `${this.configData.biome.name} • ${this.configData.attack.name} • ${this.configData.signatureSkill.name}`,
    };

    this.callbacks.onVictory(results);
  }
}
