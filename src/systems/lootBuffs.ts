import { type I18nKey } from './i18n';

export type LootBuffId = 'run-speed' | 'damage' | 'max-hp' | 'dash-cooldown';

export type LootBuff = {
  id: LootBuffId;
  textKey: I18nKey;
};

const LOOT_BUFFS: LootBuff[] = [
  { id: 'run-speed', textKey: 'loot_run_speed' },
  { id: 'damage', textKey: 'loot_damage' },
  { id: 'max-hp', textKey: 'loot_max_hp' },
  { id: 'dash-cooldown', textKey: 'loot_dash_cooldown' },
];

export function pickRandomLootBuff(): LootBuff {
  return LOOT_BUFFS[Math.floor(Math.random() * LOOT_BUFFS.length)] ?? LOOT_BUFFS[0];
}
