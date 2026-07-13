// Внутренние типы алгоритма генерации команд.
// Прямое соответствие структурам из Config.js / DataReaders.js оригинального
// проекта на Google Apps Script. В оригинале герои адресовались индексом
// строки в таблице — здесь везде используется heroId (строка), это проще
// читать и не завязано на порядок данных.

export type HeroRole = 'sup' | 'dps' | 'tnk'
export type HeroClass = 'Dive' | 'Poke' | 'Brawl'
export type AntiClass = 'Anti-Dive' | 'Anti-Poke' | 'Anti-Brawl'
export type SynergyGrade = 'S' | 'SA' | 'A' | 'B'
export type TierLetter = 'S' | 'A' | 'B' | 'C' | 'D'

export interface HeroRecord {
  id: string
  name: string
  role: HeroRole
  class?: HeroClass
  // "анти-роль" героя, контрит конкретный класс сильнее, чем обычный
  // счётчик класса (например Anti-Dive контрит Dive лучше, чем просто Poke).
  counterClass?: AntiClass
}

// heroId -> heroId партнёра -> грейд синергии. Соответствует листу FullInfo.
export type SynergyMatrix = Record<string, Record<string, SynergyGrade>>

// heroId -> тир героя в текущем патче. Соответствует листу HeroTier.
export type HeroTierMap = Record<string, TierLetter>

export interface GenerationSettings {
  teamSize: number
  roleCompositions: string[] // напр. ["2-2-2", "1-3-2", "2-3-1"]
  minSynergies: number
  maxResults: number

  useHeroTier: boolean
  useSynergies: boolean
  useSoloSynergies: boolean
  useCounterPicks: boolean
  useHeavyClass: boolean
  mustHaveSynergy: boolean

  mustHaveHeroIds: string[]
  enemyHeroIds: string[]
  bannedHeroIds: string[]

  gradeScores: Record<SynergyGrade, number>
  tierScores: Record<TierLetter, number>
  roleWeights: Record<HeroRole, number>

  counterPickBonus: number
  antiCounterPickBonus: number
  weakToEnemyPenalty: number
  heavyClassBonus: number
}

export interface RoleComposition {
  sup: number
  dps: number
  tnk: number
  weight: number
}

export interface SynergyLink {
  grade: SynergyGrade
  score: number
}

// heroId -> partnerId -> связь синергии
export type SynergyGraph = Record<string, Record<string, SynergyLink>>

export interface TeamResult {
  memberIds: string[]
  memberNames: string[]
  roles: HeroRole[]
  composition: string // раскладка, под которую собирали команду ("2-2-2")
  finalComposition: string // фактическая раскладка по факту сборки
  synergyScore: number
  counterScore: number
  tierScore: number
  roleScore: number
  heavyScore: number
  totalScore: number
  synergyCount: number
  minSynergyScore: number
  details: {
    synergy: string[]
    counter: string[]
    weakness: string[]
    tier: string[]
    heavy: string[]
  }
}

export interface GenerationContext {
  heroes: HeroRecord[]
  heroesById: Map<string, HeroRecord>
  settings: GenerationSettings
  graph: SynergyGraph
  soloCapableHeroIds: Set<string>
  heroTiers: HeroTierMap
  counterPickCache: Record<string, number>
  charactersByRole: Record<HeroRole, string[]>
}
