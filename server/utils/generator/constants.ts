import type { RoleType } from "~/types/sheets";

export const CLASS_COUNTERS: Record<string, string> = {
  Dive: "Poke",
  Poke: "Brawl",
  Brawl: "Dive",
  "Anti-Dive": "Dive",
  "Anti-Poke": "Poke",
  "Anti-Brawl": "Brawl",
};

export const ROLE_WEIGHTS: Record<RoleType, number> = {
  sup: 1,
  dps: 3,
  tnk: 2,
};

export const TIER_SCORES: Record<string, number> = {
  S: 5,
  A: 4,
  B: 3,
  C: 2,
  D: 1,
};

export const GRADE_SCORES: Record<string, number> = {
  S: 4,
  SA: 3,
  A: 2,
  B: 1,
};
