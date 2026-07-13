import type { GenerationContext, TeamResult, HeroRole } from './types'
import { CLASS_COUNTERS } from './classCounters'

/** Есть ли у героя SA-синергия с кем угодно, или любая синергия с командой */
function hasAnySynergy(heroId: string, team: string[], context: GenerationContext): boolean {
  const links = context.graph[heroId] || {}

  for (const link of Object.values(links)) {
    if (link.grade === 'SA') return true
  }
  for (const partnerId of team) {
    if (partnerId === heroId) continue
    if (links[partnerId]) return true
  }
  return false
}

/**
 * Проверяет, что обязательные персонажи входят в команду и (если включено
 * mustHaveSynergy) имеют синергию с кем-то из состава. checkMustHave() из
 * Generator.js.
 */
function checkMustHave(team: string[], context: GenerationContext): boolean {
  const { settings, soloCapableHeroIds } = context

  for (const mustId of settings.mustHaveHeroIds) {
    if (!team.includes(mustId)) return false
  }

  if (!settings.mustHaveSynergy || settings.mustHaveHeroIds.length === 0 || !settings.useSynergies) {
    return true
  }

  for (const mustId of settings.mustHaveHeroIds) {
    if (settings.useSoloSynergies && soloCapableHeroIds.has(mustId)) continue
    if (!hasAnySynergy(mustId, team, context)) return false
  }

  return true
}

interface ScoredTeam {
  synergyScore: number
  synergyCount: number
  minSynergyScore: number
  tierScore: number
  counterScore: number
  roleCounts: Record<HeroRole, number>
  classCounts: Record<string, number>
  details: TeamResult['details']
}

/**
 * Считает синергии, тиры, контрпики и роли за один проход по команде.
 * Объединяет collectTeamData() + calculateAllScores() из Generator.js — в
 * оригинале они были разделены под особенности вывода в Google Sheets, здесь
 * в этом нет необходимости.
 */
function scoreTeam(team: string[], context: GenerationContext): ScoredTeam {
  const { settings, heroesById, graph, soloCapableHeroIds, heroTiers, counterPickCache } = context

  let synergyScore = 0
  let synergyCount = 0
  let minSynergyScore = Infinity
  let tierScore = 0
  let counterScore = 0
  const roleCounts: Record<HeroRole, number> = { sup: 0, dps: 0, tnk: 0 }
  const classCounts: Record<string, number> = {}
  const details: TeamResult['details'] = { synergy: [], counter: [], weakness: [], tier: [], heavy: [] }
  const processedPairs = new Set<string>()

  for (const heroId of team) {
    const hero = heroesById.get(heroId)
    if (!hero) continue

    roleCounts[hero.role]++
    if (hero.class) classCounts[hero.class] = (classCounts[hero.class] || 0) + 1

    if (settings.useHeroTier) {
      const tier = heroTiers[heroId]
      if (tier) {
        tierScore += settings.tierScores[tier]
        details.tier.push(`${hero.name} — тир ${tier}`)
      }
    }

    counterScore += counterPickCache[heroId] || 0

    // Текстовые пояснения контрпика/уязвимости для UI (сам счёт уже учтён
    // через counterPickCache — здесь только "почему так", герой vs герой).
    if (settings.useCounterPicks && hero.class) {
      for (const enemyId of settings.enemyHeroIds) {
        const enemy = heroesById.get(enemyId)
        if (!enemy?.class) continue

        if (hero.counterClass && CLASS_COUNTERS[hero.counterClass] === enemy.class) {
          details.counter.push(`${hero.name} (${hero.counterClass}) → ${enemy.name}`)
        } else if (CLASS_COUNTERS[hero.class] === enemy.class) {
          details.counter.push(`${hero.name} (${hero.class}) → ${enemy.name}`)
        } else if (CLASS_COUNTERS[enemy.class] === hero.class) {
          details.weakness.push(`${hero.name} ← ${enemy.name} (${enemy.class})`)
        }
      }
    }

    if (!settings.useSynergies || team.length === 1) continue

    const candidates: { score: number; grade: string; partnerId?: string; partnerName?: string }[] = []

    for (const partnerId of team) {
      if (partnerId === heroId) continue
      const link = graph[heroId]?.[partnerId]
      if (link) {
        candidates.push({
          score: link.score,
          grade: link.grade,
          partnerId,
          partnerName: heroesById.get(partnerId)?.name
        })
      }
    }

    if (settings.useSoloSynergies && soloCapableHeroIds.has(heroId)) {
      candidates.push({ score: settings.gradeScores.SA, grade: 'S_SOLO' })
    }

    if (candidates.length === 0) continue

    candidates.sort((a, b) => b.score - a.score)
    const best = candidates[0]
    synergyScore += best.score
    minSynergyScore = Math.min(minSynergyScore, best.score)

    // Пара учитывается один раз (A↔B не должно считаться дважды)
    if (best.partnerId) {
      const pairKey = [heroId, best.partnerId].sort().join('-')
      if (!processedPairs.has(pairKey)) {
        processedPairs.add(pairKey)
        synergyCount++
        details.synergy.push(`${hero.name} ↔ ${best.partnerName} — синергия ${best.grade}`)
      }
    }
  }

  return { synergyScore, synergyCount, minSynergyScore, tierScore, counterScore, roleCounts, classCounts, details }
}

