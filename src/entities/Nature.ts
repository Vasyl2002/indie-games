import Phaser from 'phaser';

export const GRASS_COUNT = 200;
export const BUSH_COUNT = 50;
export const TREE_COUNT = 30;

export const GRASS_DEPTH = -6;
export const BUSH_DEPTH = 115;
export const TREE_DEPTH = 40;

export const BUSH_SIZE = 44;
export const TREE_WIDTH = 64;
export const TREE_HEIGHT = 80;
export const TREE_TRUNK_SIZE = 22;

const BUSH_TEXTURE = 'nature-bush';
const TREE_TEXTURE = 'nature-tree';

export class Bush extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, BUSH_TEXTURE);
    scene.add.existing(this);
    this.setDepth(BUSH_DEPTH);
    this.setAlpha(0.62);
    this.setScale(Phaser.Math.FloatBetween(0.82, 1.18));
  }

  static ensureTexture(scene: Phaser.Scene): void {
    if (scene.textures.exists(BUSH_TEXTURE)) {
      return;
    }

    const graphics = scene.make.graphics({ x: 0, y: 0 }, false);
    graphics.fillStyle(0x1b5e20, 1);
    graphics.fillCircle(BUSH_SIZE / 2, BUSH_SIZE / 2, BUSH_SIZE / 2 - 1);
    graphics.fillStyle(0x2e7d32, 0.7);
    graphics.fillCircle(BUSH_SIZE / 2 - 6, BUSH_SIZE / 2 - 4, BUSH_SIZE / 3);
    graphics.generateTexture(BUSH_TEXTURE, BUSH_SIZE, BUSH_SIZE);
    graphics.destroy();
  }
}

export class Tree extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, TREE_TEXTURE);

    scene.add.existing(this);
    this.setOrigin(0.5, 0.78);
    this.setDepth(TREE_DEPTH);
  }

  enableTrunkCollider(): void {
    if (!this.body) {
      this.scene.physics.add.existing(this, true);
    }

    this.setImmovable(true);
    this.setPushable(false);
    this.refreshBody();
  }

  static ensureTexture(scene: Phaser.Scene): void {
    if (scene.textures.exists(TREE_TEXTURE)) {
      return;
    }

    const graphics = scene.make.graphics({ x: 0, y: 0 }, false);
    graphics.fillStyle(0x6d4c41, 1);
    graphics.fillRoundedRect(TREE_WIDTH / 2 - 7, 38, 14, 38, 3);
    graphics.fillStyle(0x5d4037, 1);
    graphics.fillRect(TREE_WIDTH / 2 - 5, 48, 10, 26);
    graphics.fillStyle(0x2e7d32, 1);
    graphics.fillCircle(TREE_WIDTH / 2, 28, 24);
    graphics.fillStyle(0x43a047, 1);
    graphics.fillCircle(TREE_WIDTH / 2 - 10, 24, 14);
    graphics.fillCircle(TREE_WIDTH / 2 + 11, 26, 13);
    graphics.fillStyle(0x1b5e20, 1);
    graphics.fillCircle(TREE_WIDTH / 2, 18, 10);
    graphics.generateTexture(TREE_TEXTURE, TREE_WIDTH, TREE_HEIGHT);
    graphics.destroy();
  }
}

export function paintGrassTufts(
  scene: Phaser.Scene,
  count: number,
  worldWidth: number,
  worldHeight: number,
): Phaser.GameObjects.Graphics {
  const grass = scene.add.graphics().setDepth(GRASS_DEPTH);
  const margin = 24;

  for (let i = 0; i < count; i += 1) {
    const x = Phaser.Math.Between(margin, worldWidth - margin);
    const y = Phaser.Math.Between(margin, worldHeight - margin);
    const tint = Phaser.Math.RND.pick([0xc5e1a5, 0xaed581, 0x9ccc65]);
    grass.lineStyle(1.6, tint, 0.9);

    const blades = Phaser.Math.Between(2, 4);
    for (let blade = 0; blade < blades; blade += 1) {
      const lean = Phaser.Math.FloatBetween(-0.55, 0.55);
      const height = Phaser.Math.Between(6, 11);
      grass.beginPath();
      grass.moveTo(x + blade * 2 - 2, y);
      grass.lineTo(x + blade * 2 - 2 + lean * height, y - height);
      grass.strokePath();
    }
  }

  return grass;
}
