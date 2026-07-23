// stores/sheets.ts
import { defineStore } from 'pinia'
import type { FullInfoRow, HeroTierRow, ClassDataRow, RoleType, TeamUpRow } from '~/types/sheets'

interface RawSheetData {
  FullInfo: Record<string, string>[]
  HeroTier: Record<string, string>[]
  Class: Record<string, string>[]
  Roles: Record<string, string>[]
}

export const useSheetsStore = defineStore('sheets', () => {
  const fullInfo = ref<FullInfoRow[]>([])
  const heroTier = ref<HeroTierRow[]>([])
  const classData = ref<ClassDataRow[]>([])
  const rolesMap = ref<Map<string, RoleType>>(new Map())

  const heroesList = ref<
    Array<{
      name: string
      role: RoleType | null
      class: string
      counter: string
    }>
  >([])

  const teamUps = ref<TeamUpRow[]>([])

  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const loadData = async () => {
    // Проверяем, что основные данные уже загружены, чтобы не делать лишних запросов
    if (fullInfo.value.length > 0 && teamUps.value.length > 0) return

    isLoading.value = true
    error.value = null

    try {
      // 1. Загружаем основные данные
      const data = await $fetch<RawSheetData>('/api/sheets')

      // 2. Загружаем тимапы параллельно или последовательно
      try {
        const teamUpsRes = await $fetch<{ duos: TeamUpRow[] }>('/api/teamups')
        teamUps.value = teamUpsRes.duos || []

        console.log(teamUpsRes)
      } catch (e) {
        console.error('Failed to load team-ups in store:', e)
        teamUps.value = [] // На случай ошибки оставляем пустой массив, чтобы не ломать UI
      }

      // Вспомогательная функция для безопасного получения значения по возможным именам колонок
      const getCell = (row: Record<string, any>, possibleKeys: string[]): string => {
        for (const key of Object.keys(row)) {
          const cleanKey = key.trim().toLowerCase()
          if (possibleKeys.includes(cleanKey)) {
            return typeof row[key] === 'string' ? row[key].trim() : String(row[key] ?? '').trim()
          }
        }
        const firstKey = Object.keys(row)[0]
        return typeof firstKey === 'string' ? String(row[firstKey] ?? '').trim() : ''
      }

      // 3. FullInfo
      fullInfo.value = (data.FullInfo || []).filter((row): row is Record<string, string> => {
        const name = getCell(row, ['hero | anchor', 'hero', 'имя', 'персонаж'])
        return name !== ''
      }) as FullInfoRow[]

      // 4. HeroTier
      const rawHeroTier = data.HeroTier || []
      heroTier.value = rawHeroTier
        .map((row) => ({
          Hero: getCell(row, ['hero', 'имя', 'персонаж', 'adam warlock']),
          Tier: getCell(row, ['tier', 'тир', 'c', 'rank']) || 'N/A',
        }))
        .filter((row) => row.Hero !== '')

      // 5. ClassData
      const rawClassData = data.Class || []
      classData.value = rawClassData
        .map((row) => ({
          Hero: getCell(row, ['hero', 'имя', 'персонаж', 'adam warlock']),
          Poke: getCell(row, ['poke', 'class', 'класс', 'type']),
          'Anti-Dive': getCell(row, ['anti-dive', 'counter', 'контр', 'anti-role']),
        }))
        .filter((row) => row.Hero !== '')

      // 6. Roles
      const rawRoles = data.Roles || []
      const rolesMapLocal = new Map<string, RoleType>()

      if (rawRoles.length > 0) {
        const firstRowKeys = Object.keys(rawRoles[0])
        if (firstRowKeys.length >= 2) {
          const potentialHero = firstRowKeys[0].trim()
          if (
            potentialHero.toLowerCase().includes('adam') &&
            !['hero', 'имя', 'name', 'персонаж'].includes(potentialHero.toLowerCase())
          ) {
            rolesMapLocal.set(potentialHero, 'sup')
          }
        }
      }

      const normalizedRoles = rawRoles.map((row: any) => {
        const values = Object.values(row)
        return {
          Hero: String(values[0] ?? '').trim(),
          Role: String(values[1] ?? '').trim(),
        }
      })

      const validRoleRows = normalizedRoles.filter(
        (row) => row.Hero !== '' && ['sup', 'dps', 'tnk'].includes(row.Role.toLowerCase())
      )

      validRoleRows.forEach((row) => {
        const name = row.Hero
        const role = row.Role.toLowerCase() as RoleType
        rolesMapLocal.set(name, role)
      })

      if (!rolesMapLocal.has('Adam Warlock')) {
        rolesMapLocal.set('Adam Warlock', 'sup')
      }

      // 7. Собираем полный список героев
      const allHeroNames = new Set<string>()
      allHeroNames.add('Adam Warlock')

      fullInfo.value.forEach((row: any) => {
        const name = getCell(row, ['hero | anchor', 'hero', 'имя'])
        if (name) allHeroNames.add(name)
      })

      classData.value.forEach((row) => {
        if (row.Hero) allHeroNames.add(row.Hero)
      })

      const heroesLocal: Array<{
        name: string
        role: RoleType | null
        class: string
        counter: string
      }> = []

      allHeroNames.forEach((name) => {
        const role = rolesMapLocal.get(name) ?? null
        const classRow = classData.value.find((c) => c.Hero === name)

        heroesLocal.push({
          name,
          role,
          class: classRow?.Poke ?? '',
          counter: classRow?.['Anti-Dive'] ?? '',
        })
      })

      heroesLocal.sort((a, b) => a.name.localeCompare(b.name))

      rolesMap.value = rolesMapLocal
      heroesList.value = heroesLocal

      console.log(
        `Успешно загружено ${heroesLocal.length} героев и ${teamUps.value.length} тимапов.`
      )
    } catch (e: unknown) {
      if (e instanceof Error) {
        error.value = e.message
      } else if (typeof e === 'string') {
        error.value = e
      } else {
        error.value = 'Не удалось загрузить данные из Google Sheets'
      }
      console.error('Ошибка загрузки:', e)
    } finally {
      isLoading.value = false
    }
  }

  return {
    fullInfo,
    heroTier,
    classData,
    rolesMap,
    heroesList,
    teamUps,
    isLoading,
    error,
    loadData,
  }
})
