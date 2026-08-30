import Phaser from 'phaser';
import { AssetKey, fitDisplaySize } from '../systems/assets';

export const ENEMY_SIZE = 28;
export const ENEMY_SPEED = 140;
export const ENEMY_PUSH_FORCE = 70;
export const ENEMY_PUSH_MAX = 420;
export const ENEMY_MAX_HP = 40;

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  hp = ENEMY_MAX_HP;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, AssetKey.enemy);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    fitDisplaySize(this, ENEMY_SIZE);
    this.setCircle(this.width / 2);
    this.setBounce(0.12);
    this.setMass(2);
    this.setPushable(true);
    this.setDepth(1);
  }

  takeDamage(amount: number): boolean {
    this.hp -= amount;
    if (this.hp <= 0) {
      return true;
    }

    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(50, () => {
      if (this.active) {
        this.clearTint();
      }
    });
    return false;
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
