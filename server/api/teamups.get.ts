import type { RoleType } from '~/types/sheets'
import { GRADE_SCORES, TIER_SCORES, ROLE_WEIGHTS } from '../utils/generator/constants'

interface DuoResult {
  heroA: string
  roleA: RoleType | null
  tierA: string | null
  heroB: string
  roleB: RoleType | null
  tierB: string | null
  grade: string
  synergyScore: number
  tierScore: number
  roleScore: number
  totalScore: number
}

export default defineEventHandler(async (): Promise<{ duos: DuoResult[] }> => {
  const config = useRuntimeConfig()
  const spreadsheetId = config.spreadsheetId || '1wAGk5Na43fQPArlfj0T8c-HTjj3bs1PLyTKx0NdN-QY'
  const apiKey = config.googleApiKey

  if (!apiKey) {
    throw createError({ statusCode: 500, message: 'Google API Key is missing in .env' })
  }

  const sheets = ['FullInfo', 'HeroTier', 'Roles'] as const
  const ranges = sheets.map((s) => `ranges=${encodeURIComponent(s)}`).join('&')
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?${ranges}&key=${apiKey}`

  let sheetsData: { valueRanges: { values: string[][] | undefined }[] }
  try {
    sheetsData = await $fetch(url)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch sheet data'
    throw createError({ statusCode: 502, message })
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
    .map((row) => {
      const name = row['Hero | Anchor'] || row['Hero'] || Object.values(row)[0]
      return (name ?? '').toString().trim()
    })
    .filter((name) => name !== '')

  if (rowHeaders.length === 0) {
    throw createError({ statusCode: 500, message: 'FullInfo sheet is empty or not found' })
  }

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
      tiersMap.set(hero, {
        tier: tier.toUpperCase(),
        score: TIER_SCORES[tier.toUpperCase()] ?? 0,
      })
    }
  }

  const duos: DuoResult[] = []

  // Матрица в FullInfo треугольная (пара заполнена только с одной стороны),
  // поэтому проверяем обе ячейки и берём ту, что реально заполнена.
  for (let i = 0; i < rowHeaders.length; i++) {
    const heroA = rowHeaders[i]
    const rowA = fullInfoRaw[i]

    for (let j = i + 1; j < rowHeaders.length; j++) {
      const heroB = rowHeaders[j]
      const rowB = fullInfoRaw[j]

      const cellValue = rowA?.[heroB] ?? rowB?.[heroA]
      if (!cellValue || cellValue === '' || cellValue === 'N/A' || cellValue === '-') continue

      const grade = cellValue.trim().toUpperCase()
      const synergyScore = GRADE_SCORES[grade]
      if (synergyScore === undefined) continue

      const roleA = rolesMap.get(heroA) ?? null
      const roleB = rolesMap.get(heroB) ?? null
      const tierA = tiersMap.get(heroA) ?? null
      const tierB = tiersMap.get(heroB) ?? null

      const tierScore = (tierA?.score ?? 0) + (tierB?.score ?? 0)
      const roleScore = (roleA ? ROLE_WEIGHTS[roleA] : 0) + (roleB ? ROLE_WEIGHTS[roleB] : 0)
      const totalScore = synergyScore + tierScore + roleScore

      duos.push({
        heroA,
        roleA,
        tierA: tierA?.tier ?? null,
        heroB,
        roleB,
        tierB: tierB?.tier ?? null,
        grade,
        synergyScore,
        tierScore,
        roleScore,
        totalScore,
      })
    }
  }

  duos.sort((a, b) => b.totalScore - a.totalScore)

  return { duos: duos.slice(0, 30) }
})
