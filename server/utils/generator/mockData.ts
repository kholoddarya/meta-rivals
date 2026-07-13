import type { HeroRecord, SynergyMatrix, HeroTierMap } from './types'

// TODO: заменить на выборку из Postgres (см. шаг 3 плана — подключение БД).
// Пока это единственный источник данных и для /api/heroes, и для /api/generate,
// чтобы они не расходились между собой.
export const MOCK_HEROES: HeroRecord[] = [
  { id: 'hero-1', name: 'Doctor Strange', role: 'tnk', class: 'Brawl' },
  { id: 'hero-2', name: 'Rocket Raccoon', role: 'sup', class: 'Poke', counterClass: 'Anti-Poke' },
  { id: 'hero-3', name: 'Hela', role: 'dps', class: 'Poke' },
  { id: 'hero-4', name: 'Spider-Man', role: 'dps', class: 'Dive' },
  { id: 'hero-5', name: 'Luna Snow', role: 'sup', class: 'Brawl', counterClass: 'Anti-Dive' },
  { id: 'hero-6', name: 'Groot', role: 'tnk', class: 'Brawl' }
]

export const MOCK_SYNERGY_MATRIX: SynergyMatrix = {
  'hero-1': { 'hero-4': 'A', 'hero-6': 'SA' },
  'hero-2': { 'hero-3': 'S', 'hero-5': 'A' },
  'hero-3': { 'hero-2': 'S', 'hero-4': 'B' },
  'hero-4': { 'hero-1': 'A', 'hero-3': 'B' },
  'hero-5': { 'hero-2': 'A', 'hero-6': 'SA' },
  'hero-6': { 'hero-1': 'SA', 'hero-5': 'SA' }
}

export const MOCK_HERO_TIERS: HeroTierMap = {
  'hero-1': 'A',
  'hero-2': 'S',
  'hero-3': 'S',
  'hero-4': 'B',
  'hero-5': 'A',
  'hero-6': 'C'
}
