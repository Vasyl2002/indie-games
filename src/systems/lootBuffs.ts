export type LootBuffId = 'run-speed' | 'damage' | 'max-hp' | 'dash-cooldown';

export type LootBuff = {
  id: LootBuffId;
  text: string;
};

const LOOT_BUFFS: LootBuff[] = [
  { id: 'run-speed', text: '+5% к скорости бега' },
  { id: 'damage', text: '+5% к урону' },
  { id: 'max-hp', text: '+15 к максимальному HP' },
  { id: 'dash-cooldown', text: '-1с к кулдауну рывка' },
];

export function pickRandomLootBuff(): LootBuff {
  return LOOT_BUFFS[Math.floor(Math.random() * LOOT_BUFFS.length)] ?? LOOT_BUFFS[0];
}
