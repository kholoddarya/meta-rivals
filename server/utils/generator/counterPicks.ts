import type { HeroRecord, GenerationSettings } from './types'
import { CLASS_COUNTERS } from './classCounters'

/**
 * Считает бонус/штраф контрпика для каждого героя относительно известной
 * вражеской команды — один раз для всех героев, чтобы не пересчитывать это
 * на каждой оценённой команде. precomputeCounterPicks() из BusinessLogic.js.
 */
export function precomputeCounterPicks(
  heroes: HeroRecord[],
  enemyHeroIds: string[],
  heroesById: Map<string, HeroRecord>,
  settings: GenerationSettings
): Record<string, number> {
  const cache: Record<string, number> = {}
  if (!settings.useCounterPicks || enemyHeroIds.length === 0) return cache

  const enemyClasses = enemyHeroIds
    .map(id => heroesById.get(id)?.class)
    .filter((c): c is NonNullable<typeof c> => Boolean(c))

  for (const hero of heroes) {
    if (!hero.class) continue
    let score = 0

    for (const enemyClass of enemyClasses) {
      if (hero.counterClass && CLASS_COUNTERS[hero.counterClass] === enemyClass) {
        score += settings.antiCounterPickBonus
      } else if (CLASS_COUNTERS[hero.class] === enemyClass) {
        score += settings.counterPickBonus
      } else if (CLASS_COUNTERS[enemyClass] === hero.class) {
        score += settings.weakToEnemyPenalty
      }
    }

    cache[hero.id] = score
  }

  return cache
}
