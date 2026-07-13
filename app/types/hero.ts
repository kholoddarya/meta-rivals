// Модель данных отражает исходную логику из Google Apps Script проекта
// (Config.js, DataReaders.js, BusinessLogic.js) — переносим 1:1, чтобы
// не терять совместимость с уже проверенным алгоритмом.

export type HeroRole = 'sup' | 'dps' | 'tnk'

export type HeroClass = 'Dive' | 'Poke' | 'Brawl'
export type AntiClass = 'Anti-Dive' | 'Anti-Poke' | 'Anti-Brawl'

export type SynergyGrade = 'S' | 'SA' | 'A' | 'B'

export interface Hero {
  id: string
  name: string
  role: HeroRole
  class?: HeroClass
  // "анти-роль" — контрит конкретный класс сильнее обычного (напр. Anti-Dive vs Dive)
  counterClass?: AntiClass
  iconUrl?: string
}

export interface Synergy {
  heroAId: string
  heroBId: string
  grade: SynergyGrade
  patchVersion: string
}

export interface HeroTier {
  heroId: string
  tier: 'S' | 'A' | 'B' | 'C' | 'D'
  patchVersion: string
}

export interface Patch {
  version: string
  releaseDate: string
  notes?: string
}

// Настройки генерации — соответствуют DEFAULT_SETTINGS из Config.js
export interface GenerationSettings {
  teamSize: number
  minSynergies: number
  maxResults: number
  useHeroTier: boolean
  useSoloSynergies: boolean
  useSynergies: boolean
  useCounterPicks: boolean
  roleCompositions: string[] // напр. ["2-2-2", "1-3-2"]
  mustHaveHeroes: string[]
  enemyComposition: string[]
  bannedHeroes: string[]
}

export interface TeamComposition {
  heroes: Hero[]
  composition: string // "2-2-2"
  totalScore: number
  synergyScore: number
  tierScore: number
  counterPickScore: number
  roleScore?: number
  heavyScore?: number
  synergyCount?: number
  details?: {
    synergy: string[]
    counter: string[]
    weakness: string[]
    tier: string[]
    heavy: string[]
  }
}
