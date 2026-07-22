// ==========================================
// ГЕНЕРАТОР — ИСПОЛЬЗУЕТ БИЗНЕС-ЛОГИКУ
// ==========================================

function runGenerationAsync() {
  let startTime = null

  try {
    startTime = new Date().getTime()
    const settings = loadSettings()
    const ss = SpreadsheetApp.getActiveSpreadsheet()

    Logger.log(`=== Запуск генерации ===`)
    Logger.log(`Режим: ${settings.GENERATION_MODE}, Команда: ${settings.TEAM_SIZE}`)

    // ========== ВАЛИДАЦИЯ ==========
    const validationError = validateSettings(settings)
    if (validationError) {
      return { success: false, error: validationError, fixable: true }
    }

    // ========== ПОСТРОЕНИЕ РАСКЛАДОК ==========
    const compositionsToGenerate = buildCompositionsToGenerate(settings)
    if (compositionsToGenerate.length === 0) {
      return {
        success: false,
        error: `Нет валидных раскладок для размера ${settings.TEAM_SIZE}.`,
        fixable: true,
      }
    }

    const resultSheetName = buildResultSheetName(settings)
    const outputTeamSize =
      settings.GENERATION_MODE === 'counter'
        ? settings.COUNTER_ROLE_COMPOSITION.sup +
          settings.COUNTER_ROLE_COMPOSITION.dps +
          settings.COUNTER_ROLE_COMPOSITION.tnk
        : settings.TEAM_SIZE

    // ========== ЧТЕНИЕ ДАННЫХ ==========
    const matrixSheet = ss.getSheetByName(settings.MATRIX_SHEET_NAME)
    if (!matrixSheet) {
      return {
        success: false,
        error: `Лист "${settings.MATRIX_SHEET_NAME}" не найден.`,
        fixable: true,
      }
    }

    const matrixData = matrixSheet.getDataRange().getValues()
    const matrixRowStart = getMatrixRowStart(matrixData)
    const rowHeaders = matrixData
      .slice(matrixRowStart)
      .map((row) => row[0])
      .filter((n) => n)
      .map((n) => n.toString().trim())
    const headerRowIndex = matrixRowStart > 0 ? matrixRowStart - 1 : 0
    const colHeaders = matrixData[headerRowIndex].slice(1).filter((h) => h)

    if (rowHeaders.length === 0) {
      return { success: false, error: 'Лист матрицы пуст.', fixable: true }
    }

    // ========== ВАЛИДАЦИЯ ОБЯЗАТЕЛЬНЫХ ПЕРСОНАЖЕЙ ==========
    const mustHaveValidation = validateMustHaveHeroes(settings.MUST_HAVE_HEROES, rowHeaders)
    if (mustHaveValidation.missing.length > 0) {
      return {
        success: false,
        error: `Обязательные персонажи не найдены: ${mustHaveValidation.missing.join(', ')}`,
        fixable: true,
      }
    }
    const mustHaveIndices = mustHaveValidation.indices

    // ========== ВАЛИДАЦИЯ ВРАГОВ ==========
    let enemyIndices = []
    let enemyClassesMap = {}

    if (settings.GENERATION_MODE === 'counter' && settings.ENEMY_COMPOSITION.length > 0) {
      const classesMapForEnemies = readClassesMap(settings.CLASSES_SHEET_NAME)
      const enemyValidation = validateEnemyComposition(
        settings.ENEMY_COMPOSITION,
        rowHeaders,
        classesMapForEnemies
      )

      if (enemyValidation.missing.length > 0) {
        return {
          success: false,
          error: `Вражеские персонажи не найдены: ${enemyValidation.missing.join(', ')}`,
          fixable: true,
        }
      }

      enemyIndices = enemyValidation.indices
      enemyClassesMap = enemyValidation.enemyClassesMap
      Logger.log(`Вражеская композиция: ${settings.ENEMY_COMPOSITION.join(', ')}`)
    }

    // ========== ЧТЕНИЕ РОЛЕЙ ==========
    const rolesMap = readRolesMap(settings.ROLES_SHEET_NAME)
    if (!rolesMap) {
      return {
        success: false,
        error: `Лист ролей "${settings.ROLES_SHEET_NAME}" не найден.`,
        fixable: true,
      }
    }

    // ========== ЧТЕНИЕ ТИРОВ ==========
    const TIER_SCORES = {
      S: settings.TIER_S,
      A: settings.TIER_A,
      B: settings.TIER_B,
      C: settings.TIER_C,
      D: settings.TIER_D,
    }
    const heroTiersMap = settings.USE_HERO_TIER
      ? readHeroTiersMap(settings.HERO_TIER_SHEET_NAME, TIER_SCORES)
      : {}

    // ========== ЧТЕНИЕ КЛАССОВ ==========
    const classesMap = settings.USE_COUNTER_PICKS
      ? readClassesMap(settings.CLASSES_SHEET_NAME)
      : null

    // ========== БИЗНЕС-ЛОГИКА: ПОСТРОЕНИЕ ГРАФА ==========
    const GRADE_SCORES = {
      S: settings.GRADE_S,
      SA: settings.GRADE_SA,
      A: settings.GRADE_A,
      B: settings.GRADE_B,
    }

    const { graph, soloCapableChars } = buildSynergyGraph(
      rowHeaders,
      colHeaders,
      matrixData,
      matrixRowStart,
      GRADE_SCORES,
      settings.USE_SOLO_SYNERGIES
    )

    // ========== БИЗНЕС-ЛОГИКА: ГРУППИРОВКА ПО РОЛЯМ ==========
    const charactersByRole = groupCharactersByRole(rowHeaders, rolesMap)

    // ========== БИЗНЕС-ЛОГИКА: ПРЕДВЫЧИСЛЕНИЕ КОНТРПИКОВ ==========
    const counterPickCache = precomputeCounterPicks(
      rowHeaders,
      classesMap,
      enemyIndices,
      enemyClassesMap,
      settings
    )

    // ========== ГЕНЕРАЦИЯ ==========
    const topTeams = []
    let processedCount = 0

    const context = {
      settings,
      rowHeaders,
      rolesMap,
      graph,
      soloCapableChars,
      heroTiersMap,
      classesMap,
      mustHaveIndices,
      enemyIndices,
      enemyClassesMap,
      counterPickCache,
      GRADE_SCORES,
    }

    for (let c = 0; c < compositionsToGenerate.length; c++) {
      const comp = compositionsToGenerate[c]
      const teamSize = comp.sup + comp.dps + comp.tnk

      // Одиночный контрпик
      if (teamSize === 1 && settings.GENERATION_MODE === 'counter') {
        const targetRole = comp.sup === 1 ? 'sup' : comp.dps === 1 ? 'dps' : 'tnk'
        const candidates = charactersByRole[targetRole]

        for (let h = 0; h < candidates.length; h++) {
          const res = evaluateSingleHero(candidates[h], comp.weight, context)
          if (res) insertToTop(topTeams, res, settings.MAX_RESULTS)
          processedCount++
        }
        continue
      }

      const supComb = getCombinations(charactersByRole.sup, comp.sup)
      const dpsComb = getCombinations(charactersByRole.dps, comp.dps)
      const tnkComb = getCombinations(charactersByRole.tnk, comp.tnk)

      for (let si = 0; si < supComb.length; si++) {
        for (let di = 0; di < dpsComb.length; di++) {
          for (let ti = 0; ti < tnkComb.length; ti++) {
            const team = supComb[si].concat(dpsComb[di]).concat(tnkComb[ti])

            // Раннее отсечение
            if (topTeams.length >= settings.MAX_RESULTS) {
              const worstScore = topTeams[topTeams.length - 1].totalScore
              const upperBound =
                calculateUpperBound(team, soloCapableChars, GRADE_SCORES) + comp.weight
              if (upperBound <= worstScore) continue
            }

            const compStr = comp.sup + '-' + comp.dps + '-' + comp.tnk
            const res = evaluateTeam(team, compStr, comp.weight, context)
            if (res) insertToTop(topTeams, res, settings.MAX_RESULTS)

            processedCount++
            if (processedCount % 100000 === 0) {
              Logger.log(`Обработано ${processedCount} команд...`)
            }
          }
        }
      }
    }

    const duration = ((new Date().getTime() - startTime) / 1000).toFixed(2)
    Logger.log(`Генерация завершена за ${duration} сек.`)

    // ========== ВЫВОД РЕЗУЛЬТАТА ==========
    return writeResultsToSheet(ss, topTeams, resultSheetName, outputTeamSize, settings, duration)
  } catch (error) {
    Logger.log(`❌ Критическая ошибка: ${error.message}\n${error.stack}`)
    return formatErrorMessage(error)
  }
}

