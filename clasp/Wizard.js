// ==========================================
// МАСТЕР НАСТРОЕК — ПОСЛЕДОВАТЕЛЬНОЕ ПРОХОЖДЕНИЕ
// ==========================================

// Запуск мастера — сбрасывает список посещённых и открывает первую страницу
function startSettingsWizard() {
  resetVisitedSettings()
  const settings = loadSettings()
  settings.WIZARD_ACTIVE = true
  settings.WIZARD_STEP = 0
  settings.PENDING_PRESET = null
  saveSettings(settings)

  Logger.log(`🧙 Запуск мастера настроек`)

  // Открываем первую страницу
  openPage(SETTINGS_PAGES[0].key)
}

// Пометить текущую настройку как пройденную (вызывается из диалогов)
function finishCurrentSetting(currentKey) {
  Logger.log(`📝 Помечаем настройку как пройденную: ${currentKey}`)
  if (currentKey) {
    markSettingVisitedImpl(currentKey)
  }
  return true
}

// Открыть следующую непройденную настройку ПОСЛЕ текущей
function openNextUnvisitedSetting(currentKey) {
  const settings = loadSettings()

  // Логика пресета — только при переходе от "main"
  if (currentKey === 'main' && settings.PENDING_PRESET && settings.PENDING_PRESET.length > 0) {
    const preset = settings.PENDING_PRESET
    const newSize = settings.TEAM_SIZE

    settings.PENDING_PRESET = null
    saveSettings(settings)

    const ui = SpreadsheetApp.getUi()
    const response = ui.alert(
      '🔄 Найден пресет раскладок',
      `Для размера команды ${newSize} найден сохранённый пресет:\n\n` +
        `  ${preset.join(', ')}\n\n` +
        `Применить этот пресет?`,
      ui.ButtonSet.YES_NO
    )

    if (response === ui.Button.YES) {
      const s = loadSettings()
      s.ROLE_COMPOSITIONS = preset
      if (!s.ROLE_PRESETS) s.ROLE_PRESETS = {}
      s.ROLE_PRESETS[newSize] = preset
      saveSettings(s)
      Logger.log(`✅ Пресет применён: ${preset.join(', ')}`)
    } else {
      Logger.log(`⏭️ Пресет отклонён пользователем`)
    }
  }

  // Перечитываем настройки после возможного применения пресета
  const freshSettings = loadSettings()
  const visited = new Set(freshSettings.VISITED_SETTINGS || [])

  Logger.log(`🔍 Ищем следующую настройку после: ${currentKey}`)
  Logger.log(`📋 Посещённые: ${Array.from(visited).join(', ')}`)

  // Ищем следующую непройденную настройку ПОСЛЕ currentKey
  let foundCurrent = false
  for (let i = 0; i < SETTINGS_PAGES.length; i++) {
    const page = SETTINGS_PAGES[i]
    if (page.key === currentKey) {
      foundCurrent = true
      continue
    }
    if (foundCurrent && !visited.has(page.key)) {
      Logger.log(`✅ Найдена следующая настройка: ${page.key} (${page.name})`)
      openPage(page.key)
      return true
    }
  }

  // Если не нашли после currentKey — ищем с начала (циклически)
  Logger.log(`⤴️ Не найдено после ${currentKey}, ищем с начала`)
  for (let i = 0; i < SETTINGS_PAGES.length; i++) {
    const page = SETTINGS_PAGES[i]
    if (!visited.has(page.key)) {
      Logger.log(`✅ Найдена настройка с начала: ${page.key} (${page.name})`)
      openPage(page.key)
      return true
    }
  }

  // Все настройки пройдены
  Logger.log(`✅ Все настройки пройдены`)
  SpreadsheetApp.getUi().alert('✅ Все настройки пройдены!\n\nЗапустите генерацию через меню.')
  return true
}

// Завершить текущую настройку и запустить генерацию
function finishSettingsAndGenerate(currentKey) {
  Logger.log(`🏁 Завершаем настройки и запускаем генерацию (текущая: ${currentKey})`)
  if (currentKey) {
    markSettingVisitedImpl(currentKey)
  }
  resetVisitedSettings()
  startGenerationAfterSettings()
  return true
}

// Запуск генерации после настроек
function startGenerationAfterSettings() {
  resetVisitedSettings()
  updateLastGenerationTime()
  showGenerationProgress()
  return true
}

// Обновление времени последнего изменения настроек
function updateLastSettingsChangeTime() {
  const settings = loadSettings()
  settings.LAST_SETTINGS_CHANGE_TIME = new Date().getTime()
  saveSettings(settings)
}

// Обновление времени последнего запуска генерации
function updateLastGenerationTime() {
  const settings = loadSettings()
  settings.LAST_GENERATION_TIME = new Date().getTime()
  saveSettings(settings)
}

// Проверка, нужно ли предложить мастер
function shouldOfferWizard() {
  const settings = loadSettings()
  if (settings.LAST_GENERATION_TIME === 0) return false
  if (settings.LAST_SETTINGS_CHANGE_TIME > settings.LAST_GENERATION_TIME) return false
  return true
}

// Завершить мастер (используется для совместимости)
function finishWizard() {
  const settings = loadSettings()
  settings.WIZARD_ACTIVE = false
  settings.WIZARD_STEP = 0
  settings.PENDING_PRESET = null
  saveSettings(settings)

  Logger.log(`✅ Мастер настроек завершён`)
  SpreadsheetApp.getUi().alert('✅ Все настройки пройдены!')
}
