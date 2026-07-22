import type { RoleType } from '~/types/sheets'
import { GRADE_SCORES, TIER_SCORES, ROLE_WEIGHTS } from '../utils/generator/constants'

interface QuadroResult {
  heroA: string
  roleA: RoleType | null
  tierA: string | null
  heroB: string
  roleB: RoleType | null
  tierB: string | null
  heroC: string
  roleC: RoleType | null
  tierC: string | null
  heroD: string
  roleD: RoleType | null
  tierD: string | null
  gradeAB: string
  gradeCD: string
  totalScore: number
  synergyScore: number
  tierScore: number
  roleScore: number
}

export default defineEventHandler(async (): Promise<{ quadri: QuadroResult[] }> => {
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
    if (hero && ['sup', 'dps', 'tnk'].includes(roleLower)) rolesMap.set(hero, roleLower as RoleType)
  }

  const tiersMap = new Map<string, { tier: string; score: number }>()
  for (const row of heroTierRaw) {
    const hero = ((row['Hero'] || Object.values(row)[0]) ?? '') as string
    const tier = ((row['Tier'] || Object.values(row)[1]) ?? '') as string
    if (hero && tier) {
      tiersMap.set(hero, { tier: tier.toUpperCase(), score: TIER_SCORES[tier.toUpperCase()] ?? 0 })
    }
  }

  const getGrade = (i: number, j: number): string | null => {
    const rowA = fullInfoRaw[i]
    const rowB = fullInfoRaw[j]
    const heroA = rowHeaders[i]
    const heroB = rowHeaders[j]
    const cell = rowA?.[heroB] ?? rowB?.[heroA]
    if (!cell || cell === '' || cell === 'N/A' || cell === '-') return null
    return cell.trim().toUpperCase()
  }

  // Собираем все валидные пары с их синергией
  const validPairs: { i: number; j: number; grade: string; score: number }[] = []
  for (let i = 0; i < rowHeaders.length; i++) {
    for (let j = i + 1; j < rowHeaders.length; j++) {
      const grade = getGrade(i, j)
      if (!grade || GRADE_SCORES[grade] === undefined) continue
      validPairs.push({ i, j, grade, score: GRADE_SCORES[grade] })
    }
  }

  const quadriMap = new Map<string, QuadroResult>()

  // Комбинируем пары: первая пара (a,b), вторая (c,d)
  // Чтобы избежать дубликатов (AB+CD = CD+AB), фиксируем порядок: a < c
  for (let p1 = 0; p1 < validPairs.length; p1++) {
    const pair1 = validPairs[p1]
    for (let p2 = p1 + 1; p2 < validPairs.length; p2++) {
      const pair2 = validPairs[p2]

      // Все 4 индекса должны быть уникальны
      if (
        pair1.i === pair2.i ||
        pair1.i === pair2.j ||
        pair1.j === pair2.i ||
        pair1.j === pair2.j
      ) {
        continue
      }

      const indices = [pair1.i, pair1.j, pair2.i, pair2.j]
      const rA = rolesMap.get(rowHeaders[pair1.i]) ?? null
      const rB = rolesMap.get(rowHeaders[pair1.j]) ?? null
      const rC = rolesMap.get(rowHeaders[pair2.i]) ?? null
      const rD = rolesMap.get(rowHeaders[pair2.j]) ?? null

      // Не допускаем команды из 4 героев одной роли
      if (rA && rB && rC && rD && rA === rB && rB === rC && rC === rD) continue

      const tA = tiersMap.get(rowHeaders[pair1.i]) ?? null
      const tB = tiersMap.get(rowHeaders[pair1.j]) ?? null
      const tC = tiersMap.get(rowHeaders[pair2.i]) ?? null
      const tD = tiersMap.get(rowHeaders[pair2.j]) ?? null

      const synergyScore = pair1.score + pair2.score
      const tierScore = (tA?.score ?? 0) + (tB?.score ?? 0) + (tC?.score ?? 0) + (tD?.score ?? 0)
      const roleScore =
        (rA ? ROLE_WEIGHTS[rA] : 0) +
        (rB ? ROLE_WEIGHTS[rB] : 0) +
        (rC ? ROLE_WEIGHTS[rC] : 0) +
        (rD ? ROLE_WEIGHTS[rD] : 0)
      const totalScore = synergyScore + tierScore + roleScore

      // Ключ для дедупликации: отсортированные имена героев
      const heroes = [
        rowHeaders[pair1.i],
        rowHeaders[pair1.j],
        rowHeaders[pair2.i],
        rowHeaders[pair2.j],
      ].sort()
      const key = heroes.join('|')

      const existing = quadriMap.get(key)
      if (existing && existing.totalScore >= totalScore) continue

      quadriMap.set(key, {
        heroA: rowHeaders[pair1.i],
        roleA: rA,
        tierA: tA?.tier ?? null,
        heroB: rowHeaders[pair1.j],
        roleB: rB,
        tierB: tB?.tier ?? null,
        heroC: rowHeaders[pair2.i],
        roleC: rC,
        tierC: tC?.tier ?? null,
        heroD: rowHeaders[pair2.j],
        roleD: rD,
        tierD: tD?.tier ?? null,
        gradeAB: pair1.grade,
        gradeCD: pair2.grade,
        synergyScore,
        tierScore,
        roleScore,
        totalScore,
      })
    }
  }

  const quadri = Array.from(quadriMap.values()).sort((a, b) => b.totalScore - a.totalScore)
  return { quadri: quadri.slice(0, 50) }
})
