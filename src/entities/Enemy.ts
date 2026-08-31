import Phaser from 'phaser';
import { AssetKey, fitDisplaySize } from '../systems/assets';
import { applyWalkWobble, captureWalkBase, type WalkWobbleState } from '../systems/walkWobble';

export const ENEMY_SIZE = 48;
export const ENEMY_SPEED = 140;
export const ENEMY_PUSH_FORCE = 70;
export const ENEMY_PUSH_MAX = 420;
export const ENEMY_MAX_HP = 40;

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  hp = ENEMY_MAX_HP;
  private readonly walkWobble: WalkWobbleState;

  constructor(scene: Phaser.Scene, x: number, y: number, textureKey: string = AssetKey.enemy1) {
    super(scene, x, y, textureKey);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    fitDisplaySize(this, ENEMY_SIZE);
    this.setCircle(this.width / 2);
    this.setBounce(0.12);
    this.setMass(2);
    this.setPushable(true);
    this.setDamping(true);
    this.setDrag(0.001);
    this.setDepth(1);
    this.walkWobble = captureWalkBase(this);
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

    if (length < 4) {
      return;
    }

    this.setVelocity((dx / length) * ENEMY_SPEED, (dy / length) * ENEMY_SPEED);
  }

  updateWalk(delta: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body | undefined;
    const speed = body ? body.velocity.length() : 0;
    applyWalkWobble(this, speed, delta, this.walkWobble);
  }
}
