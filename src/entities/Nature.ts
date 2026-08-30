import Phaser from 'phaser';
import { AssetKey, fitDisplaySize } from '../systems/assets';

export const BUSH_COUNT = 50;
export const TREE_COUNT = 30;

export const BUSH_DEPTH = 115;
export const TREE_DEPTH = 40;

export const BUSH_SIZE = 44;
export const TREE_WIDTH = 64;
export const TREE_HEIGHT = 80;
export const TREE_TRUNK_SIZE = 22;

export class Bush extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, AssetKey.bush);
    scene.add.existing(this);
    fitDisplaySize(this, BUSH_SIZE);
    this.setDepth(BUSH_DEPTH);
    this.setScale(this.scale * Phaser.Math.FloatBetween(0.82, 1.18));
  }
}

export class Tree extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, AssetKey.tree);

    scene.add.existing(this);
    fitDisplaySize(this, TREE_WIDTH, TREE_HEIGHT);
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
}
