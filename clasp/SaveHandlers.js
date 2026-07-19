// 🆕 Централизованная функция обновления времени
function updateLastSettingsChangeTime() {
  const settings = loadSettings();
  settings.LAST_SETTINGS_CHANGE_TIME = new Date().getTime();
  return saveSettings(settings);
}

function updateLastGenerationTime() {
  const settings = loadSettings();
  settings.LAST_GENERATION_TIME = new Date().getTime();
  return saveSettings(settings);
}

// 🆕 Валидация входных данных
function validateInput(data, requiredFields) {
  const errors = [];
  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null) {
      errors.push(`Отсутствует обязательное поле: ${field}`);
    }
  }
  return errors;
}

function saveMainSettingsData(data) {
  // 🆕 Валидация входных данных
  const validationErrors = validateInput(data, ['TEAM_SIZE', 'MIN_SYNERGIES', 'MAX_RESULTS']);
  if (validationErrors.length > 0) {
    Logger.log(`❌ Ошибка валидации: ${validationErrors.join('; ')}`);
    return false;
  }
  
  const settings = loadSettings();
  const oldTeamSize = settings.TEAM_SIZE;
  
  for (const key in data) {
    if (data[key] !== undefined && data[key] !== null) {
      settings[key] = data[key];
    }
  }
  
  if (data.TEAM_SIZE !== undefined && data.TEAM_SIZE !== oldTeamSize) {
    const preset = settings.ROLE_PRESETS ? settings.ROLE_PRESETS[data.TEAM_SIZE] : null;
    if (preset && Array.isArray(preset) && preset.length > 0) {
      settings.PENDING_PRESET = preset;
    } else {
      settings.PENDING_PRESET = null;
    }
  }
  
  if (!saveSettings(settings)) return false;
  updateLastSettingsChangeTime();
  return true;
}

function saveCompositionsData(data) {
  const settings = loadSettings();
  let compositions;
  
  if (typeof data === 'string') {
    compositions = data.split('\n').map(s => s.trim()).filter(s => s);
  } else if (data && data.compositions) {
    compositions = data.compositions;
  } else {
    compositions = [];
  }
  
  // 🆕 Валидация раскладок
  for (const comp of compositions) {
    const parts = comp.split('-').map(n => parseInt(n.trim()));
    if (parts.length !== 3 || parts.some(isNaN)) {
      Logger.log(`⚠️ Невалидная раскладка: ${comp}`);
      return false;
    }
  }
  
  settings.ROLE_COMPOSITIONS = compositions;
  if (!settings.ROLE_PRESETS) settings.ROLE_PRESETS = {};
  settings.ROLE_PRESETS[settings.TEAM_SIZE] = compositions;
  
  if (!saveSettings(settings)) return false;
  updateLastSettingsChangeTime();
  return true;
}

function saveMustHaveData(data) {
  const settings = loadSettings();
  
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    settings.MUST_HAVE_HEROES = Array.isArray(data.heroes) ? data.heroes : [];
    settings.MUST_HAVE_SYNERGY = data.requireSynergy === true;
    
    if (data.compositions && Array.isArray(data.compositions)) {
      settings.ROLE_COMPOSITIONS = data.compositions;
      if (!settings.ROLE_PRESETS) settings.ROLE_PRESETS = {};
      settings.ROLE_PRESETS[settings.TEAM_SIZE] = data.compositions;
    }
  } else {
    settings.MUST_HAVE_HEROES = Array.isArray(data) ? data : [];
  }
  
  // 🆕 Валидация количества обязательных героев
  if (settings.MUST_HAVE_HEROES.length > 5) {
    Logger.log(`⚠️ Слишком много обязательных героев: ${settings.MUST_HAVE_HEROES.length}`);
    settings.MUST_HAVE_HEROES = settings.MUST_HAVE_HEROES.slice(0, 5);
  }
  
  if (!saveSettings(settings)) return false;
  updateLastSettingsChangeTime();
  return true;
}

