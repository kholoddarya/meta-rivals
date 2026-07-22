// stores/sheets.ts
import { defineStore } from 'pinia'
import type { FullInfoRow, HeroTierRow, ClassDataRow, RoleType } from '~/types/sheets'

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
  const rolesMap = ref<Map<string, RoleType>>(new Map()) // имя героя → роль
  const heroesList = ref<
    Array<{
      name: string
      role: RoleType | null
      class: string
      counter: string
    }>
  >([])

  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const loadData = async () => {
    if (fullInfo.value.length > 0) return

    isLoading.value = true
    error.value = null

    try {
      const data = await $fetch<RawSheetData>('/api/sheets')

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

      // 1. FullInfo
      fullInfo.value = (data.FullInfo || []).filter((row): row is Record<string, string> => {
        const name = getCell(row, ['hero | anchor', 'hero', 'имя', 'персонаж'])
        return name !== ''
      }) as FullInfoRow[]

      // 2. HeroTier
      const rawHeroTier = data.HeroTier || []
      heroTier.value = rawHeroTier
        .map((row) => ({
          Hero: getCell(row, ['hero', 'имя', 'персонаж', 'adam warlock']),
          Tier: getCell(row, ['tier', 'тир', 'c', 'rank']) || 'N/A',
        }))
        .filter((row) => row.Hero !== '')

      // 3. ClassData
      const rawClassData = data.Class || []
      classData.value = rawClassData
        .map((row) => ({
          Hero: getCell(row, ['hero', 'имя', 'персонаж', 'adam warlock']),
          Poke: getCell(row, ['poke', 'class', 'класс', 'type']),
          'Anti-Dive': getCell(row, ['anti-dive', 'counter', 'контр', 'anti-role']),
        }))
        .filter((row) => row.Hero !== '')

      // 4. Roles
      const rawRoles = data.Roles || []
      const rolesMapLocal = new Map<string, RoleType>()

      // 🔥 ХАК ДЛЯ АДАМА УОРЛОКА: Если он используется как заголовок столбца, API не считает его строкой данных.
      // Мы явно проверяем ключи первой строки и добавляем его, если он там.
      if (rawRoles.length > 0) {
        const firstRowKeys = Object.keys(rawRoles[0])
        if (firstRowKeys.length >= 2) {
          const potentialHero = firstRowKeys[0].trim()
          if (
            potentialHero.toLowerCase().includes('adam') &&
            !['hero', 'имя', 'name', 'персонаж'].includes(potentialHero.toLowerCase())
          ) {
            rolesMapLocal.set(potentialHero, 'sup') // Принудительно назначаем Support
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

      // 🔥 ЯВНАЯ ГАРАНТИЯ: Если Адам Уорлок все еще не в карте ролей, добавляем его как Support
      if (!rolesMapLocal.has('Adam Warlock')) {
        rolesMapLocal.set('Adam Warlock', 'sup')
      }

      // 5. Собираем полный список героев
      const allHeroNames = new Set<string>()

      // 🔥 Добавляем Адама Уорлока в список имен гарантированно, чтобы он точно отобразился
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

      // 6. Сортируем СТРОГО по алфавиту
      heroesLocal.sort((a, b) => a.name.localeCompare(b.name))

      rolesMap.value = rolesMapLocal
      heroesList.value = heroesLocal

      console.log(
        `✅ Успешно загружено ${heroesLocal.length} героев. Ролей назначено: ${rolesMapLocal.size}`
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
    isLoading,
    error,
    loadData,
  }
})
