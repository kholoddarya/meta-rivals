import type { TeamResult, SynergyGrade } from './types'

/** Все k-комбинации массива без повторов — getCombinations() из BusinessLogic.js */
export function getCombinations<T>(arr: T[], k: number): T[][] {
  const result: T[][] = []
  if (k === 0) return [[]]
  if (k > arr.length) return []

  const current: T[] = []
  function combine(start: number) {
    if (current.length === k) {
      result.push([...current])
      return
    }
    for (let i = start; i < arr.length; i++) {
      current.push(arr[i])
      combine(i + 1)
      current.pop()
    }
  }

  combine(0)
  return result
}

/**
 * Вставляет команду в отсортированный топ по totalScore. При равенстве очков
 * побеждает команда с бОльшим числом синергий, затем — с бОльшей минимальной
 * синергией среди пар. insertToTop() из BusinessLogic.js.
 */
export function insertToTop(topTeams: TeamResult[], team: TeamResult, maxResults: number) {
  let inserted = false

  for (let i = 0; i < topTeams.length; i++) {
    const current = topTeams[i]
    const better =
      team.totalScore > current.totalScore ||
      (team.totalScore === current.totalScore && team.synergyCount > current.synergyCount) ||
      (team.totalScore === current.totalScore &&
        team.synergyCount === current.synergyCount &&
        team.minSynergyScore > current.minSynergyScore)

    if (better) {
      topTeams.splice(i, 0, team)
      inserted = true
      break
    }
  }

  if (!inserted && topTeams.length < maxResults) {
    topTeams.push(team)
  }
  if (topTeams.length > maxResults) {
    topTeams.pop()
  }
}

/**
 * Верхняя граница возможного счёта команды — используется, чтобы досрочно
 * пропускать ветки перебора, которые точно не попадут в топ N (когда топ уже
 * заполнен). calculateUpperBound() из BusinessLogic.js.
 */
export function calculateUpperBound(
  team: string[],
  soloCapableHeroIds: Set<string>,
  gradeScores: Record<SynergyGrade, number>
): number {
  let maxPossible = 0
  for (const heroId of team) {
    maxPossible += soloCapableHeroIds.has(heroId) ? gradeScores.SA : gradeScores.S
  }
  return maxPossible
}
