// ==========================================
// ГЛОБАЛЬНЫЕ КОНСТАНТЫ И НАСТРОЙКИ ПО УМОЛЧАНИЮ
// ==========================================
const PROPERTIES = PropertiesService.getDocumentProperties();
const SETTINGS_KEY = "ALL_SETTINGS";
const SETTINGS_VERSION = 1; // 🆕 Версия настроек для миграции

const SETTINGS_PAGES = [
  { key: "main", name: "📊 Основные параметры", func: "showMainSettings" },
  { key: "compositions", name: "🎯 Раскладки и обязательные персонажи", func: "showMustHaveHeroes" },
  { key: "weights", name: "⚖️ Веса оценок и тиров", func: "showWeightSettings" },
  { key: "sheets", name: "✏️ Имена служебных листов", func: "showServiceSheetsSettings" },
  { key: "counter", name: "⚔️ Настроить контрпики", func: "showCounterPickSettings" }
];

const DEFAULT_SETTINGS = {
  VERSION: SETTINGS_VERSION,
  TEAM_SIZE: 3,
  MIN_SYNERGIES: 1,
  MAX_RESULTS: 100,
  RESULT_SHEET_NAME: "Team Compositions",
  MATRIX_SHEET_NAME: "FullInfo",
  ROLES_SHEET_NAME: "Roles",
  HERO_TIER_SHEET_NAME: "HeroTier",
  CLASSES_SHEET_NAME: "Classes",
  USE_HERO_TIER: true,
  USE_SOLO_SYNERGIES: true,
  USE_SYNERGIES: true,
  USE_COUNTER_PICKS: true,
  GRADE_S: 4,
  GRADE_SA: 3,
  GRADE_A: 2,
  GRADE_B: 1,
  TIER_S: 5,
  TIER_A: 4,
  TIER_B: 3,
  TIER_C: 2,
  TIER_D: 1,
  COUNTER_PICK_BONUS: 2,
  ANTI_COUNTER_PICK_BONUS: 3,
  WEAK_TO_ENEMY_PENALTY: -1,
  CLASS_WEIGHTS: { "Dive": 0, "Poke": 0, "Brawl": 0 },
  ANTI_ROLE_WEIGHTS: { "Anti-Dive": 0, "Anti-Poke": 0, "Anti-Brawl": 0 },
  ROLE_WEIGHTS: { sup: 1, dps: 3, tnk: 2 },
  USE_HEAVY_CLASS: true,
  HEAVY_CLASS_BONUS: 3,
  ROLE_COMPOSITIONS: ["2-2-2", "1-3-2", "2-3-1"],
  ROLE_PRESETS: {
    "3": ["1-1-1", "2-1-0", "1-2-0"],
    "6": ["2-2-2", "1-3-2", "2-3-1"]
  },
  MUST_HAVE_HEROES: [],
  MUST_HAVE_SYNERGY: true,
  GENERATION_MODE: "normal",
  ENEMY_COMPOSITION: [],
  COUNTER_RESULT_SHEET_NAME: "Counter",
  COUNTER_ROLE_COMPOSITION: { sup: 1, dps: 1, tnk: 1 },
  LAST_GENERATION_TIME: 0,
  LAST_SETTINGS_CHANGE_TIME: 0,
  WIZARD_ACTIVE: false,
  WIZARD_STEP: 0,
  PENDING_PRESET: null,
  WIZARD_FROM_GENERATION: false,
  VISITED_SETTINGS: []
};

const ROLE_COLORS = { "sup": "#90EE90", "dps": "#FFB6C1", "tnk": "#ADD8E6" };

const CLASS_COUNTERS = {
  "Dive": "Poke",
  "Poke": "Brawl",
  "Brawl": "Dive",
  "Anti-Dive": "Dive",
  "Anti-Poke": "Poke",
  "Anti-Brawl": "Brawl"
};

// 🆕 Улучшенный кэш с версионированием
let settingsCache = null;
let settingsCacheTime = 0;
const CACHE_TTL = 2000; // Увеличено до 2 секунд

// 🆕 Валидация настроек
function validateSettings(settings) {
  const errors = [];
  
  // 🆕 Явные проверки вместо !value (которое ломается на 0)
  if (settings.TEAM_SIZE === undefined || settings.TEAM_SIZE === null || 
      settings.TEAM_SIZE < 1 || settings.TEAM_SIZE > 10) {
    errors.push(`TEAM_SIZE должен быть от 1 до 10, получено: ${settings.TEAM_SIZE}`);
  }
  
  if (settings.MAX_RESULTS === undefined || settings.MAX_RESULTS === null || 
      settings.MAX_RESULTS < 1 || settings.MAX_RESULTS > 1000) {
    errors.push(`MAX_RESULTS должен быть от 1 до 1000, получено: ${settings.MAX_RESULTS}`);
  }
  
  // 🆕 Явная проверка на undefined/null вместо !value
  if (settings.MIN_SYNERGIES === undefined || settings.MIN_SYNERGIES === null || 
      settings.MIN_SYNERGIES < 0) {
    errors.push(`MIN_SYNERGIES должен быть ≥ 0, получено: ${settings.MIN_SYNERGIES}`);
  }
  
  return errors;
}

