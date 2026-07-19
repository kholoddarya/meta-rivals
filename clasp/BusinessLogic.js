// ==========================================
// БИЗНЕС-ЛОГИКА — ЧИСТЫЕ ФУНКЦИИ БЕЗ UI
// ==========================================

// ==========================================
// ПОСТРОЕНИЕ ГРАФА СИНЕРГИЙ
// ==========================================
function buildSynergyGraph(rowHeaders, colHeaders, matrixData, matrixRowStart, gradeScores, useSoloSynergies) {
  const graph = {};
  const soloCapableChars = new Set();
  
  Logger.log(`🔍 Построение графа: ${rowHeaders.length} героев`);
  
  for (let i = 0; i < rowHeaders.length; i++) {
    const charName = rowHeaders[i];
    graph[i] = {};
    
    // Проверяем, что строка существует
    const rowIndex = matrixRowStart + i;
    if (rowIndex >= matrixData.length) {
      Logger.log(`⚠️ Строка ${i} (${charName}) выходит за пределы матрицы`);
      continue;
    }
    
    const row = matrixData[rowIndex];
    
    for (let j = 0; j < colHeaders.length; j++) {
      const partnerName = colHeaders[j];
      const partnerIdx = rowHeaders.indexOf(partnerName);
      
      // 🆕 Строгая проверка
      if (partnerIdx === -1) {
        Logger.log(`⚠️ Партнёр "${partnerName}" не найден в rowHeaders`);
        continue;
      }
      
      if (partnerIdx === i) {
        // Пропускаем синергию с самим собой
        continue;
      }
      
      // Проверяем, что ячейка существует
      const cellIndex = j + 1;  // +1 потому что первая колонка — имена
      if (cellIndex >= row.length) {
        Logger.log(`⚠️ Ячейка ${cellIndex} для ${charName}→${partnerName} выходит за пределы строки`);
        continue;
      }
      
      const cellValue = row[cellIndex];
      if (!cellValue || cellValue === "" || cellValue === "N/A" || cellValue === "-") {
        continue;
      }
      
      const grade = cellValue.toString().trim().toUpperCase();
      
      if (gradeScores[grade] !== undefined) {
        graph[i][partnerIdx] = {
          grade: grade,
          score: gradeScores[grade]
        };
        // Logger.log(`✅ ${charName} → ${partnerName}: ${grade}`);
      }
      
      if (useSoloSynergies && grade === "S") {
        soloCapableChars.add(i);
      }
    }
  }
  
  Logger.log(`✅ Построен граф: ${Object.keys(graph).length} узлов`);
  return { graph, soloCapableChars };
}

// ==========================================
// ГРУППИРОВКА ПЕРСОНАЖЕЙ ПО РОЛЯМ
// ==========================================
function groupCharactersByRole(rowHeaders, rolesMap) {
  const charactersByRole = { sup: [], dps: [], tnk: [] };
  
  for (let i = 0; i < rowHeaders.length; i++) {
    const name = rowHeaders[i];
    const role = rolesMap[name];
    if (role && charactersByRole[role]) {
      charactersByRole[role].push(i);
    }
  }
  
  return charactersByRole;
}

// ==========================================
// ПРЕДВЫЧИСЛЕНИЕ КОНТРПИКОВ
// ==========================================
function precomputeCounterPicks(rowHeaders, classesMap, enemyIndices, enemyClassesMap, settings) {
  const cache = {};
  
  if (!settings.USE_COUNTER_PICKS || !classesMap || enemyIndices.length === 0) {
    return cache;
  }
  
  for (let i = 0; i < rowHeaders.length; i++) {
    const charName = rowHeaders[i];
    if (!classesMap[charName]) continue;
    
    const myClass = classesMap[charName].class;
    const myCounter = classesMap[charName].counter;
    let score = 0;
    
    for (let e = 0; e < enemyIndices.length; e++) {
      const enemyIdx = enemyIndices[e];
      const enemyClass = enemyClassesMap[enemyIdx];
      if (!enemyClass) continue;
      
      if (myCounter && CLASS_COUNTERS[myCounter] === enemyClass) {
        score += settings.ANTI_COUNTER_PICK_BONUS;
      } else if (CLASS_COUNTERS[myClass] === enemyClass) {
        score += settings.COUNTER_PICK_BONUS;
      } else if (CLASS_COUNTERS[enemyClass] === myClass) {
        score += settings.WEAK_TO_ENEMY_PENALTY;
      }
    }
    
    cache[i] = score;
  }
  
  return cache;
}

// ==========================================
// ВАЛИДАЦИЯ РАСКЛАДОК
// ==========================================
function validateRoleCompositions(compositions, teamSize) {
  const valid = [];
  const errors = [];
  
  for (let i = 0; i < compositions.length; i++) {
    const str = compositions[i];
    const parts = str.split("-").map(n => parseInt(n.trim()));
    
    if (parts.length !== 3 || parts.some(isNaN)) {
      errors.push(`Неверный формат: "${str}"`);
      continue;
    }
    
    const comp = { sup: parts[0], dps: parts[1], tnk: parts[2] };
    if (comp.sup + comp.dps + comp.tnk !== teamSize) {
      errors.push(`Сумма ${comp.sup + comp.dps + comp.tnk} ≠ ${teamSize} для "${str}"`);
      continue;
    }
    
    comp.weight = compositions.length - i;
    valid.push(comp);
  }
  
  return { valid, errors };
}

