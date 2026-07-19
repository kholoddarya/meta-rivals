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
    throw createError({
      statusCode: 400,
      message: 'Некорректный формат запроса',
    })
  }

  // Валидация обязательных полей
  if (!body || !Array.isArray(body.roles) || body.roles.length === 0) {
    throw createError({
      statusCode: 400,
      message: 'Необходимо выбрать хотя бы одну роль',
    })
  }

  if (!body.options || typeof body.options !== 'object') {
    throw createError({ statusCode: 400, message: 'Некорректные опции' })
  }

  // Загружаем данные из Google Sheets
  const config = useRuntimeConfig()
  const spreadsheetId = config.spreadsheetId || '1wAGk5Na43fQPArlfj0T8c-HTjj3bs1PLyTKx0NdN-QY'
  const apiKey = config.googleApiKey

  if (!apiKey) {
    throw createError({
      statusCode: 500,
      message: 'Google API Key не найден в .env',
    })
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

  // Парсим данные
  const parseSheet = (index: number): Array<Record<string, string | null>> => {
    const vr = sheetsData.valueRanges[index]
    if (!vr || !vr.values || vr.values.length === 0) return []

    const [header, ...rows] = vr.values
    if (!header) return []

    return rows.map((row) => {
      const entries = header.map((key, idx) => [key, row[idx] ?? null] as [string, string | null])
      return Object.fromEntries(entries) as Record<string, string | null>
    })
  }

  const fullInfoRaw = parseSheet(0)
  const classRaw = parseSheet(1)
  const heroTierRaw = parseSheet(2)
  const rolesRaw = parseSheet(3)

  // Строим rowHeaders из FullInfo (первая колонка "Hero | Anchor")
  const rowHeaders = fullInfoRaw
    .map((row) => row['Hero | Anchor'] ?? '')
    .filter((name) => name.trim() !== '')

  if (rowHeaders.length === 0) {
    throw createError({
      statusCode: 500,
      message: 'Лист FullInfo пуст или не найден',
    })
  }

  // Строим rolesMap
  const rolesMap = new Map<string, RoleType>()
  for (const row of rolesRaw) {
    const hero = row['Hero'] ?? ''
    const role = row['Role'] ?? ''
    if (hero.trim() && ['sup', 'dps', 'tnk'].includes(role.trim().toLowerCase())) {
      rolesMap.set(hero.trim(), role.trim().toLowerCase() as RoleType)
    }
  }

  // Строим classesMap
  const classesMap = new Map<string, { class: string; counter: string }>()
  for (const row of classRaw) {
    const hero = row['Hero'] ?? ''
    if (hero.trim()) {
      classesMap.set(hero.trim(), {
        class: row['Poke'] ?? '',
        counter: row['Anti-Dive'] ?? '',
      })
    }
  }

  // Строим heroTiersList
  const heroTiersList: Array<{ hero: string; tier: string }> = []
  for (const row of heroTierRaw) {
    const hero = row['Hero'] ?? ''
    const tier = row['Tier'] ?? ''
    if (hero.trim() && tier.trim()) {
      heroTiersList.push({
        hero: hero.trim(),
        tier: tier.trim().toUpperCase(),
      })
    }
  }

  // Формируем входные данные для генератора
  const input: GeneratorInput = {
    enemies: body.enemies || [],
    myHeroes: body.myHeroes || [],
    roles: body.roles,
    options: body.options,
    banned: body.banned || [],
    starred: body.starred || [],
  }

  // Запускаем генерацию
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
