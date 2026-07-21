import { runQuickPickGeneration } from '../utils/generator/main'
import type { GeneratorInput, GeneratorOptions, GeneratorResult } from '~/types/generator'
import type { RoleType } from '~/types/sheets'

interface GenerateRequestBody {
  enemies: string[]
  myHeroes: string[]
  roles: RoleType[]
  options: GeneratorOptions
  banned: string[]
  starred: string[]
}

export default defineEventHandler(async (event) => {
  let body: GenerateRequestBody
  try {
    body = await readBody<GenerateRequestBody>(event)
  } catch (error: unknown) {
    throw createError({ statusCode: 400, message: 'Некорректный формат запроса' })
  }

  if (!body || !Array.isArray(body.roles) || body.roles.length === 0) {
    throw createError({ statusCode: 400, message: 'Необходимо выбрать хотя бы одну роль' })
  }

  if (!body.options || typeof body.options !== 'object') {
    throw createError({ statusCode: 400, message: 'Некорректные опции' })
  }

  const config = useRuntimeConfig()
  const spreadsheetId = config.spreadsheetId || '1wAGk5Na43fQPArlfj0T8c-HTjj3bs1PLyTKx0NdN-QY'
  const apiKey = config.googleApiKey

  if (!apiKey) {
    throw createError({ statusCode: 500, message: 'Google API Key не найден в .env' })
  }

  const sheets = ['FullInfo', 'Class', 'HeroTier', 'Roles'] as const
  const ranges = sheets.map((s) => `ranges=${encodeURIComponent(s)}`).join('&')
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?${ranges}&key=${apiKey}`

  let sheetsData: { valueRanges: { values: string[][] | undefined }[] }
  try {
    sheetsData = await $fetch(url)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Не удалось загрузить данные'
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
  const classRaw = parseSheet(1)
  const heroTierRaw = parseSheet(2)
  const rolesRaw = parseSheet(3)

  // Строим rowHeaders
  const rowHeaders = fullInfoRaw
    .map((row) => {
      const name =
        row['Hero | Anchor'] ||
        row['Hero'] ||
        row['Имя'] ||
        row['Персонаж'] ||
        Object.values(row)[0]
      return (name ?? '').toString().trim()
    })
    .filter((name) => name !== '')

  const rowHeadersNormalized = rowHeaders.map((h) => h.toLowerCase())

  if (rowHeaders.length === 0) {
    throw createError({ statusCode: 500, message: 'Лист FullInfo пуст или не найден' })
  }

  // ️ НОРМАЛИЗАЦИЯ РОЛЕЙ: защищаемся от кривых заголовков Google Sheets
  const rolesMap = new Map<string, RoleType>()

  // Сначала превращаем { "Adam Warlock": "Angela", "sup": "tnk" } в { Hero: "Angela", Role: "tnk" }
  const normalizedRoles = rolesRaw.map((row: any) => {
    const values = Object.values(row)
    return {
      Hero: String(values[0] ?? '').trim(),
      Role: String(values[1] ?? '').trim(),
    }
  })

  for (const row of normalizedRoles) {
    const hero = row.Hero
    const roleLower = row.Role.toLowerCase()

    if (hero && ['sup', 'dps', 'tnk'].includes(roleLower)) {
      rolesMap.set(hero, roleLower as RoleType)
    }
  }

  // 🛡️ ЯВНАЯ ГАРАНТИЯ ДЛЯ АДАМА УОРЛОКА (если он вдруг все еще потерялся)
  if (!rolesMap.has('Adam Warlock')) {
    rolesMap.set('Adam Warlock', 'sup')
  }

  const classesMap = new Map<string, { class: string; counter: string }>()
  for (const row of classRaw) {
    const hero = ((row['Hero'] || row['Имя'] || row['Name'] || Object.values(row)[0]) ??
      '') as string
    if (hero) {
      classesMap.set(hero, {
        class: ((row['Poke'] || row['Class'] || Object.values(row)[1]) ?? '') as string,
        counter: ((row['Anti-Dive'] || row['Counter'] || Object.values(row)[2]) ?? '') as string,
      })
    }
  }

  const heroTiersList: Array<{ hero: string; tier: string }> = []
  for (const row of heroTierRaw) {
    const hero = ((row['Hero'] || row['Имя'] || row['Name'] || Object.values(row)[0]) ??
      '') as string
    const tier = ((row['Tier'] || row['Тир'] || Object.values(row)[1]) ?? '') as string
    if (hero && tier) {
      heroTiersList.push({ hero, tier: tier.toUpperCase() })
    }
  }

  const bannedSet = new Set((body.banned || []).map((h) => h.toLowerCase().trim()))

  const myHeroIndices = (body.myHeroes || [])
    .filter((h) => !bannedSet.has(h.toLowerCase().trim()))
    .map((h) => rowHeadersNormalized.indexOf(h.toLowerCase().trim()))
    .filter((idx) => idx !== -1)

  const enemyIndices = (body.enemies || [])
    .map((h) => rowHeadersNormalized.indexOf(h.toLowerCase().trim()))
    .filter((idx) => idx !== -1)

  const starredIndices = (body.starred || [])
    .map((h) => rowHeadersNormalized.indexOf(h.toLowerCase().trim()))
    .filter((idx) => idx !== -1 && enemyIndices.includes(idx))

  const bannedIndices = new Set(
    rowHeadersNormalized.map((name, i) => (bannedSet.has(name) ? i : -1)).filter((i) => i !== -1)
  )

  const input: GeneratorInput = {
    enemies: body.enemies || [],
    myHeroes: body.myHeroes || [],
    roles: body.roles,
    options: body.options,
    banned: body.banned || [],
    starred: body.starred || [],
  }

  // ✅ ИСПРАВЛЕНО: передаем только 6 аргументов, как ожидает функция
  const result: GeneratorResult = runQuickPickGeneration(
    input,
    rowHeaders,
    fullInfoRaw,
    rolesMap,
    classesMap,
    heroTiersList
  )

  return result
})

// if (result.success && result.teams) {
//   console.log(result.teams)
//   result.teams = result.teams.filter((team) => {
//     return VALID_COMPOSITIONS.includes(team.finalComposition)
//   })
//   result.groups =
//     result.groups?.filter((group) => VALID_COMPOSITIONS.includes(group.baseComposition)) || []
// }
