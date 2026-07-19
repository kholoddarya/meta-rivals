import type { TeamResult } from "~/types/generator";

// Генерация математических комбинаций
export function getCombinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (k > arr.length) return [];
  const result: T[][] = [];

  function combine(start: number, current: T[]) {
    if (current.length === k) {
      result.push([...current]);
      return;
    }
    for (let i = start; i < arr.length; i++) {
      const item = arr[i];

      // Type guard: сужаем тип с 'T | undefined' до 'T'
      if (item !== undefined) {
        current.push(item);
        combine(i + 1, current);
        current.pop();
      }
    }
  }

  combine(0, []);
  return result;
}

// Вставка команды в топ с сохранением сортировки
export function insertToTop(
  topTeams: TeamResult[],
  team: TeamResult,
  maxResults: number,
) {
  topTeams.push(team);
  topTeams.sort((a, b) => b.totalScore - a.totalScore);
  if (topTeams.length > maxResults) {
    topTeams.length = maxResults;
  }
}

// Генерация всех возможных распределений ролей FLX
export function generateFlxDistributions(
  flxCount: number,
): Array<{ sup: number; dps: number; tnk: number }> {
  if (flxCount === 0) return [{ sup: 0, dps: 0, tnk: 0 }];
  const distributions: Array<{ sup: number; dps: number; tnk: number }> = [];

  function generate(
    remaining: number,
    current: { sup: number; dps: number; tnk: number },
  ) {
    if (remaining === 0) {
      distributions.push({
        sup: current.sup,
        dps: current.dps,
        tnk: current.tnk,
      });
      return;
    }
    current.sup++;
    generate(remaining - 1, current);
    current.sup--;
    current.dps++;
    generate(remaining - 1, current);
    current.dps--;
    current.tnk++;
    generate(remaining - 1, current);
    current.tnk--;
  }

  generate(flxCount, { sup: 0, dps: 0, tnk: 0 });

  const unique: Array<{ sup: number; dps: number; tnk: number }> = [];
  const seen = new Set<string>();
  for (const d of distributions) {
    const key = `${d.sup}-${d.dps}-${d.tnk}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(d);
    }
  }
  return unique;
}

// Форматирование деталей команды для UI (аккордеон)
export function formatTeamDetails(details: {
  counter: string[];
  synergy: string[];
  tier: string[];
  class: string[];
  weakness: string[];
  role: string[];
  heavy: string[];
  starCounters: string[];
}): string {
  let html = "";

  const makeBlock = (
    id: string,
    icon: string,
    title: string,
    items: string[],
    colorClass?: string,
  ) => {
    if (!items || items.length === 0) return "";
    const itemsHtml = items
      .map(
        (d) =>
          `<div class="detail-row"><span class="detail-text ${colorClass || ""}">${d}</span></div>`,
      )
      .join("");
    return (
      `<div class="detail-block expanded" id="${id}">` +
      `<div class="detail-block-header"><span><span class="block-icon">${icon}</span>${title} (${items.length})</span></div>` +
      `<div class="detail-block-content">${itemsHtml}</div></div>`
    );
  };

  html += makeBlock("classes", "🎭", "Классы и анти-роли", details.class);
  html += makeBlock(
    "counters",
    "⚔️",
    "Контрпики",
    details.counter,
    "detail-positive",
  );
  html += makeBlock(
    "starcounters",
    "🌟",
    "Контр-ключевые (×2)",
    details.starCounters,
    "detail-positive",
  );
  html += makeBlock(
    "synergies",
    "🔗",
    "Синергии",
    details.synergy,
    "detail-positive",
  );
  html += makeBlock(
    "roles",
    "🎯",
    "Веса ролей",
    details.role,
    "detail-positive",
  );
  html += makeBlock(
    "heavy",
    "🔥",
    "Heavy class",
    details.heavy,
    "detail-positive",
  );
  html += makeBlock("tiers", "⭐", "Тиры", details.tier);
  html += makeBlock(
    "weaknesses",
    "⚠️",
    "Слабости",
    details.weakness,
    "detail-negative",
  );

  return (
    html ||
    '<div style="padding:8px;color:#666;font-style:italic;font-size:12px;">Нет выраженных преимуществ</div>'
  );
}
