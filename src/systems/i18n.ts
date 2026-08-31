export type Locale = 'en' | 'ru';

const DICT = {
  en: {
    controlsHint: 'WASD - Move · Space - Dash · E - Chest · Mouse - Aim',
    languageHint: 'L - Language',
    pressE: 'Press E',
    wave: 'WAVE {n}   {clock}',
    remaining: 'Enemies left: {n}',
    levelUp: 'LEVEL UP',
    gameOver: 'GAME OVER',
    restart: 'Restart',
    restartHint: 'Click to restart',
    upgrade_fire_rate_title: '+20% Fire Rate',
    upgrade_fire_rate_desc: 'Projectiles fire more often',
    upgrade_move_speed_title: '+Move Speed',
    upgrade_move_speed_desc: '+18% WASD speed',
    upgrade_projectile_size_title: '+Projectile Size',
    upgrade_projectile_size_desc: 'Shots become larger',
    upgrade_projectile_speed_title: '+Projectile Speed',
    upgrade_projectile_speed_desc: 'Shots fly faster',
    loot_run_speed: 'Boots! +5% Run Speed',
    loot_damage: 'Gloves! +5% Damage',
    loot_max_hp: '+15 Max HP',
    loot_dash_cooldown: '-1s Dash Cooldown',
  },
  ru: {
    controlsHint: 'WASD — движение · Space — рывок · E — сундук · мышь — прицел',
    languageHint: 'L — язык',
    pressE: 'Нажми E',
    wave: 'ВОЛНА {n}   {clock}',
    remaining: 'Осталось врагов: {n}',
    levelUp: 'НОВЫЙ УРОВЕНЬ',
    gameOver: 'GAME OVER',
    restart: 'Перезапуск',
    restartHint: 'Нажми, чтобы начать заново',
    upgrade_fire_rate_title: '+20% к скорости стрельбы',
    upgrade_fire_rate_desc: 'Снаряды вылетают чаще',
    upgrade_move_speed_title: '+Скорость бега',
    upgrade_move_speed_desc: '+18% к скорости WASD',
    upgrade_projectile_size_title: '+Размер снаряда',
    upgrade_projectile_size_desc: 'Снаряды становятся крупнее',
    upgrade_projectile_speed_title: '+Скорость снаряда',
    upgrade_projectile_speed_desc: 'Снаряды летят быстрее',
    loot_run_speed: 'Ботинки! +5% к скорости бега',
    loot_damage: 'Перчатки! +5% к урону',
    loot_max_hp: '+15 к максимальному HP',
    loot_dash_cooldown: '-1с к кулдауну рывка',
  },
} as const;

export type I18nKey = keyof typeof DICT.en;

let locale: Locale = 'en';

export function getLocale(): Locale {
  return locale;
}

export function toggleLocale(): Locale {
  locale = locale === 'en' ? 'ru' : 'en';
  return locale;
}

export function t(key: I18nKey, vars?: Record<string, string | number>): string {
  let text: string = DICT[locale][key] ?? DICT.en[key];
  if (!vars) {
    return text;
  }
  for (const [name, value] of Object.entries(vars)) {
    text = text.replaceAll(`{${name}}`, String(value));
  }
  return text;
}

export function controlsHintText(): string {
  return `${t('controlsHint')} · ${t('languageHint')}`;
}
