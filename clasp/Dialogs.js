// ==========================================
// ДИАЛОГОВЫЕ ОКНА НАСТРОЕК
// ==========================================

// ==========================================
// ОБЩИЕ КЛИЕНТСКИЕ ФУНКЦИИ
// ==========================================
function getCommonJs() {
  return `
    function showSpinner(message) {
      document.body.innerHTML = '<div style="padding:40px;text-align:center;font-family:Arial,sans-serif;">' +
        '<div style="display:inline-block;width:40px;height:40px;border:4px solid #f3f3f3;border-top:4px solid #4CAF50;border-radius:50%;animation:spin 1s linear infinite;"></div>' +
        '<p style="margin-top:20px;color:#555;">' + message + '</p>' +
        '<style>@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}</style>' +
        '</div>';
    }
    
    function showError(err) {
      document.body.innerHTML = '<div style="padding:30px;text-align:center;font-family:Arial,sans-serif;">' +
        '<div style="color:#d32f2f;font-size:40px;">❌</div>' +
        '<p style="color:#d32f2f;margin-top:15px;"><b>Ошибка сохранения</b></p>' +
        '<p style="color:#666;font-size:12px;">' + (err.message || 'Неизвестная ошибка') + '</p>' +
        '<button onclick="google.script.host.close()" style="margin-top:20px;padding:8px 20px;background:#eee;border:1px solid #ccc;border-radius:4px;cursor:pointer;">Закрыть</button>' +
        '</div>';
    }
    
    // Завершить настройки и запустить генерацию
    // currentKey — ключ текущей страницы, чтобы пометить её как пройденную
    function finishAndGenerate(currentKey) {
      showSpinner('Запуск генерации...');
      google.script.run
        .withSuccessHandler(() => {
          google.script.host.close();
          google.script.run
            .withSuccessHandler(() => {})
            .startGenerationAfterSettings();
        })
        .withFailureHandler(err => showError(err))
        .finishSettingsAndGenerate(currentKey);
    }
    
    // Продолжить настройки — пометить текущую и открыть следующую
    // currentKey — ключ текущей страницы
    function continueSettings(currentKey) {
      showSpinner('Переход к следующей настройке...');
      google.script.run
        .withSuccessHandler(() => {
          google.script.host.close();
          google.script.run
            .withSuccessHandler(() => {})
            .openNextUnvisitedSetting(currentKey);
        })
        .withFailureHandler(err => showError(err))
        .finishCurrentSetting(currentKey);
    }
  `
}

// ==========================================
// УНИВЕРСАЛЬНЫЙ БЛОК ДЕЙСТВИЙ
// ==========================================
function getActionsBlockHtml(currentSettingKey) {
  const unvisited = getUnvisitedSettings()
  const unvisitedOther = unvisited.filter((p) => p.key !== currentSettingKey)

  const listHtml =
    unvisitedOther.length > 0
      ? `<ul style="margin:5px 0 0 0;padding-left:20px;font-size:12px;color:#555;">
        ${unvisitedOther.map((p) => `<li style="margin:3px 0;">${p.name}</li>`).join('')}
       </ul>`
      : `<div style="font-size:12px;color:#388e3c;margin-top:5px;font-weight:bold;">✅ Все настройки пройдены!</div>`

  const continueDisabled =
    unvisitedOther.length === 0 ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''

  // Передаём currentSettingKey в клиентские функции
  return `
    <div style="margin-top:20px;padding:15px;background:#f5f5f5;border-radius:6px;border:1px solid #e0e0e0;">
      <div style="font-weight:bold;color:#333;margin-bottom:8px;">📋 Осталось настроить:</div>
      ${listHtml}
      <div style="margin-top:15px;display:flex;gap:10px;">
        <button onclick="finishAndGenerate('${currentSettingKey}')" 
                style="flex:1;padding:10px;background:#4CAF50;color:white;border:none;border-radius:4px;cursor:pointer;font-weight:bold;font-size:13px;">
          🚀 Завершить и сгенерировать
        </button>
        <button onclick="continueSettings('${currentSettingKey}')" ${continueDisabled}
                style="flex:1;padding:10px;background:#1976d2;color:white;border:none;border-radius:4px;cursor:pointer;font-weight:bold;font-size:13px;">
          ⚙️ Продолжить настройки
        </button>
      </div>
    </div>
  `
}

