import Phaser from 'phaser';

export const ENEMY_SIZE = 28;
export const ENEMY_SPEED = 140;
export const ENEMY_PUSH_FORCE = 48;
export const ENEMY_PUSH_MAX = 420;

const ENEMY_TEXTURE_KEY = 'enemy';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, ENEMY_TEXTURE_KEY);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    const radius = ENEMY_SIZE / 2;
    this.setCircle(radius);
    this.setBounce(0.12);
    this.setMass(2);
    this.setPushable(true);
  }

  static ensureTexture(scene: Phaser.Scene): void {
    if (scene.textures.exists(ENEMY_TEXTURE_KEY)) {
      return;
    }

    const graphics = scene.make.graphics({ x: 0, y: 0 }, false);
    graphics.fillStyle(0xe53935, 1);
    graphics.fillCircle(ENEMY_SIZE / 2, ENEMY_SIZE / 2, ENEMY_SIZE / 2 - 1);
    graphics.lineStyle(2, 0x8e1111, 1);
    graphics.strokeCircle(ENEMY_SIZE / 2, ENEMY_SIZE / 2, ENEMY_SIZE / 2 - 1);
    graphics.generateTexture(ENEMY_TEXTURE_KEY, ENEMY_SIZE, ENEMY_SIZE);
    graphics.destroy();
  }

  chase(target: Phaser.Types.Math.Vector2Like): void {
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const length = Math.hypot(dx, dy);

    if (length === 0) {
      this.setVelocity(0, 0);
      return;
    }

    this.setVelocity((dx / length) * ENEMY_SPEED, (dy / length) * ENEMY_SPEED);
  }
}
