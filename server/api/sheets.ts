type SheetRow = Record<string, string | null>;
type SheetsApiResponse = Record<string, SheetRow[]>;

export default defineEventHandler(async () => {
  const config = useRuntimeConfig();

  const spreadsheetId =
    config.spreadsheetId || "1wAGk5Na43fQPArlfj0T8c-HTjj3bs1PLyTKx0NdN-QY";
  const apiKey = config.googleApiKey;

  if (!apiKey) {
    throw createError({
      statusCode: 500,
      message: "Google API Key не найден в .env",
    });
  }

  const sheets = ["FullInfo", "HeroTier", "Class", "Roles"] as const;
  const ranges = sheets.map((s) => `ranges=${encodeURIComponent(s)}`).join("&");

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?${ranges}&key=${apiKey}`;

  try {
    const res = await $fetch<{
      valueRanges: { range: string; values: string[][] | undefined }[];
    }>(url);

    const result: SheetsApiResponse = {};

    sheets.forEach((sheetName, i) => {
      const vr = res.valueRanges[i];
      if (!vr) return;

      const values = vr.values || [];
      if (values.length === 0) return;

      const [header, ...rows] = values;
      if (!header) return;

      result[sheetName] = rows.map((row) => {
        const entries = header.map(
          (key, idx) => [key, row[idx] ?? null] as [string, string | null],
        );
        return Object.fromEntries(entries) as SheetRow;
      });
    });

    return result;
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Неизвестная ошибка";
    console.error("Ошибка при запросе к Google Sheets:", errorMessage);

    throw createError({
      statusCode: 500,
      message: "Не удалось получить данные из таблиц",
    });
  }
});
