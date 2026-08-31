import Phaser from 'phaser';

export const ASSET_DIR = 'assets';

export const AssetKey = {
  bgGrass: 'bg_grass',
  player: 'player',
  enemy1: 'enemy_1',
  enemy2: 'enemy_2',
  chest: 'chest',
  lootBoot: 'loot_boot',
  lootGlove: 'loot_glove',
  tree1: 'tree_1',
  tree2: 'tree_2',
  tree3: 'tree_3',
  bush1: 'bush_1',
  bush2: 'bush_2',
  bush3: 'bush_3',
} as const;

export type AssetKeyName = (typeof AssetKey)[keyof typeof AssetKey];

export const TREE_KEYS = [AssetKey.tree1, AssetKey.tree2, AssetKey.tree3] as const;
export const BUSH_KEYS = [AssetKey.bush1, AssetKey.bush2, AssetKey.bush3] as const;

export const GAME_IMAGES: ReadonlyArray<{ key: AssetKeyName; file: string }> = [
  { key: AssetKey.bgGrass, file: 'bg_grass.png' },
  { key: AssetKey.player, file: 'player.png' },
  { key: AssetKey.enemy1, file: 'enemy_1.png' },
  { key: AssetKey.enemy2, file: 'enemy_2.png' },
  { key: AssetKey.chest, file: 'chest.png' },
  { key: AssetKey.lootBoot, file: 'loot_boot.png' },
  { key: AssetKey.lootGlove, file: 'loot_glove.png' },
  { key: AssetKey.tree1, file: 'tree_1.png' },
  { key: AssetKey.tree2, file: 'tree_2.png' },
  { key: AssetKey.tree3, file: 'tree_3.png' },
  { key: AssetKey.bush1, file: 'bush_1.png' },
  { key: AssetKey.bush2, file: 'bush_2.png' },
  { key: AssetKey.bush3, file: 'bush_3.png' },
];

export function preloadGameAssets(load: Phaser.Loader.LoaderPlugin): void {
  load.setPath(ASSET_DIR);
  for (const image of GAME_IMAGES) {
    load.image(image.key, image.file);
  }
}

export function sharpenPixelArt(scene: Phaser.Scene, keys: readonly string[]): void {
  for (const key of keys) {
    if (scene.textures.exists(key)) {
      scene.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
    }
  }
}

export function pickRandomKey<T extends string>(keys: readonly T[]): T {
  return keys[Math.floor(Math.random() * keys.length)] ?? keys[0];
}

export function fitDisplaySize(
  gameObject: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image,
  width: number,
  height = width,
): void {
  gameObject.setDisplaySize(width, height);
}
