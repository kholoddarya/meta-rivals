import type { HeroClass, AntiClass } from './types'

// Перенос CLASS_COUNTERS из Config.js.
// Dive контрит Poke, Poke контрит Brawl, Brawl контрит Dive — классическое
// "камень-ножницы-бумага". Anti-X — специализированный контрпик класса X,
// даёт больший бонус (см. antiCounterPickBonus в defaults.ts).
export const CLASS_COUNTERS: Record<HeroClass | AntiClass, HeroClass> = {
  Dive: 'Poke',
  Poke: 'Brawl',
  Brawl: 'Dive',
  'Anti-Dive': 'Dive',
  'Anti-Poke': 'Poke',
  'Anti-Brawl': 'Brawl'
}
