import Phaser from 'phaser';
import { BUSH_KEYS, TREE_KEYS, fitDisplaySize, pickRandomKey } from '../systems/assets';

export const BUSH_COUNT = 50;
export const TREE_COUNT = 30;

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
