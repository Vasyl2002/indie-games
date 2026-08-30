import Phaser from 'phaser';

export const CHEST_SIZE = 28;
export const CHEST_TEXTURE_KEY = 'chest';

export class Chest extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, CHEST_TEXTURE_KEY);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setImmovable(true);
    this.setPushable(false);
    this.setDepth(15);
  }

  static ensureTexture(scene: Phaser.Scene): void {
    if (scene.textures.exists(CHEST_TEXTURE_KEY)) {
      return;
    }

    const graphics = scene.make.graphics({ x: 0, y: 0 }, false);
    graphics.fillStyle(0xffc107, 1);
    graphics.fillRoundedRect(2, 2, CHEST_SIZE - 4, CHEST_SIZE - 4, 4);
    graphics.lineStyle(2, 0xb8860b, 1);
    graphics.strokeRoundedRect(2, 2, CHEST_SIZE - 4, CHEST_SIZE - 4, 4);
    graphics.fillStyle(0x8d6e1a, 1);
    graphics.fillRect(4, CHEST_SIZE / 2 - 2, CHEST_SIZE - 8, 4);
    graphics.generateTexture(CHEST_TEXTURE_KEY, CHEST_SIZE, CHEST_SIZE);
    graphics.destroy();
  }
}
