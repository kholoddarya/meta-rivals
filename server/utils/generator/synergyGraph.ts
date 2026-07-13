import type { HeroRecord, SynergyMatrix, GenerationSettings, SynergyGraph, HeroRole } from './types'

/**
 * Строит граф синергий: для каждого героя — список партнёров и оценка связи.
 * Перенос buildSynergyGraph() из BusinessLogic.js, адаптирован под heroId
 * вместо индексов строк таблицы — сама логика (грейд → очки, соло-синергии
 * на грейде "S") не менялась.
 */
export function buildSynergyGraph(
  heroes: HeroRecord[],
  synergyMatrix: SynergyMatrix,
  gradeScores: GenerationSettings['gradeScores'],
  useSoloSynergies: boolean
): { graph: SynergyGraph; soloCapableHeroIds: Set<string> } {
  const graph: SynergyGraph = {}
  const soloCapableHeroIds = new Set<string>()

  for (const hero of heroes) {
    graph[hero.id] = {}
    const partners = synergyMatrix[hero.id]
    if (!partners) continue

    for (const [partnerId, grade] of Object.entries(partners)) {
      if (partnerId === hero.id) continue

      const score = gradeScores[grade]
      if (score === undefined) continue

      graph[hero.id][partnerId] = { grade, score }

      if (useSoloSynergies && grade === 'S') {
        soloCapableHeroIds.add(hero.id)
      }
    }
  }

  return { graph, soloCapableHeroIds }
}

/** Группирует героев по ролям — groupCharactersByRole() из BusinessLogic.js */
export function groupHeroesByRole(heroes: HeroRecord[]): Record<HeroRole, string[]> {
  const byRole: Record<HeroRole, string[]> = { sup: [], dps: [], tnk: [] }
  for (const hero of heroes) {
    byRole[hero.role].push(hero.id)
  }
  return byRole
}
