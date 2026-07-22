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

interface RoleDistribution {
  sup: number
  dps: number
  tnk: number
  weight: number
  finalComp: string
}

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
      maxResults: Math.max(1, input.options.maxResults ?? DEFAULT_SETTINGS.MAX_RESULTS ?? 10),
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

    // Роли уже выбранных героев — критично для правильного подбора приоритетной композиции
    const myHeroRoleCounts: Record<RoleType, number> = { sup: 0, dps: 0, tnk: 0 }
    for (const idx of myHeroIndices) {
      const role = rolesMap.get(rowHeaders[idx])
      if (role) myHeroRoleCounts[role]++
    }

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

    // Полный размер команды = уже выбранные герои + запрошенные роли (в т.ч. флексы)
    const totalTeamSize =
      fixedRoles.sup + fixedRoles.dps + fixedRoles.tnk + flxCount + myHeroIndices.length

    if (totalTeamSize > DEFAULT_SETTINGS.TEAM_SIZE) {
      return {
        success: false,
        error: `Selected heroes and roles (${totalTeamSize}) exceed team size of ${DEFAULT_SETTINGS.TEAM_SIZE}.`,
      }
    }

    // Все валидные раскладки на полную команду (6), с весом приоритета
    const prioritizedCompositions = buildCompositionsToGenerate(
      DEFAULT_SETTINGS.ROLE_COMPOSITIONS,
      DEFAULT_SETTINGS.TEAM_SIZE
    )

    const compositionWeightsMap: Record<string, number> = {}
    prioritizedCompositions.forEach((c) => {
      compositionWeightsMap[`${c.sup}-${c.dps}-${c.tnk}`] = c.weight
    })

    let distributionsToProcess: RoleDistribution[] = []

    if (flxCount === 0) {
      // Флексов нет — раскладка полностью зафиксирована слайдерами + уже выбранными героями.
      // Вес всё равно берём из приоритетного списка, чтобы группы сортировались осмысленно.
      const finalSup = fixedRoles.sup + myHeroRoleCounts.sup
      const finalDps = fixedRoles.dps + myHeroRoleCounts.dps
      const finalTnk = fixedRoles.tnk + myHeroRoleCounts.tnk
      const finalComp = `${finalSup}-${finalDps}-${finalTnk}`

      distributionsToProcess = [
        {
          sup: fixedRoles.sup,
          dps: fixedRoles.dps,
          tnk: fixedRoles.tnk,
          weight: compositionWeightsMap[finalComp] || 0,
          finalComp,
        },
      ]
    } else {
      // Есть флексы — подбираем их так, чтобы ФИНАЛЬНАЯ (с учётом уже выбранных героев)
      // композиция как можно точнее совпадала с приоритетным списком.
      const validDistributions = prioritizedCompositions
        .filter((comp) => {
          const flexNeeded =
            comp.sup -
            fixedRoles.sup -
            myHeroRoleCounts.sup +
            (comp.dps - fixedRoles.dps - myHeroRoleCounts.dps) +
            (comp.tnk - fixedRoles.tnk - myHeroRoleCounts.tnk)

          return (
            comp.sup >= fixedRoles.sup + myHeroRoleCounts.sup &&
            comp.dps >= fixedRoles.dps + myHeroRoleCounts.dps &&
            comp.tnk >= fixedRoles.tnk + myHeroRoleCounts.tnk &&
            flexNeeded === flxCount
          )
        })
        .map((comp) => ({
          sup: comp.sup - fixedRoles.sup - myHeroRoleCounts.sup,
          dps: comp.dps - fixedRoles.dps - myHeroRoleCounts.dps,
          tnk: comp.tnk - fixedRoles.tnk - myHeroRoleCounts.tnk,
          weight: comp.weight,
          finalComp: `${comp.sup}-${comp.dps}-${comp.tnk}`,
        }))

      if (validDistributions.length > 0) {
        distributionsToProcess = validDistributions
      } else {
        // Фоллбэк: ни одна приоритетная раскладка не достижима с текущим набором —
        // перебираем все варианты распределения флексов с нейтральным весом 0
        distributionsToProcess = generateFlxDistributions(flxCount).map((d) => ({
          sup: d.sup,
          dps: d.dps,
          tnk: d.tnk,
          weight: 0,
          finalComp: `${fixedRoles.sup + d.sup + myHeroRoleCounts.sup}-${fixedRoles.dps + d.dps + myHeroRoleCounts.dps}-${fixedRoles.tnk + d.tnk + myHeroRoleCounts.tnk}`,
        }))
      }
    }

    // Сортируем по весу, чтобы генератор в первую очередь проверял лучшие композиции
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

    for (const dist of distributionsToProcess) {
      // Итоговое число героев каждой роли, которых нужно НАБРАТЬ (слайдеры + флекс)
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

      // 🛠 Было dist.sup/dps/tnk — учитывало только флекс-добавку и теряло heroes из fixedRoles
      const supComb = getCombinations(charactersByRole.sup, totalRoles.sup)
      const dpsComb = getCombinations(charactersByRole.dps, totalRoles.dps)
      const tnkComb = getCombinations(charactersByRole.tnk, totalRoles.tnk)

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
