import type { RoleType } from '~/types/sheets'
import type {
  GeneratorInput,
  GeneratorResult,
  GeneratorContext,
  TeamGroup,
  TeamResult,
} from '~/types/generator'
import { CLASS_COUNTERS, ROLE_WEIGHTS, TIER_SCORES, GRADE_SCORES } from './constants'
import { getCombinations, insertToTop, generateFlxDistributions } from './utils'
import { evaluateTeam } from './evaluator'
import { buildCompositionsToGenerate, DEFAULT_SETTINGS } from '../generatorSettings'

// Построение графа синергий
function buildSynergyGraph(
  rowHeaders: string[],
  matrixData: Array<Record<string, string | null>>,
  useSoloSynergies: boolean
) {
  const graph = new Map<number, Map<number, { grade: string; score: number }>>()
  const soloCapableChars = new Set<number>()

  for (let i = 0; i < rowHeaders.length; i++) {
    const charMap = new Map<number, { grade: string; score: number }>()
    const row = matrixData[i]
    if (!row) continue

    for (let j = 0; j < rowHeaders.length; j++) {
      if (j === i) continue
      const partnerName = rowHeaders[j]
      const cellValue = row[partnerName]

      if (!cellValue || cellValue === '' || cellValue === 'N/A' || cellValue === '-') continue

      const grade = cellValue.trim().toUpperCase()
      if (GRADE_SCORES[grade] !== undefined) {
        charMap.set(j, { grade, score: GRADE_SCORES[grade] })
      }
      if (useSoloSynergies && grade === 'S') {
        soloCapableChars.add(i)
      }
    }
    if (charMap.size > 0) {
      graph.set(i, charMap)
    }
  }
  return { graph, soloCapableChars }
}

// Группировка героев по ролям
function groupCharactersByRole(
  rowHeaders: string[],
  rolesMap: Map<string, RoleType>,
  bannedIndices: Set<number>
) {
  const groups: Record<RoleType, number[]> = { sup: [], dps: [], tnk: [] }

  for (let i = 0; i < rowHeaders.length; i++) {
    if (bannedIndices.has(i)) continue

    const role = rolesMap.get(rowHeaders[i])
    if (role) {
      groups[role].push(i)
    }
  }
  return groups
}

// Предвычисление контрпиков
function precomputeCounterPicks(
  rowHeaders: string[],
  classesMap: Map<string, { class: string; counter: string }>,
  enemyIndices: number[],
  enemyClassesMap: Map<number, string>
) {
  const cache = new Map<number, number>()
  if (enemyIndices.length === 0) return cache

  for (let i = 0; i < rowHeaders.length; i++) {
    const classData = classesMap.get(rowHeaders[i])
    if (!classData) continue

    let score = 0
    for (const enemyIdx of enemyIndices) {
      const enemyClass = enemyClassesMap.get(enemyIdx)
      if (!enemyClass) continue

      if (classData.counter && CLASS_COUNTERS[classData.counter] === enemyClass) {
        score += 3
      } else if (classData.class && CLASS_COUNTERS[classData.class] === enemyClass) {
        score += 2
      } else if (classData.class && CLASS_COUNTERS[enemyClass] === classData.class) {
        score += -1
      }
    }
    cache.set(i, score)
  }
  return cache
}

// Расчёт верхней границы для отсечения
function calculateQuickUpperBound(team: number[], context: GeneratorContext) {
  let maxPossible = 0
  const roleCounts: Record<RoleType, number> = { sup: 0, dps: 0, tnk: 0 }
  const classCounts: Record<string, number> = {}

  for (const charIdx of team) {
    const charName = context.rowHeaders[charIdx]

    if (context.options.useTiers) {
      const tierInfo = context.heroTiersMap.get(charName)
      if (tierInfo) {
        maxPossible += tierInfo.score
      }
    }

    if (context.options.useSynergies) {
      maxPossible += context.soloCapableChars.has(charIdx)
        ? (GRADE_SCORES['SA'] ?? 3)
        : (GRADE_SCORES['S'] ?? 4)
    }

    const role = context.rolesMap.get(charName)
    if (role) {
      roleCounts[role]++
    }

    const classData = context.classesMap.get(charName)
    if (classData) {
      if (classData.class) {
        classCounts[classData.class] = (classCounts[classData.class] || 0) + 1
      }

      if (context.options.useCounterPicks) {
        for (const enemyIdx of context.enemyIndices) {
          const enemyClass = context.enemyClassesMap.get(enemyIdx)
          if (!enemyClass) continue

          if (classData.counter && CLASS_COUNTERS[classData.counter] === enemyClass) {
            maxPossible += 3
          } else if (classData.class && CLASS_COUNTERS[classData.class] === enemyClass) {
            maxPossible += 2
          }
        }
      }

      if (context.options.useClassWeights && classData.class) {
        maxPossible += context.classWeights[classData.class] || 0
      }
      if (context.options.useAntiRoleWeights && classData.counter) {
        maxPossible += context.antiRoleWeights[classData.counter] || 0
      }
    }
  }

  maxPossible +=
    roleCounts.sup * (ROLE_WEIGHTS.sup || 0) +
    roleCounts.dps * (ROLE_WEIGHTS.dps || 0) +
    roleCounts.tnk * (ROLE_WEIGHTS.tnk || 0)

  const classValues = Object.values(classCounts)
  if (classValues.length > 0 && team.length > 1) {
    const ratio = Math.max(...classValues) / team.length
    if (ratio >= 0.67) {
      maxPossible += Math.round(3 * ratio)
    }
  }

  return maxPossible + 1
}

