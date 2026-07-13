import { MOCK_HEROES } from '../utils/generator/mockData'

// Тот же источник данных, что использует /api/generate — чтобы список
// героев на фронте и герои, участвующие в генерации, не расходились.
// TODO: заменить на выборку из Postgres.
export default defineEventHandler(() => {
  return MOCK_HEROES
})
