// Скрывает все служебные листы
function hideServiceSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  const settings = loadSettings();
  
  // 🆕 Добавлен CLASSES_SHEET_NAME
  const serviceSheets = [
    settings.MATRIX_SHEET_NAME,
    settings.ROLES_SHEET_NAME,
    settings.HERO_TIER_SHEET_NAME,
    settings.CLASSES_SHEET_NAME
  ];
  
  let hiddenCount = 0;
  const notFound = [];
  
  for (const name of serviceSheets) {
    const sheet = ss.getSheetByName(name);
    if (sheet) {
      const visibleSheets = ss.getSheets().filter(s => !s.isSheetHidden());
      if (visibleSheets.length > 1) {
        sheet.hideSheet();
        hiddenCount++;
      }
    } else {
      notFound.push(name);
    }
  }
  
  let message = `✅ Скрыто служебных листов: ${hiddenCount}`;
  if (notFound.length > 0) {
    message += `\n\n⚠️ Не найдены: ${notFound.join(', ')}`;
  }
  ui.alert(message);
}

function showServiceSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const settings = loadSettings();
  
  // 🆕 Добавлен CLASSES_SHEET_NAME
  const serviceSheets = [
    settings.MATRIX_SHEET_NAME,
    settings.ROLES_SHEET_NAME,
    settings.HERO_TIER_SHEET_NAME,
    settings.CLASSES_SHEET_NAME
  ];
  
  let shownCount = 0;
  
  for (const name of serviceSheets) {
    const sheet = ss.getSheetByName(name);
    if (sheet && sheet.isSheetHidden()) {
      sheet.showSheet();
      shownCount++;
    }
  }
  
  SpreadsheetApp.getUi().alert(`✅ Показано служебных листов: ${shownCount}`);
}

function autoHideOnOpen() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const settings = loadSettings();
  
  // 🆕 Добавлен CLASSES_SHEET_NAME
  const serviceSheets = [
    settings.MATRIX_SHEET_NAME,
    settings.ROLES_SHEET_NAME,
    settings.HERO_TIER_SHEET_NAME,
    settings.CLASSES_SHEET_NAME
  ];
  
  for (const name of serviceSheets) {
    const sheet = ss.getSheetByName(name);
    if (sheet && !sheet.isSheetHidden()) {
      const visibleSheets = ss.getSheets().filter(s => !s.isSheetHidden());
      if (visibleSheets.length > 1) {
        sheet.hideSheet();
      }
    }
  }
}

// 🆕 Удаляет текущий лист результата
function deleteCurrentResultSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  const settings = loadSettings();
  
  const sheetName = settings.MUST_HAVE_HEROES.length > 0
    ? settings.MUST_HAVE_HEROES.map(h => h.substring(0, 2)).join("")
    : settings.RESULT_SHEET_NAME;
  
  const sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    ui.alert(`❌ Лист "${sheetName}" не найден.`);
    return;
  }
  
  const response = ui.alert(
    '🗑️ Удаление листа',
    `Вы уверены, что хотите удалить лист "${sheetName}"?\n\nЭто действие нельзя отменить.`,
    ui.ButtonSet.YES_NO
  );
  
  if (response === ui.Button.YES) {
    // Проверяем, что это не последний лист
    if (ss.getSheets().length === 1) {
      ui.alert('❌ Нельзя удалить единственный лист в таблице.');
      return;
    }
    
    ss.deleteSheet(sheet);
    ui.alert(`✅ Лист "${sheetName}" удалён.`);
  }
}