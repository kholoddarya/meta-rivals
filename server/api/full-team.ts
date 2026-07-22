import { DEFAULT_ROLE_COMPOSITIONS } from '../utils/generatorSettings'
import { GRADE_SCORES, TIER_SCORES, ROLE_WEIGHTS } from '../utils/generator/constants'
import type { RoleType } from '~/types/sheets'

interface FullTeamResult {
  heroes: { name: string; role: RoleType | null; tier: string | null }[]
  composition: string
  totalScore: number
  synergyScore: number
  tierScore: number
  roleScore: number
  activeSynergies: number // Количество пар с синергией > 0 (макс. 15)
}

export default defineEventHandler(async (): Promise<{ teams: FullTeamResult[] }> => {
  const config = useRuntimeConfig()
  const spreadsheetId = config.spreadsheetId || '1wAGk5Na43fQPArlfj0T8c-HTjj3bs1PLyTKx0NdN-QY'
  const apiKey = config.googleApiKey

  if (!apiKey) throw createError({ statusCode: 500, message: 'Google API Key is missing' })

  const sheets = ['FullInfo', 'HeroTier', 'Roles'] as const
  const ranges = sheets.map((s) => `ranges=${encodeURIComponent(s)}`).join('&')
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?${ranges}&key=${apiKey}`

  let sheetsData: { valueRanges: { values: string[][] | undefined }[] }
  try {
    sheetsData = await $fetch(url)
  } catch (error: unknown) {
    throw createError({
      statusCode: 502,
      message: error instanceof Error ? error.message : 'Failed to fetch',
    })
  }

  const parseSheet = (index: number): Array<Record<string, string | null>> => {
    const vr = sheetsData.valueRanges[index]
    if (!vr || !vr.values || vr.values.length === 0) return []
    const [header, ...rows] = vr.values
    if (!header) return []
    return rows.map((row) => {
      const obj: Record<string, string | null> = {}
      header.forEach((h, idx) => {
        const key = (h ?? '').toString().trim()
        const val = row[idx]
        obj[key] = val !== undefined && val !== null ? val.toString().trim() : null
      })
      return obj
    })
  }

  const fullInfoRaw = parseSheet(0)
  const heroTierRaw = parseSheet(1)
  const rolesRaw = parseSheet(2)

  const rowHeaders = fullInfoRaw
    .map((row) =>
      ((row['Hero | Anchor'] || row['Hero'] || Object.values(row)[0]) ?? '').toString().trim()
    )
    .filter((name) => name !== '')

  const rolesMap = new Map<string, RoleType>()
  for (const row of rolesRaw) {
    const hero = ((row['Hero'] || Object.values(row)[0]) ?? '') as string
    const role = ((row['Role'] || Object.values(row)[1]) ?? '') as string
    const roleLower = role.toLowerCase()
    if (hero && ['sup', 'dps', 'tnk'].includes(roleLower)) {
      rolesMap.set(hero, roleLower as RoleType)
    }
  }

  const tiersMap = new Map<string, { tier: string; score: number }>()
  for (const row of heroTierRaw) {
    const hero = ((row['Hero'] || Object.values(row)[0]) ?? '') as string
    const tier = ((row['Tier'] || Object.values(row)[1]) ?? '') as string
    if (hero && tier) {
      tiersMap.set(hero, { tier: tier.toUpperCase(), score: TIER_SCORES[tier.toUpperCase()] ?? 0 })
    }
  }

  const heroIndex = new Map(rowHeaders.map((h, i) => [h, i]))

  const getGrade = (nameA: string, nameB: string): string | null => {
    const i = heroIndex.get(nameA)
    const j = heroIndex.get(nameB)
    if (i === undefined || j === undefined) return null
    const rowA = fullInfoRaw[i]
    const rowB = fullInfoRaw[j]
    const cell = rowA?.[nameB] ?? rowB?.[nameA]
    if (!cell || cell === '' || cell === 'N/A' || cell === '-') return null
    return cell.trim().toUpperCase()
  }

  const heroesByRole: Record<RoleType, string[]> = { sup: [], dps: [], tnk: [] }
  for (const hero of rowHeaders) {
    const role = rolesMap.get(hero)
    if (role) heroesByRole[role].push(hero)
  }

  // Сложная часть: сортируем героев внутри роли по "потенциалу" (Тир + максимальная синергия с кем-либо)
  // и берем топ-12, чтобы ограничить комбинаторный взрыв при переборе шестерок.
  const getTopHeroes = (role: RoleType, limit = 12) => {
    return heroesByRole[role]
      .map((hero) => {
        let maxSyn = 0
        for (const other of rowHeaders) {
          if (hero === other) continue
          const g = getGrade(hero, other)
          if (g && GRADE_SCORES[g] !== undefined && GRADE_SCORES[g] > maxSyn) {
            maxSyn = GRADE_SCORES[g]
          }
        }
        const tierScore = tiersMap.get(hero)?.score ?? 0
        return { hero, score: tierScore + maxSyn * 10 }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((x) => x.hero)
  }

  const topSup = getTopHeroes('sup')
  const topDps = getTopHeroes('dps')
  const topTnk = getTopHeroes('tnk')

  function getCombinations<T>(arr: T[], k: number): T[][] {
    if (k === 0) return [[]]
    if (arr.length < k) return []
    if (k === arr.length) return [arr]
    const [first, ...rest] = arr
    const withFirst = getCombinations(rest, k - 1).map((comb) => [first, ...comb])
    const withoutFirst = getCombinations(rest, k)
    return [...withFirst, ...withoutFirst]
  }

  const candidateTeams: FullTeamResult[] = []

  for (const comp of DEFAULT_ROLE_COMPOSITIONS) {
    const [sCount, dCount, tCount] = comp.split('-').map(Number) as [number, number, number]

    const supCombos = getCombinations(topSup, sCount)
    const dpsCombos = getCombinations(topDps, dCount)
    const tnkCombos = getCombinations(topTnk, tCount)

    for (const sCombo of supCombos) {
      for (const dCombo of dpsCombos) {
        for (const tCombo of tnkCombos) {
          const teamHeroes = [...sCombo, ...dCombo, ...tCombo]

          let synergyScore = 0
          let activeSynergies = 0

          // Оцениваем все 15 пар внутри команды из 6 героев
          for (let i = 0; i < 6; i++) {
            for (let j = i + 1; j < 6; j++) {
              const grade = getGrade(teamHeroes[i], teamHeroes[j])
              if (grade && GRADE_SCORES[grade] !== undefined) {
                synergyScore += GRADE_SCORES[grade]
                if (GRADE_SCORES[grade] > 0) activeSynergies++
              }
            }
          }

          // Если синергий нет вообще, пропускаем эту сборку
          if (activeSynergies === 0) continue

          let tierScore = 0
          let roleScore = 0
          const heroDetails = teamHeroes.map((name) => {
            const role = rolesMap.get(name) ?? null
            const tierObj = tiersMap.get(name) ?? null
            tierScore += tierObj?.score ?? 0
            roleScore += role ? ROLE_WEIGHTS[role] : 0
            return { name, role, tier: tierObj?.tier ?? null }
          })

          candidateTeams.push({
            heroes: heroDetails,
            composition: comp,
            synergyScore,
            tierScore,
            roleScore,
            totalScore: synergyScore + tierScore + roleScore,
            activeSynergies,
          })
        }
      }
    }
  }

  // Сортируем: сначала по общему скорy, при равенстве - по количеству закрытых тимапов
  candidateTeams.sort((a, b) => {
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore
    return b.activeSynergies - a.activeSynergies
  })

  return { teams: candidateTeams.slice(0, 15) }
})