function saveWeightsData(data) {
  const settings = loadSettings();
  
  // Основные веса
  const weightFields = ['GRADE_S', 'GRADE_SA', 'GRADE_A', 'GRADE_B', 
                        'TIER_S', 'TIER_A', 'TIER_B', 'TIER_C', 'TIER_D'];
  
  for (const field of weightFields) {
    if (data[field] !== undefined) {
      const val = parseInt(data[field]);
      if (isNaN(val) || val < 0 || val > 100) {
        Logger.log(`⚠️ Невалидный вес ${field}: ${data[field]}, используем 0`);
        settings[field] = 0;
      } else {
        settings[field] = val;
      }
    }
  }
  
  // Веса классов
  if (data.CLASS_WEIGHTS && typeof data.CLASS_WEIGHTS === 'object') {
    settings.CLASS_WEIGHTS = {
      "Dive": parseInt(data.CLASS_WEIGHTS.Dive) || 0,
      "Poke": parseInt(data.CLASS_WEIGHTS.Poke) || 0,
      "Brawl": parseInt(data.CLASS_WEIGHTS.Brawl) || 0
    };
  }
  
  // Веса анти-ролей
  if (data.ANTI_ROLE_WEIGHTS && typeof data.ANTI_ROLE_WEIGHTS === 'object') {
    settings.ANTI_ROLE_WEIGHTS = {
      "Anti-Dive": parseInt(data.ANTI_ROLE_WEIGHTS['Anti-Dive']) || 0,
      "Anti-Poke": parseInt(data.ANTI_ROLE_WEIGHTS['Anti-Poke']) || 0,
      "Anti-Brawl": parseInt(data.ANTI_ROLE_WEIGHTS['Anti-Brawl']) || 0
    };
  }
  
  // 🆕 Веса ролей
  if (data.ROLE_WEIGHTS && typeof data.ROLE_WEIGHTS === 'object') {
    settings.ROLE_WEIGHTS = {
      "sup": parseInt(data.ROLE_WEIGHTS.sup) || 0,
      "dps": parseInt(data.ROLE_WEIGHTS.dps) || 0,
      "tnk": parseInt(data.ROLE_WEIGHTS.tnk) || 0
    };
  }
  
  // 🆕 Heavy class бонус
  if (data.USE_HEAVY_CLASS !== undefined) {
    settings.USE_HEAVY_CLASS = data.USE_HEAVY_CLASS === true;
  }
  if (data.HEAVY_CLASS_BONUS !== undefined) {
    const val = parseInt(data.HEAVY_CLASS_BONUS);
    if (!isNaN(val) && val >= 0 && val <= 100) {
      settings.HEAVY_CLASS_BONUS = val;
    }
  }
  
  if (!saveSettings(settings)) return false;
  updateLastSettingsChangeTime();
  return true;
}

function saveServiceSheetsData(data) {
  const settings = loadSettings();
  
  // 🆕 Валидация имён листов
  const sheetNames = [];
  for (const key in data) {
    if (data[key] !== undefined && data[key] !== null && data[key] !== '') {
      const name = data[key].toString().trim();
      if (name.length === 0 || name.length > 100) {
        Logger.log(`⚠️ Невалидное имя листа: ${name}`);
        return false;
      }
      settings[key] = name;
      sheetNames.push(name);
    }
  }
  
  // 🆕 Проверка на дубликаты
  const uniqueNames = new Set(sheetNames);
  if (uniqueNames.size !== sheetNames.length) {
    Logger.log(`⚠️ Обнаружены дубликаты имён листов`);
    return false;
  }
  
  if (!saveSettings(settings)) return false;
  updateLastSettingsChangeTime();
  return true;
}

function saveCounterPickData(data) {
  const settings = loadSettings();
  
  if (data && typeof data === 'object') {
    if (data.sheetName) settings.COUNTER_RESULT_SHEET_NAME = data.sheetName;
    
    if (data.sup !== undefined && data.dps !== undefined && data.tnk !== undefined) {
      const total = data.sup + data.dps + data.tnk;
      
      // 🆕 Валидация состава
      if (total < 1 || total > 6) {
        Logger.log(`⚠️ Невалидный состав команды: ${total}`);
        return false;
      }
      
      settings.COUNTER_ROLE_COMPOSITION = {
        sup: data.sup,
        dps: data.dps,
        tnk: data.tnk
      };
    }
    
    if (data.enemies) {
      settings.ENEMY_COMPOSITION = Array.isArray(data.enemies) ? data.enemies : [];
      
      // 🆕 Валидация количества врагов
      if (settings.ENEMY_COMPOSITION.length > 6) {
        Logger.log(`⚠️ Слишком много врагов: ${settings.ENEMY_COMPOSITION.length}`);
        settings.ENEMY_COMPOSITION = settings.ENEMY_COMPOSITION.slice(0, 6);
      }
    }
    
    if (data.useCounter !== undefined) {
      settings.USE_COUNTER_PICKS = data.useCounter === true;
    }
    
    settings.GENERATION_MODE = settings.ENEMY_COMPOSITION.length > 0 ? "counter" : "normal";
  }
  
  if (!saveSettings(settings)) return false;
  updateLastSettingsChangeTime();
  return true;
}