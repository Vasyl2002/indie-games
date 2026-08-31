import Phaser from 'phaser';
import { BUSH_KEYS, TREE_KEYS, fitDisplaySize, pickRandomKey } from '../systems/assets';

export const GRASS_COUNT = 720;
export const BUSH_COUNT = 190;
export const TREE_COUNT = 115;

export const GRASS_DEPTH = -6;
export const BUSH_DEPTH = 115;
export const TREE_DEPTH = 40;

export const BUSH_SIZE = 72;
export const TREE_WIDTH = 96;
export const TREE_HEIGHT = 120;
export const TREE_TRUNK_SIZE = 28;

export class Bush extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, pickRandomKey(BUSH_KEYS));
    scene.add.existing(this);
    fitDisplaySize(this, BUSH_SIZE);
    this.setDepth(BUSH_DEPTH);
    this.setScale(this.scale * Phaser.Math.FloatBetween(0.86, 1.14));
  }
}

export class Tree extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, pickRandomKey(TREE_KEYS));

    scene.add.existing(this);
    fitDisplaySize(this, TREE_WIDTH, TREE_HEIGHT);
    this.setOrigin(0.5, 0.82);
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
