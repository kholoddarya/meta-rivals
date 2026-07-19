// ==========================================
// ОКНО ПРОГРЕССА ГЕНЕРАЦИИ
// ==========================================

function showGenerationProgress() {
  const settings = loadSettings();
  
  // 🆕 Экранируем все пользовательские данные
  const heroes = settings.MUST_HAVE_HEROES.length > 0 
    ? escapeHtml(settings.MUST_HAVE_HEROES.join(', ')) 
    : 'не выбраны';
  
  const modeText = settings.GENERATION_MODE === "counter" 
    ? `⚔️ Против: ${escapeHtml(settings.ENEMY_COMPOSITION.join(', '))}` 
    : '🎯 Обычный режим';
  
  const safeSheetName = escapeHtml(settings.COUNTER_RESULT_SHEET_NAME);

const counterInfo = settings.GENERATION_MODE === "counter" ? `
  <div style="margin-top:8px;padding:8px;background:#ffebee;border-radius:4px;">
    <div style="font-size:11px;color:#c62828;"><b>Режим контр-пика:</b></div>
    <div style="font-size:11px;color:#555;">Состав: ${settings.COUNTER_ROLE_COMPOSITION.sup}-${settings.COUNTER_ROLE_COMPOSITION.dps}-${settings.COUNTER_ROLE_COMPOSITION.tnk}</div>
    <div style="font-size:11px;color:#555;">Лист: ${settings.COUNTER_RESULT_SHEET_NAME}</div>
  </div>
` : '';
  const html = `
    <div id="progressContainer" style="padding:30px;font-family:Arial,sans-serif;font-size:13px;">
      <h3 style="margin-top:0;color:#1976d2;">🚀 Генерация команд</h3>
      
      <div id="statusSection" style="margin-bottom:20px;">
        <div style="display:flex;align-items:center;margin-bottom:15px;">
          <div id="spinner" style="width:30px;height:30px;border:3px solid #f3f3f3;border-top:3px solid #4CAF50;border-radius:50%;animation:spin 1s linear infinite;margin-right:15px;"></div>
          <div>
            <div id="statusText" style="font-weight:bold;color:#333;">Инициализация...</div>
            <div id="statusDetail" style="font-size:11px;color:#666;margin-top:3px;">${modeText}</div>
          </div>
        </div>
      </div>
      
      <div style="background:#f5f5f5;padding:15px;border-radius:6px;margin-bottom:20px;">
        <div style="font-weight:bold;margin-bottom:10px;color:#555;">📋 Текущие настройки:</div>
        <div style="font-size:12px;line-height:1.8;">
          <div><b>Размер команды:</b> ${settings.TEAM_SIZE}</div>
          <div><b>Раскладки:</b> ${settings.ROLE_COMPOSITIONS.join(', ')}</div>
          <div><b>Обязательные:</b> ${heroes}</div>
          <div><b>Мин. синергий:</b> ${settings.MIN_SYNERGIES}</div>
          <div><b>Макс. результатов:</b> ${settings.MAX_RESULTS}</div>
          <div><b>Синергии:</b> ${settings.USE_SYNERGIES ? '✅ Вкл' : '❌ Выкл'}</div>
          <div><b>Соло-синергии:</b> ${settings.USE_SOLO_SYNERGIES && settings.USE_SYNERGIES ? '✅ Вкл' : '❌ Выкл'}</div>
          <div><b>Тиры:</b> ${settings.USE_HERO_TIER ? '✅ Вкл' : '❌ Выкл'}</div>
          <div><b>Контрпики:</b> ${settings.USE_COUNTER_PICKS ? '✅ Вкл' : '❌ Выкл'}</div>
        </div>
        ${counterInfo}  <!-- 🆕 ВОТ СЮДА ВСТАВЛЯЕМ -->
      </div>
      
      <div id="resultSection" style="display:none;">
        <div id="resultContent"></div>
        <div style="margin-top:20px;text-align:center;">
          <button onclick="google.script.host.close()" style="padding:10px 30px;background:#4CAF50;color:white;border:none;border-radius:4px;cursor:pointer;font-size:14px;">Закрыть</button>
        </div>
      </div>
      
      <style>
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      </style>
    </div>
    
    <script>
      google.script.run
        .withSuccessHandler(showResult)
        .withFailureHandler(showError)
        .runGenerationAsync();
      
      function showResult(result) {
        document.getElementById('spinner').style.display = 'none';
        document.getElementById('statusText').textContent = result.success ? '✅ Генерация завершена!' : '❌ Ошибка генерации';
        document.getElementById('statusDetail').textContent = '';
        
        const resultSection = document.getElementById('resultSection');
        const resultContent = document.getElementById('resultContent');
        
        if (result.success) {
          resultContent.innerHTML = \`
            <div style="background:#e8f5e9;padding:15px;border-radius:6px;border-left:4px solid #4CAF50;">
              <div style="font-size:16px;font-weight:bold;color:#2e7d32;margin-bottom:10px;">
                🎉 Найдено \${result.teamCount} команд
              </div>
              <div style="font-size:13px;color:#555;">
                <div><b>Лист результата:</b> \${result.sheetName}</div>
                <div><b>Время генерации:</b> \${result.duration} сек</div>
                \${result.heroes ? '<div><b>Обязательные персонажи:</b> ' + result.heroes + '</div>' : ''}
              </div>
              <div style="margin-top:10px;font-size:11px;color:#666;">
                💡 Колонки со статистикой скрыты. Чтобы показать — выделите столбцы → ПКМ → "Показать столбец"
              </div>
            </div>
          \`;
        } else {
          // 🆕 Улучшенный вывод ошибок
          const fixHint = result.fixable 
            ? '<div style="margin-top:10px;font-size:11px;color:#666;">💡 Откройте меню <b>⚙️ Настройки</b> для исправления проблемы.</div>'
            : '<div style="margin-top:10px;font-size:11px;color:#666;">⚠️ Это внутренняя ошибка. Попробуйте обновить страницу или сообщить разработчику.</div>';
          
          const techDetails = result.technical 
            ? '<div style="margin-top:8px;padding:8px;background:#fff;font-family:monospace;font-size:10px;color:#888;border-radius:3px;"><b>Технические детали:</b> ' + result.technical + '</div>'
            : '';
          
          resultContent.innerHTML = \`
            <div style="background:#ffebee;padding:15px;border-radius:6px;border-left:4px solid #d32f2f;">
              <div style="font-size:16px;font-weight:bold;color:#c62828;margin-bottom:10px;">
                ❌ Ошибка генерации
              </div>
              <div style="font-size:13px;color:#555;line-height:1.5;">
                \${result.error}
              </div>
              \${fixHint}
              \${techDetails}
            </div>
          \`;
        }
        
        resultSection.style.display = 'block';
      }
      
      function showError(err) {
        document.getElementById('spinner').style.display = 'none';
        document.getElementById('statusText').textContent = '❌ Ошибка';
        document.getElementById('statusDetail').textContent = '';
        
        const resultSection = document.getElementById('resultSection');
        const resultContent = document.getElementById('resultContent');
        
        resultContent.innerHTML = \`
          <div style="background:#ffebee;padding:15px;border-radius:6px;border-left:4px solid #d32f2f;">
            <div style="font-size:16px;font-weight:bold;color:#c62828;margin-bottom:10px;">
              ❌ Критическая ошибка
            </div>
            <div style="font-size:13px;color:#555;">
              \${err.message || 'Неизвестная ошибка'}
            </div>
          </div>
        \`;
        
        resultSection.style.display = 'block';
      }
    </script>
  `;
  
  SpreadsheetApp.getUi().showModalDialog(
    HtmlService.createHtmlOutput(html).setWidth(500).setHeight(580),
    'Генерация команд'
  );
}