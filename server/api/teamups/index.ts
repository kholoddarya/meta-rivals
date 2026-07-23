import { TEAM_UPS } from '../../utils/teamupDescriptions'

export default defineEventHandler(() => {
  const list = Object.entries(TEAM_UPS).map(([key, data]) => {
    const [hero1, hero2] = key.split('|')
    return {
      key,
      hero1,
      hero2,
      grade: data.grade,
      title: data.title || 'Unknown Synergy',
      description: data.description || 'No detailed description available yet.',
      bonuses: data.bonuses || [],
      confirmed: data.confirmed,
    }
  })

  // Сортируем на сервере по силе тира (SA -> S -> A -> B -> C -> D)
  const gradeOrder: Record<string, number> = { SA: 6, S: 5, A: 4, B: 3, C: 2, D: 1 }
  list.sort((a, b) => (gradeOrder[b.grade] || 0) - (gradeOrder[a.grade] || 0))

  return { teamUps: list }
})
