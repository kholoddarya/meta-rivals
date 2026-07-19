// ==========================================
// ЧТЕНИЕ ДАННЫХ ИЗ ЛИСТОВ
// ==========================================

// 🆕 Кэш в памяти для текущей сессии
const _readersCache = {};

// ==========================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ==========================================

function getMatrixRowStart(matrixData) {
  // Ищем строку заголовка (содержит "персонаж", "character", "имя", "name" и т.д.)
  for (let i = 0; i < Math.min(10, matrixData.length); i++) {
    const firstCell = matrixData[i][0];
    if (firstCell && typeof firstCell === 'string') {
      const lower = firstCell.toLowerCase().trim();
      if (lower.includes('персонаж') || lower.includes('character') || 
          lower.includes('имя') || lower.includes('name') ||
          lower.includes('матрица') || lower.includes('matrix') ||
          lower.includes('герой') || lower.includes('hero')) {
        // Возвращаем СЛЕДУЮЩУЮ строку после заголовка
        Logger.log(`📊 Заголовок найден в строке ${i}, первый герой в строке ${i + 1}`);
        return i + 1;
      }
    }
  }
  
  // Если заголовок не найден, предполагаем что данные начинаются с первой строки
  Logger.log(`⚠️ Заголовок не найден, начинаем с строки 0`);
  return 0;
}

// ==========================================
// ЧТЕНИЕ РОЛЕЙ
// ==========================================

function readRolesMap(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    Logger.log(`❌ Лист ролей "${sheetName}" не найден`);
    return null;
  }
  
  const data = sheet.getDataRange().getValues();
  Logger.log(`📊 Лист ролей "${sheetName}": ${data.length} строк`);
  
  const rolesMap = {};
  
  // 🆕 Проверяем, есть ли заголовок в первой строке
  let startRow = 0;
  if (data.length > 0 && data[0][0]) {
    const firstCell = data[0][0].toString().toLowerCase().trim();
    if (firstCell.includes("персонаж") || firstCell.includes("имя") || 
        firstCell.includes("name") || firstCell.includes("hero") ||
        firstCell.includes("роль") || firstCell.includes("role")) {
      // Есть заголовок — начинаем со второй строки
      startRow = 1;
      Logger.log(`  Заголовок найден в строке 0, начинаем с ${startRow}`);
    } else {
      // Нет заголовка — начинаем с первой строки
      Logger.log(`  Заголовка нет, начинаем с ${startRow}. Первая строка: "${data[0][0]}"`);
    }
  }
  
  for (let i = startRow; i < data.length; i++) {
    const name = data[i][0];
    const role = data[i][1];
    
    if (name && role) {
      const nameStr = name.toString().trim();
      const roleStr = role.toString().trim().toLowerCase();
      
      // Проверяем, что роль валидная
      if (['sup', 'dps', 'tnk'].includes(roleStr)) {
        rolesMap[nameStr] = roleStr;
      } else {
        Logger.log(`  ⚠️ Строка ${i}: "${nameStr}" — невалидная роль "${roleStr}"`);
      }
    } else {
      Logger.log(`  ️ Строка ${i}: пустое имя или роль`);
    }
  }
  
  Logger.log(`✅ Загружено ролей: ${Object.keys(rolesMap).length}`);
  if (Object.keys(rolesMap).length > 0) {
    Logger.log(`  Первый герой: "${Object.keys(rolesMap)[0]}" (${rolesMap[Object.keys(rolesMap)[0]]})`);
    Logger.log(`  Последний герой: "${Object.keys(rolesMap)[Object.keys(rolesMap).length - 1]}"`);
  }
  
  return rolesMap;
}

// 🆕 Кэшируемая версия readRolesMap
function readRolesMapCached(sheetName) {
  const cacheKey = 'rolesMap_' + sheetName;
  if (_readersCache[cacheKey]) {
    Logger.log(` Кэш ролей "${sheetName}": HIT`);
    return _readersCache[cacheKey];
  }
  
  Logger.log(`💾 Кэш ролей "${sheetName}": MISS, читаем из таблицы`);
  const result = readRolesMap(sheetName);
  _readersCache[cacheKey] = result;
  return result;
}

// ==========================================
// ЧТЕНИЕ КЛАССОВ
// ==========================================

