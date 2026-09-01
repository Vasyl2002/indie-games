import Phaser from 'phaser';
import { AssetKey, fitDisplaySize } from '../systems/assets';

export const STONE_PROJ_SIZE = 40;
export const STONE_PROJ_SPEED = 260;
export const STONE_PROJ_DAMAGE = 25;

export class StoneProjectile extends Phaser.Physics.Arcade.Sprite {
  private velocityX = 0;
  private velocityY = 0;
  harmlessUntil = 0;

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

  fireToward(worldX: number, worldY: number, spawnOffset = 0): void {
    const dx = worldX - this.x;
    const dy = worldY - this.y;
    const length = Math.hypot(dx, dy) || 1;
    const nx = dx / length;
    const ny = dy / length;
    if (spawnOffset > 0) {
      this.setPosition(this.x + nx * spawnOffset, this.y + ny * spawnOffset);
    }
    this.velocityX = nx * STONE_PROJ_SPEED;
    this.velocityY = ny * STONE_PROJ_SPEED;
    this.setVelocity(this.velocityX, this.velocityY);
    this.setRotation(Math.atan2(this.velocityY, this.velocityX));
    this.harmlessUntil = this.scene.time.now + 120;
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
