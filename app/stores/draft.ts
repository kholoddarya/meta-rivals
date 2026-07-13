import { defineStore } from 'pinia'
import type { GenerationSettings, TeamComposition } from '~/types/hero'

export const useDraftStore = defineStore('draft', () => {
  const myHeroIds = ref<string[]>([])
  const enemyHeroIds = ref<string[]>([])
  const bannedHeroIds = ref<string[]>([])

  const settings = ref<GenerationSettings>({
    teamSize: 6,
    minSynergies: 1,
    maxResults: 20,
    useHeroTier: true,
    useSoloSynergies: true,
    useSynergies: true,
    useCounterPicks: true,
    roleCompositions: ['2-2-2', '1-3-2', '2-3-1'],
    mustHaveHeroes: [],
    enemyComposition: [],
    bannedHeroes: []
  })

  const results = ref<TeamComposition[]>([])
  const isGenerating = ref(false)
  const error = ref<string | null>(null)

  async function generate() {
    isGenerating.value = true
    error.value = null
    try {
      const payload: GenerationSettings = {
        ...settings.value,
        mustHaveHeroes: myHeroIds.value,
        enemyComposition: enemyHeroIds.value,
        bannedHeroes: bannedHeroIds.value
      }
      results.value = await $fetch<TeamComposition[]>('/api/generate', {
        method: 'POST',
        body: payload
      })
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Не удалось сгенерировать команды'
    } finally {
      isGenerating.value = false
    }
  }

  function reset() {
    myHeroIds.value = []
    enemyHeroIds.value = []
    bannedHeroIds.value = []
    results.value = []
  }

  return {
    myHeroIds,
    enemyHeroIds,
    bannedHeroIds,
    settings,
    results,
    isGenerating,
    error,
    generate,
    reset
  }
})