// 🆕 Безопасная загрузка с миграцией версий
function loadSettings() {
  const now = new Date().getTime();
  
  // Используем кэш если он свежий
  if (settingsCache && (now - settingsCacheTime) < CACHE_TTL) {
    return settingsCache;
  }
  
  let settings = Object.assign({}, DEFAULT_SETTINGS);
  const allSettingsJson = PROPERTIES.getProperty(SETTINGS_KEY);
  
  if (allSettingsJson) {
    try {
      const parsed = JSON.parse(allSettingsJson);
      
      // 🆕 Проверка версии и миграция
      if (!parsed.VERSION || parsed.VERSION < SETTINGS_VERSION) {
        Logger.log(`🔄 Миграция настроек с версии ${parsed.VERSION || 0} на ${SETTINGS_VERSION}`);
        // Здесь можно добавить специфичную миграцию для каждой версии
      }
      
      // Merge с дефолтами
      for (const key in DEFAULT_SETTINGS) {
        if (parsed.hasOwnProperty(key)) {
          settings[key] = parsed[key];
        }
      }
      
      // 🆕 Валидация после загрузки
      const validationErrors = validateSettings(settings);
      if (validationErrors.length > 0) {
        Logger.log(`⚠️ Ошибки валидации настроек: ${validationErrors.join('; ')}`);
        // Можно сбросить на дефолты или использовать как есть
      }
      
      settingsCache = settings;
      settingsCacheTime = now;
      return settings;
      
    } catch (e) {
      Logger.log(`❌ Критическая ошибка парсинга настроек: ${e.message}`);
      // Используем дефолты
    }
  }
  
  // 🆕 Миграция со старого формата
  const oldProperties = PROPERTIES.getProperties();
  let migrated = false;
  
  for (const key in DEFAULT_SETTINGS) {
    if (oldProperties.hasOwnProperty(key) && key !== SETTINGS_KEY) {
      try {
        settings[key] = JSON.parse(oldProperties[key]);
        migrated = true;
      } catch (e) {
        settings[key] = oldProperties[key];
        migrated = true;
      }
    }
  }
  
  if (settings.MUST_HAVE_HERO && !settings.MUST_HAVE_HEROES) {
    settings.MUST_HAVE_HEROES = settings.MUST_HAVE_HERO ? [settings.MUST_HAVE_HERO] : [];
    delete settings.MUST_HAVE_HERO;
    migrated = true;
  }
  
  if (migrated) {
    Logger.log(`🔄 Миграция настроек в новый формат...`);
    saveSettings(settings, true);
  }
  
  settingsCache = settings;
  settingsCacheTime = now;
  return settings;
}

// 🆕 Безопасное сохранение через транзакции
function saveSettings(settings, silent = false) {
  return saveSettingsTransactional(settings, silent);
}

// 🆕 Функции управления посещёнными настройками
function getUnvisitedSettings() {
  const settings = loadSettings();
  const visited = new Set(settings.VISITED_SETTINGS || []);
  return SETTINGS_PAGES.filter(page => !visited.has(page.key));
}

function markSettingVisited(settingKey) {
  markSettingVisitedImpl(settingKey);
  return true;
}

function markSettingVisitedImpl(settingKey) {
  if (!settingKey) {
    Logger.log(`⚠️ Попытка пометить невалидный ключ: ${settingKey}`);
    return;
  }
  
  const settings = loadSettings();
  if (!settings.VISITED_SETTINGS) settings.VISITED_SETTINGS = [];
  
  // 🆕 Проверка, что ключ существует в SETTINGS_PAGES
  const pageExists = SETTINGS_PAGES.some(p => p.key === settingKey);
  if (!pageExists) {
    Logger.log(`⚠️ Неизвестный ключ настройки: ${settingKey}`);
    return;
  }
  
  if (!settings.VISITED_SETTINGS.includes(settingKey)) {
    settings.VISITED_SETTINGS.push(settingKey);
    saveSettings(settings);
  }
}

function resetVisitedSettings() {
  const settings = loadSettings();
  settings.VISITED_SETTINGS = [];
  saveSettings(settings);
  Logger.log(`🔄 Сброшен список посещённых настроек`);
}

function getNextUnvisitedSetting() {
  const unvisited = getUnvisitedSettings();
  return unvisited.length > 0 ? unvisited[0] : null;
}

// 🆕 Надёжный вызов страницы настроек
function openPage(pageKey) {
  const page = SETTINGS_PAGES.find(p => p.key === pageKey);
  if (!page) {
    Logger.log(`❌ Неизвестная страница настроек: ${pageKey}`);
    return false;
  }
  
  try {
    this[page.func]();
    return true;
  } catch (e) {
    Logger.log(`❌ Ошибка открытия страницы ${pageKey}: ${e.message}`);
    return false;
  }
}

function cleanupOldProperties() {
  const oldProperties = PROPERTIES.getProperties();
  let deletedCount = 0;
  
  for (const key in oldProperties) {
    if (key !== SETTINGS_KEY && DEFAULT_SETTINGS.hasOwnProperty(key)) {
      PROPERTIES.deleteProperty(key);
      deletedCount++;
    }
  }
  
  Logger.log(`🗑️ Удалено ${deletedCount} старых свойств`);
}