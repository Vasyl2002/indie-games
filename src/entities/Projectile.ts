import Phaser from 'phaser';

export const PROJECTILE_SIZE = 12;
export const PROJECTILE_SPEED = 560;
export const PROJECTILE_FIRE_INTERVAL_MS = 500;

const PROJECTILE_TEXTURE_KEY = 'projectile';

export class Projectile extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, PROJECTILE_TEXTURE_KEY);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCircle(PROJECTILE_SIZE / 2);
    this.setDepth(80);
    this.setBounce(0);
    this.setPushable(false);
  }

  static ensureTexture(scene: Phaser.Scene): void {
    if (scene.textures.exists(PROJECTILE_TEXTURE_KEY)) {
      return;
    }

    const graphics = scene.make.graphics({ x: 0, y: 0 }, false);
    graphics.fillStyle(0xffe14d, 1);
    graphics.fillCircle(PROJECTILE_SIZE / 2, PROJECTILE_SIZE / 2, PROJECTILE_SIZE / 2 - 1);
    graphics.lineStyle(2, 0xf5b400, 1);
    graphics.strokeCircle(PROJECTILE_SIZE / 2, PROJECTILE_SIZE / 2, PROJECTILE_SIZE / 2 - 1);
    graphics.generateTexture(PROJECTILE_TEXTURE_KEY, PROJECTILE_SIZE, PROJECTILE_SIZE);
    graphics.destroy();
  }

  fireAt(worldX: number, worldY: number): void {
    const dx = worldX - this.x;
    const dy = worldY - this.y;
    const length = Math.hypot(dx, dy);

    if (length === 0) {
      this.setVelocity(PROJECTILE_SPEED, 0);
      return;
    }

    this.setVelocity((dx / length) * PROJECTILE_SPEED, (dy / length) * PROJECTILE_SPEED);
  }

  protected preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);

    if (!this.active) {
      return;
    }

    const bounds = this.scene.physics.world.bounds;
    if (!bounds.contains(this.x, this.y)) {
      this.destroy();
    }
  }
}
