// server/utils/generatorSettings.ts

export interface RoleComposition {
  sup: number
  dps: number
  tnk: number
  weight: number
  totalSize: number
}

// Приоритет раскладок ролей. Формат строго: "sup-dps-tnk". Порядок = приоритет.
export const DEFAULT_ROLE_COMPOSITIONS: string[] = [
  '2-2-2', // 1. Золотой стандарт
  '3-1-2', // 2. Упор на саппортов и танков
  '3-2-1', // 3. Упор на саппортов и дамаг
  '2-3-1', // 4. Агрессивная с 2 саппортами
  '2-1-3', // 5. Танковая с 2 саппортами
  '3-0-3', // 6. Специфическая (3 саппорта, 3 танка)
  '4-1-1', // 7. Экстремальная поддержка
  '4-0-2', // 8. Экстремальная поддержка + танки
]

export const DEFAULT_SETTINGS = {
  TEAM_SIZE: 6,
  MIN_SYNERGIES: 1,
  MAX_RESULTS: 100,
  USE_HERO_TIER: true,
  USE_SOLO_SYNERGIES: true,
  USE_SYNERGIES: true,
  USE_COUNTER_PICKS: true,
  GRADE_S: 4,
  GRADE_SA: 3,
  GRADE_A: 2,
  GRADE_B: 1,
  TIER_S: 5,
  TIER_A: 4,
  TIER_B: 3,
  TIER_C: 2,
  TIER_D: 1,
  COUNTER_PICK_BONUS: 2,
  ANTI_COUNTER_PICK_BONUS: 3,
  WEAK_TO_ENEMY_PENALTY: -1,
  CLASS_WEIGHTS: { Dive: 0, Poke: 0, Brawl: 0 },
  ANTI_ROLE_WEIGHTS: { 'Anti-Dive': 0, 'Anti-Poke': 0, 'Anti-Brawl': 0 },
  ROLE_WEIGHTS: { sup: 1, dps: 3, tnk: 2 },
  USE_HEAVY_CLASS: true,
  HEAVY_CLASS_BONUS: 3,
  ROLE_COMPOSITIONS: DEFAULT_ROLE_COMPOSITIONS,
  MUST_HAVE_SYNERGY: true,
}

/**
 * Строит список валидных раскладок ролей с весом приоритета.
 * Раньше в массиве = выше вес = предпочтительнее при прочих равных.
 */
export function buildCompositionsToGenerate(
  roleCompositions: string[] = DEFAULT_ROLE_COMPOSITIONS,
  teamSize: number = DEFAULT_SETTINGS.TEAM_SIZE
): RoleComposition[] {
  return roleCompositions
    .map((str, index) => {
      const parts = str.split('-').map((n) => Number.parseInt(n.trim(), 10))
      if (parts.length !== 3 || parts.some(Number.isNaN)) return null

      const [sup, dps, tnk] = parts
      const totalSize = sup + dps + tnk
      if (totalSize !== teamSize) return null

      return {
        sup,
        dps,
        tnk,
        totalSize,
        weight: roleCompositions.length - index, // приоритет по позиции в списке
      }
    })
    .filter((c): c is RoleComposition => c !== null)
}
