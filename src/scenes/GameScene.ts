import Phaser from 'phaser';
import { Chest, CHEST_OPEN_RADIUS, CHEST_SIZE } from '../entities/Chest';
import {
  Enemy,
  ENEMY_PUSH_FORCE,
  ENEMY_PUSH_MAX,
} from '../entities/Enemy';
import { ExperienceOrb, XP_ORB_VALUE, XP_TO_LEVEL } from '../entities/ExperienceOrb';
import { Loot } from '../entities/Loot';
import { Bush, BUSH_COUNT, TREE_COUNT, TREE_TRUNK_SIZE, Tree } from '../entities/Nature';
import {
  Projectile,
  PROJECTILE_FIRE_INTERVAL_MS,
  PROJECTILE_SPEED,
} from '../entities/Projectile';
import {
  Tower,
  TOWER_COUNT,
  TOWER_SHOT_DAMAGE,
  TOWER_SIZE,
  type TowerKind,
} from '../entities/Tower';
import { TowerProjectile } from '../entities/TowerProjectile';
import { AssetKey, BUSH_KEYS, TREE_KEYS, fitDisplaySize, preloadGameAssets, sharpenPixelArt } from '../systems/assets';
import { GameEvents, type XpSnapshot } from '../systems/events';
import { pickRandomLootBuff, type LootBuffId } from '../systems/lootBuffs';
import {
  MINIMAP_CHEST_BLIP_R,
  MINIMAP_PLAYER_BLIP_R,
  MINIMAP_SIZE,
  MINIMAP_TOP,
  MINIMAP_TOWER_BLIP,
  MINIMAP_TREE_BLIP_R,
  minimapScreenX,
  minimapZoom,
} from '../systems/minimap';
import { type UpgradeId } from '../systems/upgrades';

const PLAYER_SPEED = 260;
const PLAYER_SIZE = 56;
const PLAYER_MAX_HP = 100;
const PLAYER_BASE_DAMAGE = 20;
const CONTACT_DAMAGE = 15;
const IFRAME_MS = 1000;
const HP_BAR_WIDTH = 42;
const HP_BAR_HEIGHT = 6;
const HP_BAR_OFFSET_Y = 42;
const DASH_BAR_WIDTH = 42;
const DASH_BAR_HEIGHT = 4;
const DASH_BAR_OFFSET_Y = 58;
const DASH_DISTANCE = 200;
const DASH_COOLDOWN_MS = 15000;
const DASH_COOLDOWN_MIN_MS = 3000;
const WORLD_WIDTH = 3000;
const WORLD_HEIGHT = 3000;
const WAVE_SIZE = 5;
const WAVE_INTERVAL_MS = 2000;
const SPAWN_MARGIN = 72;
const SPAWN_SPACING = 52;
const KNOCKBACK_DECAY_PER_SECOND = 8;
const CHEST_RANDOM_COUNT = 5;
const CHEST_NEAR_BOMB_COUNT = 5;
const CHEST_NEAR_BOMB_MIN = 150;
const CHEST_NEAR_BOMB_MAX = 200;
const CHEST_EDGE_MARGIN = 48;
const CHEST_CLEAR_TOWER = 88;
const CHEST_CLEAR_CHEST = 40;
const CHEST_CLEAR_PLAYER = 140;
const NATURE_EDGE = 40;
const TREE_CLEAR_PLAYER = 180;
const TREE_CLEAR_TOWER = 110;
const TREE_CLEAR_CHEST = 56;
const TREE_CLEAR_TREE = 74;

