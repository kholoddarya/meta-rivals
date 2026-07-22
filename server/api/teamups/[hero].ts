import type { RoleType } from '~/types/sheets'
import { getTeamupDescription } from '../../utils/teamupDescriptions'

interface TeamUpInfo {
  partner: string
  role: RoleType | null
  tier: string | null
  grade: string
  synergyScore: number
  description: {
    title: string
    text: string
    bonuses: string[]
  } | null
}

export default defineEventHandler(
  async (event): Promise<{ teamups: TeamUpInfo[]; hero: string }> => {
    const heroName = decodeURIComponent(getRouterParam(event, 'hero') || '')

    if (!heroName) {
      throw createError({ statusCode: 400, message: 'Hero name is required' })
    }

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

    const heroIndex = rowHeaders.findIndex((h) => h.toLowerCase() === heroName.toLowerCase())

    if (heroIndex === -1) {
      throw createError({ statusCode: 404, message: `Hero "${heroName}" not found` })
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

    const tiersMap = new Map<string, string>()
    for (const row of heroTierRaw) {
      const hero = ((row['Hero'] || Object.values(row)[0]) ?? '') as string
      const tier = ((row['Tier'] || Object.values(row)[1]) ?? '') as string
      if (hero && tier) {
        tiersMap.set(hero, tier.toUpperCase())
      }
    }

    const getCellValue = (i: number, j: number): string | null => {
      const rowA = fullInfoRaw[i]
      const rowB = fullInfoRaw[j]
      const heroA = rowHeaders[i]
      const heroB = rowHeaders[j]
      const cell = rowA?.[heroB] ?? rowB?.[heroA]
      if (!cell || cell === '' || cell === 'N/A' || cell === '-') return null
      return cell.trim().toUpperCase()
    }

    const teamups: TeamUpInfo[] = []

    for (let i = 0; i < rowHeaders.length; i++) {
      if (i === heroIndex) continue

      const grade = getCellValue(heroIndex, i)
      if (!grade) continue

      const partner = rowHeaders[i]
      const role = rolesMap.get(partner) ?? null
      const tier = tiersMap.get(partner) ?? null

      const gradeScores: Record<string, number> = {
        SA: 100,
        S: 80,
        A: 60,
        B: 40,
        C: 20,
        D: 10,
      }
      const synergyScore = gradeScores[grade] ?? 0

      // Получаем описание тимапа
      const description = getTeamupDescription(heroName, partner)

      teamups.push({
        partner,
        role,
        tier,
        grade,
        synergyScore,
        description: description
          ? {
              title: description.title,
              text: description.description,
              bonuses: description.bonuses,
            }
          : null,
      })
    }

    teamups.sort((a, b) => b.synergyScore - a.synergyScore)

    return { teamups, hero: heroName }
  }
)