// Группировка смежных команд
function groupSimilarTeams(teams: TeamResult[], rolesMap: Map<string, RoleType>): TeamGroup[] {
  if (!teams || teams.length === 0) return []

  const groups: TeamGroup[] = []
  const used = new Set<number>()

  for (let i = 0; i < teams.length; i++) {
    if (used.has(i)) continue

    const bestTeam = teams[i]
    const baseMembers = bestTeam.addedMembers || []
    const baseComposition = bestTeam.finalComposition || bestTeam.composition || ''

    const group: TeamGroup = {
      id: `group_${i}`,
      bestTeam,
      baseMembers: [...baseMembers],
      baseComposition,
      slotAlternatives: [],
      bestScore: bestTeam.totalScore,
      worstScore: bestTeam.totalScore,
      compositionWeight: 1,
      bestTeamWeight: bestTeam.totalScore,
    }
    used.add(i)

    for (let j = i + 1; j < teams.length; j++) {
      if (used.has(j)) continue

      const candidate = teams[j]
      const candidateMembers = candidate.addedMembers || []
      const candidateComp = candidate.finalComposition || candidate.composition || ''

      if (candidateComp !== baseComposition || candidateMembers.length !== baseMembers.length)
        continue

      const candidateSet = new Set(candidateMembers)
      let intersectionCount = 0
      for (const m of baseMembers) {
        if (candidateSet.has(m)) intersectionCount++
      }

      if (baseMembers.length - intersectionCount === 1) {
        group.worstScore = Math.min(group.worstScore, candidate.totalScore)
        used.add(j)

        const memberSet = new Set(candidateMembers)
        const baseSetLocal = new Set(baseMembers)
        const replaced = baseMembers.filter((m) => !memberSet.has(m))
        const added = candidateMembers.filter((m) => !baseSetLocal.has(m))

        if (replaced.length === 1 && added.length === 1) {
          const replacedHero = replaced[0]
          const addedHero = added[0]
          const pos = baseMembers.indexOf(replacedHero)

          const baseRole = rolesMap.get(replacedHero) ?? null
          const addedRole = rolesMap.get(addedHero) ?? null

          if (baseRole && addedRole && baseRole !== addedRole) continue

          let slot = group.slotAlternatives.find((s) => s.position === pos)
          if (!slot) {
            slot = {
              position: pos,
              baseHero: replacedHero,
              baseRole,
              alternatives: [],
              baseHeroWeight: group.bestScore,
            }
            group.slotAlternatives.push(slot)
          }

          const existing = slot.alternatives.find((a) => a.name === addedHero)
          if (!existing) {
            slot.alternatives.push({
              name: addedHero,
              role: addedRole,
              bestScore: candidate.totalScore,
              compositionWeight: candidate.totalScore,
            })
          } else if (candidate.totalScore > existing.bestScore) {
            existing.bestScore = candidate.totalScore
            existing.compositionWeight = candidate.totalScore
          }
        }
      }
    }

    group.slotAlternatives.sort((a, b) => a.position - b.position)
    group.slotAlternatives.forEach((slot) => {
      slot.alternatives.sort((a, b) => b.bestScore - a.bestScore)
    })
    group.slotAlternatives = group.slotAlternatives.filter((s) => s.alternatives.length > 0)
    groups.push(group)
  }

  groups.sort((a, b) =>
    a.compositionWeight !== b.compositionWeight
      ? b.compositionWeight - a.compositionWeight
      : b.bestScore - a.bestScore
  )

  return groups
}

