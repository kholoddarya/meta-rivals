export type TierValue = 'S' | 'SA' | 'A' | 'B' | 'C' | 'D' | 'N/A' | ''
export type RoleType = 'sup' | 'dps' | 'tnk' | 'flx'

export interface FullInfoRow {
  'Hero | Anchor': string
  [heroName: string]: TierValue | string
}

export interface HeroTierRow {
  Hero: string
  Tier: TierValue | string
}

export interface ClassDataRow {
  Hero: string
  Poke: string
  'Anti-Dive': string
}

export interface RoleRow {
  Hero: string
  Role: RoleType | string
}

export interface TeamUpRow {
  heroA: string
  roleA: string
  tierA: string
  heroB: string
  roleB: string
  tierB: string
  grade: string
  synergyScore: number
  tierScore: number
  roleScore: number
  totalScore: number
}
