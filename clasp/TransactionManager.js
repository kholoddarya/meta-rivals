// ==========================================
// ТРАНЗАКЦИОННОЕ СОХРАНЕНИЕ НАСТРОЕК
// ==========================================

const TRANSACTION_KEY = 'TRANSACTION_SNAPSHOT'
const TRANSACTION_TIMEOUT = 30000 // 30 секунд

// ==========================================
// КЛАСС ТРАНЗАКЦИИ
// ==========================================
class SettingsTransaction {
  constructor() {
    this.snapshot = null
    this.transactionId = null
    this.startTime = null
  }

  // Начало транзакции — сохраняем snapshot
  begin() {
    this.transactionId =
      'tx_' + new Date().getTime() + '_' + Math.random().toString(36).substr(2, 9)
    this.startTime = new Date().getTime()

    // Сохраняем текущее состояние как snapshot
    const currentJson = PROPERTIES.getProperty(SETTINGS_KEY)
    this.snapshot = currentJson

    // Сохраняем метаданные транзакции
    const txMeta = {
      id: this.transactionId,
      startTime: this.startTime,
      snapshot: this.snapshot,
    }

    PROPERTIES.setProperty(TRANSACTION_KEY, JSON.stringify(txMeta))
    Logger.log(`🔒 Транзакция начата: ${this.transactionId}`)

    return this.transactionId
  }

  // Фиксация транзакции — сохраняем новые данные и удаляем snapshot
  commit(newSettings) {
    if (!this.transactionId) {
      throw new Error('Транзакция не была начата')
    }

    try {
      const json = JSON.stringify(newSettings)

      // Проверка размера
      if (json.length > 8000) {
        Logger.log(`⚠️ Настройки слишком большие: ${json.length} байт`)
      }

      // Сохраняем новые данные
      PROPERTIES.setProperty(SETTINGS_KEY, json)

      // Удаляем snapshot — транзакция успешна
      PROPERTIES.deleteProperty(TRANSACTION_KEY)

      // Обновляем кэш
      settingsCache = newSettings
      settingsCacheTime = new Date().getTime()

      const duration = new Date().getTime() - this.startTime
      Logger.log(`✅ Транзакция зафиксирована: ${this.transactionId} за ${duration}ms`)

      this.transactionId = null
      this.snapshot = null
      return true
    } catch (e) {
      Logger.log(`❌ Ошибка фиксации: ${e.message}`)
      this.rollback()
      throw e
    }
  }

  // Откат транзакции — восстанавливаем snapshot
  rollback() {
    if (!this.transactionId) {
      Logger.log(`⚠️ Откат: транзакция не активна`)
      return false
    }

    try {
      if (this.snapshot !== null) {
        PROPERTIES.setProperty(SETTINGS_KEY, this.snapshot)
        Logger.log(`🔄 Транзакция откачена: ${this.transactionId}`)
      }

      PROPERTIES.deleteProperty(TRANSACTION_KEY)

      // Сбрасываем кэш
      settingsCache = null
      settingsCacheTime = 0

      this.transactionId = null
      this.snapshot = null
      return true
    } catch (e) {
      Logger.log(`❌ Критическая ошибка отката: ${e.message}`)
      return false
    }
  }
}

// ==========================================
// ФАБРИКА ТРАНЗАКЦИЙ
// ==========================================
function createTransaction() {
  return new SettingsTransaction()
}

// ==========================================
// ПРОВЕРКА И ВОССТАНОВЛЕНИЕ ПОСЛЕ СБОЯ
// ==========================================
function checkAndRecoverTransactions() {
  const txJson = PROPERTIES.getProperty(TRANSACTION_KEY)
  if (!txJson) return

  try {
    const txMeta = JSON.parse(txJson)
    const age = new Date().getTime() - txMeta.startTime

    // Если транзакция зависла (старше timeout) — восстанавливаем snapshot
    if (age > TRANSACTION_TIMEOUT) {
      Logger.log(`⚠️ Обнаружена зависшая транзакция: ${txMeta.id} (возраст: ${age}ms)`)

      if (txMeta.snapshot !== null) {
        PROPERTIES.setProperty(SETTINGS_KEY, txMeta.snapshot)
        Logger.log(`🔄 Восстановлены настройки из snapshot`)
      }

      PROPERTIES.deleteProperty(TRANSACTION_KEY)

      // Сбрасываем кэш
      settingsCache = null
      settingsCacheTime = 0
    }
  } catch (e) {
    Logger.log(`❌ Ошибка проверки транзакций: ${e.message}`)
    PROPERTIES.deleteProperty(TRANSACTION_KEY)
  }
}

// ==========================================
// ОБЁРТКА ДЛЯ ТРАНЗАКЦИОННОГО СОХРАНЕНИЯ
// ==========================================
function saveSettingsTransactional(settings, silent = false) {
  const tx = createTransaction()

  try {
    tx.begin()

    // Валидация перед сохранением
    const validationErrors = validateSettings(settings)
    if (validationErrors.length > 0) {
      // Подробное логирование для отладки
      Logger.log(`⚠️ Отмена транзакции: невалидные настройки`)
      Logger.log(`Ошибки валидации: ${validationErrors.join('; ')}`)
      Logger.log(
        `Текущие значения: TEAM_SIZE=${settings.TEAM_SIZE}, MAX_RESULTS=${settings.MAX_RESULTS}, MIN_SYNERGIES=${settings.MIN_SYNERGIES}`
      )
      tx.rollback()
      return false
    }

    settings.VERSION = SETTINGS_VERSION
    tx.commit(settings)

    if (!silent) {
      Logger.log(`✅ Настройки сохранены транзакционно`)
    }

    return true
  } catch (e) {
    Logger.log(`❌ Ошибка транзакции: ${e.message}`)
    try {
      tx.rollback()
    } catch (rollbackError) {
      Logger.log(`❌ Критическая ошибка отката: ${rollbackError.message}`)
    }
    return false
  }
}
