import Phaser from 'phaser';
import { AssetKey, fitDisplaySize } from '../systems/assets';

export type LootKind = 'boot' | 'glove';

export const LOOT_SIZE = 22;

const LOOT_TEXTURES: Record<LootKind, string> = {
  boot: AssetKey.lootBoot,
  glove: AssetKey.lootGlove,
};

export class Loot extends Phaser.Physics.Arcade.Sprite {
  readonly lootKind: LootKind;

  constructor(scene: Phaser.Scene, x: number, y: number, kind: LootKind) {
    super(scene, x, y, LOOT_TEXTURES[kind]);

    this.lootKind = kind;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    fitDisplaySize(this, LOOT_SIZE);
    this.setDepth(16);
  }

  static randomKind(): LootKind {
    return Math.random() < 0.5 ? 'boot' : 'glove';
  }
}
