import type { GeneratorContext, TeamResult } from "~/types/generator";
import type { RoleType } from "~/types/sheets";

import { GRADE_SCORES } from "./constants";
import { formatTeamDetails } from "./utils";

// Локальный тип для кандидатов на синергию (замена any)
interface SynergyCandidate {
  score: number;
  hasRealPartner: boolean;
  grade: string;
  partnerIdx: number;
  partnerName: string;
}

// Оценка одной конкретной команды
export function evaluateTeam(
  team: number[],
  composition: string,
  compositionWeight: number,
  context: GeneratorContext,
): TeamResult | null {
  const {
    rowHeaders,
    rolesMap,
    classesMap,
    heroTiersMap,
    graph,
    soloCapableChars,
    enemyIndices,
    enemyClassesMap,
    roleWeights,
    classWeights,
    antiRoleWeights,
    classCounters,
    myHeroIndices,
    options,
  } = context;

  const mySet = new Set(myHeroIndices);
  // teamSet удален, так как нигде не использовался в оригинальной логике

  const members: string[] = [];
  const roles: RoleType[] = [];
  const roleCounts: Record<RoleType, number> = { sup: 0, dps: 0, tnk: 0 };
  const classCounts: Record<string, number> = {};

  let synergyScore = 0;
  let tierScore = 0;
  let counterScore = 0;
  let roleScore = 0;
  let heavyScore = 0;
  let synergyCount = 0;
  let minScore = Infinity;

  const processedPairs = new Set<string>();
  const details = {
    counter: [] as string[],
    synergy: [] as string[],
    tier: [] as string[],
    class: [] as string[],
    weakness: [] as string[],
    role: [] as string[],
    heavy: [] as string[],
    starCounters: [] as string[],
  };

  for (const idx of team) {
    const name = rowHeaders[idx];
    const rawRole = rolesMap.get(name);
    const role: RoleType =
      rawRole === "sup" || rawRole === "dps" || rawRole === "tnk"
        ? rawRole
        : "dps";
    const isProposed = !mySet.has(idx);

    members.push(String(name));
    roles.push(role);

    // Безопасная проверка ключа в объекте для строгого TS
    if (roleCounts[role] !== undefined) {
      roleCounts[role]++;
    }

    // Тиры
    if (options.useTiers) {
      const tierInfo = heroTiersMap.get(name);
      if (tierInfo) {
        tierScore += tierInfo.score;
        if (isProposed) details.tier.push(`${name} — тир ${tierInfo.tier}`);
      }
    }

    // Классы и контрпики
    const classData = classesMap.get(name);
    if (classData) {
      const myClass = classData.class;
      const myCounter = classData.counter;

      if (myClass) {
        classCounts[myClass] = (classCounts[myClass] || 0) + 1;
      }

      if (isProposed) {
        const parts = [myClass, myCounter].filter(Boolean);
        details.class.push(
          `${name} — ${parts.join(" / ") || "класс не указан"}`,
        );
      }

      if (options.useCounterPicks && enemyIndices.length > 0) {
        for (const enemyIdx of enemyIndices) {
          const enemyClass = enemyClassesMap.get(enemyIdx);
          if (!enemyClass) continue;

          const enemyName = rowHeaders[enemyIdx];
          const isStarred = context.starredEnemyIndices.includes(enemyIdx);
          const mult = isStarred ? 2 : 1;

          if (myCounter && classCounters[myCounter] === enemyClass) {
            const bonus = 3 * mult;
            counterScore += bonus;
            if (isProposed) {
              const label = `${name} (${myCounter}) → ${enemyName}${isStarred ? " (×2)" : ""}`;
              details.counter.push(label);
              if (isStarred)
                details.starCounters.push(
                  `${name} → контрит ключевого ${enemyName}`,
                );
            }
          } else if (myClass && classCounters[myClass] === enemyClass) {
            counterScore += 2 * mult;
            if (isProposed)
              details.counter.push(
                `${name} (${myClass}) → ${enemyName}${isStarred ? " 🌟 (×2)" : ""}`,
              );
          } else if (myClass && classCounters[enemyClass] === myClass) {
            counterScore += -1 * mult;
            if (isProposed)
              details.weakness.push(
                `${name} ← ${enemyName} (${enemyClass})${isStarred ? " 🌟 КРИТИЧНО (×2)" : ""}`,
              );
          }
        }
      }

      if (options.useClassWeights && myClass && classWeights[myClass]) {
        counterScore += classWeights[myClass];
      }
      if (
        options.useAntiRoleWeights &&
        myCounter &&
        antiRoleWeights[myCounter]
      ) {
        counterScore += antiRoleWeights[myCounter];
      }
    }
  }

  // Синергии
  if (options.useSynergies && team.length > 1) {
    for (let heroIdx = 0; heroIdx < team.length; heroIdx++) {
      const idx = team[heroIdx];
      const name = rowHeaders[idx];
      const isProposed = !mySet.has(idx);

      // Строго типизированный массив вместо any[]
      const candidates: SynergyCandidate[] = [];

      const heroGraph = graph.get(idx);
      if (heroGraph) {
        for (
          let partnerIdxLocal = 0;
          partnerIdxLocal < team.length;
          partnerIdxLocal++
        ) {
          if (heroIdx === partnerIdxLocal) continue;

          const otherIdx = team[partnerIdxLocal];
          const synergy = heroGraph.get(otherIdx);

          if (synergy) {
            candidates.push({
              score: synergy.score,
              hasRealPartner: true,
              grade: synergy.grade,
              partnerIdx: otherIdx,
              partnerName: rowHeaders[otherIdx],
            });
          }
        }
      }

      if (options.useSoloSynergies && soloCapableChars.has(idx)) {
        candidates.push({
          score: GRADE_SCORES["SA"] ?? 3,
          hasRealPartner: false,
          grade: "S_SOLO",
          partnerIdx: -1,
          partnerName: "",
        });
      }

      if (candidates.length > 0) {
        candidates.sort((a, b) => b.score - a.score);
        const best = candidates[0];

        synergyScore += best.score;
        minScore = Math.min(minScore, best.score);

        if (best?.hasRealPartner) {
          const pairKey = `${Math.min(idx, best.partnerIdx)}-${Math.max(idx, best.partnerIdx)}`;
          if (!processedPairs.has(pairKey)) {
            processedPairs.add(pairKey);
            synergyCount++;

            const partnerIsProposed = !mySet.has(best.partnerIdx);
            if (
              (isProposed || partnerIsProposed) &&
              !best.grade.includes("_DEG") &&
              best.grade !== "S_SOLO"
            ) {
              const myLabel = mySet.has(idx) ? " (ваш)" : "";
              const partnerLabel = mySet.has(best.partnerIdx) ? " (ваш)" : "";
              details.synergy.push(
                `${name}${myLabel} ↔ ${best.partnerName}${partnerLabel} — синергия ${best.grade}`,
              );
            }
          }
        }
      }
    }
  }

  // Веса ролей
  roleScore =
    roleCounts.sup * (roleWeights.sup || 0) +
    roleCounts.dps * (roleWeights.dps || 0) +
    roleCounts.tnk * (roleWeights.tnk || 0);

  if (roleScore > 0) {
    const parts: string[] = [];
    if (roleCounts.sup > 0) parts.push(`${roleCounts.sup}✚`);
    if (roleCounts.dps > 0) parts.push(`${roleCounts.dps}⚔️`);
    if (roleCounts.tnk > 0) parts.push(`${roleCounts.tnk}🛡️`);
    details.role.push(
      `Состав: ${parts.join(" ")} = ${roleScore} очков за роли`,
    );
  }

  // Heavy class
  const classValues = Object.values(classCounts);
  if (classValues.length > 0 && team.length > 1) {
    const maxCount = Math.max(...classValues);
    const ratio = maxCount / team.length;

    if (ratio >= 0.67) {
      let dominant = "";
      for (const cls in classCounts) {
        if (classCounts[cls] === maxCount) {
          dominant = cls;
          break;
        }
      }
      heavyScore = Math.round(3 * ratio);
      details.heavy.push(
        `Heavy ${dominant}: ${maxCount}/${team.length} героев (${Math.round(ratio * 100)}%)`,
      );
    }
  }

  const finalComposition = `${roleCounts.sup}-${roleCounts.dps}-${roleCounts.tnk}`;
  const totalScore =
    (options.useSynergies ? synergyScore : 0) +
    (options.useTiers ? tierScore : 0) +
    counterScore +
    roleScore +
    heavyScore +
    compositionWeight;

  return {
    members,
    roles,
    composition,
    finalComposition,
    compositionWeight,
    synergyScore,
    counterScore,
    tierScore,
    roleScore,
    heavyScore,
    totalScore,
    synergyCount,
    minScore: synergyCount > 0 ? minScore : 0,
    addedMembers: team
      .filter((idx) => !mySet.has(idx))
      .map((idx) => rowHeaders[idx]),
    formattedDetails: formatTeamDetails(details),
  };
}