// ==========================================
// ВАЛИДАЦИЯ ОБЯЗАТЕЛЬНЫХ ПЕРСОНАЖЕЙ
// ==========================================
function validateMustHaveHeroes(heroes, rowHeaders) {
  const indices = [];
  const missing = [];
  
  for (let i = 0; i < heroes.length; i++) {
    const hero = heroes[i];
    const idx = rowHeaders.indexOf(hero);
    if (idx === -1) {
      missing.push(hero);
    } else {
      indices.push(idx);
    }
  }
  
  return { indices, missing };
}

// ==========================================
// ВАЛИДАЦИЯ ВРАЖЕСКОЙ КОМПОЗИЦИИ
// ==========================================
function validateEnemyComposition(enemies, rowHeaders, classesMap) {
  const indices = [];
  const missing = [];
  const enemyClassesMap = {};
  
  for (let i = 0; i < enemies.length; i++) {
    const enemy = enemies[i];
    const idx = rowHeaders.indexOf(enemy);
    if (idx === -1) {
      missing.push(enemy);
    } else {
      indices.push(idx);
      if (classesMap && classesMap[enemy]) {
        enemyClassesMap[idx] = classesMap[enemy].class;
      }
    }
  }
  
  return { indices, missing, enemyClassesMap };
}

// ==========================================
// ГЕНЕРАЦИЯ КОМБИНАЦИЙ
// ==========================================
function getCombinations(arr, k) {
  const result = [];
  if (k === 0) return [[]];
  if (k > arr.length) return [];
  
  function combine(start, current) {
    if (current.length === k) { 
      result.push([...current]); 
      return; 
    }
    for (let i = start; i < arr.length; i++) {
      current.push(arr[i]); 
      combine(i + 1, current); 
      current.pop();
    }
  }
  
  combine(0, []);
  return result;
}

// ==========================================
// ВСТАВКА В ТОП С СОХРАНЕНИЕМ СОРТИРОВКИ
// ==========================================
function insertToTop(topTeams, teamData, maxResults) {
  let inserted = false;
  for (let i = 0; i < topTeams.length; i++) {
    const current = topTeams[i];
    if (teamData.totalScore > current.totalScore ||
        (teamData.totalScore === current.totalScore && teamData.synergyCount > current.synergyCount) ||
        (teamData.totalScore === current.totalScore && teamData.synergyCount === current.synergyCount && teamData.minScore > current.minScore)) {
      topTeams.splice(i, 0, teamData);
      inserted = true; 
      break;
    }
  }
  if (!inserted && topTeams.length < maxResults) {
    topTeams.push(teamData);
  }
  if (topTeams.length > maxResults) {
    topTeams.pop();
  }
}

// ==========================================
// РАСЧЁТ ВЕРХНЕЙ ГРАНИЦЫ ОЦЕНКИ (для отсечения)
// ==========================================
function calculateUpperBound(team, soloCapableChars, GRADE_SCORES) {
  let maxPossible = 0;
  for (let i = 0; i < team.length; i++) {
    if (soloCapableChars.has(team[i])) {
      maxPossible += GRADE_SCORES["SA"];
    } else {
      maxPossible += GRADE_SCORES["S"];
    }
  }
  return maxPossible;
}

// ==========================================
// ФОРМИРОВАНИЕ ИМЕНИ ЛИСТА РЕЗУЛЬТАТА
// ==========================================
function buildResultSheetName(settings) {
  if (settings.GENERATION_MODE === "counter") {
    return settings.COUNTER_RESULT_SHEET_NAME || "Counter";
  }
  
  if (settings.MUST_HAVE_HEROES.length > 0) {
    return settings.MUST_HAVE_HEROES.map(h => h.substring(0, 2)).join("");
  }
  
  return settings.RESULT_SHEET_NAME;
}

// ==========================================
// ФОРМИРОВАНИЕ РАСКЛАДОК ДЛЯ ГЕНЕРАЦИИ
// ==========================================
function buildCompositionsToGenerate(settings) {
  if (settings.GENERATION_MODE === "counter") {
    const cc = settings.COUNTER_ROLE_COMPOSITION;
    const totalSize = cc.sup + cc.dps + cc.tnk;
    return [{
      sup: cc.sup,
      dps: cc.dps,
      tnk: cc.tnk,
      weight: 1,
      totalSize: totalSize
    }];
  }
  
  return settings.ROLE_COMPOSITIONS.map((str, index) => {
    const parts = str.split("-").map(n => parseInt(n.trim()));
    if (parts.length !== 3 || parts.some(isNaN)) return null;
    const comp = { sup: parts[0], dps: parts[1], tnk: parts[2] };
    if (comp.sup + comp.dps + comp.tnk !== settings.TEAM_SIZE) return null;
    comp.weight = settings.ROLE_COMPOSITIONS.length - index;
    return comp;
  }).filter(c => c !== null);
}

// ==========================================
// ПОЛНАЯ ФУНКЦИЯ evaluateTeam (см. пункт 1)
// ==========================================
// (функция evaluateTeam остаётся здесь или в Generator.gs — 
//  в зависимости от предпочтений; для чистоты рекомендую оставить в BusinessLogic.gs)