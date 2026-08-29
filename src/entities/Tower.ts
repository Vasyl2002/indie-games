import Phaser from 'phaser';
import { TowerProjectile } from './TowerProjectile';

export type TowerKind = 'archer' | 'bomb';

export const TOWER_SIZE = 96;
export const TOWER_COUNT = 5;
export const ARCHER_AGGRO = 500;
export const BOMB_AGGRO = 300;
export const ARCHER_FIRE_INTERVAL_MS = 1500;
export const BOMB_FIRE_INTERVAL_MS = 2000;
export const BOMB_COUNT = 10;
export const TOWER_SHOT_DAMAGE = 20;

const TOWER_TEXTURES: Record<TowerKind, string> = {
  archer: 'tower-archer',
  bomb: 'tower-bomb',
};

export class Tower extends Phaser.Physics.Arcade.Sprite {
  readonly kind: TowerKind;
  private nextFireAt = 0;
  private readonly registerShot: (shot: TowerProjectile) => void;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    kind: TowerKind,
    registerShot: (shot: TowerProjectile) => void,
  ) {
    super(scene, x, y, TOWER_TEXTURES[kind]);

    this.kind = kind;
    this.registerShot = registerShot;

    scene.add.existing(this);
    scene.physics.add.existing(this, true);

    this.setImmovable(true);
    this.setPushable(false);
    this.setDepth(20);
  }

  static ensureTextures(scene: Phaser.Scene): void {
    if (!scene.textures.exists(TOWER_TEXTURES.archer)) {
      Tower.drawTowerTexture(scene, TOWER_TEXTURES.archer, 'archer');
    }
    if (!scene.textures.exists(TOWER_TEXTURES.bomb)) {
      Tower.drawTowerTexture(scene, TOWER_TEXTURES.bomb, 'bomb');
    }
  }

  updateCombat(target: Phaser.Types.Math.Vector2Like, now: number): void {
    const range = this.kind === 'archer' ? ARCHER_AGGRO : BOMB_AGGRO;
    const distance = Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y);
    if (distance > range || now < this.nextFireAt) {
      return;
    }

    this.nextFireAt =
      now + (this.kind === 'archer' ? ARCHER_FIRE_INTERVAL_MS : BOMB_FIRE_INTERVAL_MS);

    if (this.kind === 'archer') {
      this.fireArrow(target);
      return;
    }

    this.fireBombFan();
  }

  private fireArrow(target: Phaser.Types.Math.Vector2Like): void {
    const shot = new TowerProjectile(this.scene, this.x, this.y, 'arrow');
    shot.fireToward(target.x, target.y);
    this.registerShot(shot);
  }

  private fireBombFan(): void {
    for (let i = 0; i < BOMB_COUNT; i += 1) {
      const angle = (Math.PI * 2 * i) / BOMB_COUNT;
      const shot = new TowerProjectile(this.scene, this.x, this.y, 'bomb');
      shot.fireAngle(angle);
      this.registerShot(shot);
    }
  }

  private static drawTowerTexture(
    scene: Phaser.Scene,
    key: string,
    kind: TowerKind,
  ): void {
    const graphics = scene.make.graphics({ x: 0, y: 0 }, false);
    graphics.fillStyle(0x6d7380, 1);
    graphics.fillRoundedRect(4, 4, TOWER_SIZE - 8, TOWER_SIZE - 8, 8);
    graphics.lineStyle(4, 0x3d424c, 1);
    graphics.strokeRoundedRect(4, 4, TOWER_SIZE - 8, TOWER_SIZE - 8, 8);
    graphics.fillStyle(0x4a505a, 1);
    graphics.fillRect(18, 14, TOWER_SIZE - 36, 16);

    if (kind === 'archer') {
      graphics.fillStyle(0xff8a1f, 1);
      graphics.fillRect(TOWER_SIZE / 2 - 4, 28, 8, 36);
      graphics.fillTriangle(
        TOWER_SIZE / 2,
        22,
        TOWER_SIZE / 2 - 10,
        36,
        TOWER_SIZE / 2 + 10,
        36,
      );
    } else {
      graphics.fillStyle(0x111111, 1);
      graphics.fillCircle(TOWER_SIZE / 2, TOWER_SIZE / 2 + 6, 16);
      graphics.fillStyle(0x333333, 1);
      graphics.fillCircle(TOWER_SIZE / 2, TOWER_SIZE / 2 + 6, 7);
    }

    graphics.generateTexture(key, TOWER_SIZE, TOWER_SIZE);
    graphics.destroy();
  }
}
