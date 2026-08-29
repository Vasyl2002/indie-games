import Phaser from 'phaser';

export type TowerShotKind = 'arrow' | 'bomb';

export const TOWER_ARROW_SPEED = 480;
export const TOWER_BOMB_SPEED = 240;
export const TOWER_ARROW_WIDTH = 56;
export const TOWER_ARROW_HEIGHT = 12;
export const TOWER_BOMB_SIZE = 18;

const ARROW_TEXTURE = 'tower-arrow';
const BOMB_TEXTURE = 'tower-bomb-shot';

export class TowerProjectile extends Phaser.Physics.Arcade.Sprite {
  readonly shotKind: TowerShotKind;
  private velocityX = 0;
  private velocityY = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, kind: TowerShotKind) {
    super(scene, x, y, kind === 'arrow' ? ARROW_TEXTURE : BOMB_TEXTURE);

    this.shotKind = kind;
    scene.add.existing(this);
    scene.physics.add.existing(this);

    if (kind === 'arrow') {
      this.setSize(TOWER_ARROW_WIDTH, TOWER_ARROW_HEIGHT);
    } else {
      this.setCircle(TOWER_BOMB_SIZE / 2);
    }

    this.setDepth(85);
    this.setBounce(0);
    this.setPushable(false);
  }

  static ensureTextures(scene: Phaser.Scene): void {
    if (!scene.textures.exists(ARROW_TEXTURE)) {
      const graphics = scene.make.graphics({ x: 0, y: 0 }, false);
      graphics.fillStyle(0xff8a1f, 1);
      graphics.fillRoundedRect(1, 2, TOWER_ARROW_WIDTH - 2, TOWER_ARROW_HEIGHT - 4, 3);
      graphics.fillTriangle(
        TOWER_ARROW_WIDTH - 2,
        TOWER_ARROW_HEIGHT / 2,
        TOWER_ARROW_WIDTH - 16,
        1,
        TOWER_ARROW_WIDTH - 16,
        TOWER_ARROW_HEIGHT - 1,
      );
      graphics.generateTexture(ARROW_TEXTURE, TOWER_ARROW_WIDTH, TOWER_ARROW_HEIGHT);
      graphics.destroy();
    }

    if (!scene.textures.exists(BOMB_TEXTURE)) {
      const graphics = scene.make.graphics({ x: 0, y: 0 }, false);
      graphics.fillStyle(0x111111, 1);
      graphics.fillCircle(TOWER_BOMB_SIZE / 2, TOWER_BOMB_SIZE / 2, TOWER_BOMB_SIZE / 2 - 1);
      graphics.lineStyle(2, 0x444444, 1);
      graphics.strokeCircle(TOWER_BOMB_SIZE / 2, TOWER_BOMB_SIZE / 2, TOWER_BOMB_SIZE / 2 - 1);
      graphics.generateTexture(BOMB_TEXTURE, TOWER_BOMB_SIZE, TOWER_BOMB_SIZE);
      graphics.destroy();
    }
  }

  fireToward(worldX: number, worldY: number): void {
    const dx = worldX - this.x;
    const dy = worldY - this.y;
    this.fireAngle(Math.atan2(dy, dx));
  }

  fireAngle(angle: number): void {
    const speed = this.shotKind === 'arrow' ? TOWER_ARROW_SPEED : TOWER_BOMB_SPEED;
    this.velocityX = Math.cos(angle) * speed;
    this.velocityY = Math.sin(angle) * speed;
    this.setVelocity(this.velocityX, this.velocityY);
    if (this.shotKind === 'arrow') {
      this.setRotation(angle);
    }
  }

  protected preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);

    if (!this.active) {
      return;
    }

    this.setVelocity(this.velocityX, this.velocityY);

    const view = this.scene.cameras.main.worldView;
    const pad = 48;
    const onScreen =
      this.x >= view.x - pad &&
      this.x <= view.right + pad &&
      this.y >= view.y - pad &&
      this.y <= view.bottom + pad;

    if (!onScreen || !this.scene.physics.world.bounds.contains(this.x, this.y)) {
      this.destroy();
    }
  }
}