/**
 * Оценивает конкретную команду целиком и возвращает результат, либо null,
 * если команда не проходит фильтры (обязательные герои, минимум синергий).
 * evaluateTeam() из Generator.js.
 */
export function evaluateTeam(
  team: string[],
  compositionLabel: string,
  compositionWeight: number,
  context: GenerationContext
): TeamResult | null {
  const { settings } = context

  if (!checkMustHave(team, context)) return null

  const scored = scoreTeam(team, context)

  const synergyOk =
    !settings.useSynergies || team.length === 1 || scored.synergyCount >= settings.minSynergies
  if (!synergyOk) return null

  // Роли: вес каждой роли × сколько героев этой роли в команде
  const roleScore =
    scored.roleCounts.sup * settings.roleWeights.sup +
    scored.roleCounts.dps * settings.roleWeights.dps +
    scored.roleCounts.tnk * settings.roleWeights.tnk

  // Heavy-class: бонус, если один класс доминирует в составе (порог 67%,
  // как и в оригинале) — команда "заточена" под один стиль игры.
  let heavyScore = 0
  if (settings.useHeavyClass && settings.heavyClassBonus > 0 && team.length > 1) {
    const counts = Object.values(scored.classCounts)
    if (counts.length > 0) {
      const maxCount = Math.max(...counts)
      const ratio = maxCount / team.length
      if (ratio >= 0.67) {
        heavyScore = Math.round(settings.heavyClassBonus * ratio)
        const dominantClass = Object.entries(scored.classCounts).find(([, c]) => c === maxCount)?.[0]
        scored.details.heavy.push(
          `Heavy ${dominantClass}: ${maxCount}/${team.length} героев (${Math.round(ratio * 100)}%)`
        )
      }
    }
  }

  const finalComposition = `${scored.roleCounts.sup}-${scored.roleCounts.dps}-${scored.roleCounts.tnk}`

  const totalScore =
    (settings.useSynergies ? scored.synergyScore : 0) +
    (settings.useHeroTier ? scored.tierScore : 0) +
    scored.counterScore +
    roleScore +
    heavyScore +
    compositionWeight

  return {
    memberIds: team,
    memberNames: team.map(id => context.heroesById.get(id)?.name ?? id),
    roles: team.map(id => context.heroesById.get(id)!.role),
    composition: compositionLabel,
    finalComposition,
    synergyScore: scored.synergyScore,
    counterScore: scored.counterScore,
    tierScore: scored.tierScore,
    roleScore,
    heavyScore,
    totalScore,
    synergyCount: scored.synergyCount,
    minSynergyScore: scored.synergyCount > 0 ? scored.minSynergyScore : 0,
    details: scored.details
  }
}