// Вынесена запись в лист
function writeResultsToSheet(ss, topTeams, resultSheetName, outputTeamSize, settings, duration) {
  let targetSheet = ss.getSheetByName(resultSheetName)
  if (!targetSheet) {
    targetSheet = ss.insertSheet(resultSheetName)
  } else {
    targetSheet.clear()
    try {
      targetSheet.showColumns(1, targetSheet.getMaxColumns())
    } catch (e) {}
  }

  let headerRowOffset = 0
  if (settings.GENERATION_MODE === 'counter') {
    const enemyNames = settings.ENEMY_COMPOSITION.join(', ')
    targetSheet
      .getRange(1, 1)
      .setValue(`⚔️ Против: ${enemyNames}`)
      .setFontWeight('bold')
      .setFontSize(12)
      .setFontColor('#d32f2f')
    targetSheet.getRange(1, 1, 1, 10).merge()
    headerRowOffset = 1
  }

  const headers = []
  for (let i = 1; i <= outputTeamSize; i++) headers.push(`Персонаж ${i}`)
  headers.push('Итог', 'Раскладка', 'Кол-во син.', 'Слабое звено', 'Синергии')
  if (settings.USE_COUNTER_PICKS && settings.GENERATION_MODE === 'counter')
    headers.push('Контрпики')
  if (settings.USE_HERO_TIER) headers.push('Тиры')

  const headerRow = 1 + headerRowOffset
  targetSheet.getRange(headerRow, 1, 1, headers.length).setValues([headers])

  if (topTeams.length > 0) {
    const outputData = []
    for (let r = 0; r < topTeams.length; r++) {
      const t = topTeams[r]
      const row = []
      for (let i = 0; i < outputTeamSize; i++) row.push(t.members[i] || '')
      row.push(t.totalScore, t.composition, t.synergyCount, t.minScore, t.synergyScore)
      if (settings.USE_COUNTER_PICKS && settings.GENERATION_MODE === 'counter')
        row.push(t.counterScore)
      if (settings.USE_HERO_TIER) row.push(t.tierScore)
      outputData.push(row)
    }

    const dataStartRow = headerRow + 1
    targetSheet.getRange(dataStartRow, 1, outputData.length, headers.length).setValues(outputData)
    targetSheet.getRange(headerRow, 1, outputData.length + 1, headers.length).setNumberFormat('@')

    for (let r = 0; r < topTeams.length; r++) {
      for (let cIdx = 0; cIdx < outputTeamSize; cIdx++) {
        const role = topTeams[r].roles[cIdx]
        const color = ROLE_COLORS[role] || '#FFFFFF'
        targetSheet.getRange(dataStartRow + r, cIdx + 1).setBackground(color)
      }
    }

    targetSheet
      .getRange(headerRow, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground('#f3f3f3')

    const hiddenCount = headers.length - outputTeamSize
    if (hiddenCount > 0) targetSheet.hideColumns(outputTeamSize + 1, hiddenCount)

    return {
      success: true,
      teamCount: topTeams.length,
      sheetName: resultSheetName,
      heroes: settings.MUST_HAVE_HEROES.length > 0 ? settings.MUST_HAVE_HEROES.join(', ') : null,
      duration: duration,
    }
  } else {
    const dataStartRow = headerRow + 1
    targetSheet.getRange(dataStartRow, 1).setValue('Команд не найдено.')
    return { success: false, error: 'Команд не найдено.', fixable: true }
  }
}

// Форматирование ошибок
function formatErrorMessage(error) {
  let userMessage = error.message
  let fixable = false

  if (error.message.includes('Assignment to constant variable')) {
    userMessage = 'Внутренняя ошибка скрипта. Обновите скрипт.'
    fixable = false
  } else if (error.message.includes('Cannot read')) {
    userMessage = 'Не удалось прочитать данные. Проверьте служебные листы.'
    fixable = true
  } else if (error.message.includes('Exceeded maximum execution time')) {
    userMessage = 'Превышено время выполнения. Уменьшите MAX_RESULTS.'
    fixable = true
  } else if (error.message.includes('Out of memory')) {
    userMessage = 'Недостаточно памяти. Уменьшите MAX_RESULTS.'
    fixable = true
  }

  return {
    success: false,
    error: userMessage,
    fixable: fixable,
    technical: error.message,
  }
}

function runGeneration() {
  const ui = SpreadsheetApp.getUi()

  if (shouldOfferWizard()) {
    const response = ui.alert(
      '🔄 Настройки не менялись',
      'С момента последнего запуска настройки не изменялись.\n\nПройти настройки заново?',
      ui.ButtonSet.YES_NO
    )

    if (response === ui.Button.YES) {
      startSettingsWizard()
      return
    }
  }

  resetVisitedSettings()
  updateLastGenerationTime()
  showGenerationProgress()
}

function runCounterGeneration() {
  showCounterPickSettings()
}

function startCounterGeneration() {
  resetVisitedSettings()
  updateLastGenerationTime()
  showGenerationProgress()
  return true
}

// ==========================================
// БЫСТРЫЙ ПОДБОР КОМАНДЫ (для sidebar)
// ==========================================
function quickPickTeams(enemies, myHeroes, neededRoles, options, bannedHeroes, starredEnemies) {
  try {
    const settings = loadSettings()
    const ss = SpreadsheetApp.getActiveSpreadsheet()
    const startTime = new Date().getTime()

    const opts = Object.assign(
      {
        useSynergies: true,
        useSoloSynergies: true,
        useTiers: true,
        useCounterPicks: true,
        useClassWeights: true,
        useAntiRoleWeights: true,
        maxResults: 10, // По умолчанию 10
      },
      options || {}
    )

    // Количество отображаемых команд — БЕЗ ЛИМИТА
    const maxResults = Math.max(1, parseInt(opts.maxResults) || 10)

    const bannedSet = new Set(Array.isArray(bannedHeroes) ? bannedHeroes : [])
    const starredSet = new Set(Array.isArray(starredEnemies) ? starredEnemies : [])

    Logger.log(
      `=== Быстрый подбор === maxResults: ${maxResults}, ⭐ Звёзд: ${starredSet.size}, FLX: ${neededRoles.filter((r) => r === 'flx').length}`
    )

    const matrixSheet = ss.getSheetByName(settings.MATRIX_SHEET_NAME)
    if (!matrixSheet) {
      return { success: false, error: `Лист "${settings.MATRIX_SHEET_NAME}" не найден.` }
    }

    const matrixData = matrixSheet.getDataRange().getValues()
    const matrixRowStart = getMatrixRowStart(matrixData)
    const rowHeaders = matrixData
      .slice(matrixRowStart)
      .map((row) => row[0])
      .filter((n) => n)
      .map((n) => n.toString().trim())
    const headerRowIndex = matrixRowStart > 0 ? matrixRowStart - 1 : 0
    const colHeaders = matrixData[headerRowIndex].slice(1).filter((h) => h)

    // Валидация врагов
    const enemyIndices = []
    if (enemies && enemies.length > 0) {
      for (const enemy of enemies) {
        const idx = rowHeaders.indexOf(enemy)
        if (idx === -1) return { success: false, error: `Враг "${enemy}" не найден.` }
        enemyIndices.push(idx)
      }
    }

    // Индексы звёздных врагов
    const starredEnemyIndices = []
    for (const enemy of starredSet) {
      const idx = rowHeaders.indexOf(enemy)
      if (idx !== -1 && enemyIndices.indexOf(idx) !== -1) {
        starredEnemyIndices.push(idx)
      }
    }

    // Валидация "моих" героев
    const myHeroIndices = []
    for (const hero of myHeroes) {
      if (bannedSet.has(hero)) continue
      const idx = rowHeaders.indexOf(hero)
      if (idx === -1) return { success: false, error: `Ваш герой "${hero}" не найден.` }
      myHeroIndices.push(idx)
    }

    // Индексы забаненных
    const bannedIndices = new Set()
    for (let i = 0; i < rowHeaders.length; i++) {
      if (bannedSet.has(rowHeaders[i])) bannedIndices.add(i)
    }

    const rolesMap = readRolesMapCached(settings.ROLES_SHEET_NAME)
    if (!rolesMap) return { success: false, error: `Лист ролей не найден.` }

    const classesMap = readClassesMapCached(settings.CLASSES_SHEET_NAME)

    const TIER_SCORES = {
      S: settings.TIER_S,
      A: settings.TIER_A,
      B: settings.TIER_B,
      C: settings.TIER_C,
      D: settings.TIER_D,
    }
    const heroTiersMap = opts.useTiers
      ? readHeroTiersMapCached(settings.HERO_TIER_SHEET_NAME, TIER_SCORES)
      : {}

    const GRADE_SCORES = {
      S: settings.GRADE_S,
      SA: settings.GRADE_SA,
      A: settings.GRADE_A,
      B: settings.GRADE_B,
    }

    const { graph, soloCapableChars } = buildSynergyGraph(
      rowHeaders,
      colHeaders,
      matrixData,
      matrixRowStart,
      GRADE_SCORES,
      opts.useSoloSynergies
    )

    const enemyClassesMap = {}
    if (classesMap) {
      for (const enemyIdx of enemyIndices) {
        const enemyName = rowHeaders[enemyIdx]
        if (classesMap[enemyName]) {
          enemyClassesMap[enemyIdx] = classesMap[enemyName].class
        }
      }
    }

    const counterPickCache =
      opts.useCounterPicks && settings.USE_COUNTER_PICKS && enemyIndices.length > 0
        ? precomputeCounterPicks(rowHeaders, classesMap, enemyIndices, enemyClassesMap, settings)
        : {}

    // Фильтрация кандидатов
    const allByRole = groupCharactersByRole(rowHeaders, rolesMap)
    const charactersByRole = {
      sup: allByRole.sup.filter((idx) => !bannedIndices.has(idx)),
      dps: allByRole.dps.filter((idx) => !bannedIndices.has(idx)),
      tnk: allByRole.tnk.filter((idx) => !bannedIndices.has(idx)),
    }

    // Разделение ролей
    const fixedRoles = { sup: 0, dps: 0, tnk: 0 }
    let flxCount = 0
    for (const role of neededRoles) {
      if (role === 'flx') flxCount++
      else if (fixedRoles.hasOwnProperty(role)) fixedRoles[role]++
    }

    const totalTeamSize =
      fixedRoles.sup + fixedRoles.dps + fixedRoles.tnk + flxCount + myHeroIndices.length
    const compositionWeightsMap = getCompositionWeights(settings, totalTeamSize)

    const localSettings = Object.assign({}, settings, {
      USE_SYNERGIES: opts.useSynergies,
      USE_SOLO_SYNERGIES: opts.useSoloSynergies,
      USE_HERO_TIER: opts.useTiers,
      USE_COUNTER_PICKS: opts.useCounterPicks && settings.USE_COUNTER_PICKS,
      USE_CLASS_WEIGHTS: opts.useClassWeights,
      USE_ANTI_ROLE_WEIGHTS: opts.useAntiRoleWeights,
      MIN_SYNERGIES: 0,
      CLASS_COUNTERS: CLASS_COUNTERS,
    })

    const context = {
      settings: localSettings,
      rowHeaders,
      rolesMap,
      graph,
      soloCapableChars,
      heroTiersMap,
      classesMap,
      mustHaveIndices: [],
      enemyIndices,
      starredEnemyIndices: starredEnemyIndices,
      enemyClassesMap,
      counterPickCache,
      GRADE_SCORES,
      myHeroIndices: myHeroIndices,
    }

    // Храним top-maxResults команд — БЕЗ ИСКУССТВЕННЫХ ЛИМИТОВ
    const topTeams = []
    let totalIterations = 0
    let skippedByBound = 0

    const flxDistributions = generateFlxDistributions(flxCount)

    // Сортируем распределения по весу композиции
    flxDistributions.sort((a, b) => {
      const compA =
        fixedRoles.sup + a.sup + '-' + (fixedRoles.dps + a.dps) + '-' + (fixedRoles.tnk + a.tnk)
      const compB =
        fixedRoles.sup + b.sup + '-' + (fixedRoles.dps + b.dps) + '-' + (fixedRoles.tnk + b.tnk)
      const weightA = compositionWeightsMap[compA] || 0
      const weightB = compositionWeightsMap[compB] || 0
      return weightB - weightA
    })

    // Перебираем ВСЕ распределения и ВСЕ комбинации — без лимита итераций
    for (const dist of flxDistributions) {
      const totalRoles = {
        sup: fixedRoles.sup + dist.sup,
        dps: fixedRoles.dps + dist.dps,
        tnk: fixedRoles.tnk + dist.tnk,
      }

      if (
        totalRoles.sup > charactersByRole.sup.length ||
        totalRoles.dps > charactersByRole.dps.length ||
        totalRoles.tnk > charactersByRole.tnk.length
      ) {
        continue
      }

      const supComb = getCombinations(charactersByRole.sup, totalRoles.sup)
      const dpsComb = getCombinations(charactersByRole.dps, totalRoles.dps)
      const tnkComb = getCombinations(charactersByRole.tnk, totalRoles.tnk)

      const compStr = totalRoles.sup + '-' + totalRoles.dps + '-' + totalRoles.tnk
      const compWeight = compositionWeightsMap[compStr] || 1

      for (let si = 0; si < supComb.length; si++) {
        for (let di = 0; di < dpsComb.length; di++) {
          for (let ti = 0; ti < tnkComb.length; ti++) {
            const team = myHeroIndices.concat(supComb[si]).concat(dpsComb[di]).concat(tnkComb[ti])
            const uniqueTeam = Array.from(new Set(team))
            if (uniqueTeam.length !== team.length) {
              totalIterations++
              continue
            }

            // Агрессивное отсечение по верхней границе — но НЕ по количеству итераций
            if (topTeams.length >= maxResults) {
              const worstScore = topTeams[topTeams.length - 1].totalScore
              const upperBound = calculateQuickUpperBound(uniqueTeam, context) + compWeight
              if (upperBound <= worstScore) {
                skippedByBound++
                totalIterations++
                continue
              }
            }

            const res = evaluateTeam(uniqueTeam, compStr, compWeight, context)

            if (res) {
              const mySet = new Set(myHeroIndices)
              res.addedMembers = uniqueTeam
                .filter(function (idx) {
                  return !mySet.has(idx)
                })
                .map(function (idx) {
                  return rowHeaders[idx]
                })

              res.formattedDetails = formatTeamDetails(res)
              insertToTop(topTeams, res, maxResults)
            }

            totalIterations++
          }

          // Защита от таймаута — проверяем каждые 1000 итераций
          if (totalIterations % 1000 === 0) {
            const elapsed = new Date().getTime() - startTime
            if (elapsed > 240000) {
              // 4 минуты
              Logger.log(`⚠️ Таймаут 4 мин, остановка. Проверено: ${totalIterations}`)
              break
            }
          }
        }
        if (new Date().getTime() - startTime > 240000) break
      }
      if (new Date().getTime() - startTime > 240000) break
    }

    const duration = ((new Date().getTime() - startTime) / 1000).toFixed(2)
    Logger.log(
      `✅ Подбор за ${duration}с, итераций: ${totalIterations}, отсечено: ${skippedByBound}, в топ: ${topTeams.length}`
    )

    // Берём top-maxResults и группируем
    const topK = topTeams.slice(0, maxResults)
    const groups = groupSimilarTeams(topK, rolesMap, compositionWeightsMap)

    // Вычисляем веса героев
    const weightContext = {
      settings: localSettings,
      rolesMap,
      classesMap,
      heroTiersMap,
      enemyIndices,
      enemyClassesMap,
      rowHeaders,
      starredEnemyIndices: starredEnemyIndices,
    }

    groups.forEach(function (group) {
      var totalWeight = 0
      group.baseMembers.forEach(function (name) {
        totalWeight += calculateHeroIndividualWeight(name, weightContext)
      })
      group.bestTeamWeight = group.bestScore

      if (group.slotAlternatives) {
        group.slotAlternatives.forEach(function (slot) {
          slot.baseHeroWeight = group.bestScore
          slot.alternatives.forEach(function (alt) {
            alt.compositionWeight = alt.bestScore
          })
          slot.alternatives.sort(function (a, b) {
            return (b.compositionWeight || 0) - (a.compositionWeight || 0)
          })
        })
      }
    })

    if (topK.length > 0) {
      debugTeamSynergies(
        topK[0].members.map((name) => rowHeaders.indexOf(name)),
        context
      )
    }

    return {
      success: true,
      teams: topK,
      groups: groups,
      myHeroes: myHeroes,
      enemies: enemies,
      stats: {
        duration,
        iterations: totalIterations,
        skippedByBound: skippedByBound,
        distributions: flxDistributions.length,
        totalGenerated: topTeams.length,
        groupsCount: groups.length,
        requestedResults: maxResults,
      },
    }
  } catch (error) {
    Logger.log(`❌ Ошибка: ${error.message}\n${error.stack}`)
    return { success: false, error: error.message }
  }
}

// ==========================================
// РАСЧЁТ ИНДИВИДУАЛЬНОГО ВЕСА ГЕРОЯ
// Учитывает: тир + роль + класс + анти-роль + контрпики
// ==========================================
function calculateHeroIndividualWeight(heroName, context) {
  const {
    settings,
    rolesMap,
    classesMap,
    heroTiersMap,
    enemyIndices,
    enemyClassesMap,
    rowHeaders,
  } = context

  let weight = 0

  // Тир
  if (settings.USE_HERO_TIER && heroTiersMap[heroName]) {
    weight += heroTiersMap[heroName].score
  }

  // Вес роли
  const role = rolesMap[heroName]
  if (role && settings.ROLE_WEIGHTS && settings.ROLE_WEIGHTS[role]) {
    weight += settings.ROLE_WEIGHTS[role]
  }

  // Класс, анти-роль и контрпики
  if (classesMap && classesMap[heroName]) {
    const myClass = classesMap[heroName].class
    const myCounter = classesMap[heroName].counter

    if (
      settings.USE_CLASS_WEIGHTS &&
      myClass &&
      settings.CLASS_WEIGHTS &&
      settings.CLASS_WEIGHTS[myClass]
    ) {
      weight += settings.CLASS_WEIGHTS[myClass]
    }
    if (
      settings.USE_ANTI_ROLE_WEIGHTS &&
      myCounter &&
      settings.ANTI_ROLE_WEIGHTS &&
      settings.ANTI_ROLE_WEIGHTS[myCounter]
    ) {
      weight += settings.ANTI_ROLE_WEIGHTS[myCounter]
    }

    if (settings.USE_COUNTER_PICKS && enemyIndices.length > 0) {
      for (const enemyIdx of enemyIndices) {
        const enemyClass = enemyClassesMap[enemyIdx]
        if (!enemyClass) continue
        // Множитель за ключевого врага
        const isStarred =
          context.starredEnemyIndices && context.starredEnemyIndices.indexOf(enemyIdx) !== -1
        const mult = isStarred ? 2 : 1

        if (
          myCounter &&
          settings.CLASS_COUNTERS &&
          settings.CLASS_COUNTERS[myCounter] === enemyClass
        ) {
          weight += settings.ANTI_COUNTER_PICK_BONUS * mult
        } else if (
          myClass &&
          settings.CLASS_COUNTERS &&
          settings.CLASS_COUNTERS[myClass] === enemyClass
        ) {
          weight += settings.COUNTER_PICK_BONUS * mult
        }
      }
    }
  }

  return weight
}

// ==========================================
// ГРУППИРОВКА СМЕЖНЫХ КОМАНД v3
// - Смежные = отличаются на 1 героя + та же композиция
// - Альтернатива = та же роль, что и базовый герой
// - Сортировка групп по весу композиции
// ==========================================
function groupSimilarTeams(teams, rolesMap, compositionWeightsMap) {
  if (!teams || teams.length === 0) return []

  const groups = []
  const used = new Set()

  for (let i = 0; i < teams.length; i++) {
    if (used.has(i)) continue

    const bestTeam = teams[i]
    const baseMembers = bestTeam.addedMembers || []
    const baseComposition = bestTeam.finalComposition || bestTeam.composition || ''

    const group = {
      id: 'group_' + i,
      bestTeam: bestTeam,
      baseMembers: [...baseMembers],
      baseComposition: baseComposition,
      slotAlternatives: [],
      teams: [{ index: i, team: bestTeam }],
      bestScore: bestTeam.totalScore,
      worstScore: bestTeam.totalScore,
      compositionWeight: (compositionWeightsMap && compositionWeightsMap[baseComposition]) || 1,
    }
    used.add(i)

    // Ищем смежные команды: отличаются на 1 + та же композиция
    for (let j = i + 1; j < teams.length; j++) {
      if (used.has(j)) continue

      const candidate = teams[j]
      const candidateMembers = candidate.addedMembers || []

      // Сравниваем итоговые раскладки
      const candidateComp = candidate.finalComposition || candidate.composition || ''
      if (candidateComp !== baseComposition) continue

      if (candidateMembers.length !== baseMembers.length) continue

      // Считаем пересечение
      const candidateSet = new Set(candidateMembers)
      const baseSet = new Set(baseMembers)

      let intersectionCount = 0
      for (const m of baseMembers) {
        if (candidateSet.has(m)) intersectionCount++
      }

      const difference = baseMembers.length - intersectionCount
      if (difference === 1) {
        group.teams.push({ index: j, team: candidate })
        group.worstScore = Math.min(group.worstScore, candidate.totalScore)
        used.add(j)
      }
    }

    // Формируем слоты альтернатив (с проверкой роли)
    if (group.teams.length > 1) {
      for (let t = 1; t < group.teams.length; t++) {
        const team = group.teams[t].team
        const members = team.addedMembers || []

        const memberSet = new Set(members)
        const baseSetLocal = new Set(baseMembers)

        const replaced = baseMembers.filter((m) => !memberSet.has(m))
        const added = members.filter((m) => !baseSetLocal.has(m))

        if (replaced.length === 1 && added.length === 1) {
          const replacedHero = replaced[0]
          const addedHero = added[0]
          const pos = baseMembers.indexOf(replacedHero)

          // Роли из rolesMap (не из team.roles, чтобы избежать ошибок индекса)
          const baseRole = rolesMap ? rolesMap[replacedHero] || null : null
          const addedRole = rolesMap ? rolesMap[addedHero] || null : null

          // КРИТИЧЕСКАЯ ПРОВЕРКА: альтернатива должна быть той же роли
          if (baseRole && addedRole && baseRole !== addedRole) {
            // Пропускаем — это меняет композицию
            continue
          }

          // Находим или создаём слот
          let slot = group.slotAlternatives.find((s) => s.position === pos)
          if (!slot) {
            slot = {
              position: pos,
              baseHero: replacedHero,
              baseRole: baseRole,
              alternatives: [],
            }
            group.slotAlternatives.push(slot)
          }

          const existing = slot.alternatives.find((a) => a.name === addedHero)
          if (!existing) {
            slot.alternatives.push({
              name: addedHero,
              role: addedRole,
              bestScore: team.totalScore,
              teamIndex: t,
            })
          } else if (team.totalScore > existing.bestScore) {
            existing.bestScore = team.totalScore
            existing.teamIndex = t
          }
        }
      }

      // Сортировка
      group.slotAlternatives.sort((a, b) => a.position - b.position)
      group.slotAlternatives.forEach((slot) => {
        slot.alternatives.sort((a, b) => b.bestScore - a.bestScore)
      })

      // Удаляем пустые слоты (если все альтернативы были отфильтрованы)
      group.slotAlternatives = group.slotAlternatives.filter((s) => s.alternatives.length > 0)
    }

    groups.push(group)
  }

  // Сортировка групп по весу композиции (убывание), затем по оценке
  groups.sort((a, b) => {
    // Сначала по весу композиции
    if (a.compositionWeight !== b.compositionWeight) {
      return b.compositionWeight - a.compositionWeight
    }
    // Потом по оценке лучшей команды
    return b.bestScore - a.bestScore
  })

  return groups
}

// Функция получения весов композиций из настроек
function getCompositionWeights(settings, teamSize) {
  const weightsMap = {}

  // Ищем пресет для нужного размера команды
  let compositions = []
  if (settings.ROLE_PRESETS && settings.ROLE_PRESETS[teamSize]) {
    compositions = settings.ROLE_PRESETS[teamSize]
  } else if (settings.TEAM_SIZE === teamSize) {
    compositions = settings.ROLE_COMPOSITIONS || []
  }

  // Первая раскладка = максимальный вес, последняя = минимальный
  const total = compositions.length
  for (let i = 0; i < total; i++) {
    const comp = compositions[i]
    // Вес: от total (первая) до 1 (последняя)
    weightsMap[comp] = total - i
  }

  Logger.log(`📊 Веса композиций для размера ${teamSize}: ${JSON.stringify(weightsMap)}`)
  return weightsMap
}

// Быстрая оценка верхней границы для отсечения
function calculateQuickUpperBound(team, context) {
  const {
    settings,
    heroTiersMap,
    rowHeaders,
    rolesMap,
    classesMap,
    GRADE_SCORES,
    soloCapableChars,
    enemyIndices,
    enemyClassesMap,
  } = context

  let maxPossible = 0
  const roleCounts = { sup: 0, dps: 0, tnk: 0 }
  const classCounts = {}

  for (const charIdx of team) {
    const charName = rowHeaders[charIdx]

    // Тиры
    if (settings.USE_HERO_TIER && heroTiersMap[charName]) {
      maxPossible += heroTiersMap[charName].score
    }

    // Синергии — максимум S для каждого
    if (settings.USE_SYNERGIES) {
      if (soloCapableChars.has(charIdx)) {
        maxPossible += GRADE_SCORES['SA']
      } else {
        maxPossible += GRADE_SCORES['S']
      }
    }

    // Веса ролей
    const role = rolesMap[charName]
    if (role && roleCounts.hasOwnProperty(role)) {
      roleCounts[role]++
    }

    // Веса классов и анти-ролей
    if (classesMap && classesMap[charName]) {
      const myClass = classesMap[charName].class
      const myCounter = classesMap[charName].counter

      if (myClass) {
        classCounts[myClass] = (classCounts[myClass] || 0) + 1
      }

      // Контрпики — максимум за каждого врага
      if (settings.USE_COUNTER_PICKS && enemyIndices.length > 0) {
        for (const enemyIdx of enemyIndices) {
          const enemyClass = enemyClassesMap[enemyIdx]
          if (!enemyClass) continue

          if (
            myCounter &&
            settings.CLASS_COUNTERS &&
            settings.CLASS_COUNTERS[myCounter] === enemyClass
          ) {
            maxPossible += settings.ANTI_COUNTER_PICK_BONUS
          } else if (
            myClass &&
            settings.CLASS_COUNTERS &&
            settings.CLASS_COUNTERS[myClass] === enemyClass
          ) {
            maxPossible += settings.COUNTER_PICK_BONUS
          }
        }
      }

      // Веса классов
      if (
        settings.USE_CLASS_WEIGHTS &&
        myClass &&
        settings.CLASS_WEIGHTS &&
        settings.CLASS_WEIGHTS[myClass]
      ) {
        maxPossible += settings.CLASS_WEIGHTS[myClass]
      }

      // Веса анти-ролей
      if (
        settings.USE_ANTI_ROLE_WEIGHTS &&
        myCounter &&
        settings.ANTI_ROLE_WEIGHTS &&
        settings.ANTI_ROLE_WEIGHTS[myCounter]
      ) {
        maxPossible += settings.ANTI_ROLE_WEIGHTS[myCounter]
      }
    }
  }

  // Веса ролей
  if (settings.ROLE_WEIGHTS) {
    maxPossible +=
      roleCounts.sup * (settings.ROLE_WEIGHTS.sup || 0) +
      roleCounts.dps * (settings.ROLE_WEIGHTS.dps || 0) +
      roleCounts.tnk * (settings.ROLE_WEIGHTS.tnk || 0)
  }

  // Heavy class бонус
  if (settings.USE_HEAVY_CLASS && settings.HEAVY_CLASS_BONUS > 0 && team.length > 1) {
    const classValues = Object.values(classCounts)
    if (classValues.length > 0) {
      const maxClassCount = Math.max(...classValues)
      const heavyRatio = maxClassCount / team.length
      if (heavyRatio >= 0.67) {
        maxPossible += Math.round(settings.HEAVY_CLASS_BONUS * heavyRatio)
      }
    }
  }

  return maxPossible + 1 // +1 за compositionWeight
}

function generateFlxDistributions(flxCount) {
  if (flxCount === 0) return [{ sup: 0, dps: 0, tnk: 0 }]

  const distributions = []

  function generate(remaining, current) {
    if (remaining === 0) {
      distributions.push({ sup: current.sup, dps: current.dps, tnk: current.tnk })
      return
    }

    current.sup++
    generate(remaining - 1, current)
    current.sup--

    current.dps++
    generate(remaining - 1, current)
    current.dps--

    current.tnk++
    generate(remaining - 1, current)
    current.tnk--
  }

  generate(flxCount, { sup: 0, dps: 0, tnk: 0 })

  const unique = []
  const seen = new Set()
  for (const d of distributions) {
    const key = d.sup + '-' + d.dps + '-' + d.tnk
    if (!seen.has(key)) {
      seen.add(key)
      unique.push(d)
    }
  }

  return unique
}

// Генерация всех возможных распределений FLX по ролям
function generateFlxDistributions(flxCount) {
  if (flxCount === 0) return [{ sup: 0, dps: 0, tnk: 0 }]

  const distributions = []

  function generate(remaining, current) {
    if (remaining === 0) {
      distributions.push({ sup: current.sup, dps: current.dps, tnk: current.tnk })
      return
    }

    // Пробуем каждую роль
    current.sup++
    generate(remaining - 1, current)
    current.sup--

    current.dps++
    generate(remaining - 1, current)
    current.dps--

    current.tnk++
    generate(remaining - 1, current)
    current.tnk--
  }

  generate(flxCount, { sup: 0, dps: 0, tnk: 0 })

  // Убираем дубликаты (например, FLX=2: sup+dps и dps+sup — это одно и то же)
  const unique = []
  const seen = new Set()
  for (const d of distributions) {
    const key = d.sup + '-' + d.dps + '-' + d.tnk
    if (!seen.has(key)) {
      seen.add(key)
      unique.push(d)
    }
  }

  return unique
}

// ==========================================
// ПРОВЕРКА ТРЕБОВАНИЙ СИНЕРГИЙ
// ==========================================
function checkSynergyRequirements(team, teamData, context) {
  const { settings, mustHaveIndices, graph, soloCapableChars } = context

  // Проверка обязательных персонажей
  for (const mustIdx of mustHaveIndices) {
    if (!team.includes(mustIdx)) return false
  }

  const isSingleCounter = settings.GENERATION_MODE === 'counter' && team.length === 1

  if (
    isSingleCounter ||
    !settings.MUST_HAVE_SYNERGY ||
    mustHaveIndices.length === 0 ||
    !settings.USE_SYNERGIES
  ) {
    return true
  }

  // Проверка синергий для обязательных персонажей
  for (const mustIdx of mustHaveIndices) {
    if (settings.USE_SOLO_SYNERGIES && soloCapableChars.has(mustIdx)) continue

    let hasSynergy = false

    // Проверка SA-синергии с любым героем
    for (const partnerIdxStr in graph[mustIdx]) {
      if (graph[mustIdx][partnerIdxStr].grade === 'SA') {
        hasSynergy = true
        break
      }
    }

    if (!hasSynergy) {
      // Проверка любой синергии с героями в команде
      for (const t of team) {
        if (t === mustIdx) continue
        if (graph[mustIdx][t]) {
          hasSynergy = true
          break
        }
      }
    }

    if (!hasSynergy) return false
  }

  return true
}

// ==========================================
// ГЛОБАЛЬНЫЕ ФУНКЦИИ ОЦЕНКИ КОМАНД
// ==========================================
function evaluateSingleHero(heroIdx, compositionWeight, context) {
  const { settings, rowHeaders, rolesMap, heroTiersMap, counterPickCache } = context
  const charName = rowHeaders[heroIdx]

  let tierScore = 0
  let counterScore = counterPickCache[heroIdx] || 0

  if (settings.USE_HERO_TIER && heroTiersMap[charName]) {
    tierScore += heroTiersMap[charName].score
  }

  const totalScore = (settings.USE_HERO_TIER ? tierScore : 0) + counterScore + compositionWeight

  return {
    members: [charName],
    roles: [rolesMap[charName]],
    composition: '1-0-0',
    compositionWeight: compositionWeight,
    synergyScore: 0,
    counterScore: counterScore,
    tierScore: settings.USE_HERO_TIER ? tierScore : 0,
    totalScore: totalScore,
    synergyCount: 0,
    minScore: 0,
  }
}

// ==========================================
// ОЦЕНКА КОМАНДЫ
// ==========================================
function evaluateTeam(team, composition, compositionWeight, context) {
  const { settings, myHeroIndices } = context

  // Проверка обязательных
  if (!checkMustHave(team, context)) return null

  const mySet = new Set(myHeroIndices || [])
  const teamSet = new Set(team)

  // Собираем данные о команде
  const teamData = collectTeamData(team, mySet, context)

  // Проверка синергий
  if (!checkSynergyRequirements(team, teamData, context)) return null

  // Расчёт всех оценок
  const scores = calculateAllScores(teamData, context)

  // Проверка минимума синергий
  if (settings.USE_SYNERGIES && team.length > 1 && scores.synergyCount < settings.MIN_SYNERGIES) {
    return null
  }

  // Вычисляем ИТОГОВУЮ раскладку всей команды (мои + добавляемые)
  const finalRoleCounts = { sup: 0, dps: 0, tnk: 0 }
  for (let i = 0; i < team.length; i++) {
    const heroRole = context.rolesMap[context.rowHeaders[team[i]]]
    if (heroRole && finalRoleCounts.hasOwnProperty(heroRole)) {
      finalRoleCounts[heroRole]++
    }
  }
  const finalComposition =
    finalRoleCounts.sup + '-' + finalRoleCounts.dps + '-' + finalRoleCounts.tnk

  // Итоговая оценка
  const totalScore =
    (settings.USE_SYNERGIES ? scores.synergy : 0) +
    (settings.USE_HERO_TIER ? scores.tier : 0) +
    scores.counter +
    scores.role +
    scores.heavy +
    compositionWeight

  const synergyCheck =
    settings.USE_SYNERGIES && team.length > 1 ? scores.synergyCount >= settings.MIN_SYNERGIES : true

  if (synergyCheck) {
    return {
      members: team.map(function (idx) {
        return context.rowHeaders[idx]
      }),
      roles: team.map(function (idx) {
        return context.rolesMap[context.rowHeaders[idx]]
      }),
      composition: composition,
      finalComposition: finalComposition, // Итоговая раскладка всей команды
      compositionWeight: compositionWeight,
      synergyScore: scores.synergy,
      counterScore: scores.counter,
      tierScore: settings.USE_HERO_TIER ? scores.tier : 0,
      roleScore: scores.role,
      heavyScore: scores.heavy,
      totalScore: totalScore,
      synergyCount: scores.synergyCount,
      minScore: scores.synergyCount > 0 ? scores.minScore : 0,
      counterDetails: teamData.details.counter,
      synergyDetails: teamData.details.synergy,
      tierDetails: teamData.details.tier,
      classDetails: teamData.details.class,
      weaknessDetails: teamData.details.weakness,
      roleDetails: teamData.details.role,
      heavyDetails: teamData.details.heavy,
    }
  }
  return null
}

// Проверка обязательных персонажей
function checkMustHave(team, context) {
  const { mustHaveIndices, settings, graph, soloCapableChars } = context

  for (const mustIdx of mustHaveIndices) {
    if (!team.includes(mustIdx)) return false
  }

  const isSingleCounter = settings.GENERATION_MODE === 'counter' && team.length === 1
  if (
    isSingleCounter ||
    !settings.MUST_HAVE_SYNERGY ||
    mustHaveIndices.length === 0 ||
    !settings.USE_SYNERGIES
  ) {
    return true
  }

  for (const mustIdx of mustHaveIndices) {
    if (settings.USE_SOLO_SYNERGIES && soloCapableChars.has(mustIdx)) continue
    if (!hasAnySynergy(mustIdx, team, graph)) return false
  }

  return true
}

function hasAnySynergy(heroIdx, team, graph) {
  for (const partnerIdxStr in graph[heroIdx]) {
    if (graph[heroIdx][partnerIdxStr].grade === 'SA') return true
  }
  for (const t of team) {
    if (t === heroIdx) continue
    if (graph[heroIdx][t]) return true
  }
  return false
}

// Сбор данных о команде (один проход)
function collectTeamData(team, mySet, context) {
  const {
    rowHeaders,
    rolesMap,
    classesMap,
    heroTiersMap,
    settings,
    enemyIndices,
    enemyClassesMap,
  } = context

  const data = {
    members: [],
    roles: [],
    roleCounts: { sup: 0, dps: 0, tnk: 0 },
    classCounts: {},
    details: {
      counter: [],
      synergy: [],
      tier: [],
      class: [],
      weakness: [],
      role: [],
      heavy: [],
      starCounters: [],
    },
    proposedHeroes: [],
  }

  for (let i = 0; i < team.length; i++) {
    const charIdx = team[i]
    const charName = rowHeaders[charIdx]
    const isProposed = !mySet.has(charIdx)
    const role = rolesMap[charName]

    data.members.push(charName)
    data.roles.push(role)
    if (role && data.roleCounts.hasOwnProperty(role)) data.roleCounts[role]++

    if (isProposed) data.proposedHeroes.push({ idx: charIdx, name: charName, role: role })

    // Классы
    if (classesMap && classesMap[charName]) {
      const myClass = classesMap[charName].class
      const myCounter = classesMap[charName].counter
      if (myClass) data.classCounts[myClass] = (data.classCounts[myClass] || 0) + 1

      if (isProposed) {
        const parts = [myClass, myCounter].filter(Boolean)
        data.details.class.push(charName + ' — ' + (parts.join(' / ') || 'класс не указан'))
      }
    }
  }

  return data
}

// Расчёт всех оценок
function calculateAllScores(teamData, context) {
  const {
    settings,
    rowHeaders,
    graph,
    soloCapableChars,
    heroTiersMap,
    classesMap,
    enemyIndices,
    enemyClassesMap,
    myHeroIndices,
    starredEnemyIndices,
  } = context

  const scores = {
    synergy: 0,
    synergyCount: 0,
    minScore: Infinity,
    tier: 0,
    counter: 0,
    role: 0,
    heavy: 0,
  }

  const team = teamData.members.map((name, i) => {
    const idx = rowHeaders.indexOf(name)
    return { idx, name, role: teamData.roles[i] }
  })

  const teamSet = new Set(team.map((h) => h.idx))
  const mySet = new Set(myHeroIndices || [])

  // Отслеживаем обработанные пары, чтобы не дублировать
  const processedPairs = new Set()

  // Один проход по команде
  for (let heroIdx = 0; heroIdx < team.length; heroIdx++) {
    const hero = team[heroIdx]
    const { idx, name } = hero
    const isProposed = !mySet.has(idx)

    // Тиры
    if (settings.USE_HERO_TIER && heroTiersMap[name]) {
      const tierInfo = heroTiersMap[name]
      scores.tier += tierInfo.score
      if (isProposed) {
        if (!teamData.details.tier) teamData.details.tier = []
        teamData.details.tier.push(name + ' — тир ' + tierInfo.tier)
      }
    }

    // Контрпики и веса классов
    if (classesMap && classesMap[name]) {
      const myClass = classesMap[name].class
      const myCounter = classesMap[name].counter

      // Контрпики по врагам
      if (settings.USE_COUNTER_PICKS && enemyIndices.length > 0) {
        for (let ei = 0; ei < enemyIndices.length; ei++) {
          const enemyIdx = enemyIndices[ei]
          const enemyClass = enemyClassesMap[enemyIdx]
          if (!enemyClass) continue
          const enemyName = rowHeaders[enemyIdx]

          // Проверяем, звёздный ли враг
          const isStarred = starredEnemyIndices && starredEnemyIndices.indexOf(enemyIdx) !== -1
          const starMultiplier = isStarred ? 2 : 1

          if (
            myCounter &&
            settings.CLASS_COUNTERS &&
            settings.CLASS_COUNTERS[myCounter] === enemyClass
          ) {
            const bonus = settings.ANTI_COUNTER_PICK_BONUS * starMultiplier
            scores.counter += bonus
            if (isProposed) {
              if (!teamData.details.counter) teamData.details.counter = []
              var label = name + ' (' + myCounter + ') → ' + enemyName
              if (isStarred) label += '  (×2)'
              teamData.details.counter.push(label)

              if (isStarred) {
                if (!teamData.details.starCounters) teamData.details.starCounters = []
                teamData.details.starCounters.push({ hero: name, enemy: enemyName, type: 'anti' })
              }
            }
          } else if (
            myClass &&
            settings.CLASS_COUNTERS &&
            settings.CLASS_COUNTERS[myClass] === enemyClass
          ) {
            const bonus = settings.COUNTER_PICK_BONUS * starMultiplier
            scores.counter += bonus
            if (isProposed) {
              if (!teamData.details.counter) teamData.details.counter = []
              var label = name + ' (' + myClass + ') → ' + enemyName
              if (isStarred) label += ' 🌟 (×2)'
              teamData.details.counter.push(label)
            }
          } else if (
            myClass &&
            settings.CLASS_COUNTERS &&
            settings.CLASS_COUNTERS[enemyClass] === myClass
          ) {
            const penalty = settings.WEAK_TO_ENEMY_PENALTY * starMultiplier
            scores.counter += penalty
            if (isProposed) {
              if (!teamData.details.weakness) teamData.details.weakness = []
              var label = name + ' ← ' + enemyName + ' (' + enemyClass + ')'
              if (isStarred) label += ' 🌟 КРИТИЧНО (×2)'
              teamData.details.weakness.push(label)
            }
          }
        }
      }

      // Веса классов и анти-ролей
      if (
        settings.USE_CLASS_WEIGHTS &&
        myClass &&
        settings.CLASS_WEIGHTS &&
        settings.CLASS_WEIGHTS[myClass]
      ) {
        scores.counter += settings.CLASS_WEIGHTS[myClass]
      }
      if (
        settings.USE_ANTI_ROLE_WEIGHTS &&
        myCounter &&
        settings.ANTI_ROLE_WEIGHTS &&
        settings.ANTI_ROLE_WEIGHTS[myCounter]
      ) {
        scores.counter += settings.ANTI_ROLE_WEIGHTS[myCounter]
      }
    }

    // Синергии
    if (!settings.USE_SYNERGIES || team.length === 1) continue

    const candidates = []

    //  Проверяем синергии ТОЛЬКО с героями в команде (не с самим собой)
    for (let partnerIdxLocal = 0; partnerIdxLocal < team.length; partnerIdxLocal++) {
      if (heroIdx === partnerIdxLocal) continue // Не с самим собой

      const otherIdx = team[partnerIdxLocal].idx
      const otherName = team[partnerIdxLocal].name

      // Проверяем граф
      if (graph[idx] && graph[idx][otherIdx]) {
        const synergy = graph[idx][otherIdx]
        candidates.push({
          score: synergy.score,
          hasRealPartner: true,
          grade: synergy.grade,
          partnerIdx: otherIdx,
          partnerName: otherName,
        })
      }
    }

    // Соло-синергии (если включены)
    if (settings.USE_SOLO_SYNERGIES && soloCapableChars.has(idx)) {
      candidates.push({
        score: context.GRADE_SCORES['SA'],
        hasRealPartner: false,
        grade: 'S_SOLO',
      })
    }

    if (candidates.length > 0) {
      candidates.sort(function (a, b) {
        return b.score - a.score
      })
      const best = candidates[0]
      scores.synergy += best.score
      if (scores.minScore === Infinity) scores.minScore = best.score
      else scores.minScore = Math.min(scores.minScore, best.score)

      // Формируем детали ТОЛЬКО для реальных синергий
      if (best.hasRealPartner) {
        // Создаём уникальный ключ пары (чтобы не дублировать A↔B и B↔A)
        const pairKey = Math.min(idx, best.partnerIdx) + '-' + Math.max(idx, best.partnerIdx)

        if (!processedPairs.has(pairKey)) {
          processedPairs.add(pairKey)
          scores.synergyCount++

          const partnerIsProposed = !mySet.has(best.partnerIdx)

          // Показываем деталь только если хотя бы один из пары — предложенный
          if (
            (isProposed || partnerIsProposed) &&
            best.grade &&
            !best.grade.includes('_DEG') &&
            best.grade !== 'S_SOLO'
          ) {
            const myLabel = mySet.has(idx) ? ' (ваш)' : ''
            const partnerLabel = mySet.has(best.partnerIdx) ? ' (ваш)' : ''

            if (!teamData.details.synergy) teamData.details.synergy = []
            teamData.details.synergy.push(
              name + myLabel + ' ↔ ' + best.partnerName + partnerLabel + ' — синергия ' + best.grade
            )
          }
        }
      }
    }
  }

  // Веса ролей
  if (settings.ROLE_WEIGHTS) {
    scores.role =
      teamData.roleCounts.sup * (settings.ROLE_WEIGHTS.sup || 0) +
      teamData.roleCounts.dps * (settings.ROLE_WEIGHTS.dps || 0) +
      teamData.roleCounts.tnk * (settings.ROLE_WEIGHTS.tnk || 0)
    if (scores.role > 0) {
      var parts = []
      if (teamData.roleCounts.sup > 0) parts.push(teamData.roleCounts.sup + '')
      if (teamData.roleCounts.dps > 0) parts.push(teamData.roleCounts.dps + '⚔️')
      if (teamData.roleCounts.tnk > 0) parts.push(teamData.roleCounts.tnk + '🛡️')
      if (!teamData.details.role) teamData.details.role = []
      teamData.details.role.push(
        'Состав: ' + parts.join(' ') + ' = ' + scores.role + ' очков за роли'
      )
    }
  }

  // Heavy class
  if (settings.USE_HEAVY_CLASS && settings.HEAVY_CLASS_BONUS > 0 && team.length > 1) {
    const classValues = Object.values(teamData.classCounts)
    if (classValues.length > 0) {
      const maxCount = Math.max.apply(null, classValues)
      const ratio = maxCount / team.length
      if (ratio >= 0.67) {
        var dominant = null
        for (var cls in teamData.classCounts) {
          if (teamData.classCounts[cls] === maxCount) {
            dominant = cls
            break
          }
        }
        scores.heavy = Math.round(settings.HEAVY_CLASS_BONUS * ratio)
        if (!teamData.details.heavy) teamData.details.heavy = []
        teamData.details.heavy.push(
          'Heavy ' +
            dominant +
            ': ' +
            maxCount +
            '/' +
            team.length +
            ' героев (' +
            Math.round(ratio * 100) +
            '%)'
        )
      }
    }
  }

  return scores
}

// Построение результата
function buildTeamResult(
  team,
  composition,
  compositionWeight,
  teamData,
  scores,
  totalScore,
  context
) {
  const { rowHeaders, rolesMap } = context

  return {
    members: teamData.members,
    roles: teamData.roles,
    composition: composition,
    compositionWeight: compositionWeight,
    synergyScore: scores.synergy,
    counterScore: scores.counter,
    tierScore: scores.tier,
    roleScore: scores.role,
    heavyScore: scores.heavy,
    totalScore: totalScore,
    synergyCount: scores.synergyCount,
    minScore: scores.synergyCount > 0 ? scores.minScore : 0,
    counterDetails: teamData.details.counter,
    synergyDetails: teamData.details.synergy,
    tierDetails: teamData.details.tier,
    classDetails: teamData.details.class,
    weaknessDetails: teamData.details.weakness,
    roleDetails: teamData.details.role,
    heavyDetails: teamData.details.heavy,
    starCounterDetails: teamData.details.starCounters || [],
  }
}

// ==========================================
// ФОРМАТИРОВАНИЕ ДЕТАЛЕЙ — АККОРДЕОН
// ==========================================
function formatTeamDetails(teamData) {
  var html = ''

  function makeBlock(id, icon, title, items, itemColorClass) {
    if (!items || items.length === 0) return ''

    var itemsHtml
    if (id === 'starcounters') {
      // Для starcounters рендерим объект {hero, enemy, type}
      itemsHtml = items
        .map(function (d) {
          var text
          if (typeof d === 'object' && d.hero) {
            text = '⭐ ' + d.hero + ' → контрит ключевого ' + d.enemy
          } else {
            text = '⭐ ' + d
          }
          return (
            '<div class="detail-row"><span class="detail-text detail-star">' +
            text +
            '</span></div>'
          )
        })
        .join('')
    } else {
      itemsHtml = items
        .map(function (d) {
          return (
            '<div class="detail-row">' +
            '<span class="detail-text ' +
            (itemColorClass || '') +
            '">' +
            d +
            '</span>' +
            '</div>'
          )
        })
        .join('')
    }

    return (
      '<div class="detail-block expanded" id="' +
      id +
      '">' +
      '<div class="detail-block-header" onclick="toggleDetailBlock(event, this)">' +
      '<span><span class="block-icon">' +
      icon +
      '</span>' +
      title +
      ' (' +
      items.length +
      ')</span>' +
      '<span class="block-toggle">▶</span>' +
      '</div>' +
      '<div class="detail-block-content">' +
      itemsHtml +
      '</div>' +
      '</div>'
    )
  }

  // Отсортированный порядок блоков:
  // 1. Классы и анти-роли (базовая информация)
  // 2. Контрпики (против врагов)
  // 3. Синергии (взаимодействие)
  // 4. Веса ролей (состав команды)
  // 5. Heavy class (однородность)
  // 6. Тиры (сила героев)
  // 7. Слабости (проблемы)

  html += makeBlock('classes', '🎭', 'Классы и анти-роли', teamData.classDetails)
  html += makeBlock('counters', '⚔️', 'Контрпики', teamData.counterDetails, 'detail-positive')
  html += makeBlock(
    'starcounters',
    '🌟',
    'Контр-ключевые (×2)',
    teamData.starCounterDetails,
    'detail-positive'
  )
  html += makeBlock('synergies', '🔗', 'Синергии', teamData.synergyDetails, 'detail-positive')
  html += makeBlock('roles', '🎯', 'Веса ролей', teamData.roleDetails, 'detail-positive')
  html += makeBlock('heavy', '🔥', 'Heavy class', teamData.heavyDetails, 'detail-positive')
  html += makeBlock('tiers', '⭐', 'Тиры', teamData.tierDetails)
  html += makeBlock('weaknesses', '⚠️', 'Слабости', teamData.weaknessDetails, 'detail-negative')

  if (html === '') {
    html =
      '<div style="padding:8px;color:#666;font-style:italic;font-size:12px;">Нет выраженных преимуществ</div>'
  }

  return html
}

// ==========================================
// ФОРМАТИРОВАНИЕ ДЕТАЛЕЙ ГРУППЫ
// ==========================================
function formatGroupDetails(group) {
  // Берём детали из лучшей команды группы
  const bestTeam = group.bestTeam
  if (!bestTeam) return ''

  let html = ''

  function makeBlock(id, icon, title, items, itemColorClass) {
    if (!items || items.length === 0) return ''

    const itemsHtml = items
      .map(function (d) {
        return (
          '<div class="detail-row">' +
          '<span class="detail-text ' +
          (itemColorClass || '') +
          '">' +
          d +
          '</span>' +
          '</div>'
        )
      })
      .join('')

    return (
      '<div class="detail-block expanded">' +
      '<div class="detail-block-header" onclick="toggleDetailBlock(event, this)">' +
      '<span><span class="block-icon">' +
      icon +
      '</span>' +
      title +
      ' (' +
      items.length +
      ')</span>' +
      '<span class="block-toggle">▶</span>' +
      '</div>' +
      '<div class="detail-block-content">' +
      itemsHtml +
      '</div>' +
      '</div>'
    )
  }

  html += makeBlock('classes', '🎭', 'Классы и анти-роли', bestTeam.classDetails)
  html += makeBlock('counters', '⚔️', 'Контрпики', bestTeam.counterDetails, 'detail-positive')
  html += makeBlock('heavy', '🔥', 'Heavy class', bestTeam.heavyDetails, 'detail-positive')
  html += makeBlock('roles', '🎯', 'Веса ролей', bestTeam.roleDetails, 'detail-positive')
  html += makeBlock('synergies', '🔗', 'Синергии', bestTeam.synergyDetails, 'detail-positive')
  html += makeBlock('tiers', '⭐', 'Тиры', bestTeam.tierDetails)
  html += makeBlock('weaknesses', '⚠️', 'Слабости', bestTeam.weaknessDetails, 'detail-negative')

  if (html === '') {
    html =
      '<div style="padding:8px;color:#666;font-style:italic;font-size:12px;">Нет выраженных преимуществ</div>'
  }

  return html
}

// Диагностика: проверка синергий в команде
function debugTeamSynergies(team, context) {
  const { rowHeaders, graph, rolesMap } = context

  Logger.log('=== ДИАГНОСТИКА СИНЕРГИЙ ===')
  Logger.log(`Команда: ${team.map((idx) => rowHeaders[idx]).join(', ')}`)

  for (let i = 0; i < team.length; i++) {
    const heroIdx = team[i]
    const heroName = rowHeaders[heroIdx]
    const heroRole = rolesMap[heroName] || '?'

    Logger.log(`\n${heroName} (${heroRole}):`)

    for (let j = 0; j < team.length; j++) {
      if (i === j) continue

      const partnerIdx = team[j]
      const partnerName = rowHeaders[partnerIdx]
      const synergy = graph[heroIdx][partnerIdx]

      if (synergy) {
        Logger.log(`  → ${partnerName}: ${synergy.grade} (${synergy.score})`)
      } else {
        Logger.log(`  → ${partnerName}: нет синергии`)
      }
    }
  }
}

// ==========================================
// ОЦЕНКА КОНКРЕТНОЙ КОМАНДЫ (для пересчёта альтернатив)
// ==========================================
function evaluateSpecificTeam(heroNames, myHeroes, enemies, options, bannedHeroes, starredEnemies) {
  try {
    const settings = loadSettings()
    const ss = SpreadsheetApp.getActiveSpreadsheet()

    const opts = Object.assign(
      {
        useSynergies: true,
        useSoloSynergies: true,
        useTiers: true,
        useCounterPicks: true,
        useClassWeights: true,
        useAntiRoleWeights: true,
      },
      options || {}
    )

    // Загружаем матрицу
    const matrixSheet = ss.getSheetByName(settings.MATRIX_SHEET_NAME)
    if (!matrixSheet) return { success: false, error: 'Матрица не найдена' }

    const matrixData = matrixSheet.getDataRange().getValues()
    const matrixRowStart = getMatrixRowStart(matrixData)
    const rowHeaders = matrixData
      .slice(matrixRowStart)
      .map((r) => r[0])
      .filter((n) => n)
      .map((n) => n.toString().trim())
    const headerRowIndex = matrixRowStart > 0 ? matrixRowStart - 1 : 0
    const colHeaders = matrixData[headerRowIndex].slice(1).filter((h) => h)

    // Преобразуем имена в индексы
    const teamIndices = []
    for (const name of heroNames) {
      const idx = rowHeaders.indexOf(name)
      if (idx === -1) return { success: false, error: `Герой "${name}" не найден` }
      teamIndices.push(idx)
    }

    // "Мои" герои
    const myHeroIndices = []
    for (const name of myHeroes || []) {
      const idx = rowHeaders.indexOf(name)
      if (idx !== -1) myHeroIndices.push(idx)
    }

    // Враги
    const enemyIndices = []
    const enemyClassesMap = {}
    for (const name of enemies || []) {
      const idx = rowHeaders.indexOf(name)
      if (idx !== -1) enemyIndices.push(idx)
    }

    // Звёзды
    const starredEnemyIndices = []
    for (const name of starredEnemies || []) {
      const idx = rowHeaders.indexOf(name)
      if (idx !== -1 && enemyIndices.indexOf(idx) !== -1) {
        starredEnemyIndices.push(idx)
      }
    }

    // Загружаем данные (с кэшем — быстро!)
    const rolesMap = readRolesMapCached(settings.ROLES_SHEET_NAME) || {}
    const classesMap = readClassesMapCached(settings.CLASSES_SHEET_NAME) || {}

    if (classesMap) {
      for (const enemyIdx of enemyIndices) {
        const enemyName = rowHeaders[enemyIdx]
        if (classesMap[enemyName]) {
          enemyClassesMap[enemyIdx] = classesMap[enemyName].class
        }
      }
    }

    const TIER_SCORES = {
      S: settings.TIER_S,
      A: settings.TIER_A,
      B: settings.TIER_B,
      C: settings.TIER_C,
      D: settings.TIER_D,
    }
    const heroTiersMap = opts.useTiers
      ? readHeroTiersMapCached(settings.HERO_TIER_SHEET_NAME, TIER_SCORES)
      : {}

    const GRADE_SCORES = {
      S: settings.GRADE_S,
      SA: settings.GRADE_SA,
      A: settings.GRADE_A,
      B: settings.GRADE_B,
    }

    const { graph, soloCapableChars } = buildSynergyGraph(
      rowHeaders,
      colHeaders,
      matrixData,
      matrixRowStart,
      GRADE_SCORES,
      opts.useSoloSynergies
    )

    const localSettings = Object.assign({}, settings, {
      USE_SYNERGIES: opts.useSynergies,
      USE_SOLO_SYNERGIES: opts.useSoloSynergies,
      USE_HERO_TIER: opts.useTiers,
      USE_COUNTER_PICKS: opts.useCounterPicks && settings.USE_COUNTER_PICKS,
      USE_CLASS_WEIGHTS: opts.useClassWeights,
      USE_ANTI_ROLE_WEIGHTS: opts.useAntiRoleWeights,
      MIN_SYNERGIES: 0,
      CLASS_COUNTERS: CLASS_COUNTERS,
    })

    const context = {
      settings: localSettings,
      rowHeaders,
      rolesMap,
      graph,
      soloCapableChars,
      heroTiersMap,
      classesMap,
      mustHaveIndices: [],
      enemyIndices,
      starredEnemyIndices: starredEnemyIndices,
      enemyClassesMap: enemyClassesMap,
      counterPickCache: {},
      GRADE_SCORES,
      myHeroIndices: myHeroIndices,
    }

    // Определяем итоговую композицию
    const roleCounts = { sup: 0, dps: 0, tnk: 0 }
    for (const idx of teamIndices) {
      const role = rolesMap[rowHeaders[idx]]
      if (role && roleCounts.hasOwnProperty(role)) roleCounts[role]++
    }
    const compStr = roleCounts.sup + '-' + roleCounts.dps + '-' + roleCounts.tnk

    // Вес композиции
    const compositionWeightsMap = getCompositionWeights(settings, teamIndices.length)
    const compWeight = compositionWeightsMap[compStr] || 1

    // Оценка
    const result = evaluateTeam(teamIndices, compStr, compWeight, context)

    if (!result) {
      return { success: false, error: 'Команда не прошла проверки синергий' }
    }

    // Добавляем служебные поля
    const mySet = new Set(myHeroIndices)
    result.addedMembers = teamIndices.filter((idx) => !mySet.has(idx)).map((idx) => rowHeaders[idx])
    result.formattedDetails = formatTeamDetails(result)

    return { success: true, ...result }
  } catch (e) {
    Logger.log(`❌ evaluateSpecificTeam: ${e.message}\n${e.stack}`)
    return { success: false, error: e.message }
  }
}
