import type { RoleType } from '~/types/sheets'
import { GRADE_SCORES, TIER_SCORES, ROLE_WEIGHTS } from '../utils/generator/constants'

interface TrioResult {
  heroA: string
  roleA: RoleType | null
  tierA: string | null
  heroB: string
  roleB: RoleType | null
  tierB: string | null
  heroC: string
  roleC: RoleType | null
  tierC: string | null
  coreGrade: string
  totalScore: number
  synergyScore: number
  tierScore: number
  roleScore: number
}

export default defineEventHandler(async (): Promise<{ trios: TrioResult[] }> => {
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

  const getCellValue = (i: number, j: number) => {
    const rowA = fullInfoRaw[i]
    const rowB = fullInfoRaw[j]
    const heroA = rowHeaders[i]
    const heroB = rowHeaders[j]
    return rowA?.[heroB] ?? rowB?.[heroA]
  }

  const trios: TrioResult[] = []

  for (let i = 0; i < rowHeaders.length; i++) {
    for (let j = i + 1; j < rowHeaders.length; j++) {
      const coreGradeRaw = getCellValue(i, j)
      if (!coreGradeRaw || coreGradeRaw === '' || coreGradeRaw === 'N/A' || coreGradeRaw === '-')
        continue

      const coreGrade = coreGradeRaw.trim().toUpperCase()
      const coreSynergyScore = GRADE_SCORES[coreGrade]
      if (coreSynergyScore === undefined) continue

      const heroA = rowHeaders[i]
      const heroB = rowHeaders[j]
      const roleA = rolesMap.get(heroA) ?? null
      const roleB = rolesMap.get(heroB) ?? null
      const tierA = tiersMap.get(heroA) ?? null
      const tierB = tiersMap.get(heroB) ?? null

      for (let k = 0; k < rowHeaders.length; k++) {
        if (k === i || k === j) continue

        const heroC = rowHeaders[k]
        const roleC = rolesMap.get(heroC) ?? null
        const tierC = tiersMap.get(heroC) ?? null

        const gradeACRaw = getCellValue(i, k)
        const gradeBCRaw = getCellValue(j, k)

        const gradeAC = gradeACRaw?.trim().toUpperCase()
        const gradeBC = gradeBCRaw?.trim().toUpperCase()

        const synergyAC = gradeAC && GRADE_SCORES[gradeAC] !== undefined ? GRADE_SCORES[gradeAC] : 0
        const synergyBC = gradeBC && GRADE_SCORES[gradeBC] !== undefined ? GRADE_SCORES[gradeBC] : 0

        const synergyScore = coreSynergyScore + synergyAC + synergyBC
        const tierScore = (tierA?.score ?? 0) + (tierB?.score ?? 0) + (tierC?.score ?? 0)
        const roleScore =
          (roleA ? ROLE_WEIGHTS[roleA] : 0) +
          (roleB ? ROLE_WEIGHTS[roleB] : 0) +
          (roleC ? ROLE_WEIGHTS[roleC] : 0)

        const totalScore = synergyScore + tierScore + roleScore

        trios.push({
          heroA,
          roleA,
          tierA: tierA?.tier ?? null,
          heroB,
          roleB,
          tierB: tierB?.tier ?? null,
          heroC,
          roleC,
          tierC: tierC?.tier ?? null,
          coreGrade,
          synergyScore,
          tierScore,
          roleScore,
          totalScore,
        })
      }
    }
  }

  trios.sort((a, b) => b.totalScore - a.totalScore)
  return { trios: trios.slice(0, 50) }
})
