// ==========================================
// МЕНЮ И АВТОМАТИЧЕСКАЯ БОКОВАЯ ПАНЕЛЬ
// ==========================================
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  
  // 🆕 Быстрое создание меню без тяжёлых операций
  ui.createMenu('🎮 Генератор команд')
    .addItem('🔐 Авторизовать скрипт', 'authorizeScript')
    .addSeparator()
    .addItem('🚀 Запустить генерацию', 'runGeneration')
    .addItem('⚔️ Против вражеской композиции', 'runCounterGeneration')
    .addSeparator()
    .addItem('⚡ Открыть быстрый подбор', 'showQuickPickSidebar')
    .addSeparator()
    .addSubMenu(ui.createMenu('⚙️ Настройки')
      .addItem('📊 Основные параметры', 'showMainSettings')
      .addItem('🎯 Раскладки и обязательные персонажи', 'showMustHaveHeroes')
      .addItem('⚖️ Веса оценок и тиров', 'showWeightSettings')
      .addItem('✏️ Имена служебных листов', 'showServiceSheetsSettings')
      .addItem('⚔️ Настроить контрпики', 'showCounterPickSettings'))
    .addSeparator()
    .addItem('🔄 Пройти все настройки заново', 'startSettingsWizard')
    .addSeparator()
    .addSubMenu(ui.createMenu('👁️ Служебные листы')
      .addItem('🙈 Скрыть служебные листы', 'hideServiceSheets')
      .addItem('👀 Показать служебные листы', 'showServiceSheets'))
    .addSeparator()
    .addItem('🗑️ Удалить текущий лист результата', 'deleteCurrentResultSheet')
    .addSeparator()
    .addItem('📖 Инструкция', 'showInstructions')
    .addSeparator()
    .addItem('🖼️ Очистить кэш иконок', 'clearIconCache')
    .addSeparator()
    .addItem('🔧 Очистить старые настройки', 'cleanupAndNotify')
    .addToUi();
  
  // 🆕 Убрал checkAndRecoverTransactions() и autoHideOnOpen() из onOpen
  // Они вызываются асинхронно через триггер или вручную
}

// 🆕 Функция авторизации — вызывает запрос разрешений
function authorizeScript() {
  // Обращение к SpreadsheetApp триггерит запрос авторизации
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const name = ss.getName();
  
  // Также "трогаем" PropertiesService и другие сервисы
  loadSettings();
  
  SpreadsheetApp.getUi().alert(
    '✅ Авторизация выполнена!\n\n' +
    'Таблица: ' + name + '\n\n' +
    'Теперь QuickPick и все остальные функции будут работать без ошибок авторизации.'
  );
}

// 🆕 Тихая авто-авторизация при открытии таблицы
function tryAuthorizeSilently() {
  try {
    // Просто "трогаем" сервисы — этого достаточно для запроса авторизации
    SpreadsheetApp.getActiveSpreadsheet().getName();
    loadSettings();
  } catch (e) {
    Logger.log(`Тихая авторизация не удалась: ${e.message}`);
  }
}

// ==========================================
// 🆕 ФУНКЦИЯ ДЛЯ ПОДКЛЮЧЕНИЯ HTML-ФРАГМЕНТОВ
// Вызывается из HTML-шаблонов через <?!= include('filename') ?>
// ==========================================
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ==========================================
// БЫСТРЫЙ ПОДБОР — МОДАЛЬНЫЙ ДИАЛОГ (растягиваемый)
// ==========================================
function showQuickPickSidebar() {
  try {
    const html = HtmlService.createTemplateFromFile('QuickPickSidebar')
      .evaluate()
      .setWidth(900)
      .setHeight(750);
    
    SpreadsheetApp.getUi().showModalDialog(html, '⚡ Быстрый подбор команды');
  } catch (e) {
    Logger.log(`❌ Ошибка: ${e.message}`);
    SpreadsheetApp.getUi().alert(`❌ ${e.message}`);
  }
}

// 🆕 Автооткрытие — тоже в modal dialog
function autoOpenSidebar() {
  try {
    const html = HtmlService.createTemplateFromFile('QuickPickSidebar')
      .evaluate()
      .setWidth(900)
      .setHeight(750);
    
    SpreadsheetApp.getUi().showModalDialog(html, '⚡ Быстрый подбор команды');
  } catch (e) {
    Logger.log(`Автооткрытие не удалось: ${e.message}`);
  }
}

function cleanupAndNotify() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    '🔧 Очистка старых настроек',
    'Это удалит устаревшие отдельные свойства настроек.\n\nПродолжить?',
    ui.ButtonSet.YES_NO
  );
  
  if (response === ui.Button.YES) {
    cleanupOldProperties();
    ui.alert('✅ Старые настройки очищены!');
  }
}

function showInstructions() {
  const html = `
    <div style="padding:20px;font-family:Arial,sans-serif;font-size:13px;line-height:1.6;">
      <h3 style="margin-top:0;">📋 Как использовать</h3>
      <ol style="padding-left:20px;">
        <li>Настройте параметры через меню <b>⚙️ Настройки</b></li>
        <li>Убедитесь, что листы <b>FullInfo</b>, <b>Roles</b>, <b>HeroTier</b>, <b>Classes</b> заполнены</li>
        <li>При необходимости выберите <b>⭐ Обязательных персонажей</b> (до 5)</li>
        <li>Нажмите <b>🚀 Запустить генерацию</b> или <b>⚔️ Против вражеской композиции</b></li>
      </ol>
      <h4>⚔️ Режим контрпиков:</h4>
      <ul style="padding-left:20px;">
        <li><b>Dive > Poke > Brawl > Dive</b> (цикл)</li>
        <li><b>Anti-Dive > Dive</b>, <b>Anti-Poke > Poke</b>, <b>Anti-Brawl > Brawl</b></li>
        <li>Выберите вражеских персонажей → скрипт подберёт контрпики</li>
      </ul>
      <h4>🗑️ Удаление листа:</h4>
      <ul style="padding-left:20px;">
        <li>Меню → <b>🗑️ Удалить текущий лист результата</b></li>
        <li>Или создайте кнопку: Вставка → Рисунок → назначьте скрипт <code>deleteCurrentResultSheet</code></li>
      </ul>
    </div>
  `;
  SpreadsheetApp.getUi().showModalDialog(
    HtmlService.createHtmlOutput(html).setWidth(450).setHeight(450),
    'Инструкция'
  );
}

// 🆕 Установить триггер автооткрытия sidebar (выполнить ОДИН раз)
function installAutoOpenTrigger() {
  // Удаляем старые триггеры, если есть
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'autoOpenSidebar') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  // Создаём новый installable trigger
  ScriptApp.newTrigger('autoOpenSidebar')
    .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet())
    .onOpen()
    .create();
  
  SpreadsheetApp.getUi().alert(
    '✅ Триггер автооткрытия установлен!\n\n' +
    'При следующем открытии таблицы sidebar будет появляться автоматически.\n\n' +
    'Чтобы отключить — выполните removeAutoOpenTrigger().'
  );
}

// 🆕 Удалить триггер автооткрытия
function removeAutoOpenTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  let removed = 0;
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'autoOpenSidebar') {
      ScriptApp.deleteTrigger(trigger);
      removed++;
    }
  });
  SpreadsheetApp.getUi().alert(`✅ Удалено триггеров: ${removed}`);
}

