// types/generator.ts
import type { RoleType } from "./sheets";

export interface GeneratorOptions {
  useSynergies: boolean;
  useSoloSynergies: boolean;
  useTiers: boolean;
  useCounterPicks: boolean;
  useClassWeights: boolean;
  useAntiRoleWeights: boolean;
  maxResults: number;
}

export interface GeneratorInput {
  enemies: string[];
  myHeroes: string[];
  roles: RoleType[];
  options: GeneratorOptions;
  banned: string[];
  starred: string[];
}

export interface GeneratorContext {
  rowHeaders: string[];
  rolesMap: Map<string, RoleType>;
  classesMap: Map<string, { class: string; counter: string }>;
  heroTiersMap: Map<string, { tier: string; score: number }>;
  graph: Map<number, Map<number, { grade: string; score: number }>>;
  soloCapableChars: Set<number>;
  enemyIndices: number[];
  starredEnemyIndices: number[];
  enemyClassesMap: Map<number, string>;
  counterPickCache: Map<number, number>;
  gradeScores: Record<string, number>;
  tierScores: Record<string, number>;
  roleWeights: Record<RoleType, number>;
  classWeights: Record<string, number>;
  antiRoleWeights: Record<string, number>;
  classCounters: Record<string, string>;
  myHeroIndices: number[];
  options: GeneratorOptions;
}

export interface TeamResult {
  members: string[];
  roles: RoleType[];
  composition: string;
  finalComposition: string;
  compositionWeight: number;
  synergyScore: number;
  counterScore: number;
  tierScore: number;
  roleScore: number;
  heavyScore: number;
  totalScore: number;
  synergyCount: number;
  minScore: number;
  addedMembers: string[];
  formattedDetails: string;
}

export interface SlotAlternative {
  name: string;
  role: RoleType | null;
  bestScore: number;
  compositionWeight: number;
}

export interface SlotItem {
  position: number;
  baseHero: string;
  baseRole: RoleType | null;
  alternatives: SlotAlternative[];
  baseHeroWeight: number;
}

export interface TeamGroup {
  id: string;
  bestTeam: TeamResult;
  baseMembers: string[];
  baseComposition: string;
  slotAlternatives: SlotItem[];
  bestScore: number;
  worstScore: number;
  compositionWeight: number;
  bestTeamWeight: number;
}

export interface GeneratorResult {
  success: boolean;
  error?: string;
  teams?: TeamResult[];
  groups?: TeamGroup[];
  myHeroes?: string[];
  enemies?: string[];
  stats?: {
    duration: string;
    iterations: number;
    skippedByBound: number;
    distributions: number;
    totalGenerated: number;
    groupsCount: number;
    requestedResults: number;
  };
}