function readClassesMap(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    Logger.log(`❌ Лист классов "${sheetName}" не найден`);
    return null;
  }
  
  const data = sheet.getDataRange().getValues();
  Logger.log(`📊 Лист классов "${sheetName}": ${data.length} строк`);
  
  const classesMap = {};
  
  // 🆕 Проверяем, есть ли заголовок в первой строке
  let startRow = 0;
  if (data.length > 0 && data[0][0]) {
    const firstCell = data[0][0].toString().toLowerCase().trim();
    if (firstCell.includes("персонаж") || firstCell.includes("имя") || 
        firstCell.includes("name") || firstCell.includes("hero") ||
        firstCell.includes("класс") || firstCell.includes("class")) {
      // Есть заголовок — начинаем со второй строки
      startRow = 1;
      Logger.log(`  Заголовок найден в строке 0, начинаем с ${startRow}`);
    } else {
      // Нет заголовка — начинаем с первой строки
      Logger.log(`  Заголовка нет, начинаем с ${startRow}. Первая строка: "${data[0][0]}"`);
    }
  }
  
  for (let i = startRow; i < data.length; i++) {
    const name = data[i][0];
    const heroClass = data[i][1];
    const counterClass = data[i][2];
    
    if (name && heroClass) {
      const nameStr = name.toString().trim();
      const classStr = heroClass.toString().trim();
      const counterStr = counterClass ? counterClass.toString().trim() : null;
      
      classesMap[nameStr] = {
        class: classStr,
        counter: counterStr
      };
    } else {
      Logger.log(`  ⚠️ Строка ${i}: пустое имя или класс`);
    }
  }
  
  Logger.log(`✅ Загружено классов: ${Object.keys(classesMap).length}`);
  if (Object.keys(classesMap).length > 0) {
    Logger.log(`  Первый герой: "${Object.keys(classesMap)[0]}" (${classesMap[Object.keys(classesMap)[0]].class})`);
    Logger.log(`  Последний герой: "${Object.keys(classesMap)[Object.keys(classesMap).length - 1]}"`);
  }
  
  return classesMap;
}

// 🆕 Кэшируемая версия readClassesMap
function readClassesMapCached(sheetName) {
  const cacheKey = 'classesMap_' + sheetName;
  if (_readersCache[cacheKey]) {
    Logger.log(`💾 Кэш классов "${sheetName}": HIT`);
    return _readersCache[cacheKey];
  }
  
  Logger.log(`💾 Кэш классов "${sheetName}": MISS, читаем из таблицы`);
  const result = readClassesMap(sheetName);
  _readersCache[cacheKey] = result;
  return result;
}

// ==========================================
// ЧТЕНИЕ ТИРОВ
// ==========================================

function readHeroTiersMap(sheetName, tierScores) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    Logger.log(` Лист тиров "${sheetName}" не найден`);
    return {};
  }
  
  const data = sheet.getDataRange().getValues();
  Logger.log(`📊 Лист тиров "${sheetName}": ${data.length} строк`);
  
  const tiersMap = {};
  
  // 🆕 Проверяем, есть ли заголовок в первой строке
  let startRow = 0;
  if (data.length > 0 && data[0][0]) {
    const firstCell = data[0][0].toString().toLowerCase().trim();
    if (firstCell.includes("персонаж") || firstCell.includes("имя") || 
        firstCell.includes("name") || firstCell.includes("hero") ||
        firstCell.includes("тир") || firstCell.includes("tier")) {
      // Есть заголовок — начинаем со второй строки
      startRow = 1;
      Logger.log(`  Заголовок найден в строке 0, начинаем с ${startRow}`);
    } else {
      // Нет заголовка — начинаем с первой строки
      Logger.log(`  Заголовка нет, начинаем с ${startRow}. Первая строка: "${data[0][0]}"`);
    }
  }
  
  for (let i = startRow; i < data.length; i++) {
    const name = data[i][0];
    const tier = data[i][1];
    
    if (name && tier) {
      const nameStr = name.toString().trim();
      const tierStr = tier.toString().trim().toUpperCase();
      
      if (tierScores[tierStr] !== undefined) {
        tiersMap[nameStr] = {
          tier: tierStr,
          score: tierScores[tierStr]
        };
      } else {
        Logger.log(`  ⚠️ Строка ${i}: "${nameStr}" — неизвестный тир "${tierStr}"`);
      }
    } else {
      Logger.log(`  ⚠️ Строка ${i}: пустое имя или тир`);
    }
  }
  
  Logger.log(`✅ Загружено тиров: ${Object.keys(tiersMap).length}`);
  if (Object.keys(tiersMap).length > 0) {
    Logger.log(`  Первый герой: "${Object.keys(tiersMap)[0]}" (${tiersMap[Object.keys(tiersMap)[0]].tier})`);
  }
  
  return tiersMap;
}

// 🆕 Кэшируемая версия readHeroTiersMap
function readHeroTiersMapCached(sheetName, tierScores) {
  const cacheKey = 'tiersMap_' + sheetName + '_' + JSON.stringify(tierScores);
  if (_readersCache[cacheKey]) {
    Logger.log(`💾 Кэш тиров "${sheetName}": HIT`);
    return _readersCache[cacheKey];
  }
  
  Logger.log(`💾 Кэш тиров "${sheetName}": MISS, читаем из таблицы`);
  const result = readHeroTiersMap(sheetName, tierScores);
  _readersCache[cacheKey] = result;
  return result;
}

