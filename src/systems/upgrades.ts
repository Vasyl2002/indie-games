import { type I18nKey } from './i18n';

export type UpgradeId =
  | 'fire-rate'
  | 'move-speed'
  | 'projectile-size'
  | 'projectile-speed';

export type UpgradeDef = {
  id: UpgradeId;
  titleKey: I18nKey;
  descKey: I18nKey;
};

export const UPGRADES: UpgradeDef[] = [
  {
    id: 'fire-rate',
    titleKey: 'upgrade_fire_rate_title',
    descKey: 'upgrade_fire_rate_desc',
  },
  {
    id: 'move-speed',
    titleKey: 'upgrade_move_speed_title',
    descKey: 'upgrade_move_speed_desc',
  },
  {
    id: 'projectile-size',
    titleKey: 'upgrade_projectile_size_title',
    descKey: 'upgrade_projectile_size_desc',
  },
  {
    id: 'projectile-speed',
    titleKey: 'upgrade_projectile_speed_title',
    descKey: 'upgrade_projectile_speed_desc',
  },
];

export function pickRandomUpgrades(count: number): UpgradeDef[] {
  const pool = [...UPGRADES];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(count, pool.length));
}