// ==========================================
// 📊 ОСНОВНЫЕ ПАРАМЕТРЫ
// ==========================================
function showMainSettings() {
  const settings = loadSettings()
  const actionsBlock = getActionsBlockHtml('main')

  const html = `
    <div style="padding:20px;font-family:Arial,sans-serif;font-size:13px;">
      <h3 style="margin-top:0;">📊 Основные параметры</h3>
      <form onsubmit="return false;">
        <div style="margin-bottom:15px;">
          <label style="display:block;margin-bottom:5px;"><b>Размер команды:</b></label>
          <input type="number" id="TEAM_SIZE" value="${settings.TEAM_SIZE}" min="1" max="10" style="width:100%;padding:5px;">
        </div>
        <div style="margin-bottom:15px;">
          <label style="display:block;margin-bottom:5px;"><b>Минимум синергий:</b></label>
          <input type="number" id="MIN_SYNERGIES" value="${settings.MIN_SYNERGIES}" min="0" style="width:100%;padding:5px;">
        </div>
        <div style="margin-bottom:15px;">
          <label style="display:block;margin-bottom:5px;"><b>Максимум результатов:</b></label>
          <input type="number" id="MAX_RESULTS" value="${settings.MAX_RESULTS}" min="1" style="width:100%;padding:5px;">
        </div>
        <div style="margin-bottom:15px;">
          <label style="display:block;margin-bottom:5px;"><b>Имя листа результата (по умолчанию):</b></label>
          <input type="text" id="RESULT_SHEET_NAME" value="${settings.RESULT_SHEET_NAME}" style="width:100%;padding:5px;">
          <small style="color:#666;">💡 При выборе обязательных персонажей — лист назовётся по их первым буквам</small>
        </div>
        <div id="validationMsg" style="color:#d32f2f;font-size:12px;min-height:18px;margin-bottom:10px;"></div>
        <div style="text-align:right;">
          <button id="saveBtn" onclick="saveMainSettings()" style="padding:8px 20px;background:#4CAF50;color:white;border:none;border-radius:4px;cursor:pointer;">💾 Сохранить</button>
        </div>
      </form>
      ${actionsBlock}
    </div>
    <script>
      ${getCommonJs()}
      
      function validate() {
        const teamSize = parseInt(document.getElementById('TEAM_SIZE').value);
        const minSyn = parseInt(document.getElementById('MIN_SYNERGIES').value);
        const maxRes = parseInt(document.getElementById('MAX_RESULTS').value);
        const msgEl = document.getElementById('validationMsg');
        const btn = document.getElementById('saveBtn');
        const errors = [];
        if (isNaN(teamSize) || teamSize < 1 || teamSize > 10) errors.push('Размер: 1-10');
        if (isNaN(minSyn) || minSyn < 0) errors.push('Мин.синергий ≥ 0');
        if (isNaN(maxRes) || maxRes < 1) errors.push('Макс.результатов ≥ 1');
        if (errors.length > 0) {
          msgEl.textContent = '⚠️ ' + errors.join(' | ');
          btn.disabled = true; btn.style.opacity = 0.5;
          return false;
        }
        msgEl.textContent = '';
        btn.disabled = false; btn.style.opacity = 1;
        return true;
      }
      document.querySelectorAll('input').forEach(inp => inp.addEventListener('input', validate));
      
      function saveMainSettings() {
        if (!validate()) return;
        const data = {
          TEAM_SIZE: parseInt(document.getElementById('TEAM_SIZE').value),
          MIN_SYNERGIES: parseInt(document.getElementById('MIN_SYNERGIES').value),
          MAX_RESULTS: parseInt(document.getElementById('MAX_RESULTS').value),
          RESULT_SHEET_NAME: document.getElementById('RESULT_SHEET_NAME').value.trim() || 'Team Compositions'
        };
        showSpinner('Сохранение...');
        google.script.run
          .withSuccessHandler(() => {
            google.script.run.withSuccessHandler(() => {
              google.script.host.close();
            }).markSettingVisited("main");
          })
          .withFailureHandler(err => showError(err))
          .saveMainSettingsData(data);
      }
    </script>
  `
  SpreadsheetApp.getUi().showModalDialog(
    HtmlService.createHtmlOutput(html).setWidth(450).setHeight(700),
    'Основные параметры'
  )
}