export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private enemies!: Phaser.Physics.Arcade.Group;
  private projectiles!: Phaser.GameObjects.Group;
  private towers!: Phaser.Physics.Arcade.StaticGroup;
  private towerShots!: Phaser.GameObjects.Group;
  private orbs!: Phaser.Physics.Arcade.Group;
  private chests!: Phaser.Physics.Arcade.Group;
  private loot!: Phaser.Physics.Arcade.Group;
  private trees!: Phaser.Physics.Arcade.StaticGroup;
  private bushes!: Phaser.GameObjects.Group;
  private fireTimer?: Phaser.Time.TimerEvent;
  private playerKnockback = new Phaser.Math.Vector2();
  private keys!: {
    w: Phaser.Input.Keyboard.Key;
    a: Phaser.Input.Keyboard.Key;
    s: Phaser.Input.Keyboard.Key;
    d: Phaser.Input.Keyboard.Key;
    space: Phaser.Input.Keyboard.Key;
    e: Phaser.Input.Keyboard.Key;
  };
  private stats = {
    moveSpeed: PLAYER_SPEED,
    fireIntervalMs: PROJECTILE_FIRE_INTERVAL_MS,
    projectileScale: 1,
    projectileSpeed: PROJECTILE_SPEED,
    damage: PLAYER_BASE_DAMAGE,
  };
  private currentXp = 0;
  private playerLevel = 1;
  private levelingUp = false;
  private gameOver = false;
  private playerHp = PLAYER_MAX_HP;
  private playerMaxHp = PLAYER_MAX_HP;
  private invulnerableUntil = 0;
  private hpBarBg!: Phaser.GameObjects.Rectangle;
  private hpBarFill!: Phaser.GameObjects.Rectangle;
  private dashBarBg!: Phaser.GameObjects.Rectangle;
  private dashBarFill!: Phaser.GameObjects.Rectangle;
  private dashTimerText!: Phaser.GameObjects.Text;
  private dashReadyAt = 0;
  private dashCooldownMs = DASH_COOLDOWN_MS;
  private lastMoveDir = new Phaser.Math.Vector2(0, -1);
  private minimap?: Phaser.Cameras.Scene2D.Camera;
  private playerBlip!: Phaser.GameObjects.Arc;
  private hudObjects: Phaser.GameObjects.GameObject[] = [];
  private worldDecor: Phaser.GameObjects.GameObject[] = [];
  private chestPrompt!: Phaser.GameObjects.Text;

  constructor() {
    super('GameScene');
  }

  preload(): void {
    preloadGameAssets(this.load);
  }

  create(): void {
    this.resetRunState();
    const { width } = this.scale;

    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.drawWorldGround();
    sharpenPixelArt(this, [
      AssetKey.player,
      AssetKey.enemy1,
      AssetKey.chest,
      AssetKey.lootBoot,
      AssetKey.lootGlove,
      ...TREE_KEYS,
      ...BUSH_KEYS,
    ]);
    Projectile.ensureTexture(this);
    ExperienceOrb.ensureTexture(this);
    Tower.ensureTextures(this);
    TowerProjectile.ensureTextures(this);

    this.player = this.physics.add.sprite(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, AssetKey.player);
    this.player.setCollideWorldBounds(true);
    fitDisplaySize(this.player, PLAYER_SIZE);
    this.player.setCircle(this.player.width / 2);
    this.player.setMass(1);
    this.player.setPushable(true);
    this.player.setDepth(100);

    this.hpBarBg = this.add
      .rectangle(this.player.x, this.player.y - HP_BAR_OFFSET_Y, HP_BAR_WIDTH + 2, HP_BAR_HEIGHT + 2, 0x1a1010)
      .setDepth(101);
    this.hpBarFill = this.add
      .rectangle(this.player.x, this.player.y - HP_BAR_OFFSET_Y, HP_BAR_WIDTH, HP_BAR_HEIGHT, 0x4caf50)
      .setOrigin(0, 0.5)
      .setDepth(102);
    this.dashBarBg = this.add
      .rectangle(
        this.player.x,
        this.player.y - DASH_BAR_OFFSET_Y,
        DASH_BAR_WIDTH + 2,
        DASH_BAR_HEIGHT + 2,
        0x101820,
      )
      .setDepth(101);
    this.dashBarFill = this.add
      .rectangle(
        this.player.x,
        this.player.y - DASH_BAR_OFFSET_Y,
        DASH_BAR_WIDTH,
        DASH_BAR_HEIGHT,
        0x4dd0e1,
      )
      .setOrigin(0, 0.5)
      .setDepth(102);
    this.dashTimerText = this.add
      .text(this.player.x + DASH_BAR_WIDTH / 2 + 10, this.player.y - DASH_BAR_OFFSET_Y, '', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#4dd0e1',
      })
      .setOrigin(0, 0.5)
      .setDepth(103);
    this.updateHpBar();
    this.updateDashBar();

    this.enemies = this.physics.add.group();
    this.projectiles = this.add.group();
    this.towers = this.physics.add.staticGroup();
    this.towerShots = this.add.group();
    this.orbs = this.physics.add.group();
    this.chests = this.physics.add.group();
    this.loot = this.physics.add.group();
    this.trees = this.physics.add.staticGroup();
    this.bushes = this.add.group();
    this.enemies.createCallback = (child) => this.hideFromMinimap(child);
    this.projectiles.createCallback = (child) => this.hideFromMinimap(child);
    this.towerShots.createCallback = (child) => this.hideFromMinimap(child);
    this.orbs.createCallback = (child) => this.hideFromMinimap(child);
    this.loot.createCallback = (child) => this.hideFromMinimap(child);
    this.physics.add.collider(this.enemies, this.enemies);
    this.physics.add.collider(this.player, this.towers);
    this.physics.add.collider(this.enemies, this.towers);
    this.physics.add.collider(this.player, this.trees);
    this.physics.add.collider(this.enemies, this.trees);
    this.physics.add.overlap(
      this.projectiles,
      this.towers,
      this.onPlayerShotHitTower,
      undefined,
      this,
    );
    this.physics.add.overlap(
      this.player,
      this.towerShots,
      this.onTowerShotHitPlayer,
      undefined,
      this,
    );
    this.physics.add.collider(
      this.player,
      this.enemies,
      this.onPlayerEnemyCollide,
      undefined,
      this,
    );
    this.physics.add.overlap(
      this.projectiles,
      this.enemies,
      this.onProjectileHitEnemy,
      undefined,
      this,
    );
    this.physics.add.overlap(
      this.player,
      this.orbs,
      this.onCollectOrb,
      undefined,
      this,
    );
    this.physics.add.overlap(
      this.player,
      this.loot,
      this.onCollectLoot,
      undefined,
      this,
    );
    this.physics.add.overlap(
      this.projectiles,
      this.trees,
      this.onShotHitTree,
      undefined,
      this,
    );
    this.physics.add.overlap(
      this.towerShots,
      this.trees,
      this.onShotHitTree,
      undefined,
      this,
    );

    const keyboard = this.input.keyboard;
    if (!keyboard) {
      throw new Error('Keyboard input is not available');
    }

    this.keys = {
      w: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      a: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      s: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      d: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      space: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      e: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
    };

    const hint = this.add
      .text(width / 2, 50, 'WASD — движение · Space — рывок · E — сундук · мышь — прицел', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#e8eef7',
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(200);
    this.hudObjects.push(
      this.hpBarBg,
      this.hpBarFill,
      this.dashBarBg,
      this.dashBarFill,
      this.dashTimerText,
      hint,
    );

    this.chestPrompt = this.add
      .text(0, 0, 'Press E', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#ffe14d',
        stroke: '#1a1408',
        strokeThickness: 4,
      })
      .setOrigin(0.5, 1)
      .setDepth(160)
      .setVisible(false);
    this.hudObjects.push(this.chestPrompt);

    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.startFollow(this.player, true, 1, 1);
    this.cameras.main.centerOn(this.player.x, this.player.y);
    this.cameras.main.setRoundPixels(true);

    this.placeTowers();
    this.spawnChests();
    this.placeNature();
    this.setupMinimap();
    this.time.delayedCall(4500, () => {
      if (this.gameOver || this.levelingUp) {
        return;
      }
      this.spawnWave();
      this.time.addEvent({
        delay: WAVE_INTERVAL_MS,
        loop: true,
        callback: this.spawnWave,
        callbackScope: this,
      });
    });

    this.fireProjectile();
    this.restartFireTimer();

    this.game.events.on(GameEvents.UpgradeSelected, this.onUpgradeSelected, this);
    this.game.events.on(GameEvents.RestartRequested, this.restartRun, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off(GameEvents.UpgradeSelected, this.onUpgradeSelected, this);
      this.game.events.off(GameEvents.RestartRequested, this.restartRun, this);
    });

    this.scene.stop('UIScene');
    this.scene.launch('UIScene');
    this.emitXp();

    if (import.meta.env.DEV) {
      (window as Window & { __scene?: GameScene }).__scene = this;
    }
  }

  getRunDebug(): {
    player: { x: number; y: number };
    dashReadyIn: number;
    chests: { x: number; y: number }[];
    loot: { x: number; y: number }[];
    trees: { x: number; y: number }[];
    bushCount: number;
  } {
    return {
      player: { x: this.player.x, y: this.player.y },
      dashReadyIn: Math.max(0, this.dashReadyAt - this.time.now),
      chests: this.chests
        .getChildren()
        .filter((child) => (child as Chest).active)
        .map((child) => ({ x: (child as Chest).x, y: (child as Chest).y })),
      loot: this.loot
        .getChildren()
        .filter((child) => (child as Loot).active)
        .map((child) => ({ x: (child as Loot).x, y: (child as Loot).y })),
      trees: this.trees
        .getChildren()
        .filter((child) => (child as Tree).active)
        .map((child) => ({ x: (child as Tree).x, y: (child as Tree).y })),
      bushCount: this.bushes.getLength(),
    };
  }

  getXpSnapshot(): XpSnapshot {
    return {
      current: this.currentXp,
      max: XP_TO_LEVEL,
      level: this.playerLevel,
    };
  }

  update(_time: number, delta: number): void {
    this.updatePlayerMovement(delta);
    this.tryDash();
    this.updateEnemyChase();
    this.updateTowers();
    this.syncOverheadBars();
    this.updateDashBar();
    this.updateChestInteract();
    this.syncMinimapBlips();
  }

  private updatePlayerMovement(delta: number): void {
    let vx = 0;
    let vy = 0;

    if (this.keys.a.isDown) {
      vx -= 1;
    }
    if (this.keys.d.isDown) {
      vx += 1;
    }
    if (this.keys.w.isDown) {
      vy -= 1;
    }
    if (this.keys.s.isDown) {
      vy += 1;
    }

    if (vx !== 0 || vy !== 0) {
      const length = Math.hypot(vx, vy);
      this.lastMoveDir.set(vx / length, vy / length);
      vx = this.lastMoveDir.x * this.stats.moveSpeed;
      vy = this.lastMoveDir.y * this.stats.moveSpeed;
    }

    const decay = Math.exp(-KNOCKBACK_DECAY_PER_SECOND * (delta / 1000));
    this.playerKnockback.scale(decay);

    this.player.setVelocity(
      vx + this.playerKnockback.x,
      vy + this.playerKnockback.y,
    );
  }

  private updateTowers(): void {
    if (this.levelingUp || this.gameOver) {
      return;
    }

    const now = this.time.now;
    for (const child of this.towers.getChildren()) {
      const tower = child as Tower;
      if (tower.active) {
        tower.updateCombat(this.player, now);
      }
    }
  }

  private placeTowers(): void {
    const kinds: TowerKind[] = ['archer', 'bomb', 'archer', 'bomb', 'archer'];
    Phaser.Utils.Array.Shuffle(kinds);

    const regions = [
      { minX: 220, maxX: 900, minY: 220, maxY: 900 },
      { minX: 2100, maxX: 2780, minY: 220, maxY: 900 },
      { minX: 220, maxX: 900, minY: 2100, maxY: 2780 },
      { minX: 2100, maxX: 2780, minY: 2100, maxY: 2780 },
      { minX: 1200, maxX: 1800, minY: 220, maxY: 820 },
    ];

    for (let i = 0; i < TOWER_COUNT; i += 1) {
      const region = regions[i] ?? regions[0];
      const x = Phaser.Math.Between(region.minX, region.maxX);
      const y = Phaser.Math.Between(region.minY, region.maxY);
      const tower = new Tower(this, x, y, kinds[i] ?? 'archer', (shot) => {
        this.towerShots.add(shot);
        this.hideFromMinimap(shot);
      });
      this.towers.add(tower);
    }
  }

  private tryDash(): void {
    if (this.levelingUp || this.gameOver) {
      return;
    }
    if (!Phaser.Input.Keyboard.JustDown(this.keys.space)) {
      return;
    }
    if (this.time.now < this.dashReadyAt) {
      return;
    }

    const destX = Phaser.Math.Clamp(
      this.player.x + this.lastMoveDir.x * DASH_DISTANCE,
      PLAYER_SIZE,
      WORLD_WIDTH - PLAYER_SIZE,
    );
    const destY = Phaser.Math.Clamp(
      this.player.y + this.lastMoveDir.y * DASH_DISTANCE,
      PLAYER_SIZE,
      WORLD_HEIGHT - PLAYER_SIZE,
    );

    const landed = this.resolveDashLanding(destX, destY);
    if (!landed) {
      return;
    }

    this.player.setPosition(landed.x, landed.y);
    this.dashReadyAt = this.time.now + this.dashCooldownMs;
    this.updateDashBar();
    this.syncOverheadBars();
  }

  private resolveDashLanding(
    destX: number,
    destY: number,
  ): Phaser.Types.Math.Vector2Like | null {
    if (!this.pointHitsSolid(destX, destY)) {
      return { x: destX, y: destY };
    }

    for (let step = 8; step >= 1; step -= 1) {
      const t = step / 9;
      const x = Phaser.Math.Linear(this.player.x, destX, t);
      const y = Phaser.Math.Linear(this.player.y, destY, t);
      if (!this.pointHitsSolid(x, y)) {
        return { x, y };
      }
    }

    return null;
  }

  private pointHitsSolid(x: number, y: number): boolean {
    const towerClearance = TOWER_SIZE / 2 + PLAYER_SIZE / 2 - 4;
    for (const child of this.towers.getChildren()) {
      const tower = child as Tower;
      if (Math.abs(tower.x - x) < towerClearance && Math.abs(tower.y - y) < towerClearance) {
        return true;
      }
    }

    const treeClearance = TREE_TRUNK_SIZE / 2 + PLAYER_SIZE / 2 - 2;
    for (const child of this.trees.getChildren()) {
      const tree = child as Tree;
      if (Phaser.Math.Distance.Between(tree.x, tree.y, x, y) < treeClearance) {
        return true;
      }
    }

    return false;
  }

  private updateEnemyChase(): void {
    for (const child of this.enemies.getChildren()) {
      const enemy = child as Enemy;
      if (!enemy.active) {
        continue;
      }
      enemy.chase(this.player);
    }
  }

  private fireProjectile(): void {
    if (this.levelingUp || this.gameOver) {
      return;
    }

    const pointer = this.input.mousePointer ?? this.input.activePointer;
    pointer.updateWorldPoint(this.cameras.main);

    const projectile = new Projectile(
      this,
      this.player.x,
      this.player.y,
      this.stats.projectileSpeed,
      this.stats.projectileScale,
    );
    this.projectiles.add(projectile);
    this.hideFromMinimap(projectile);
    projectile.fireAt(pointer.worldX, pointer.worldY);
  }

  private restartFireTimer(): void {
    this.fireTimer?.remove(false);
    this.fireTimer = this.time.addEvent({
      delay: this.stats.fireIntervalMs,
      loop: true,
      callback: this.fireProjectile,
      callbackScope: this,
    });
  }

  private spawnWave(): void {
    if (this.levelingUp || this.gameOver) {
      return;
    }

    for (const point of this.getOffscreenWavePoints(WAVE_SIZE)) {
      const enemy = new Enemy(this, point.x, point.y);
      this.enemies.add(enemy);
      this.hideFromMinimap(enemy);
    }
  }

  private getOffscreenWavePoints(
    count: number,
  ): Phaser.Types.Math.Vector2Like[] {
    const view = this.cameras.main.worldView;
    const world = this.physics.world.bounds;
    const startOffset = -((count - 1) / 2) * SPAWN_SPACING;
    const points: Phaser.Types.Math.Vector2Like[] = [];

    const viableSides: number[] = [];
    if (view.y - SPAWN_MARGIN > world.y) {
      viableSides.push(0);
    }
    if (view.right + SPAWN_MARGIN < world.right) {
      viableSides.push(1);
    }
    if (view.bottom + SPAWN_MARGIN < world.bottom) {
      viableSides.push(2);
    }
    if (view.x - SPAWN_MARGIN > world.x) {
      viableSides.push(3);
    }

    const side =
      viableSides.length > 0
        ? Phaser.Utils.Array.GetRandom(viableSides)
        : Phaser.Math.Between(0, 3);

    for (let i = 0; i < count; i += 1) {
      const along = startOffset + i * SPAWN_SPACING;
      let x = view.centerX;
      let y = view.centerY;

      switch (side) {
        case 0:
          x = view.centerX + along;
          y = view.y - SPAWN_MARGIN;
          break;
        case 1:
          x = view.right + SPAWN_MARGIN;
          y = view.centerY + along;
          break;
        case 2:
          x = view.centerX + along;
          y = view.bottom + SPAWN_MARGIN;
          break;
        default:
          x = view.x - SPAWN_MARGIN;
          y = view.centerY + along;
          break;
      }

      points.push({
        x: Phaser.Math.Clamp(x, world.x + 16, world.right - 16),
        y: Phaser.Math.Clamp(y, world.y + 16, world.bottom - 16),
      });
    }

    return points;
  }

  private onPlayerEnemyCollide: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback =
    (playerObj, enemyObj) => {
      const player = playerObj as Phaser.Physics.Arcade.Sprite;
      const enemy = enemyObj as Phaser.Physics.Arcade.Sprite;
      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      const length = Math.hypot(dx, dy) || 1;

      this.playerKnockback.x += (dx / length) * ENEMY_PUSH_FORCE;
      this.playerKnockback.y += (dy / length) * ENEMY_PUSH_FORCE;
      this.playerKnockback.limit(ENEMY_PUSH_MAX);
      this.takeDamage(CONTACT_DAMAGE);
    };

  private onPlayerShotHitTower: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback =
    (projectileObj) => {
      const projectile = projectileObj as Projectile;
      if (projectile.active) {
        projectile.destroy();
      }
    };

  private onShotHitTree: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (shotObj) => {
    const shot = shotObj as Phaser.Physics.Arcade.Sprite;
    if (shot.active) {
      shot.destroy();
    }
  };

  private onTowerShotHitPlayer: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (
    _playerObj,
    shotObj,
  ) => {
    const shot = shotObj as TowerProjectile;
    if (!shot.active || this.gameOver || this.levelingUp) {
      return;
    }

    shot.destroy();
    this.takeDamage(TOWER_SHOT_DAMAGE);
  };

  private onProjectileHitEnemy: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback =
    (projectileObj, enemyObj) => {
      const projectile = projectileObj as Projectile;
      const enemy = enemyObj as Enemy;
      if (!projectile.active || !enemy.active) {
        return;
      }

      projectile.destroy();
      if (!enemy.takeDamage(this.stats.damage)) {
        return;
      }

      const dropX = enemy.x;
      const dropY = enemy.y;
      enemy.destroy();
      const orb = new ExperienceOrb(this, dropX, dropY);
      this.orbs.add(orb);
      this.hideFromMinimap(orb);
    };

  private onCollectOrb: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (
    _playerObj,
    orbObj,
  ) => {
    const orb = orbObj as ExperienceOrb;
    if (!orb.active || this.levelingUp || this.gameOver) {
      return;
    }

    const value = orb.value ?? XP_ORB_VALUE;
    orb.destroy();
    this.addExperience(value);
  };

  private addExperience(amount: number): void {
    this.currentXp += amount;
    if (this.currentXp >= XP_TO_LEVEL) {
      this.currentXp = XP_TO_LEVEL;
      this.emitXp();
      this.startLevelUp();
      return;
    }

    this.emitXp();
  }

  private startLevelUp(): void {
    if (this.levelingUp || this.gameOver) {
      return;
    }

    this.levelingUp = true;
    this.player.setVelocity(0, 0);
    this.scene.pause();
    this.game.events.emit(GameEvents.LevelUp);
  }

  private takeDamage(amount: number): void {
    if (this.gameOver || this.levelingUp || this.time.now < this.invulnerableUntil) {
      return;
    }

    this.playerHp = Math.max(0, this.playerHp - amount);
    this.invulnerableUntil = this.time.now + IFRAME_MS;
    this.startIframeBlink();
    this.updateHpBar();

    if (this.playerHp <= 0) {
      this.startGameOver();
    }
  }

  private startIframeBlink(): void {
    this.tweens.killTweensOf(this.player);
    this.player.setAlpha(1);
    this.tweens.add({
      targets: this.player,
      alpha: 0.25,
      duration: 80,
      yoyo: true,
      repeat: Math.ceil(IFRAME_MS / 160) - 1,
      onComplete: () => {
        if (this.player.active) {
          this.player.setAlpha(1);
        }
      },
    });
  }

  private startGameOver(): void {
    if (this.gameOver) {
      return;
    }

    this.gameOver = true;
    this.tweens.killTweensOf(this.player);
    this.player.setAlpha(1);
    this.player.setVelocity(0, 0);
    this.scene.pause();
    this.game.events.emit(GameEvents.GameOver);
  }

  private restartRun = (): void => {
    this.scene.stop('UIScene');
    this.scene.start('GameScene');
  };

  private resetRunState(): void {
    this.clearExtraCameras();
    this.stats = {
      moveSpeed: PLAYER_SPEED,
      fireIntervalMs: PROJECTILE_FIRE_INTERVAL_MS,
      projectileScale: 1,
      projectileSpeed: PROJECTILE_SPEED,
      damage: PLAYER_BASE_DAMAGE,
    };
    this.currentXp = 0;
    this.playerLevel = 1;
    this.levelingUp = false;
    this.gameOver = false;
    this.playerMaxHp = PLAYER_MAX_HP;
    this.playerHp = PLAYER_MAX_HP;
    this.invulnerableUntil = 0;
    this.dashReadyAt = 0;
    this.dashCooldownMs = DASH_COOLDOWN_MS;
    this.lastMoveDir.set(0, -1);
    this.playerKnockback.set(0, 0);
    this.fireTimer = undefined;
    this.minimap = undefined;
    this.hudObjects = [];
    this.worldDecor = [];
  }

  private clearExtraCameras(): void {
    for (const camera of [...this.cameras.cameras]) {
      if (camera !== this.cameras.main) {
        this.cameras.remove(camera);
      }
    }
  }

  private syncOverheadBars(): void {
    const hpY = this.player.y - HP_BAR_OFFSET_Y;
    const dashY = this.player.y - DASH_BAR_OFFSET_Y;
    this.hpBarBg.setPosition(this.player.x, hpY);
    this.hpBarFill.setPosition(this.player.x - HP_BAR_WIDTH / 2, hpY);
    this.dashBarBg.setPosition(this.player.x, dashY);
    this.dashBarFill.setPosition(this.player.x - DASH_BAR_WIDTH / 2, dashY);
    this.dashTimerText.setPosition(this.player.x + DASH_BAR_WIDTH / 2 + 8, dashY);
  }

  private updateHpBar(): void {
    const ratio = Phaser.Math.Clamp(this.playerHp / this.playerMaxHp, 0, 1);
    this.hpBarFill.displayWidth = Math.max(ratio * HP_BAR_WIDTH, 0);
    this.hpBarFill.setFillStyle(ratio > 0.35 ? 0x4caf50 : 0xe53935);
    this.syncOverheadBars();
  }

  private updateDashBar(): void {
    const remaining = Math.max(0, this.dashReadyAt - this.time.now);
    const ratio =
      remaining <= 0 ? 1 : Phaser.Math.Clamp(1 - remaining / this.dashCooldownMs, 0, 1);
    this.dashBarFill.displayWidth = Math.max(ratio * DASH_BAR_WIDTH, remaining <= 0 ? DASH_BAR_WIDTH : 2);
    this.dashBarFill.setFillStyle(remaining <= 0 ? 0x4dd0e1 : 0x0277bd);
    if (remaining <= 0) {
      this.dashTimerText.setText('');
    } else {
      this.dashTimerText.setText((remaining / 1000).toFixed(1));
    }
    this.syncOverheadBars();
  }

  private onUpgradeSelected = (upgradeId: UpgradeId): void => {
    if (this.gameOver) {
      return;
    }

    this.applyUpgrade(upgradeId);
    this.currentXp = 0;
    this.playerLevel += 1;
    this.levelingUp = false;
    this.emitXp();
    this.scene.resume('GameScene');
    this.restartFireTimer();
  };

  private applyUpgrade(upgradeId: UpgradeId): void {
    switch (upgradeId) {
      case 'fire-rate':
        this.stats.fireIntervalMs = Math.max(120, this.stats.fireIntervalMs * 0.8);
        break;
      case 'move-speed':
        this.stats.moveSpeed *= 1.18;
        break;
      case 'projectile-size':
        this.stats.projectileScale *= 1.25;
        break;
      case 'projectile-speed':
        this.stats.projectileSpeed *= 1.2;
        break;
      default:
        break;
    }
  }

  private emitXp(): void {
    this.game.events.emit(GameEvents.XpChanged, this.getXpSnapshot());
  }

  private placeNature(): void {
    for (let i = 0; i < BUSH_COUNT; i += 1) {
      const bush = new Bush(
        this,
        Phaser.Math.Between(NATURE_EDGE, WORLD_WIDTH - NATURE_EDGE),
        Phaser.Math.Between(NATURE_EDGE, WORLD_HEIGHT - NATURE_EDGE),
      );
      this.bushes.add(bush);
    }

    for (let i = 0; i < TREE_COUNT; i += 1) {
      const point = this.pickClearTreePoint();
      const tree = new Tree(this, point.x, point.y);
      this.trees.add(tree);
      tree.enableTrunkCollider();
    }
  }

  private pickClearTreePoint(): Phaser.Types.Math.Vector2Like {
    let best = { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2 };
    for (let attempt = 0; attempt < 28; attempt += 1) {
      const point = {
        x: Phaser.Math.Between(NATURE_EDGE, WORLD_WIDTH - NATURE_EDGE),
        y: Phaser.Math.Between(NATURE_EDGE, WORLD_HEIGHT - NATURE_EDGE),
      };
      if (this.isTreePointClear(point.x, point.y)) {
        return point;
      }
      best = point;
    }
    return best;
  }

  private isTreePointClear(x: number, y: number): boolean {
    if (Phaser.Math.Distance.Between(x, y, WORLD_WIDTH / 2, WORLD_HEIGHT / 2) < TREE_CLEAR_PLAYER) {
      return false;
    }

    for (const child of this.towers.getChildren()) {
      const tower = child as Tower;
      if (Phaser.Math.Distance.Between(x, y, tower.x, tower.y) < TREE_CLEAR_TOWER) {
        return false;
      }
    }

    for (const child of this.chests.getChildren()) {
      const chest = child as Chest;
      if (Phaser.Math.Distance.Between(x, y, chest.x, chest.y) < TREE_CLEAR_CHEST) {
        return false;
      }
    }

    for (const child of this.trees.getChildren()) {
      const tree = child as Tree;
      if (Phaser.Math.Distance.Between(x, y, tree.x, tree.y) < TREE_CLEAR_TREE) {
        return false;
      }
    }

    return true;
  }

  private spawnChests(): void {
    const bombTowers = this.towers
      .getChildren()
      .filter((child): child is Tower => child instanceof Tower && child.kind === 'bomb');

    for (let i = 0; i < CHEST_NEAR_BOMB_COUNT; i += 1) {
      const tower = bombTowers[i % bombTowers.length];
      const point = tower
        ? this.pickPointNear(tower.x, tower.y, CHEST_NEAR_BOMB_MIN, CHEST_NEAR_BOMB_MAX)
        : this.pickRandomChestPoint();
      this.addChest(point.x, point.y);
    }

    for (let i = 0; i < CHEST_RANDOM_COUNT; i += 1) {
      const point = this.pickRandomChestPoint();
      this.addChest(point.x, point.y);
    }
  }

  private addChest(x: number, y: number): Chest {
    const chest = new Chest(this, x, y);
    const blip = this.add
      .circle(x, y, MINIMAP_CHEST_BLIP_R, 0xffc107, 1)
      .setDepth(1000)
      .setData('minimapBlip', true);
    chest.setData('blip', blip);
    this.chests.add(chest);
    this.cameras.main.ignore(blip);
    return chest;
  }

  private pickRandomChestPoint(): Phaser.Types.Math.Vector2Like {
    return this.pickClearChestPoint(() => ({
      x: Phaser.Math.Between(CHEST_EDGE_MARGIN, WORLD_WIDTH - CHEST_EDGE_MARGIN),
      y: Phaser.Math.Between(CHEST_EDGE_MARGIN, WORLD_HEIGHT - CHEST_EDGE_MARGIN),
    }));
  }

  private pickPointNear(
    originX: number,
    originY: number,
    minRadius: number,
    maxRadius: number,
  ): Phaser.Types.Math.Vector2Like {
    return this.pickClearChestPoint(() => {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const radius = Phaser.Math.FloatBetween(minRadius, maxRadius);
      return {
        x: Phaser.Math.Clamp(
          originX + Math.cos(angle) * radius,
          CHEST_EDGE_MARGIN,
          WORLD_WIDTH - CHEST_EDGE_MARGIN,
        ),
        y: Phaser.Math.Clamp(
          originY + Math.sin(angle) * radius,
          CHEST_EDGE_MARGIN,
          WORLD_HEIGHT - CHEST_EDGE_MARGIN,
        ),
      };
    });
  }

  private pickClearChestPoint(
    sample: () => Phaser.Types.Math.Vector2Like,
  ): Phaser.Types.Math.Vector2Like {
    let best = sample();
    for (let attempt = 0; attempt < 24; attempt += 1) {
      const point = sample();
      if (this.isChestPointClear(point.x, point.y)) {
        return point;
      }
      best = point;
    }
    return best;
  }

  private isChestPointClear(x: number, y: number): boolean {
    if (Phaser.Math.Distance.Between(x, y, WORLD_WIDTH / 2, WORLD_HEIGHT / 2) < CHEST_CLEAR_PLAYER) {
      return false;
    }

    for (const child of this.towers.getChildren()) {
      const tower = child as Tower;
      if (Phaser.Math.Distance.Between(x, y, tower.x, tower.y) < CHEST_CLEAR_TOWER) {
        return false;
      }
    }

    for (const child of this.chests.getChildren()) {
      const chest = child as Chest;
      if (Phaser.Math.Distance.Between(x, y, chest.x, chest.y) < CHEST_CLEAR_CHEST + CHEST_SIZE) {
        return false;
      }
    }

    return true;
  }

  private findChestInRange(): Chest | undefined {
    let nearest: Chest | undefined;
    let nearestDist = CHEST_OPEN_RADIUS;
    for (const child of this.chests.getChildren()) {
      const chest = child as Chest;
      if (!chest.active) {
        continue;
      }
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, chest.x, chest.y);
      if (dist <= nearestDist) {
        nearest = chest;
        nearestDist = dist;
      }
    }
    return nearest;
  }

  private updateChestInteract(): void {
    if (!this.chestPrompt) {
      return;
    }

    if (this.gameOver || this.levelingUp) {
      this.chestPrompt.setVisible(false);
      return;
    }

    const chest = this.findChestInRange();
    if (!chest) {
      this.chestPrompt.setVisible(false);
      return;
    }

    this.chestPrompt.setVisible(true);
    this.chestPrompt.setPosition(chest.x, chest.y - 40);

    if (Phaser.Input.Keyboard.JustDown(this.keys.e)) {
      this.openChest(chest);
    }
  }

  private openChest(chest: Chest): void {
    if (!chest.active || this.gameOver || this.levelingUp) {
      return;
    }

    const dropX = chest.x;
    const dropY = chest.y;
    const blip = chest.getData('blip') as Phaser.GameObjects.Arc | undefined;
    blip?.destroy();
    chest.destroy();
    this.chestPrompt.setVisible(false);

    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const loot = new Loot(
      this,
      dropX + Math.cos(angle) * 38,
      dropY + Math.sin(angle) * 38,
      Loot.randomKind(),
    );
    this.hideFromMinimap(loot);
    const targetScale = loot.scale;
    loot.setScale(targetScale * 0.4);
    this.tweens.add({
      targets: loot,
      scale: targetScale,
      duration: 220,
      ease: 'Back.Out',
      onComplete: () => {
        this.time.delayedCall(280, () => {
          if (loot.active) {
            this.loot.add(loot);
          }
        });
      },
    });
  }

  private onCollectLoot: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (
    _playerObj,
    lootObj,
  ) => {
    const loot = lootObj as Loot;
    if (!loot.active || this.gameOver || this.levelingUp) {
      return;
    }

    loot.destroy();
    const buff = pickRandomLootBuff();
    this.applyLootBuff(buff.id);
    this.spawnFloatingText(this.player.x, this.player.y - 52, buff.text);
  };

  private applyLootBuff(id: LootBuffId): void {
    switch (id) {
      case 'run-speed':
        this.stats.moveSpeed *= 1.05;
        break;
      case 'damage':
        this.stats.damage *= 1.05;
        break;
      case 'max-hp':
        this.playerMaxHp += 15;
        this.playerHp = Math.min(this.playerMaxHp, this.playerHp + 15);
        this.updateHpBar();
        break;
      case 'dash-cooldown':
        this.dashCooldownMs = Math.max(DASH_COOLDOWN_MIN_MS, this.dashCooldownMs - 1000);
        this.dashReadyAt = Math.min(this.dashReadyAt, this.time.now + this.dashCooldownMs);
        this.updateDashBar();
        break;
      default:
        break;
    }
  }

  private spawnFloatingText(x: number, y: number, message: string): void {
    const label = this.add
      .text(x, y, message, {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#ffe14d',
        stroke: '#1a1408',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(400);
    this.hideFromMinimap(label);
    this.tweens.add({
      targets: label,
      y: y - 48,
      alpha: 0,
      duration: 1400,
      ease: 'Cubic.Out',
      onComplete: () => {
        label.destroy();
      },
    });
  }

  private setupMinimap(): void {
    const { width } = this.scale;
    const camera = this.cameras.add(
      minimapScreenX(width),
      MINIMAP_TOP,
      MINIMAP_SIZE,
      MINIMAP_SIZE,
      false,
      'minimap',
    );
    camera.setZoom(minimapZoom());
    camera.setBackgroundColor(0x0a0e14);
    camera.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    camera.startFollow(this.player, true, 1, 1);
    camera.setRoundPixels(true);
    this.minimap = camera;

    this.hideFromMinimap(this.hudObjects);
    this.hideFromMinimap(this.worldDecor);
    this.hideFromMinimap(this.player);
    this.hideFromMinimap(this.enemies);
    this.hideFromMinimap(this.projectiles);
    this.hideFromMinimap(this.towerShots);
    this.hideFromMinimap(this.orbs);
    this.hideFromMinimap(this.loot);
    this.hideFromMinimap(this.chests);
    this.hideFromMinimap(this.towers);
    this.hideFromMinimap(this.trees);
    this.hideFromMinimap(this.bushes);

    this.playerBlip = this.add
      .circle(this.player.x, this.player.y, MINIMAP_PLAYER_BLIP_R, 0x4caf50, 1)
      .setDepth(1001)
      .setData('minimapBlip', true);
    this.cameras.main.ignore(this.playerBlip);

    for (const child of this.towers.getChildren()) {
      const tower = child as Tower;
      const blip = this.add
        .rectangle(tower.x, tower.y, MINIMAP_TOWER_BLIP, MINIMAP_TOWER_BLIP, 0xe53935, 1)
        .setDepth(1000)
        .setData('minimapBlip', true);
      this.cameras.main.ignore(blip);
    }

    for (const child of this.trees.getChildren()) {
      const tree = child as Tree;
      const blip = this.add
        .circle(tree.x, tree.y, MINIMAP_TREE_BLIP_R, 0x1b5e20, 1)
        .setDepth(999)
        .setData('minimapBlip', true);
      this.cameras.main.ignore(blip);
    }
  }

  private hideFromMinimap(
    target:
      | Phaser.GameObjects.GameObject
      | Phaser.GameObjects.GameObject[]
      | Phaser.GameObjects.Group,
  ): void {
    this.minimap?.ignore(target);
  }

  private syncMinimapBlips(): void {
    if (this.playerBlip?.active) {
      this.playerBlip.setPosition(this.player.x, this.player.y);
    }
  }

  private drawWorldGround(): void {
    this.add
      .tileSprite(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, WORLD_WIDTH, WORLD_HEIGHT, AssetKey.bgGrass)
      .setDepth(-10);

    const border = this.add.graphics().setDepth(-9);
    border.lineStyle(6, 0x6d7b99, 1);
    border.strokeRect(3, 3, WORLD_WIDTH - 6, WORLD_HEIGHT - 6);
    this.worldDecor.push(border);

    for (let gx = 500; gx < WORLD_WIDTH; gx += 1000) {
      for (let gy = 500; gy < WORLD_HEIGHT; gy += 1000) {
        const mark = this.add.circle(gx, gy, 48, 0x2e3a52, 0.55).setDepth(-8);
        const label = this.add
          .text(gx, gy, `${gx},${gy}`, {
            fontFamily: 'monospace',
            fontSize: '16px',
            color: '#8ea0bf',
          })
          .setOrigin(0.5)
          .setDepth(-7);
        this.worldDecor.push(mark, label);
      }
    }
  }
}
