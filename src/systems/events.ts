import { type WaveSnapshot } from './waves';

export const GameEvents = {
  XpChanged: 'xp-changed',
  LevelUp: 'level-up',
  UpgradeSelected: 'upgrade-selected',
  GameOver: 'game-over',
  RestartRequested: 'restart-requested',
  WaveChanged: 'wave-changed',
} as const;

export type { WaveSnapshot };

export type XpSnapshot = {
  current: number;
  max: number;
  level: number;
};