// ==========================================
// 🎯 РАСКЛАДКИ И ОБЯЗАТЕЛЬНЫЕ ПЕРСОНАЖИ
// ==========================================
function showMustHaveHeroes() {
  const settings = loadSettings()
  const heroes = getHeroList()
  if (heroes.length === 0) {
    SpreadsheetApp.getUi().alert('❌ Лист матрицы не найден или пуст!')
    return
  }

  const actionsBlock = getActionsBlockHtml('compositions')
  const compositions = settings.ROLE_COMPOSITIONS.join('\n')
  const selectedSet = new Set(settings.MUST_HAVE_HEROES || [])

  const items = heroes
    .map((h, i) => {
      const checked = selectedSet.has(h) ? 'checked' : ''
      const escaped = h.replace(/"/g, '&quot;').replace(/</g, '&lt;')
      return `<div class="hero-item" data-name="${h.toLowerCase()}" style="padding:6px 8px;display:flex;align-items:center;border-bottom:1px solid #eee;">
      <input type="checkbox" class="hero-cb" id="hero_${i}" value="${escaped}" ${checked} style="margin-right:10px;">
      <label for="hero_${i}" style="cursor:pointer;flex:1;">${escaped}</label>
    </div>`
    })
    .join('')

  const html = `
    <div style="padding:20px;font-family:Arial,sans-serif;font-size:13px;">
      <h3 style="margin-top:0;color:#1976d2;">🎯 Раскладки ролей</h3>
      <p style="color:#666;font-size:11px;margin:0 0 5px 0;">Формат: <b>sup-dps-tnk</b>. Сумма = <b>${settings.TEAM_SIZE}</b></p>
      <textarea id="compositions" rows="3" style="width:100%;padding:5px;font-family:monospace;box-sizing:border-box;">${compositions}</textarea>
      <div id="compMsg" style="margin-top:5px;color:#d32f2f;font-size:12px;min-height:18px;"></div>
      
      <h3 style="margin-top:20px;color:#7b1fa2;">⭐ Обязательные персонажи</h3>
      <p style="color:#666;font-size:11px;margin:0 0 5px 0;">До <b>5</b> персонажей. Имя листа = первые 2 буквы имён.</p>
      <input type="text" id="search" placeholder="🔍 Поиск..." 
             style="width:100%;padding:8px;font-size:13px;margin-bottom:8px;box-sizing:border-box;border:1px solid #ccc;border-radius:4px;">
      <div id="list" style="max-height:150px;overflow-y:auto;border:1px solid #ccc;border-radius:4px;background:#fafafa;">
        ${items}
      </div>
      <div style="margin-top:8px;display:flex;justify-content:space-between;align-items:center;font-size:12px;color:#666;">
        <span>Выбрано: <b id="count">${selectedSet.size}</b> / 5</span>
        <button onclick="clearAll()" style="padding:4px 10px;font-size:11px;background:#eee;border:1px solid #ccc;border-radius:3px;cursor:pointer;">Сбросить</button>
      </div>
      
      <div style="margin-top:15px;padding:10px;background:#fff3e0;border-radius:4px;border-left:4px solid #ff9800;">
        <label style="display:flex;align-items:flex-start;cursor:pointer;font-size:12px;">
          <input type="checkbox" id="MUST_HAVE_SYNERGY" ${settings.MUST_HAVE_SYNERGY ? 'checked' : ''} style="margin-right:8px;margin-top:2px;">
          <span>
            <b>Требовать синергию у обязательных персонажей</b><br>
            <span style="color:#666;font-size:11px;">Каждый обязательный герой должен иметь хотя бы одну синергию</span>
          </span>
        </label>
      </div>
      
      <div style="margin-top:15px;text-align:right;">
        <button id="saveBtn" onclick="saveAll()" style="padding:8px 20px;background:#4CAF50;color:white;border:none;border-radius:4px;cursor:pointer;">💾 Сохранить</button>
      </div>
      
      ${actionsBlock}
    </div>
    <script>
      ${getCommonJs()}
      
      const TEAM_SIZE = ${settings.TEAM_SIZE};
      const searchInput = document.getElementById('search');
      const listEl = document.getElementById('list');
      const countEl = document.getElementById('count');
      const allItems = Array.from(listEl.querySelectorAll('.hero-item'));
      
      function validateCompositions() {
        const text = document.getElementById('compositions').value;
        const lines = text.split('\\n').map(s => s.trim()).filter(s => s);
        const errors = [];
        if (lines.length === 0) errors.push('Добавьте хотя бы одну раскладку');
        else lines.forEach((line, i) => {
          const parts = line.split('-').map(n => parseInt(n.trim()));
          if (parts.length !== 3 || parts.some(isNaN)) errors.push('Строка ' + (i+1) + ': неверный формат');
          else if (parts[0] + parts[1] + parts[2] !== TEAM_SIZE) errors.push('Строка ' + (i+1) + ': сумма ≠ ' + TEAM_SIZE);
        });
        const msgEl = document.getElementById('compMsg');
        if (errors.length === 0) {
          msgEl.style.color = '#388e3c';
          msgEl.textContent = '✅ Раскладки валидны (' + lines.length + ' шт.)';
          return lines;
        }
        msgEl.style.color = '#d32f2f';
        msgEl.textContent = errors.join(' | ');
        return null;
      }
      
      document.getElementById('compositions').addEventListener('input', updateSaveBtn);
      
      function updateCount() {
        const checked = document.querySelectorAll('.hero-cb:checked');
        countEl.textContent = checked.length;
        countEl.style.color = checked.length >= 5 ? '#d32f2f' : '#333';
      }
      
      searchInput.addEventListener('input', function() {
        const q = this.value.toLowerCase().trim();
        allItems.forEach(item => {
          item.style.display = item.getAttribute('data-name').includes(q) ? 'flex' : 'none';
        });
      });
      
      listEl.addEventListener('change', function(e) {
        if (e.target.classList.contains('hero-cb')) {
          if (document.querySelectorAll('.hero-cb:checked').length > 5) {
            e.target.checked = false;
            alert('Максимум 5 персонажей!');
            return;
          }
          updateCount();
        }
      });
      
      function clearAll() {
        document.querySelectorAll('.hero-cb').forEach(cb => cb.checked = false);
        updateCount();
      }
      
      function updateSaveBtn() {
        const btn = document.getElementById('saveBtn');
        const compositions = validateCompositions();
        btn.disabled = !compositions;
        btn.style.opacity = compositions ? '1' : '0.5';
      }
      
      function saveAll() {
        const compositions = validateCompositions();
        if (!compositions) return;
        
        const heroes = Array.from(document.querySelectorAll('.hero-cb:checked')).map(cb => cb.value);
        const requireSynergy = document.getElementById('MUST_HAVE_SYNERGY').checked;
        
        showSpinner('Сохранение...');
        google.script.run
          .withSuccessHandler(() => {
            google.script.run.withSuccessHandler(() => {
              google.script.host.close();
            }).markSettingVisited("compositions");
          })
          .withFailureHandler(err => showError(err))
          .saveMustHaveData({
            heroes: heroes,
            requireSynergy: requireSynergy,
            compositions: compositions
          });
      }
      
      updateCount();
      updateSaveBtn();
    </script>
  `
  SpreadsheetApp.getUi().showModalDialog(
    HtmlService.createHtmlOutput(html).setWidth(450).setHeight(780),
    'Раскладки и обязательные персонажи'
  )
}

// Для совместимости
function showCompositionSettings() {
  showMustHaveHeroes()
}

// ==========================================
// ⚖️ ВЕСА ОЦЕНОК И ТИРОВ
// ==========================================
function showWeightSettings() {
  const settings = loadSettings()
  const actionsBlock = getActionsBlockHtml('weights')

  const cw = settings.CLASS_WEIGHTS || { Dive: 0, Poke: 0, Brawl: 0 }
  const arw = settings.ANTI_ROLE_WEIGHTS || { 'Anti-Dive': 0, 'Anti-Poke': 0, 'Anti-Brawl': 0 }
  // Веса ролей
  const rw = settings.ROLE_WEIGHTS || { sup: 1, dps: 3, tnk: 2 }

  const html = `
    <div style="padding:20px;font-family:Arial,sans-serif;font-size:13px;max-height:90vh;overflow-y:auto;">
      <h3 style="margin-top:0;color:#1976d2;">⚖️ Веса оценок синергий</h3>
      
      <div style="margin-bottom:15px;padding:10px;background:#e3f2fd;border-radius:4px;">
        <label style="display:flex;align-items:center;cursor:pointer;">
          <input type="checkbox" id="USE_SYNERGIES" ${settings.USE_SYNERGIES ? 'checked' : ''} style="margin-right:8px;">
          <b>Учитывать синергии</b>
        </label>
      </div>
      
      <div id="synergyBlock" style="display:grid;grid-template-columns:60px 1fr;gap:10px;align-items:center;margin-bottom:20px;padding:15px;background:#f5f5f5;border-radius:6px;${!settings.USE_SYNERGIES ? 'opacity:0.4;pointer-events:none;' : ''}">
        <label><b>S:</b></label><input type="number" id="GRADE_S" value="${settings.GRADE_S}" min="0" style="padding:5px;">
        <label><b>SA:</b></label><input type="number" id="GRADE_SA" value="${settings.GRADE_SA}" min="0" style="padding:5px;">
        <label><b>A:</b></label><input type="number" id="GRADE_A" value="${settings.GRADE_A}" min="0" style="padding:5px;">
        <label><b>B:</b></label><input type="number" id="GRADE_B" value="${settings.GRADE_B}" min="0" style="padding:5px;">
      </div>
      
      <div id="soloBlock" style="margin-bottom:20px;padding:10px;background:#f5f5f5;border-radius:4px;${!settings.USE_SYNERGIES ? 'opacity:0.4;pointer-events:none;' : ''}">
        <label style="display:flex;align-items:center;cursor:pointer;">
          <input type="checkbox" id="USE_SOLO_SYNERGIES" ${settings.USE_SOLO_SYNERGIES ? 'checked' : ''} style="margin-right:8px;">
          <span>
            <b>Учитывать соло-синергии (S)</b><br>
            <small style="color:#666;">Персонажи с S-синергией работают без пары</small>
          </span>
        </label>
      </div>
      
      <h3 style="color:#7b1fa2;">🏆 Веса тиров героев</h3>
      
      <div style="margin-bottom:15px;padding:10px;background:#f3e5f5;border-radius:4px;">
        <label style="display:flex;align-items:center;cursor:pointer;">
          <input type="checkbox" id="USE_HERO_TIER" ${settings.USE_HERO_TIER ? 'checked' : ''} style="margin-right:8px;">
          <b>Учитывать тиры героев</b>
        </label>
      </div>
      
      <div id="tierBlock" style="display:grid;grid-template-columns:60px 1fr;gap:10px;align-items:center;margin-bottom:20px;padding:15px;background:#f5f5f5;border-radius:6px;${!settings.USE_HERO_TIER ? 'opacity:0.4;pointer-events:none;' : ''}">
        <label><b>S:</b></label><input type="number" id="TIER_S" value="${settings.TIER_S}" min="0" style="padding:5px;">
        <label><b>A:</b></label><input type="number" id="TIER_A" value="${settings.TIER_A}" min="0" style="padding:5px;">
        <label><b>B:</b></label><input type="number" id="TIER_B" value="${settings.TIER_B}" min="0" style="padding:5px;">
        <label><b>C:</b></label><input type="number" id="TIER_C" value="${settings.TIER_C}" min="0" style="padding:5px;">
        <label><b>D:</b></label><input type="number" id="TIER_D" value="${settings.TIER_D}" min="0" style="padding:5px;">
      </div>
      
      <h3 style="color:#e65100;">🎭 Веса классов</h3>
      <div style="display:grid;grid-template-columns:100px 1fr;gap:10px;align-items:center;margin-bottom:20px;padding:15px;background:#fff3e0;border-radius:6px;">
        <label><b>Dive:</b></label><input type="number" id="CLASS_DIVE" value="${cw.Dive}" style="padding:5px;">
        <label><b>Poke:</b></label><input type="number" id="CLASS_POKE" value="${cw.Poke}" style="padding:5px;">
        <label><b>Brawl:</b></label><input type="number" id="CLASS_BRAWL" value="${cw.Brawl}" style="padding:5px;">
      </div>
      
      <h3 style="color:#6a1b9a;">🛡️ Веса анти-ролей</h3>
      <div style="display:grid;grid-template-columns:100px 1fr;gap:10px;align-items:center;margin-bottom:20px;padding:15px;background:#f3e5f5;border-radius:6px;">
        <label><b>Anti-Dive:</b></label><input type="number" id="ANTI_DIVE" value="${arw['Anti-Dive']}" style="padding:5px;">
        <label><b>Anti-Poke:</b></label><input type="number" id="ANTI_POKE" value="${arw['Anti-Poke']}" style="padding:5px;">
        <label><b>Anti-Brawl:</b></label><input type="number" id="ANTI_BRAWL" value="${arw['Anti-Brawl']}" style="padding:5px;">
      </div>
      
      <!-- Веса ролей -->
      <h3 style="color:#00695c;">🎯 Веса ролей</h3>
      <p style="color:#666;font-size:11px;margin:0 0 10px 0;">Влияние роли на оценку команды (DPS обычно важнее Sup)</p>
      <div style="display:grid;grid-template-columns:100px 1fr;gap:10px;align-items:center;margin-bottom:20px;padding:15px;background:#e0f2f1;border-radius:6px;">
        <label><b>✚ Sup:</b></label><input type="number" id="ROLE_SUP" value="${rw.sup}" min="0" style="padding:5px;">
        <label><b>⚔️ DPS:</b></label><input type="number" id="ROLE_DPS" value="${rw.dps}" min="0" style="padding:5px;">
        <label><b>🛡️ Tnk:</b></label><input type="number" id="ROLE_TNK" value="${rw.tnk}" min="0" style="padding:5px;">
      </div>
      
      <!-- Heavy class бонус -->
      <h3 style="color:#bf360c;">🔥 Бонус за однородность классов</h3>
      <div style="margin-bottom:15px;padding:10px;background:#fbe9e7;border-radius:4px;">
        <label style="display:flex;align-items:center;cursor:pointer;">
          <input type="checkbox" id="USE_HEAVY_CLASS" ${settings.USE_HEAVY_CLASS ? 'checked' : ''} style="margin-right:8px;">
          <span>
            <b>Учитывать heavy class</b><br>
            <small style="color:#666;">Бонус за команду из одного класса (напр. 3 Poke)</small>
          </span>
        </label>
      </div>
      <div style="display:grid;grid-template-columns:150px 1fr;gap:10px;align-items:center;margin-bottom:20px;padding:15px;background:#f5f5f5;border-radius:6px;">
        <label><b>Бонус за heavy:</b></label><input type="number" id="HEAVY_CLASS_BONUS" value="${settings.HEAVY_CLASS_BONUS}" min="0" style="padding:5px;">
      </div>
      
      <div style="text-align:right;">
        <button onclick="saveWeights()" style="padding:8px 20px;background:#4CAF50;color:white;border:none;border-radius:4px;cursor:pointer;">💾 Сохранить</button>
      </div>
      
      ${actionsBlock}
    </div>
    <script>
      ${getCommonJs()}
      
      function updateBlocks() {
        const useSyn = document.getElementById('USE_SYNERGIES').checked;
        const useTier = document.getElementById('USE_HERO_TIER').checked;
        
        document.getElementById('synergyBlock').style.opacity = useSyn ? '1' : '0.4';
        document.getElementById('synergyBlock').style.pointerEvents = useSyn ? 'auto' : 'none';
        document.getElementById('soloBlock').style.opacity = useSyn ? '1' : '0.4';
        document.getElementById('soloBlock').style.pointerEvents = useSyn ? 'auto' : 'none';
        document.getElementById('tierBlock').style.opacity = useTier ? '1' : '0.4';
        document.getElementById('tierBlock').style.pointerEvents = useTier ? 'auto' : 'none';
        
        if (!useSyn) document.getElementById('USE_SOLO_SYNERGIES').checked = false;
      }
      
      document.getElementById('USE_SYNERGIES').addEventListener('change', updateBlocks);
      document.getElementById('USE_HERO_TIER').addEventListener('change', updateBlocks);
      
      function saveWeights() {
        const useSyn = document.getElementById('USE_SYNERGIES').checked;
        const useTier = document.getElementById('USE_HERO_TIER').checked;
        const useHeavy = document.getElementById('USE_HEAVY_CLASS').checked;
        
        const data = {
          USE_SYNERGIES: useSyn,
          USE_SOLO_SYNERGIES: useSyn ? document.getElementById('USE_SOLO_SYNERGIES').checked : false,
          USE_HERO_TIER: useTier,
          GRADE_S: useSyn ? (parseInt(document.getElementById('GRADE_S').value) || 0) : 0,
          GRADE_SA: useSyn ? (parseInt(document.getElementById('GRADE_SA').value) || 0) : 0,
          GRADE_A: useSyn ? (parseInt(document.getElementById('GRADE_A').value) || 0) : 0,
          GRADE_B: useSyn ? (parseInt(document.getElementById('GRADE_B').value) || 0) : 0,
          TIER_S: useTier ? (parseInt(document.getElementById('TIER_S').value) || 0) : 0,
          TIER_A: useTier ? (parseInt(document.getElementById('TIER_A').value) || 0) : 0,
          TIER_B: useTier ? (parseInt(document.getElementById('TIER_B').value) || 0) : 0,
          TIER_C: useTier ? (parseInt(document.getElementById('TIER_C').value) || 0) : 0,
          TIER_D: useTier ? (parseInt(document.getElementById('TIER_D').value) || 0) : 0,
          CLASS_WEIGHTS: {
            "Dive": parseInt(document.getElementById('CLASS_DIVE').value) || 0,
            "Poke": parseInt(document.getElementById('CLASS_POKE').value) || 0,
            "Brawl": parseInt(document.getElementById('CLASS_BRAWL').value) || 0
          },
          ANTI_ROLE_WEIGHTS: {
            "Anti-Dive": parseInt(document.getElementById('ANTI_DIVE').value) || 0,
            "Anti-Poke": parseInt(document.getElementById('ANTI_POKE').value) || 0,
            "Anti-Brawl": parseInt(document.getElementById('ANTI_BRAWL').value) || 0
          },
          // Веса ролей
          ROLE_WEIGHTS: {
            "sup": parseInt(document.getElementById('ROLE_SUP').value) || 0,
            "dps": parseInt(document.getElementById('ROLE_DPS').value) || 0,
            "tnk": parseInt(document.getElementById('ROLE_TNK').value) || 0
          },
          // Heavy class
          USE_HEAVY_CLASS: useHeavy,
          HEAVY_CLASS_BONUS: parseInt(document.getElementById('HEAVY_CLASS_BONUS').value) || 0
        };
        showSpinner('Сохранение...');
        google.script.run
          .withSuccessHandler(() => {
            google.script.run.withSuccessHandler(() => {
              google.script.host.close();
            }).markSettingVisited("weights");
          })
          .withFailureHandler(err => showError(err))
          .saveWeightsData(data);
      }
    </script>
  `
  SpreadsheetApp.getUi().showModalDialog(
    HtmlService.createHtmlOutput(html).setWidth(450).setHeight(900),
    'Веса оценок и тиров'
  )
}

// ==========================================
// ✏️ ИМЕНА СЛУЖЕБНЫХ ЛИСТОВ
// ==========================================
function showServiceSheetsSettings() {
  const settings = loadSettings()
  const actionsBlock = getActionsBlockHtml('sheets')

  const html = `
    <div style="padding:20px;font-family:Arial,sans-serif;font-size:13px;">
      <h3 style="margin-top:0;">📝 Имена служебных листов</h3>
      <p style="color:#666;font-size:12px;">Укажите имена листов, с которых скрипт будет читать данные.</p>
      
      <div style="margin-bottom:15px;">
        <label style="display:block;margin-bottom:5px;"><b>Лист с матрицей синергий:</b></label>
        <input type="text" id="MATRIX_SHEET_NAME" value="${settings.MATRIX_SHEET_NAME}" style="width:100%;padding:5px;">
        <small style="color:#666;">Содержит имена персонажей и оценки синергий</small>
      </div>
      
      <div style="margin-bottom:15px;">
        <label style="display:block;margin-bottom:5px;"><b>Лист с ролями:</b></label>
        <input type="text" id="ROLES_SHEET_NAME" value="${settings.ROLES_SHEET_NAME}" style="width:100%;padding:5px;">
        <small style="color:#666;">Содержит имена персонажей и их роли (sup/dps/tnk)</small>
      </div>
      
      <div style="margin-bottom:15px;">
        <label style="display:block;margin-bottom:5px;"><b>Лист с тирами:</b></label>
        <input type="text" id="HERO_TIER_SHEET_NAME" value="${settings.HERO_TIER_SHEET_NAME}" style="width:100%;padding:5px;">
        <small style="color:#666;">Содержит имена персонажей и их тиры (S/A/B/C/D)</small>
      </div>
      
      <div style="margin-bottom:15px;">
        <label style="display:block;margin-bottom:5px;"><b>Лист с классами:</b></label>
        <input type="text" id="CLASSES_SHEET_NAME" value="${settings.CLASSES_SHEET_NAME}" style="width:100%;padding:5px;">
        <small style="color:#666;">Содержит классы персонажей и их контрпики</small>
      </div>
      
      <div id="validationMsg" style="color:#d32f2f;font-size:12px;min-height:18px;margin-bottom:10px;"></div>
      <div style="text-align:right;">
        <button id="saveBtn" onclick="saveServiceSheets()" style="padding:8px 20px;background:#4CAF50;color:white;border:none;border-radius:4px;cursor:pointer;">💾 Сохранить</button>
      </div>
      
      ${actionsBlock}
    </div>
    <script>
      ${getCommonJs()}
      
      function validate() {
        const matrix = document.getElementById('MATRIX_SHEET_NAME').value.trim();
        const roles = document.getElementById('ROLES_SHEET_NAME').value.trim();
        const tiers = document.getElementById('HERO_TIER_SHEET_NAME').value.trim();
        const classes = document.getElementById('CLASSES_SHEET_NAME').value.trim();
        const msgEl = document.getElementById('validationMsg');
        const btn = document.getElementById('saveBtn');
        const errors = [];
        
        if (!matrix) errors.push('Укажите лист матрицы');
        if (!roles) errors.push('Укажите лист ролей');
        if (!tiers) errors.push('Укажите лист тиров');
        if (!classes) errors.push('Укажите лист классов');
        
        const names = [matrix, roles, tiers, classes].filter(n => n);
        const unique = new Set(names);
        if (unique.size !== names.length) errors.push('Имена листов не должны повторяться');
        
        if (errors.length > 0) {
          msgEl.textContent = '⚠️ ' + errors.join(' | ');
          btn.disabled = true; btn.style.opacity = 0.5;
          return false;
        }
        msgEl.textContent = '';
        btn.disabled = false; btn.style.opacity = 1;
        return true;
      }
      
      document.querySelectorAll('input').forEach(inp => inp.addEventListener('input', validate));
      
      function saveServiceSheets() {
        if (!validate()) return;
        const data = {
          MATRIX_SHEET_NAME: document.getElementById('MATRIX_SHEET_NAME').value.trim(),
          ROLES_SHEET_NAME: document.getElementById('ROLES_SHEET_NAME').value.trim(),
          HERO_TIER_SHEET_NAME: document.getElementById('HERO_TIER_SHEET_NAME').value.trim(),
          CLASSES_SHEET_NAME: document.getElementById('CLASSES_SHEET_NAME').value.trim()
        };
        showSpinner('Сохранение...');
        google.script.run
          .withSuccessHandler(() => {
            google.script.run.withSuccessHandler(() => {
              google.script.host.close();
            }).markSettingVisited("sheets");
          })
          .withFailureHandler(err => showError(err))
          .saveServiceSheetsData(data);
      }
    </script>
  `
  SpreadsheetApp.getUi().showModalDialog(
    HtmlService.createHtmlOutput(html).setWidth(450).setHeight(700),
    'Имена служебных листов'
  )
}

// ==========================================
// ⚔️ ПРОТИВ ВРАЖЕСКОЙ КОМПОЗИЦИИ
// ==========================================
function showCounterPickSettings() {
  const settings = loadSettings()
  const heroes = getHeroList()

  if (heroes.length === 0) {
    SpreadsheetApp.getUi().alert('❌ Лист матрицы не найден или пуст!')
    return
  }

  const enemySet = new Set(settings.ENEMY_COMPOSITION || [])
  const counterComp = settings.COUNTER_ROLE_COMPOSITION || { sup: 1, dps: 1, tnk: 1 }

  // Блок действий с кнопками "Завершить и сгенерировать" / "Продолжить настройки"
  const actionsBlock = getActionsBlockHtml('counter')

  // Безопасное экранирование имени листа
  const safeSheetName = escapeAttr(settings.COUNTER_RESULT_SHEET_NAME || 'Counter')

  // Генерация списка героев с экранированием
  const items = heroes
    .map((h, i) => {
      const checked = enemySet.has(h) ? 'checked' : ''
      const escaped = escapeHtml(h)
      const dataName = escapeAttr(h.toLowerCase())
      return `<div class="hero-item" data-name="${dataName}" style="padding:6px 8px;display:flex;align-items:center;border-bottom:1px solid #eee;">
      <input type="checkbox" class="enemy-cb" id="enemy_${i}" value="${escaped}" ${checked} style="margin-right:10px;">
      <label for="enemy_${i}" style="cursor:pointer;flex:1;">${escaped}</label>
    </div>`
    })
    .join('')

  const html = `
    <div style="padding:20px;font-family:Arial,sans-serif;font-size:13px;">
      <h3 style="margin-top:0;color:#d32f2f;">⚔️ Режим: Против вражеской композиции</h3>
      
      <!-- Имя листа результата -->
      <div style="margin-bottom:15px;">
        <label style="display:block;margin-bottom:5px;"><b>Имя листа результата:</b></label>
        <input type="text" id="COUNTER_RESULT_SHEET_NAME" value="${safeSheetName}" 
               style="width:100%;padding:5px;box-sizing:border-box;">
        <small style="color:#666;">Лист, куда будут сохранены контр-пик композиции</small>
      </div>
      
      <!-- Состав команды -->
      <div style="margin-bottom:15px;padding:12px;background:#e3f2fd;border-radius:4px;">
        <label style="display:block;margin-bottom:10px;"><b>Состав команды (от 1 до 6 персонажей):</b></label>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;">
          <div style="text-align:center;">
            <label style="display:block;color:#2e7d32;font-weight:bold;margin-bottom:5px;">🛡️ Sup</label>
            <input type="number" id="COUNTER_SUP" value="${counterComp.sup}" min="0" max="6" 
                   style="width:100%;padding:8px;text-align:center;font-size:14px;box-sizing:border-box;">
          </div>
          <div style="text-align:center;">
            <label style="display:block;color:#c2185b;font-weight:bold;margin-bottom:5px;">⚔️ DPS</label>
            <input type="number" id="COUNTER_DPS" value="${counterComp.dps}" min="0" max="6" 
                   style="width:100%;padding:8px;text-align:center;font-size:14px;box-sizing:border-box;">
          </div>
          <div style="text-align:center;">
            <label style="display:block;color:#1565c0;font-weight:bold;margin-bottom:5px;">🛡️ Tnk</label>
            <input type="number" id="COUNTER_TNK" value="${counterComp.tnk}" min="0" max="6" 
                   style="width:100%;padding:8px;text-align:center;font-size:14px;box-sizing:border-box;">
          </div>
        </div>
        <div id="compositionMsg" style="margin-top:10px;font-size:12px;color:#666;text-align:center;"></div>
      </div>
      
      <!-- Чекбокс учёта контрпиков -->
      <div style="margin-bottom:15px;padding:10px;background:#fff3e0;border-radius:4px;border-left:4px solid #ff9800;">
        <label style="display:flex;align-items:center;cursor:pointer;">
          <input type="checkbox" id="USE_COUNTER_PICKS" ${settings.USE_COUNTER_PICKS ? 'checked' : ''} style="margin-right:8px;">
          <span>
            <b>Учитывать контрпики</b><br>
            <small style="color:#666;">Dive > Poke > Brawl > Dive | Anti-класс сильнее обычного</small>
          </span>
        </label>
      </div>
      
      <!-- Выбор вражеских персонажей -->
      <label style="display:block;margin-bottom:8px;"><b>Вражеские персонажи (от 1 до 6):</b></label>
      <input type="text" id="search" placeholder="🔍 Поиск персонажа..." 
             style="width:100%;padding:8px;font-size:13px;margin-bottom:10px;box-sizing:border-box;border:1px solid #ccc;border-radius:4px;">
      <div id="list" style="max-height:180px;overflow-y:auto;border:1px solid #ccc;border-radius:4px;background:#fafafa;">
        ${items}
      </div>
      <div style="margin-top:10px;display:flex;justify-content:space-between;align-items:center;font-size:12px;color:#666;">
        <span>Выбрано врагов: <b id="enemyCount">${enemySet.size}</b> / 6</span>
        <button onclick="clearEnemies()" style="padding:4px 10px;font-size:11px;background:#eee;border:1px solid #ccc;border-radius:3px;cursor:pointer;">Сбросить</button>
      </div>
      
      <!-- Сообщения об ошибках валидации -->
      <div id="validationMsg" style="color:#d32f2f;font-size:12px;min-height:18px;margin-top:10px;"></div>
      
      <!-- Кнопка сохранения -->
      <div style="margin-top:15px;text-align:right;">
        <button id="saveBtn" onclick="saveCounter()" 
                style="padding:8px 20px;background:#d32f2f;color:white;border:none;border-radius:4px;cursor:pointer;">
          💾 Сохранить
        </button>
      </div>
      
      <!-- Блок действий: продолжить или завершить -->
      ${actionsBlock}
    </div>
    <script>
      ${getCommonJs()}
      
      // ========== ИНИЦИАЛИЗАЦИЯ ==========
      const searchInput = document.getElementById('search');
      const listEl = document.getElementById('list');
      const enemyCountEl = document.getElementById('enemyCount');
      const allItems = Array.from(listEl.querySelectorAll('.hero-item'));
      
      // ========== ОБНОВЛЕНИЕ СЧЁТЧИКА ВРАГОВ ==========
      function updateEnemyCount() {
        const checked = document.querySelectorAll('.enemy-cb:checked');
        enemyCountEl.textContent = checked.length;
        enemyCountEl.style.color = checked.length > 6 ? '#d32f2f' : (checked.length === 0 ? '#ff9800' : '#333');
      }
      
      // ========== СООБЩЕНИЕ О СОСТАВЕ КОМАНДЫ ==========
      function updateCompositionMsg() {
        const sup = parseInt(document.getElementById('COUNTER_SUP').value) || 0;
        const dps = parseInt(document.getElementById('COUNTER_DPS').value) || 0;
        const tnk = parseInt(document.getElementById('COUNTER_TNK').value) || 0;
        const total = sup + dps + tnk;
        const msgEl = document.getElementById('compositionMsg');
        
        if (total === 0) {
          msgEl.textContent = '⚠️ Выберите хотя бы одного персонажа';
          msgEl.style.color = '#d32f2f';
        } else if (total === 1) {
          msgEl.textContent = '🎯 Одиночный контрпик — будет выбран один идеальный персонаж';
          msgEl.style.color = '#1976d2';
        } else if (total <= 6) {
          msgEl.textContent = '✅ Команда из ' + total + ' персонажей (' + sup + '-' + dps + '-' + tnk + ')';
          msgEl.style.color = '#388e3c';
        } else {
          msgEl.textContent = '❌ Максимум 6 персонажей (сейчас: ' + total + ')';
          msgEl.style.color = '#d32f2f';
        }
      }
      
      // ========== ВАЛИДАЦИЯ ФОРМЫ ==========
      function validate() {
        const sheetName = document.getElementById('COUNTER_RESULT_SHEET_NAME').value.trim();
        const sup = parseInt(document.getElementById('COUNTER_SUP').value) || 0;
        const dps = parseInt(document.getElementById('COUNTER_DPS').value) || 0;
        const tnk = parseInt(document.getElementById('COUNTER_TNK').value) || 0;
        const total = sup + dps + tnk;
        const enemies = document.querySelectorAll('.enemy-cb:checked');
        
        const msgEl = document.getElementById('validationMsg');
        const btn = document.getElementById('saveBtn');
        const errors = [];
        
        // Валидация имени листа
        if (!sheetName) {
          errors.push('Укажите имя листа');
        } else if (sheetName.length > 100) {
          errors.push('Имя листа слишком длинное');
        }
        
        // Валидация состава
        if (total === 0) {
          errors.push('Выберите хотя бы одного персонажа');
        } else if (total > 6) {
          errors.push('Максимум 6 персонажей');
        }
        
        // Валидация количества врагов
        if (enemies.length === 0) {
          errors.push('Выберите хотя бы одного врага');
        } else if (enemies.length > 6) {
          errors.push('Максимум 6 врагов');
        }
        
        // Валидация отдельных полей состава
        if (sup < 0 || sup > 6) errors.push('Sup: 0-6');
        if (dps < 0 || dps > 6) errors.push('DPS: 0-6');
        if (tnk < 0 || tnk > 6) errors.push('Tnk: 0-6');
        
        if (errors.length > 0) {
          msgEl.textContent = '⚠️ ' + errors.join(' | ');
          btn.disabled = true;
          btn.style.opacity = 0.5;
          return false;
        }
        msgEl.textContent = '';
        btn.disabled = false;
        btn.style.opacity = 1;
        return true;
      }
      
      // ========== ПОИСК ПО СПИСКУ ==========
      searchInput.addEventListener('input', function() {
        const q = this.value.toLowerCase().trim();
        allItems.forEach(item => {
          const name = item.getAttribute('data-name');
          item.style.display = name.includes(q) ? 'flex' : 'none';
        });
      });
      
      // ========== ОБРАБОТКА ИЗМЕНЕНИЙ ЧЕКБОКСОВ ==========
      listEl.addEventListener('change', function(e) {
        if (e.target.classList.contains('enemy-cb')) {
          if (document.querySelectorAll('.enemy-cb:checked').length > 6) {
            e.target.checked = false;
            alert('Максимум 6 вражеских персонажей!');
            return;
          }
          updateEnemyCount();
          validate();
        }
      });
      
      // ========== ОБРАБОТКА ИЗМЕНЕНИЙ ПОЛЕЙ СОСТАВА ==========
      document.getElementById('COUNTER_SUP').addEventListener('input', () => { 
        updateCompositionMsg(); 
        validate(); 
      });
      document.getElementById('COUNTER_DPS').addEventListener('input', () => { 
        updateCompositionMsg(); 
        validate(); 
      });
      document.getElementById('COUNTER_TNK').addEventListener('input', () => { 
        updateCompositionMsg(); 
        validate(); 
      });
      document.getElementById('COUNTER_RESULT_SHEET_NAME').addEventListener('input', validate);
      
      // ========== СБРОС ВРАГОВ ==========
      function clearEnemies() {
        document.querySelectorAll('.enemy-cb').forEach(cb => cb.checked = false);
        updateEnemyCount();
        validate();
      }
      
      // ========== СОХРАНЕНИЕ ==========
      function saveCounter() {
        if (!validate()) return;
        
        const data = {
          sheetName: document.getElementById('COUNTER_RESULT_SHEET_NAME').value.trim(),
          sup: parseInt(document.getElementById('COUNTER_SUP').value) || 0,
          dps: parseInt(document.getElementById('COUNTER_DPS').value) || 0,
          tnk: parseInt(document.getElementById('COUNTER_TNK').value) || 0,
          enemies: Array.from(document.querySelectorAll('.enemy-cb:checked')).map(cb => cb.value),
          useCounter: document.getElementById('USE_COUNTER_PICKS').checked
        };
        
        showSpinner('Сохранение...');
        google.script.run
          .withSuccessHandler(() => {
            google.script.run
              .withSuccessHandler(() => {
                google.script.host.close();
              })
              .markSettingVisited("counter");
          })
          .withFailureHandler(err => showError(err))
          .saveCounterPickData(data);
      }
      
      // ========== ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ ==========
      updateEnemyCount();
      updateCompositionMsg();
      validate();
    </script>
  `

  SpreadsheetApp.getUi().showModalDialog(
    HtmlService.createHtmlOutput(html).setWidth(450).setHeight(850),
    'Против вражеской композиции'
  )
}

// ==========================================
// ЗАЩИТА ОТ XSS — ЭКРАНИРОВАНИЕ HTML
// ==========================================
function escapeHtml(text) {
  if (text === null || text === undefined) return ''
  return text
    .toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// Специальное экранирование для атрибутов
function escapeAttr(text) {
  return escapeHtml(text).replace(/\n/g, ' ').replace(/\r/g, '')
}