// Главная функция генерации
export function runQuickPickGeneration(
  input: GeneratorInput,
  rowHeaders: string[],
  matrixData: Array<Record<string, string | null>>,
  rolesMap: Map<string, RoleType>,
  classesMap: Map<string, { class: string; counter: string }>,
  heroTiersList: Array<{ hero: string; tier: string }>
): GeneratorResult {
  const startTime = Date.now()

  try {
    const opts = {
      ...input.options,
      maxResults: 10,
    }
    const bannedSet = new Set(input.banned || [])

    const enemyIndices = input.enemies.map((e) => rowHeaders.indexOf(e)).filter((idx) => idx !== -1)

    const starredEnemyIndices = input.starred
      .map((e) => {
        const idx = rowHeaders.indexOf(e)
        return idx !== -1 && enemyIndices.includes(idx) ? idx : -1
      })
      .filter((idx) => idx !== -1)

    const myHeroIndices = input.myHeroes
      .filter((h) => !bannedSet.has(h))
      .map((h) => rowHeaders.indexOf(h))
      .filter((idx) => idx !== -1)

    const bannedIndices = new Set(
      rowHeaders.map((name, i) => (bannedSet.has(name) ? i : -1)).filter((i) => i !== -1)
    )

    const heroTiersMap = new Map<string, { tier: string; score: number }>()
    if (opts.useTiers) {
      for (const h of heroTiersList) {
        heroTiersMap.set(h.hero, {
          tier: h.tier,
          score: TIER_SCORES[h.tier] ?? 0,
        })
      }
    }

    const { graph, soloCapableChars } = buildSynergyGraph(
      rowHeaders,
      matrixData,
      opts.useSoloSynergies
    )

    const enemyClassesMap = new Map<number, string>()
    for (const enemyIdx of enemyIndices) {
      const classData = classesMap.get(rowHeaders[enemyIdx])
      if (classData) {
        enemyClassesMap.set(enemyIdx, classData.class)
      }
    }

    const counterPickCache = precomputeCounterPicks(
      rowHeaders,
      classesMap,
      enemyIndices,
      enemyClassesMap
    )
    const charactersByRole = groupCharactersByRole(rowHeaders, rolesMap, bannedIndices)

    const fixedRoles: Record<RoleType, number> = { sup: 0, dps: 0, tnk: 0 }
    let flxCount = 0

    // Считаем роли, явно запрошенные в "Roles to Draft"
    for (const role of input.roles) {
      if (role === 'flx') {
        flxCount++
      } else {
        fixedRoles[role]++
      }
    }

    // ДОБАВЛЯЕМ роли героев, которые пользователь уже выбрал в "Heroes"
    // for (const heroName of input.myHeroes) {
    //   const role = rolesMap.get(heroName)
    //   if (role && (role === 'sup' || role === 'dps' || role === 'tnk')) {
    //     fixedRoles[role]++
    //   }
    // }

    // Если пользователь выбрал больше героев, чем TEAM_SIZE, ограничиваем
    const totalFixed = fixedRoles.sup + fixedRoles.dps + fixedRoles.tnk + flxCount
    if (totalFixed > 6) {
      // В идеале это должно блокироваться на фронте, но на всякий случай
      return { success: false, error: 'Total selected heroes and roles exceed team size of 6.' }
    }

    // Получаем все валидные раскладки с их весами приоритета
    const prioritizedCompositions = buildCompositionsToGenerate(
      DEFAULT_SETTINGS.ROLE_COMPOSITIONS,
      DEFAULT_SETTINGS.TEAM_SIZE
    )

    let distributionsToProcess: any[] = []

    if (flxCount === 0) {
      // 🎯 ЕСЛИ FLEX НЕТ: мы просто используем запрошенные роли как есть.
      // Финальная композиция будет корректно посчитана в evaluator.ts на основе всех 6 героев.
      distributionsToProcess = [
        {
          sup: fixedRoles.sup,
          dps: fixedRoles.dps,
          tnk: fixedRoles.tnk,
          weight: 1, // Базовый вес, итоговая оценка будет зависеть от реальной finalComposition
          finalComp: 'pending', // Будет перезаписано корректным значением внутри evaluateTeam
        },
      ]
    } else {
      // 🎯 ЕСЛИ FLEX ЕСТЬ: распределяем их, чтобы достичь приоритетных композиций
      const validDistributions = prioritizedCompositions
        .filter(
          (comp) =>
            comp.sup >= fixedRoles.sup &&
            comp.dps >= fixedRoles.dps &&
            comp.tnk >= fixedRoles.tnk &&
            comp.sup -
              fixedRoles.sup +
              (comp.dps - fixedRoles.dps) +
              (comp.tnk - fixedRoles.tnk) ===
              flxCount
        )
        .map((comp) => ({
          sup: comp.sup - fixedRoles.sup,
          dps: comp.dps - fixedRoles.dps,
          tnk: comp.tnk - fixedRoles.tnk,
          weight: comp.weight,
          finalComp: `${comp.sup}-${comp.dps}-${comp.tnk}`,
        }))

      if (validDistributions.length > 0) {
        distributionsToProcess = validDistributions
      } else {
        // Фоллбэк: если запрошенные роли + флексы не дают ни одной валидной композиции,
        // просто перебираем все варианты распределения флексов с весом 0
        distributionsToProcess = generateFlxDistributions(flxCount).map((d) => ({
          sup: d.sup,
          dps: d.dps,
          tnk: d.tnk,
          weight: 0,
          finalComp: `${fixedRoles.sup + d.sup}-${fixedRoles.dps + d.dps}-${fixedRoles.tnk + d.tnk}`,
        }))
      }
    }

    // Сортируем по весу (приоритету), чтобы генератор в первую очередь проверял лучшие композиции
    distributionsToProcess.sort((a, b) => b.weight - a.weight)

    const context: GeneratorContext = {
      rowHeaders,
      rolesMap,
      graph,
      soloCapableChars,
      heroTiersMap,
      classesMap,
      enemyIndices,
      starredEnemyIndices,
      enemyClassesMap,
      counterPickCache,
      gradeScores: GRADE_SCORES,
      tierScores: TIER_SCORES,
      roleWeights: ROLE_WEIGHTS,
      classWeights: { Dive: 0, Poke: 0, Brawl: 0 },
      antiRoleWeights: { 'Anti-Dive': 0, 'Anti-Poke': 0, 'Anti-Brawl': 0 },
      classCounters: CLASS_COUNTERS,
      myHeroIndices,
      options: opts,
    }

    const topTeams: TeamResult[] = []
    let totalIterations = 0
    let skippedByBound = 0

    // Итерируемся по отсортированным дистрибуциям
    for (const dist of distributionsToProcess) {
      const totalRoles = {
        sup: fixedRoles.sup + dist.sup,
        dps: fixedRoles.dps + dist.dps,
        tnk: fixedRoles.tnk + dist.tnk,
      }

      if (
        totalRoles.sup > charactersByRole.sup.length ||
        totalRoles.dps > charactersByRole.dps.length ||
        totalRoles.tnk > charactersByRole.tnk.length
      ) {
        continue
      }

      const supComb = getCombinations(charactersByRole.sup, dist.sup)
      const dpsComb = getCombinations(charactersByRole.dps, dist.dps)
      const tnkComb = getCombinations(charactersByRole.tnk, dist.tnk)

      const compStr = dist.finalComp
      const compWeight = dist.weight

      for (const supTeam of supComb) {
        for (const dpsTeam of dpsComb) {
          for (const tnkTeam of tnkComb) {
            const team = [...myHeroIndices, ...supTeam, ...dpsTeam, ...tnkTeam]
            const uniqueTeam = Array.from(new Set(team))

            if (uniqueTeam.length !== team.length) {
              totalIterations++
              continue
            }

            if (topTeams.length >= opts.maxResults) {
              const worstScore = topTeams[topTeams.length - 1].totalScore
              if (calculateQuickUpperBound(uniqueTeam, context) + compWeight <= worstScore) {
                skippedByBound++
                totalIterations++
                continue
              }
            }

            const res = evaluateTeam(uniqueTeam, compStr, compWeight, context)
            if (res) {
              insertToTop(topTeams, res, opts.maxResults)
            }
            totalIterations++
          }
        }
        if (Date.now() - startTime > 240000) break
      }
      if (Date.now() - startTime > 240000) break
    }

    const topK = topTeams.slice(0, opts.maxResults)
    const groups = groupSimilarTeams(topK, rolesMap)

    groups.forEach((group) => {
      group.bestTeamWeight = group.bestScore
      group.slotAlternatives.forEach((slot) => {
        slot.baseHeroWeight = group.bestScore
        slot.alternatives.forEach((alt) => {
          alt.compositionWeight = alt.bestScore
        })
      })
    })

    return {
      success: true,
      teams: topK,
      groups,
      myHeroes: input.myHeroes,
      enemies: input.enemies,
      stats: {
        duration: ((Date.now() - startTime) / 1000).toFixed(2),
        iterations: totalIterations,
        skippedByBound,
        distributions: distributionsToProcess.length,
        totalGenerated: topTeams.length,
        groupsCount: groups.length,
        requestedResults: opts.maxResults,
      },
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Неизвестная ошибка'
    console.error('Ошибка генерации:', message)
    return { success: false, error: message }
  }
}
