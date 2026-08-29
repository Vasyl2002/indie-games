export type UpgradeId =
  | 'fire-rate'
  | 'move-speed'
  | 'projectile-size'
  | 'projectile-speed';

export type UpgradeDef = {
  id: UpgradeId;
  title: string;
  description: string;
};

export const UPGRADES: UpgradeDef[] = [
  {
    id: 'fire-rate',
    title: '+20% к скорости стрельбы',
    description: 'Снаряды вылетают чаще',
  },
  {
    id: 'move-speed',
    title: '+Скорость бега',
    description: '+18% к скорости WASD',
  },
  {
    id: 'projectile-size',
    title: '+Размер снаряда',
    description: 'Снаряды становятся крупнее',
  },
  {
    id: 'projectile-speed',
    title: '+Скорость снаряда',
    description: 'Снаряды летят быстрее',
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
