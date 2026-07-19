// stores/sheets.ts
import { defineStore } from "pinia";
import type {
  FullInfoRow,
  HeroTierRow,
  ClassDataRow,
  RoleType,
} from "~/types/sheets";

interface RawSheetData {
  FullInfo: Record<string, string>[];
  HeroTier: Record<string, string>[];
  Class: Record<string, string>[];
  Roles: Record<string, string>[];
}

export const useSheetsStore = defineStore("sheets", () => {
  const fullInfo = ref<FullInfoRow[]>([]);
  const heroTier = ref<HeroTierRow[]>([]);
  const classData = ref<ClassDataRow[]>([]);
  const rolesMap = ref<Map<string, RoleType>>(new Map()); // имя героя → роль
  const heroesList = ref<
    Array<{
      name: string;
      role: RoleType | null;
      class: string;
      counter: string;
    }>
  >([]);

  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const loadData = async () => {
    if (fullInfo.value.length > 0) return;

    isLoading.value = true;
    error.value = null;

    try {
      const data = await $fetch<RawSheetData>("/api/sheets");

      // FullInfo
      fullInfo.value = (data.FullInfo || []).filter(
        (row): row is Record<string, string> =>
          typeof row["Hero | Anchor"] === "string" &&
          row["Hero | Anchor"].trim() !== "",
      ) as FullInfoRow[];

      // HeroTier
      const rawHeroTier = data.HeroTier || [];
      const validTierRows = rawHeroTier.filter(
        (row) =>
          typeof row["Adam Warlock"] === "string" &&
          row["Adam Warlock"].trim() !== "",
      );
      const mappedHeroTier: HeroTierRow[] = validTierRows.map((row) => ({
        Hero: row["Adam Warlock"] ?? "",
        Tier: row["C"] ?? "N/A",
      }));
      mappedHeroTier.unshift({ Hero: "Adam Warlock", Tier: "C" });
      heroTier.value = mappedHeroTier;

      // ClassData
      const rawClassData = data.Class || [];
      const validClassRows = rawClassData.filter(
        (row) =>
          typeof row["Adam Warlock"] === "string" &&
          row["Adam Warlock"].trim() !== "",
      );
      classData.value = validClassRows.map((row) => ({
        Hero: row["Adam Warlock"] ?? "",
        Poke: row["Poke"] ?? "N/A",
        "Anti-Dive": row["Anti-Dive"] ?? "N/A",
      }));

      // строим Map и список героев
      const rawRoles = data.Roles || [];
      const rolesMapLocal = new Map<string, RoleType>();
      const heroesLocal: Array<{
        name: string;
        role: RoleType | null;
        class: string;
        counter: string;
      }> = [];

      const validRoleRows = rawRoles.filter(
        (row) =>
          typeof row["Hero"] === "string" &&
          row["Hero"].trim() !== "" &&
          typeof row["Role"] === "string" &&
          ["sup", "dps", "tnk"].includes(row["Role"].trim().toLowerCase()),
      );

      validRoleRows.forEach((row) => {
        const name = (row["Hero"] ?? "").trim();
        const role = (row["Role"] ?? "").trim().toLowerCase() as RoleType;
        rolesMapLocal.set(name, role);
      });

      // Собираем полный список героев из FullInfo + Roles + Class
      const allHeroNames = new Set<string>();
      fullInfo.value.forEach((row) => {
        if (row["Hero | Anchor"]) allHeroNames.add(row["Hero | Anchor"]);
      });
      classData.value.forEach((row) => {
        if (row.Hero) allHeroNames.add(row.Hero);
      });

      allHeroNames.forEach((name) => {
        const role = rolesMapLocal.get(name) ?? null;
        const classRow = classData.value.find((c) => c.Hero === name);
        heroesLocal.push({
          name,
          role,
          class: classRow?.Poke ?? "",
          counter: classRow?.["Anti-Dive"] ?? "",
        });
      });

      // Сортируем по роли, потом по имени
      const roleOrder: Record<RoleType, number> = { sup: 0, dps: 1, tnk: 2 };
      heroesLocal.sort((a, b) => {
        const ra = a.role ? roleOrder[a.role] : 3;
        const rb = b.role ? roleOrder[b.role] : 3;
        if (ra && rb && ra !== rb) return ra - rb;
        return a.name.localeCompare(b.name);
      });

      rolesMap.value = rolesMapLocal;
      heroesList.value = heroesLocal;
    } catch (e: unknown) {
      if (e instanceof Error) {
        error.value = e.message;
      } else if (typeof e === "string") {
        error.value = e;
      } else {
        error.value = "Не удалось загрузить данные из Google Sheets";
      }
      console.error("Ошибка загрузки:", e);
    } finally {
      isLoading.value = false;
    }
  };

  return {
    fullInfo,
    heroTier,
    classData,
    rolesMap,
    heroesList,
    isLoading,
    error,
    loadData,
  };
});
