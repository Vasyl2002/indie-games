import Phaser from 'phaser';
import { AssetKey, fitDisplaySize } from '../systems/assets';

export const CHEST_SIZE = 48;
export const CHEST_OPEN_RADIUS = 60;

export class Chest extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, AssetKey.chest);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    fitDisplaySize(this, CHEST_SIZE, Math.round(CHEST_SIZE * 1.15));
    this.setOrigin(0.5, 0.82);
    this.setImmovable(true);
    this.setPushable(false);
    this.setDepth(15);
    this.refreshBody();
  }
}
