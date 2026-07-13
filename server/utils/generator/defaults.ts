import type { GenerationSettings } from './types'

// Перенос числовых констант из DEFAULT_SETTINGS (Config.js).
// Пока фронт их не присылает — сюда позже ляжет экран "Веса оценок и тиров"
// из Wizard.js/Dialogs.js, когда дойдём до соответствующей админки.
export const DEFAULT_GENERATION_SETTINGS: GenerationSettings = {
  teamSize: 6,
  roleCompositions: ['2-2-2', '1-3-2', '2-3-1'],
  minSynergies: 1,
  maxResults: 20,

  useHeroTier: true,
  useSynergies: true,
  useSoloSynergies: true,
  useCounterPicks: true,
  useHeavyClass: true,
  mustHaveSynergy: true,

  mustHaveHeroIds: [],
  enemyHeroIds: [],
  bannedHeroIds: [],

  gradeScores: { S: 4, SA: 3, A: 2, B: 1 },
  tierScores: { S: 5, A: 4, B: 3, C: 2, D: 1 },
  roleWeights: { sup: 1, dps: 3, tnk: 2 },

  counterPickBonus: 2,
  antiCounterPickBonus: 3,
  weakToEnemyPenalty: -1,
  heavyClassBonus: 3
}
