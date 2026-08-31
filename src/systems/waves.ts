import { AssetKey } from './assets';

export const WAVE_DURATION_MS = 90_000;
export const WAVE_SPAWN_BASE_MS = 1600;
export const WAVE_SPAWN_MIN_MS = 400;
export const WAVE_SPAWN_DECAY = 0.82;

export const BOSS_WAVE = 5;
export const ENEMY_CONTACT_DAMAGE_BASE = 6;
export const ENEMY_CONTACT_DAMAGE_PER_WAVE = 1;

export type WaveSnapshot = {
  wave: number;
  remainingMs: number;
  spawning: boolean;
  alive: number;
  boss: boolean;
};

export function spawnIntervalMs(wave: number): number {
  return Math.max(
    WAVE_SPAWN_MIN_MS,
    Math.round(WAVE_SPAWN_BASE_MS * WAVE_SPAWN_DECAY ** Math.max(0, wave - 1)),
  );
}

export function enemyKeysForWave(wave: number): string[] {
  if (wave <= 1) {
    return [AssetKey.enemy1];
  }
  return [AssetKey.enemy1, AssetKey.enemy2];
}

export function enemyContactDamage(wave: number): number {
  return ENEMY_CONTACT_DAMAGE_BASE + Math.max(0, wave - 1) * ENEMY_CONTACT_DAMAGE_PER_WAVE;
}

export function formatWaveClock(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
