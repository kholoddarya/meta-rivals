import { defineStore } from 'pinia'
import type { Hero } from '~/types/hero'

export const useHeroesStore = defineStore('heroes', () => {
  const heroes = ref<Hero[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function fetchHeroes() {
    isLoading.value = true
    error.value = null
    try {
      heroes.value = await $fetch<Hero[]>('/api/heroes')
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Не удалось загрузить героев'
    } finally {
      isLoading.value = false
    }
  }

  const byRole = computed(() => {
    return {
      sup: heroes.value.filter(h => h.role === 'sup'),
      dps: heroes.value.filter(h => h.role === 'dps'),
      tnk: heroes.value.filter(h => h.role === 'tnk')
    }
  })

  return { heroes, isLoading, error, fetchHeroes, byRole }
})
