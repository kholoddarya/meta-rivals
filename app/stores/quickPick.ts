// stores/quickPick.ts
import { defineStore } from 'pinia'

// ==========================================
// КОНСТАНТЫ (из QuickPickScript.js)
// ==========================================
const MAX_TOTAL_ROLES = 6
const MAX_PER_ROLE = 3
const MAX_FLX = 3
const MAX_ENEMIES = 6
const MAX_MY = 5
const MAX_STARS = 2

export type RoleType = 'sup' | 'dps' | 'tnk' | 'flx'

export interface QuickPickOptions {
  useSynergies: boolean
  useSoloSynergies: boolean
  useTiers: boolean
  useCounterPicks: boolean
  useClassWeights: boolean
  useAntiRoleWeights: boolean
  maxResults: number
}

export interface RoleCounts {
  sup: number
  dps: number
  tnk: number
  flx: number
}

export const useQuickPickStore = defineStore(
  'quickPick',
  () => {
    const selectedEnemies = ref<string[]>([])
    const selectedMyHeroes = ref<string[]>([])
    const bannedHeroes = ref<string[]>([])
    const starredEnemies = ref<string[]>([])

    const roleCounts = ref<RoleCounts>({
      sup: 0,
      dps: 0,
      tnk: 0,
      flx: 0,
    })

    const options = ref<QuickPickOptions>({
      useSynergies: true,
      useSoloSynergies: true,
      useTiers: true,
      useCounterPicks: true,
      useClassWeights: true,
      useAntiRoleWeights: true,
      maxResults: 10,
    })

    const isLoading = ref(false)
    const error = ref<string | null>(null)
    const lastResult = ref<unknown>(null) // Здесь будет результат генерации

    const totalRoles = computed(() => {
      return (
        roleCounts.value.sup + roleCounts.value.dps + roleCounts.value.tnk + roleCounts.value.flx
      )
    })

    // Превращает { sup: 2, dps: 1 } в ['sup', 'sup', 'dps'] для отправки на бэк
    const rolesArray = computed(() => {
      const roles: RoleType[] = []
      const addRole = (role: RoleType, count: number) => {
        for (let i = 0; i < count; i++) roles.push(role)
      }
      addRole('sup', roleCounts.value.sup)
      addRole('dps', roleCounts.value.dps)
      addRole('tnk', roleCounts.value.tnk)
      addRole('flx', roleCounts.value.flx)
      return roles
    })

    const toggleEnemy = (hero: string) => {
      const idx = selectedEnemies.value.indexOf(hero)
      if (idx !== -1) {
        // Удаляем из врагов и автоматически снимаем звезду
        selectedEnemies.value.splice(idx, 1)
        removeStar(hero)
      } else {
        if (selectedEnemies.value.length >= MAX_ENEMIES) {
          alert(`Максимум ${MAX_ENEMIES} врагов!`)
          return
        }
        // При добавлении во враги, снимаем бан, если он был
        removeBan(hero)
        selectedEnemies.value.push(hero)
      }
    }

    const toggleMyHero = (hero: string) => {
      const idx = selectedMyHeroes.value.indexOf(hero)
      if (idx !== -1) {
        selectedMyHeroes.value.splice(idx, 1)
      } else {
        if (selectedMyHeroes.value.length >= MAX_MY) {
          alert(`Максимум ${MAX_MY} своих героев!`)
          return
        }
        removeBan(hero)
        selectedMyHeroes.value.push(hero)
      }
    }

    const toggleStar = (hero: string) => {
      const idx = starredEnemies.value.indexOf(hero)
      if (idx !== -1) {
        starredEnemies.value.splice(idx, 1)
      } else {
        if (starredEnemies.value.length >= MAX_STARS) {
          alert(`Максимум ${MAX_STARS} ключевых врагов! Снимите звезду с другого.`)
          return
        }
        // Автоматически делаем врагом, если им не является
        if (!selectedEnemies.value.includes(hero)) {
          if (selectedEnemies.value.length >= MAX_ENEMIES) {
            alert(`Максимум ${MAX_ENEMIES} врагов!`)
            return
          }
          removeBan(hero)
          selectedEnemies.value.push(hero)
        }
        starredEnemies.value.push(hero)
      }
    }

    const toggleBan = (hero: string) => {
      const idx = bannedHeroes.value.indexOf(hero)
      if (idx !== -1) {
        bannedHeroes.value.splice(idx, 1)
      } else {
        // При бане снимаем со всех остальных списков
        removeEnemy(hero)
        removeMyHero(hero)
        removeStar(hero)
        bannedHeroes.value.push(hero)
      }
    }

    const changeRole = (role: RoleType, delta: number) => {
      const maxForRole = role === 'flx' ? MAX_FLX : MAX_PER_ROLE
      const newValue = roleCounts.value[role] + delta

      if (newValue < 0 || newValue > maxForRole) return

      if (delta > 0 && totalRoles.value >= MAX_TOTAL_ROLES) {
        alert(`Максимум ${MAX_TOTAL_ROLES} ролей в сумме!`)
        return
      }

      roleCounts.value[role] = newValue
    }

    // Вспомогательные функции
    const removeEnemy = (hero: string) => {
      const idx = selectedEnemies.value.indexOf(hero)
      if (idx !== -1) selectedEnemies.value.splice(idx, 1)
    }
    const removeMyHero = (hero: string) => {
      const idx = selectedMyHeroes.value.indexOf(hero)
      if (idx !== -1) selectedMyHeroes.value.splice(idx, 1)
    }
    const removeStar = (hero: string) => {
      const idx = starredEnemies.value.indexOf(hero)
      if (idx !== -1) starredEnemies.value.splice(idx, 1)
    }
    const removeBan = (hero: string) => {
      const idx = bannedHeroes.value.indexOf(hero)
      if (idx !== -1) bannedHeroes.value.splice(idx, 1)
    }

    const clearAll = () => {
      selectedEnemies.value = []
      selectedMyHeroes.value = []
      bannedHeroes.value = []
      starredEnemies.value = []
      roleCounts.value = { sup: 0, dps: 0, tnk: 0, flx: 0 }
      lastResult.value = null
      error.value = null
    }

    const generateTeams = async () => {
      if (totalRoles.value === 0) {
        error.value = 'Выберите хотя бы одну роль для генерации'
        return
      }

      isLoading.value = true
      error.value = null

      try {
        const result = await $fetch('/api/generate', {
          method: 'POST',
          body: {
            enemies: selectedEnemies.value,
            myHeroes: selectedMyHeroes.value,
            roles: rolesArray.value,
            options: options.value,
            banned: bannedHeroes.value,
            starred: starredEnemies.value,
          },
        })
        lastResult.value = result
      } catch (e: unknown) {
        if (e instanceof Error) {
          error.value = e.message
        } else if (typeof e === 'string') {
          error.value = e
        } else {
          error.value = 'Ошибка при генерации команд'
        }
        console.error('Generation error:', e)
      } finally {
        isLoading.value = false
      }
    }

    return {
      // State
      selectedEnemies,
      selectedMyHeroes,
      bannedHeroes,
      starredEnemies,
      roleCounts,
      options,
      isLoading,
      error,
      lastResult,

      // Computed
      totalRoles,
      rolesArray,

      // Actions
      toggleEnemy,
      toggleMyHero,
      toggleStar,
      toggleBan,
      changeRole,
      clearAll,
      generateTeams,
    }
  },
  {
    persist: {
      key: 'quickPickState_v5', // ключ, который в Apps Script
      storage: typeof window !== 'undefined' ? localStorage : undefined,
      // Сохраняем всё, кроме isLoading, error и lastResult
      omit: ['isLoading', 'error', 'lastResult'],
    },
  }
)
