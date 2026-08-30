import Phaser from 'phaser';

export const ASSET_DIR = 'assets';

export const AssetKey = {
  bgGrass: 'bg_grass',
  tree: 'tree',
  bush: 'bush',
  player: 'player',
  enemy: 'enemy',
  chest: 'chest',
  lootBoot: 'loot_boot',
  lootGlove: 'loot_glove',
} as const;

export type AssetKeyName = (typeof AssetKey)[keyof typeof AssetKey];

export const GAME_IMAGES: ReadonlyArray<{ key: AssetKeyName; file: string }> = [
  { key: AssetKey.bgGrass, file: 'bg_grass.png' },
  { key: AssetKey.tree, file: 'tree.png' },
  { key: AssetKey.bush, file: 'bush.png' },
  { key: AssetKey.player, file: 'player.png' },
  { key: AssetKey.enemy, file: 'enemy.png' },
  { key: AssetKey.chest, file: 'chest.png' },
  { key: AssetKey.lootBoot, file: 'loot_boot.png' },
  { key: AssetKey.lootGlove, file: 'loot_glove.png' },
];

export function preloadGameAssets(load: Phaser.Loader.LoaderPlugin): void {
  load.setPath(ASSET_DIR);
  for (const image of GAME_IMAGES) {
    load.image(image.key, image.file);
  }
}

export function fitDisplaySize(
  gameObject: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image,
  width: number,
  height = width,
): void {
  gameObject.setDisplaySize(width, height);
}
