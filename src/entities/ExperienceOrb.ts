import Phaser from 'phaser';

export const XP_ORB_SIZE = 14;
export const XP_ORB_VALUE = 1;
export const XP_TO_LEVEL = 4;

const XP_ORB_TEXTURE_KEY = 'xp-orb';

export class ExperienceOrb extends Phaser.Physics.Arcade.Sprite {
  readonly value = XP_ORB_VALUE;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, XP_ORB_TEXTURE_KEY);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCircle(XP_ORB_SIZE / 2);
    this.setImmovable(true);
    this.setPushable(false);
    this.setDepth(40);
  }

  static ensureTexture(scene: Phaser.Scene): void {
    if (scene.textures.exists(XP_ORB_TEXTURE_KEY)) {
      return;
    }

    const graphics = scene.make.graphics({ x: 0, y: 0 }, false);
    graphics.fillStyle(0x42a5f5, 1);
    graphics.fillCircle(XP_ORB_SIZE / 2, XP_ORB_SIZE / 2, XP_ORB_SIZE / 2 - 1);
    graphics.lineStyle(2, 0x1565c0, 1);
    graphics.strokeCircle(XP_ORB_SIZE / 2, XP_ORB_SIZE / 2, XP_ORB_SIZE / 2 - 1);
    graphics.generateTexture(XP_ORB_TEXTURE_KEY, XP_ORB_SIZE, XP_ORB_SIZE);
    graphics.destroy();
  }
}
