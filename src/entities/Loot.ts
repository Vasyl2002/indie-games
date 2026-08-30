import Phaser from 'phaser';

export type LootKind = 'boot' | 'glove';

export const LOOT_SIZE = 22;

const LOOT_TEXTURES: Record<LootKind, string> = {
  boot: 'loot-boot',
  glove: 'loot-glove',
};

export class Loot extends Phaser.Physics.Arcade.Sprite {
  readonly lootKind: LootKind;

  constructor(scene: Phaser.Scene, x: number, y: number, kind: LootKind) {
    super(scene, x, y, LOOT_TEXTURES[kind]);

    this.lootKind = kind;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(16);
  }

  static ensureTextures(scene: Phaser.Scene): void {
    if (!scene.textures.exists(LOOT_TEXTURES.boot)) {
      const graphics = scene.make.graphics({ x: 0, y: 0 }, false);
      graphics.fillStyle(0x6d4c41, 1);
      graphics.fillRoundedRect(4, 8, 14, 12, 3);
      graphics.fillStyle(0x3e2723, 1);
      graphics.fillRect(4, 16, 16, 4);
      graphics.generateTexture(LOOT_TEXTURES.boot, LOOT_SIZE, LOOT_SIZE);
      graphics.destroy();
    }

    if (!scene.textures.exists(LOOT_TEXTURES.glove)) {
      const graphics = scene.make.graphics({ x: 0, y: 0 }, false);
      graphics.fillStyle(0xc62828, 1);
      graphics.fillCircle(11, 12, 8);
      graphics.fillStyle(0xef9a9a, 1);
      graphics.fillCircle(11, 10, 4);
      graphics.generateTexture(LOOT_TEXTURES.glove, LOOT_SIZE, LOOT_SIZE);
      graphics.destroy();
    }
  }

  static randomKind(): LootKind {
    return Math.random() < 0.5 ? 'boot' : 'glove';
  }
}
