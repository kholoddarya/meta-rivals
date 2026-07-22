import type { RoleType } from '~/types/sheets'

export const CLASS_COUNTERS: Record<string, string> = {
  Dive: 'Poke',
  Poke: 'Brawl',
  Brawl: 'Dive',
  'Anti-Dive': 'Dive',
  'Anti-Poke': 'Poke',
  'Anti-Brawl': 'Brawl',
}

export const ROLE_WEIGHTS: Record<RoleType, number> = {
  sup: 1,
  dps: 3,
  tnk: 2,
}

export const TIER_SCORES: Record<string, number> = {
  S: 5,
  A: 4,
  B: 3,
  C: 2,
  D: 1,
}

export const GRADE_SCORES: Record<string, number> = {
  S: 4,
  SA: 3,
  A: 2,
  B: 1,
}

// Приоритет раскладок ролей для полной команды (6 человек), от лучшей к худшей.
// Формат: sup-dps-tnk. Индекс в массиве = приоритет (0 = самая желанная).
export const ROLE_COMPOSITIONS: string[] = [
  '2-2-2', // 1. Золотой стандарт
  '3-1-2', // 2. Упор на саппортов и танков
  '3-2-1', // 3. Упор на саппортов и дамаг
  '2-3-1', // 4. Агрессивная с 2 саппортами
  '2-1-3', // 5. Танковая с 2 саппортами
  '3-0-3', // 6. Специфическая (3 саппорта, 3 танка)
  '1-3-2',
  '4-1-1', // 7. Экстремальная поддержка
  '4-0-2', // 8. Экстремальная поддержка + танки
]
