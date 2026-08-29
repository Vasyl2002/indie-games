export const GameEvents = {
  XpChanged: 'xp-changed',
  LevelUp: 'level-up',
  UpgradeSelected: 'upgrade-selected',
} as const;

export type XpSnapshot = {
  current: number;
  max: number;
  level: number;
};