// 🆕 Очистка кэша (вызывается при изменении настроек)
function clearReadersCache() {
  for (const key in _readersCache) {
    delete _readersCache[key];
  }
  Logger.log('🗑️ Кэш читателей очищен');
}

// ==========================================
// ГРУППИРОВКА И ГРАФ
// ==========================================

function groupCharactersByRole(rowHeaders, rolesMap) {
  const groups = { sup: [], dps: [], tnk: [] };
  
  for (let i = 0; i < rowHeaders.length; i++) {
    const heroName = rowHeaders[i];
    const role = rolesMap[heroName];
    
    if (role && groups.hasOwnProperty(role)) {
      groups[role].push(i);
    }
  }
  
  return groups;
}

function buildSynergyGraph(rowHeaders, colHeaders, matrixData, matrixRowStart, gradeScores, useSoloSynergies) {
  const graph = {};
  const soloCapableChars = new Set();
  
  Logger.log(`🔍 Построение графа: ${rowHeaders.length} героев`);
  if (rowHeaders.length > 0) {
    Logger.log(`  Первый герой: "${rowHeaders[0]}"`);
    if (rowHeaders.length > 1) {
      Logger.log(`  Второй герой: "${rowHeaders[1]}"`);
    }
  }
  
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
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ==========================================

function precomputeCounterPicks(rowHeaders, classesMap, enemyIndices, enemyClassesMap, settings) {
  const cache = {};
  
  if (!classesMap || enemyIndices.length === 0) return cache;
  
  for (let i = 0; i < rowHeaders.length; i++) {
    const heroName = rowHeaders[i];
    if (!classesMap[heroName]) continue;
    
    const myClass = classesMap[heroName].class;
    const myCounter = classesMap[heroName].counter;
    
    cache[i] = {
      counters: [],
      weakTo: []
    };
    
    for (const enemyIdx of enemyIndices) {
      const enemyClass = enemyClassesMap[enemyIdx];
      if (!enemyClass) continue;
      
      if (myCounter && settings.CLASS_COUNTERS && settings.CLASS_COUNTERS[myCounter] === enemyClass) {
        cache[i].counters.push({ enemyIdx, type: 'anti' });
      } else if (myClass && settings.CLASS_COUNTERS && settings.CLASS_COUNTERS[myClass] === enemyClass) {
        cache[i].counters.push({ enemyIdx, type: 'class' });
      } else if (myClass && settings.CLASS_COUNTERS && settings.CLASS_COUNTERS[enemyClass] === myClass) {
        cache[i].weakTo.push(enemyIdx);
      }
    }
  }
  
  return cache;
}

function getCombinations(arr, k) {
  if (k === 0) return [[]];
  if (k > arr.length) return [];
  
  const result = [];
  
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

function insertToTop(topTeams, team, maxResults) {
  topTeams.push(team);
  topTeams.sort((a, b) => b.totalScore - a.totalScore);
  if (topTeams.length > maxResults) {
    topTeams.length = maxResults;
  }
}

// ==========================================
// ГЛАВНАЯ ФУНКЦИЯ ПОЛУЧЕНИЯ ДАННЫХ
// ==========================================

function getHeroesData() {
  const settings = loadSettings();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  Logger.log(`=== getHeroesData ===`);
  
  const matrixSheet = ss.getSheetByName(settings.MATRIX_SHEET_NAME);
  if (!matrixSheet) {
    Logger.log(`❌ Лист "${settings.MATRIX_SHEET_NAME}" не найден`);
    return { heroes: [] };
  }
  
  const matrixData = matrixSheet.getDataRange().getValues();
  Logger.log(`📊 Всего строк в матрице: ${matrixData.length}`);
  
  const matrixRowStart = getMatrixRowStart(matrixData);
  Logger.log(`📊 Начало данных: строка ${matrixRowStart}`);
  
  const EXCLUDED_VALUES = new Set([
    "S", "SA", "A", "B", "N/A", "NA", "N",
    "ПЕРСОНАЖ", "CHARACTER", "ИМЯ", "NAME", "ГЕРОЙ", "HERO",
    "МАТРИЦА", "MATRIX", "СИНЕРГИЯ", "SYNERGY", "СИНЕРГИИ", "SYNERGIES",
    "ТИР", "TIER", "РАНГ", "RANK", "ОЦЕНКА", "RATING",
    "", "0", "-", "—"
  ]);
  
  // 🆕 Логируем первые несколько строк для отладки
  for (let i = matrixRowStart; i < Math.min(matrixRowStart + 5, matrixData.length); i++) {
    const cellValue = matrixData[i][0];
    Logger.log(`  Строка ${i}: "${cellValue}"`);
  }
  
  const heroNames = matrixData.slice(matrixRowStart)
    .map((row, idx) => {
      const name = row[0];
      // Logger.log(`  [${idx}] name="${name}", type=${typeof name}`);
      return name;
    })
    .filter(n => {
      if (n === null || n === undefined || n === "") {
        // Logger.log(`  ❌ Пропущено: null/undefined/пусто`);
        return false;
      }
      if (typeof n === "number") {
        // Logger.log(`  ❌ Пропущено: число ${n}`);
        return false;
      }
      const str = n.toString().trim().toUpperCase();
      if (str === "" || EXCLUDED_VALUES.has(str)) {
        // Logger.log(`  ❌ Пропущено: "${str}" в excluded`);
        return false;
      }
      return true;
    })
    .map(n => n.toString().trim());
  
  Logger.log(`✅ Найдено ${heroNames.length} имён героев: ${heroNames.slice(0, 10).join(', ')}${heroNames.length > 10 ? '...' : ''}`);
  
  // 🆕 Используем кэшируемые версии
  const rolesMap = readRolesMapCached(settings.ROLES_SHEET_NAME) || {};
  const classesMap = readClassesMapCached(settings.CLASSES_SHEET_NAME) || {};
  
  Logger.log(` Ролей загружено: ${Object.keys(rolesMap).length}`);
  Logger.log(` Классов загружено: ${Object.keys(classesMap).length}`);
  
  // 🆕 Проверяем первого героя
  if (heroNames.length > 0) {
    const firstHero = heroNames[0];
    Logger.log(` Проверка первого героя "${firstHero}":`);
    Logger.log(`  - Есть в rolesMap: ${rolesMap[firstHero] ? 'ДА (' + rolesMap[firstHero] + ')' : 'НЕТ'}`);
    Logger.log(`  - Есть в classesMap: ${classesMap[firstHero] ? 'ДА' : 'НЕТ'}`);
  }
  
  const heroes = [];
  for (const name of heroNames) {
    const role = rolesMap[name] || null;
    if (!role) {
      Logger.log(`  ⚠️ У героя "${name}" не найдена роль`);
      continue;
    }
    
    const classData = classesMap[name] || {};
    heroes.push({
      name: name,
      role: role,
      class: classData.class || null,
      counter: classData.counter || null
    });
  }
  
  Logger.log(`✅ Загружено ${heroes.length} героев`);
  if (heroes.length > 0) {
    Logger.log(`  ПЕРВЫЙ В СПИСКЕ: "${heroes[0].name}" (${heroes[0].role})`);
    Logger.log(`  ПОСЛЕДНИЙ В СПИСКЕ: "${heroes[heroes.length - 1].name}"`);
  }
  
  return { heroes: heroes };
}

// ==========================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ HEROES
// ==========================================

function getHeroList() {
  const settings = loadSettings();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  const matrixSheet = ss.getSheetByName(settings.MATRIX_SHEET_NAME);
  if (!matrixSheet) return [];
  
  const matrixData = matrixSheet.getDataRange().getValues();
  const matrixRowStart = getMatrixRowStart(matrixData);
  
  const EXCLUDED_VALUES = new Set([
    "S", "SA", "A", "B", "N/A", "NA", "N",
    "ПЕРСОНАЖ", "CHARACTER", "ИМЯ", "NAME", "ГЕРОЙ", "HERO",
    "МАТРИЦА", "MATRIX", "СИНЕРГИЯ", "SYNERGY", "СИНЕРГИИ", "SYNERGIES",
    "ТИР", "TIER", "РАНГ", "RANK", "ОЦЕНКА", "RATING",
    "", "0", "-", "—"
  ]);
  
  return matrixData.slice(matrixRowStart)
    .map(row => row[0])
    .filter(n => {
      if (n === null || n === undefined || n === "") return false;
      if (typeof n === "number") return false;
      const str = n.toString().trim().toUpperCase();
      return !EXCLUDED_VALUES.has(str);
    })
    .map(n => n.toString().trim());
}

function getHeroRole(heroName) {
  const settings = loadSettings();
  const rolesMap = readRolesMapCached(settings.ROLES_SHEET_NAME);
  return rolesMap ? (rolesMap[heroName] || null) : null;
}

function getHeroesRoles(heroNames) {
  if (!heroNames || !Array.isArray(heroNames) || heroNames.length === 0) return {};
  
  const settings = loadSettings();
  const rolesMap = readRolesMapCached(settings.ROLES_SHEET_NAME);
  if (!rolesMap) return {};
  
  const result = {};
  for (const name of heroNames) {
    result[name] = rolesMap[name] || null;
  }
  return result;
}