import Phaser from 'phaser';
import { AssetKey, fitDisplaySize } from '../systems/assets';

export const CHEST_SIZE = 28;

export class Chest extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, AssetKey.chest);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    fitDisplaySize(this, CHEST_SIZE);
    this.setImmovable(true);
    this.setPushable(false);
    this.setDepth(15);
  }
}
