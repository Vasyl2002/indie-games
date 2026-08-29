import Phaser from 'phaser';
import {
  Enemy,
  ENEMY_PUSH_FORCE,
  ENEMY_PUSH_MAX,
} from '../entities/Enemy';
import { ExperienceOrb, XP_ORB_VALUE, XP_TO_LEVEL } from '../entities/ExperienceOrb';
import {
  Projectile,
  PROJECTILE_FIRE_INTERVAL_MS,
  PROJECTILE_SPEED,
} from '../entities/Projectile';
import { GameEvents, type XpSnapshot } from '../systems/events';
import { type UpgradeId } from '../systems/upgrades';

const PLAYER_SPEED = 260;
const PLAYER_SIZE = 40;
const PLAYER_MAX_HP = 100;
const CONTACT_DAMAGE = 15;
const IFRAME_MS = 1000;
const HP_BAR_WIDTH = 42;
const HP_BAR_HEIGHT = 6;
const HP_BAR_OFFSET_Y = 30;
const WAVE_SIZE = 5;
const WAVE_INTERVAL_MS = 2000;
const SPAWN_MARGIN = 36;
const SPAWN_SPACING = 46;
const KNOCKBACK_DECAY_PER_SECOND = 8;

export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private enemies!: Phaser.Physics.Arcade.Group;
  private projectiles!: Phaser.GameObjects.Group;
  private orbs!: Phaser.Physics.Arcade.Group;
  private fireTimer?: Phaser.Time.TimerEvent;
  private playerKnockback = new Phaser.Math.Vector2();
  private keys!: {
    w: Phaser.Input.Keyboard.Key;
    a: Phaser.Input.Keyboard.Key;
    s: Phaser.Input.Keyboard.Key;
    d: Phaser.Input.Keyboard.Key;
  };
  private stats = {
    moveSpeed: PLAYER_SPEED,
    fireIntervalMs: PROJECTILE_FIRE_INTERVAL_MS,
    projectileScale: 1,
    projectileSpeed: PROJECTILE_SPEED,
  };
  private currentXp = 0;
  private playerLevel = 1;
  private levelingUp = false;
  private gameOver = false;
  private playerHp = PLAYER_MAX_HP;
  private invulnerableUntil = 0;
  private hpBarBg!: Phaser.GameObjects.Rectangle;
  private hpBarFill!: Phaser.GameObjects.Rectangle;

  constructor() {
    super('GameScene');
  }

  create(): void {
    this.resetRunState();
    const { width, height } = this.scale;

    this.drawArena(width, height);
    this.physics.world.setBounds(0, 0, width, height);
    this.createPlayerTexture();
    Enemy.ensureTexture(this);
    Projectile.ensureTexture(this);
    ExperienceOrb.ensureTexture(this);

    this.player = this.physics.add.sprite(width / 2, height / 2, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.setCircle(PLAYER_SIZE / 2);
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
    this.updateHpBar();

    this.enemies = this.physics.add.group();
    this.projectiles = this.add.group();
    this.orbs = this.physics.add.group();
    this.physics.add.collider(this.enemies, this.enemies);
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

    const keyboard = this.input.keyboard;
    if (!keyboard) {
      throw new Error('Keyboard input is not available');
    }

    this.keys = {
      w: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      a: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      s: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      d: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    this.add
      .text(width / 2, 50, 'WASD to move · aim with mouse', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#e8eef7',
      })
      .setOrigin(0.5, 0);

    this.spawnWave();
    this.time.addEvent({
      delay: WAVE_INTERVAL_MS,
      loop: true,
      callback: this.spawnWave,
      callbackScope: this,
    });

    this.fireProjectile();
    this.restartFireTimer();

    this.game.events.on(GameEvents.UpgradeSelected, this.onUpgradeSelected, this);
    this.game.events.on(GameEvents.RestartRequested, this.restartRun, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off(GameEvents.UpgradeSelected, this.onUpgradeSelected, this);
      this.game.events.off(GameEvents.RestartRequested, this.restartRun, this);
    });

    this.scene.launch('UIScene');
    this.emitXp();
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
    this.updateEnemyChase();
    this.syncHpBarPosition();
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
      vx = (vx / length) * this.stats.moveSpeed;
      vy = (vy / length) * this.stats.moveSpeed;
    }

    const decay = Math.exp(-KNOCKBACK_DECAY_PER_SECOND * (delta / 1000));
    this.playerKnockback.scale(decay);

    this.player.setVelocity(
      vx + this.playerKnockback.x,
      vy + this.playerKnockback.y,
    );
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
      this.enemies.add(new Enemy(this, point.x, point.y));
    }
  }

  private getOffscreenWavePoints(
    count: number,
  ): Phaser.Types.Math.Vector2Like[] {
    const { width, height } = this.scale;
    const side = Phaser.Math.Between(0, 3);
    const originX = width / 2;
    const originY = height / 2;
    const startOffset = -((count - 1) / 2) * SPAWN_SPACING;
    const points: Phaser.Types.Math.Vector2Like[] = [];

    for (let i = 0; i < count; i += 1) {
      const along = startOffset + i * SPAWN_SPACING;

      switch (side) {
        case 0:
          points.push({ x: originX + along, y: -SPAWN_MARGIN });
          break;
        case 1:
          points.push({ x: width + SPAWN_MARGIN, y: originY + along });
          break;
        case 2:
          points.push({ x: originX + along, y: height + SPAWN_MARGIN });
          break;
        default:
          points.push({ x: -SPAWN_MARGIN, y: originY + along });
          break;
      }
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

  private onProjectileHitEnemy: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback =
    (projectileObj, enemyObj) => {
      const projectile = projectileObj as Projectile;
      const enemy = enemyObj as Enemy;
      if (!projectile.active || !enemy.active) {
        return;
      }

      const dropX = enemy.x;
      const dropY = enemy.y;
      projectile.destroy();
      enemy.destroy();
      this.orbs.add(new ExperienceOrb(this, dropX, dropY));
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
    this.scene.restart();
  };

  private resetRunState(): void {
    this.stats = {
      moveSpeed: PLAYER_SPEED,
      fireIntervalMs: PROJECTILE_FIRE_INTERVAL_MS,
      projectileScale: 1,
      projectileSpeed: PROJECTILE_SPEED,
    };
    this.currentXp = 0;
    this.playerLevel = 1;
    this.levelingUp = false;
    this.gameOver = false;
    this.playerHp = PLAYER_MAX_HP;
    this.invulnerableUntil = 0;
    this.playerKnockback.set(0, 0);
    this.fireTimer = undefined;
  }

  private syncHpBarPosition(): void {
    const barY = this.player.y - HP_BAR_OFFSET_Y;
    this.hpBarBg.setPosition(this.player.x, barY);
    this.hpBarFill.setPosition(this.player.x - HP_BAR_WIDTH / 2, barY);
  }

  private updateHpBar(): void {
    const ratio = Phaser.Math.Clamp(this.playerHp / PLAYER_MAX_HP, 0, 1);
    this.hpBarFill.displayWidth = Math.max(ratio * HP_BAR_WIDTH, 0);
    this.hpBarFill.setFillStyle(ratio > 0.35 ? 0x4caf50 : 0xe53935);
    this.syncHpBarPosition();
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

  private drawArena(width: number, height: number): void {
    const grid = this.add.graphics();
    grid.lineStyle(1, 0x2c3350, 0.7);

    const step = 64;
    for (let x = 0; x <= width; x += step) {
      grid.lineBetween(x, 0, x, height);
    }
    for (let y = 0; y <= height; y += step) {
      grid.lineBetween(0, y, width, y);
    }
  }

  private createPlayerTexture(): void {
    const graphics = this.make.graphics({ x: 0, y: 0 }, false);
    graphics.fillStyle(0x3dd6c6, 1);
    graphics.fillRoundedRect(2, 2, PLAYER_SIZE - 4, PLAYER_SIZE - 4, 8);
    graphics.fillStyle(0x0b3d3a, 1);
    graphics.fillCircle(PLAYER_SIZE / 2, PLAYER_SIZE / 2 - 2, 7);
    graphics.lineStyle(3, 0x9ff5ea, 1);
    graphics.strokeRoundedRect(2, 2, PLAYER_SIZE - 4, PLAYER_SIZE - 4, 8);
    graphics.generateTexture('player', PLAYER_SIZE, PLAYER_SIZE);
    graphics.destroy();
  }
}
