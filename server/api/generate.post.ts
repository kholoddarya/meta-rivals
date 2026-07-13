import { generateTeams } from '../utils/generator/generateTeams'
import { DEFAULT_GENERATION_SETTINGS } from '../utils/generator/defaults'
import { MOCK_HEROES, MOCK_SYNERGY_MATRIX, MOCK_HERO_TIERS } from '../utils/generator/mockData'
import type { TeamResult, GenerationSettings } from '../utils/generator/types'

// Тело запроса, которое шлёт draftStore.generate() (см. app/stores/draft.ts).
// Названия полей совпадают с GenerationSettings из app/types/hero.ts.
interface GenerateRequestBody {
  teamSize: number
  minSynergies?: number
  maxResults?: number
  useHeroTier?: boolean
  useSoloSynergies?: boolean
  useSynergies?: boolean
  useCounterPicks?: boolean
  roleCompositions?: string[]
  mustHaveHeroes?: string[]
  enemyComposition?: string[]
  bannedHeroes?: string[]
}

// Клиентские настройки (упрощённые, без весов/грейдов) объединяем с
// дефолтами движка — полный редактор весов появится вместе с админкой.
function toSettings(body: GenerateRequestBody): GenerationSettings {
  return {
    ...DEFAULT_GENERATION_SETTINGS,
    teamSize: body.teamSize,
    roleCompositions: body.roleCompositions?.length
      ? body.roleCompositions
      : DEFAULT_GENERATION_SETTINGS.roleCompositions,
    minSynergies: body.minSynergies ?? DEFAULT_GENERATION_SETTINGS.minSynergies,
    maxResults: body.maxResults ?? DEFAULT_GENERATION_SETTINGS.maxResults,
    useHeroTier: body.useHeroTier ?? DEFAULT_GENERATION_SETTINGS.useHeroTier,
    useSoloSynergies: body.useSoloSynergies ?? DEFAULT_GENERATION_SETTINGS.useSoloSynergies,
    useSynergies: body.useSynergies ?? DEFAULT_GENERATION_SETTINGS.useSynergies,
    useCounterPicks: body.useCounterPicks ?? DEFAULT_GENERATION_SETTINGS.useCounterPicks,
    mustHaveHeroIds: body.mustHaveHeroes ?? [],
    enemyHeroIds: body.enemyComposition ?? [],
    bannedHeroIds: body.bannedHeroes ?? []
  }
}

// Приводим внутренний TeamResult к форме, которую ждёт фронт
// (TeamComposition из app/types/hero.ts) — с героями целиком, а не id/именами.
function toApiTeam(team: TeamResult) {
  return {
    heroes: team.memberIds
      .map(id => MOCK_HEROES.find(h => h.id === id))
      .filter((h): h is (typeof MOCK_HEROES)[number] => Boolean(h)),
    composition: team.finalComposition,
    totalScore: team.totalScore,
    synergyScore: team.synergyScore,
    tierScore: team.tierScore,
    counterPickScore: team.counterScore,
    roleScore: team.roleScore,
    heavyScore: team.heavyScore,
    synergyCount: team.synergyCount,
    details: team.details
  }
}

export default defineEventHandler(async (event) => {
  const body = await readBody<GenerateRequestBody>(event)

  if (!body?.teamSize) {
    throw createError({
      statusCode: 400,
      statusMessage: 'teamSize обязателен в теле запроса'
    })
  }

  const settings = toSettings(body)

  try {
    const topTeams = generateTeams({
      heroes: MOCK_HEROES,
      synergyMatrix: MOCK_SYNERGY_MATRIX,
      heroTiers: MOCK_HERO_TIERS,
      settings
    })

    return topTeams.map(toApiTeam)
  } catch (e) {
    throw createError({
      statusCode: 400,
      statusMessage: e instanceof Error ? e.message : 'Ошибка генерации команд'
    })
  }
})
