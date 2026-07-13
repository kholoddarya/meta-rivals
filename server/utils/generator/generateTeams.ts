import type {
  HeroRecord,
  SynergyMatrix,
  HeroTierMap,
  GenerationSettings,
  GenerationContext,
  RoleComposition,
  TeamResult
} from './types'
import { buildSynergyGraph, groupHeroesByRole } from './synergyGraph'
import { precomputeCounterPicks } from './counterPicks'
import { getCombinations, insertToTop, calculateUpperBound } from './combinations'
import { evaluateTeam } from './teamScoring'

/**
 * Разбирает строки раскладок вида "2-2-2" в объекты { sup, dps, tnk, weight }.
 * buildCompositionsToGenerate() из BusinessLogic.js — режим "counter" (подбор
 * контрпика под конкретную вражескую команду одним героем) сюда пока не
 * перенесён, добавим вместе с quick-pick на следующем шаге.
 */
function parseRoleCompositions(compositions: string[], teamSize: number): RoleComposition[] {
  const parsed: RoleComposition[] = []

  compositions.forEach((str, index) => {
    const parts = str.split('-').map(n => parseInt(n.trim(), 10))
    if (parts.length !== 3 || parts.some(Number.isNaN)) return

    const [sup, dps, tnk] = parts
    if (sup + dps + tnk !== teamSize) return

    parsed.push({ sup, dps, tnk, weight: compositions.length - index })
  })

  return parsed
}

export interface GenerateTeamsInput {
  heroes: HeroRecord[]
  synergyMatrix: SynergyMatrix
  heroTiers: HeroTierMap
  settings: GenerationSettings
}

/**
 * Главная функция генерации: для каждой ролевой раскладки перебирает все
 * комбинации героев по ролям, оценивает команды и держит топ N лучших.
 * Перенос основного цикла runGenerationAsync() из Generator.js — без
 * чтения/записи Google Sheets, данные приходят уже в готовом виде.
 */
export function generateTeams(input: GenerateTeamsInput): TeamResult[] {
  const { settings } = input
  const heroes = input.heroes.filter(h => !settings.bannedHeroIds.includes(h.id))
  const heroesById = new Map(heroes.map(h => [h.id, h]))

  const compositions = parseRoleCompositions(settings.roleCompositions, settings.teamSize)
  if (compositions.length === 0) {
    throw new Error(`Нет валидных раскладок для размера команды ${settings.teamSize}`)
  }

  const { graph, soloCapableHeroIds } = buildSynergyGraph(
    heroes,
    input.synergyMatrix,
    settings.gradeScores,
    settings.useSoloSynergies
  )
  const charactersByRole = groupHeroesByRole(heroes)
  const counterPickCache = precomputeCounterPicks(heroes, settings.enemyHeroIds, heroesById, settings)

  const context: GenerationContext = {
    heroes,
    heroesById,
    settings,
    graph,
    soloCapableHeroIds,
    heroTiers: input.heroTiers,
    counterPickCache,
    charactersByRole
  }

  const topTeams: TeamResult[] = []

  for (const comp of compositions) {
    const supCombos = getCombinations(charactersByRole.sup, comp.sup)
    const dpsCombos = getCombinations(charactersByRole.dps, comp.dps)
    const tnkCombos = getCombinations(charactersByRole.tnk, comp.tnk)
    const compositionLabel = `${comp.sup}-${comp.dps}-${comp.tnk}`

    for (const supTeam of supCombos) {
      for (const dpsTeam of dpsCombos) {
        for (const tnkTeam of tnkCombos) {
          const team = [...supTeam, ...dpsTeam, ...tnkTeam]

          // Раннее отсечение: если топ уже заполнен и даже теоретический
          // максимум этой команды не превзойдёт худшую в топе — пропускаем,
          // не считая полный скор. calculateUpperBound() из BusinessLogic.js.
          if (topTeams.length >= settings.maxResults) {
            const worstScore = topTeams[topTeams.length - 1].totalScore
            const upperBound =
              calculateUpperBound(team, soloCapableHeroIds, settings.gradeScores) + comp.weight
            if (upperBound <= worstScore) continue
          }

          const result = evaluateTeam(team, compositionLabel, comp.weight, context)
          if (result) insertToTop(topTeams, result, settings.maxResults)
        }
      }
    }
  }

  return topTeams
}
