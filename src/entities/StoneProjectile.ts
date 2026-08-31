import Phaser from 'phaser';
import { AssetKey, fitDisplaySize } from '../systems/assets';

export const STONE_PROJ_SIZE = 28;
export const STONE_PROJ_SPEED = 280;
export const STONE_PROJ_DAMAGE = 25;

export class StoneProjectile extends Phaser.Physics.Arcade.Sprite {
  private velocityX = 0;
  private velocityY = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, AssetKey.stoneProj);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    fitDisplaySize(this, STONE_PROJ_SIZE);
    this.setCircle(this.width / 2);
    this.setDepth(90);
    this.setBounce(0);
    this.setPushable(false);
  }

  fireToward(worldX: number, worldY: number): void {
    const dx = worldX - this.x;
    const dy = worldY - this.y;
    const length = Math.hypot(dx, dy) || 1;
    this.velocityX = (dx / length) * STONE_PROJ_SPEED;
    this.velocityY = (dy / length) * STONE_PROJ_SPEED;
    this.setVelocity(this.velocityX, this.velocityY);
    this.setRotation(Math.atan2(this.velocityY, this.velocityX));
  }

  protected preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);

    if (!this.active) {
      return;
    }

    this.setVelocity(this.velocityX, this.velocityY);
    this.rotation += 0.12;

    const bounds = this.scene.physics.world.bounds;
    if (!bounds.contains(this.x, this.y)) {
      this.destroy();
    }
  }
}
