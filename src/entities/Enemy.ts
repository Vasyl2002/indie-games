import Phaser from 'phaser';
import { AssetKey, fitDisplaySize } from '../systems/assets';
import { applyWalkWobble, captureWalkBase, type WalkWobbleState } from '../systems/walkWobble';

export const ENEMY_SIZE = 48;
export const ENEMY_SPEED = 140;
export const ENEMY_PUSH_FORCE = 70;
export const ENEMY_PUSH_MAX = 420;
export const ENEMY_MAX_HP = 40;
export const ENEMY_ATTACK_COOLDOWN_MS = 1500;
export const ENEMY_AGGRO_RADIUS = 240;
export const ENEMY_LEASH_SPEED_FACTOR = 0.4;

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  hp = ENEMY_MAX_HP;
  private nextAttackAt = 0;
  private roamAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
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

  canDealContact(now: number): boolean {
    return now >= this.nextAttackAt;
  }

  markContactDealt(now: number): void {
    this.nextAttackAt = now + ENEMY_ATTACK_COOLDOWN_MS;
  }

  chase(target: Phaser.Types.Math.Vector2Like, speed: number): void {
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const length = Math.hypot(dx, dy);

    if (length < 4) {
      return;
    }

    const nx = dx / length;
    const ny = dy / length;

    if (length > ENEMY_AGGRO_RADIUS) {
      const roamX = Math.cos(this.roamAngle);
      const roamY = Math.sin(this.roamAngle);
      const leash = speed * ENEMY_LEASH_SPEED_FACTOR;
      this.setVelocity((nx * 0.78 + roamX * 0.22) * leash, (ny * 0.78 + roamY * 0.22) * leash);
      return;
    }

    this.setVelocity(nx * speed, ny * speed);
  }

  updateWalk(delta: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body | undefined;
    const speed = body ? body.velocity.length() : 0;
    applyWalkWobble(this, speed, delta, this.walkWobble);
  }
}
