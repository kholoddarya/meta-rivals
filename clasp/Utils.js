// ==========================================
// УТИЛИТЫ — ОБЩИЕ ФУНКЦИИ
// ==========================================

// Константы проекта
const CONSTANTS = {
  MAX_ENEMIES: 6,
  MAX_MY_HEROES: 5,
  MAX_PER_ROLE: 3,
  MAX_FLX: 3,
  MAX_TOTAL_ROLES: 6,
  MAX_RESULTS: 50,
  MAX_TOP_DISPLAY: 10,
  MAX_ITERATIONS_PER_DIST: 50000,
  TIMEOUT_MS: 240000, // 4 минуты
  CACHE_TTL_MS: 7 * 24 * 60 * 60 * 1000, // 7 дней
  HEAVY_CLASS_THRESHOLD: 0.67,
  ICON_CACHE_MAX_SIZE: 50000,
}

// Безопасный парсер чисел
function safeInt(value, defaultValue) {
  const parsed = parseInt(value)
  return isNaN(parsed) ? defaultValue : parsed
}

// Безопасный парсер булевых
function safeBool(value, defaultValue) {
  if (value === undefined || value === null) return defaultValue
  return value === true || value === 'true' || value === 1
}

// Экранирование HTML (единая функция)
function escapeHtml(text) {
  if (text === null || text === undefined) return ''
  return text
    .toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Иконка роли
function getRoleIcon(role) {
  const icons = { sup: '✚', dps: '⚔️', tnk: '🛡️' }
  return icons[role] || ''
}

// Инициалы героя
function getInitials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

// Цвет по классу
function getClassColor(heroClass) {
  const colors = {
    Dive: '#c2185b',
    Poke: '#1976d2',
    Brawl: '#388e3c',
    'Anti-Dive': '#7b1fa2',
    'Anti-Poke': '#f57c00',
    'Anti-Brawl': '#d32f2f',
  }
  return colors[heroClass] || '#757575'
}

// Логгер с уровнями
const Log = {
  info: (msg) => Logger.log(`✅ ${msg}`),
  warn: (msg) => Logger.log(`⚠️ ${msg}`),
  error: (msg) => Logger.log(`❌ ${msg}`),
  debug: (msg) => {
    if (DEBUG_MODE) Logger.log(`🔍 ${msg}`)
  },
}

// Валидатор значений
const Validator = {
  range: (value, min, max, field) => {
    if (value < min || value > max) {
      throw new Error(`${field} должен быть от ${min} до ${max}, получено: ${value}`)
    }
    return value
  },
  notEmpty: (value, field) => {
    if (!value || (Array.isArray(value) && value.length === 0)) {
      throw new Error(`${field} не может быть пустым`)
    }
    return value
  },
  isString: (value, field) => {
    if (typeof value !== 'string') {
      throw new Error(`${field} должен быть строкой`)
    }
    return value
  },
}

// Кэш в памяти (для сессии)
const MemoryCache = {
  _cache: {},
  get: (key) => MemoryCache._cache[key],
  set: (key, value) => {
    MemoryCache._cache[key] = value
  },
  clear: () => {
    MemoryCache._cache = {}
  },
}

// Обёртка для безопасного выполнения
function safeExecute(fn, errorMessage) {
  try {
    return fn()
  } catch (e) {
    Log.error(`${errorMessage}: ${e.message}`)
    return null
  }
}
