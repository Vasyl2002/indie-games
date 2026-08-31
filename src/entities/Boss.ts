import Phaser from 'phaser';
import { ENEMY_SIZE } from './Enemy';
import { AssetKey, fitDisplaySize } from '../systems/assets';
import { applyWalkWobble, captureWalkBase, type WalkWobbleState } from '../systems/walkWobble';

export const BOSS_SIZE = ENEMY_SIZE * 2;
export const BOSS_SPEED = 70;
export const BOSS_MAX_ARMOR = 500;
export const BOSS_MAX_HP = 1000;
export const BOSS_FIRE_INTERVAL_MS = 2500;
export const BOSS_CONTACT_DAMAGE = 20;

const BAR_WIDTH = 88;
const BAR_HEIGHT = 8;
const ARMOR_OFFSET_Y = 70;
const HP_OFFSET_Y = 58;

export class Boss extends Phaser.Physics.Arcade.Sprite {
  armor = BOSS_MAX_ARMOR;
  hp = BOSS_MAX_HP;
  private nextFireAt = 0;
  private readonly walkWobble: WalkWobbleState;
  private readonly armorBarBg: Phaser.GameObjects.Rectangle;
  private readonly armorBarFill: Phaser.GameObjects.Rectangle;
  private readonly hpBarBg: Phaser.GameObjects.Rectangle;
  private readonly hpBarFill: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, AssetKey.bossStone);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    fitDisplaySize(this, BOSS_SIZE);
    this.setCircle(this.width / 2);
    this.setBounce(0.04);
    this.setMass(8);
    this.setPushable(false);
    this.setDamping(true);
    this.setDrag(0.001);
    this.setCollideWorldBounds(true);
    this.setDepth(50);
    this.walkWobble = captureWalkBase(this);
    this.nextFireAt = scene.time.now + BOSS_FIRE_INTERVAL_MS;

    this.armorBarBg = scene.add
      .rectangle(x, y - ARMOR_OFFSET_Y, BAR_WIDTH + 2, BAR_HEIGHT + 2, 0x101820)
      .setDepth(51);
    this.armorBarFill = scene.add
      .rectangle(x, y - ARMOR_OFFSET_Y, BAR_WIDTH, BAR_HEIGHT, 0x42a5f5)
      .setOrigin(0, 0.5)
      .setDepth(52);
    this.hpBarBg = scene.add
      .rectangle(x, y - HP_OFFSET_Y, BAR_WIDTH + 2, BAR_HEIGHT + 2, 0x1a1010)
      .setDepth(51);
    this.hpBarFill = scene.add
      .rectangle(x, y - HP_OFFSET_Y, BAR_WIDTH, BAR_HEIGHT, 0xe53935)
      .setOrigin(0, 0.5)
      .setDepth(52);
    this.syncBars();
  }

  barObjects(): Phaser.GameObjects.GameObject[] {
    return [this.armorBarBg, this.armorBarFill, this.hpBarBg, this.hpBarFill];
  }

  takeDamage(amount: number): boolean {
    if (this.armor > 0) {
      const absorbed = Math.min(this.armor, amount);
      this.armor -= absorbed;
      amount -= absorbed;
    }
    if (amount > 0) {
      this.hp -= amount;
    }
    this.syncBars();

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
    if (length < 8) {
      return;
    }
    this.setVelocity((dx / length) * BOSS_SPEED, (dy / length) * BOSS_SPEED);
  }

  tryFire(now: number): boolean {
    if (now < this.nextFireAt) {
      return false;
    }
    this.nextFireAt = now + BOSS_FIRE_INTERVAL_MS;
    return true;
  }

  updateWalk(delta: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body | undefined;
    const speed = body ? body.velocity.length() : 0;
    applyWalkWobble(this, speed, delta, this.walkWobble);
    this.syncBars();
  }

  syncBars(): void {
    const armorY = this.y - ARMOR_OFFSET_Y;
    const hpY = this.y - HP_OFFSET_Y;
    this.armorBarBg.setPosition(this.x, armorY);
    this.armorBarFill.setPosition(this.x - BAR_WIDTH / 2, armorY);
    this.hpBarBg.setPosition(this.x, hpY);
    this.hpBarFill.setPosition(this.x - BAR_WIDTH / 2, hpY);

    const armorRatio = Phaser.Math.Clamp(this.armor / BOSS_MAX_ARMOR, 0, 1);
    const hpRatio = Phaser.Math.Clamp(this.hp / BOSS_MAX_HP, 0, 1);
    this.armorBarFill.displayWidth = Math.max(armorRatio * BAR_WIDTH, this.armor > 0 ? 2 : 0);
    this.hpBarFill.displayWidth = Math.max(hpRatio * BAR_WIDTH, this.hp > 0 ? 2 : 0);
  }

  destroy(fromScene?: boolean): void {
    this.armorBarBg.destroy();
    this.armorBarFill.destroy();
    this.hpBarBg.destroy();
    this.hpBarFill.destroy();
    super.destroy(fromScene);
  }
}
