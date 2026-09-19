function openSettingsModal() {
    updateSettingsMobileInfo();
    if (typeof syncDebugSettingsCheckbox === 'function') syncDebugSettingsCheckbox();
    openUiModal('settings-modal');
}

function closeSettingsModal(restoreSearch) {
    closeUiModal('settings-modal');
    if (restoreSearch !== false) restoreLinkSearchFocus();
}


function buildColorThemeField(field) {
    const wrap = document.createElement('div');
    wrap.className = 'color-theme-modal__field';

    const label = document.createElement('label');
    label.className = 'color-theme-modal__label';
    label.textContent = field.label;
    wrap.appendChild(label);

    const controls = document.createElement('div');
    controls.className = 'color-theme-modal__controls';

    const picker = document.createElement('input');
    picker.type = 'color';
    picker.id = colorFieldPickerId(field);
    picker.className = 'color-theme-modal__picker';
    controls.appendChild(picker);

    const text = document.createElement('input');
    text.type = 'text';
    text.id = colorFieldTextId(field);
    text.className = 'color-theme-modal__hex';
    text.placeholder = field.light;
    controls.appendChild(text);

    const reset = document.createElement('button');
    reset.type = 'button';
    reset.className = 'reset-single-color color-theme-modal__reset';
    reset.dataset.field = field.key;
    reset.title = 'Reset to default';
    const icon = document.createElement('i');
    icon.className = 'fa-solid fa-undo';
    reset.appendChild(icon);
    controls.appendChild(reset);

    wrap.appendChild(controls);
    return wrap;
}

/** True when the browser is in mobile/device mode (UA or coarse touch pointer). */
function isMobileBrowser() {
    try {
        if (navigator.userAgentData && navigator.userAgentData.mobile === true) {
            return true;
        }
    } catch (e) { /* ignore */ }

    var ua = navigator.userAgent || '';
    if (/Mobi|Android|iPhone|iPod|IEMobile|Opera Mini/i.test(ua)) return true;

    try {
        return window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    } catch (e2) {
        return false;
    }
}

function updateColorThemeMobileLayout() {
    var mobile = isMobileBrowser();
    document.documentElement.classList.toggle('is-mobile', mobile);
    var modal = document.getElementById('color-theme-modal');
    if (modal) modal.classList.toggle('is-mobile', mobile);
    if (typeof refreshAbcSectionNavLayout === 'function') {
        refreshAbcSectionNavLayout();
    }
    updateSettingsMobileInfo();
}

function updateSettingsMobileInfo() {
    var info = document.getElementById('settings-mobile-info');
    var dprEl = document.getElementById('settings-dpr-value');
    if (!info) return;

    var mobile = isMobileBrowser();
    if (mobile) info.removeAttribute('hidden');
    else info.setAttribute('hidden', '');

    if (dprEl) {
        var dpr = window.devicePixelRatio;
        dprEl.textContent = (typeof dpr === 'number' && isFinite(dpr)) ? String(dpr) : '—';
    }
}

function syncDebugSettingsCheckbox() {
    var cb = document.getElementById('debug-panel-checkbox');
    if (!cb) return;
    var open = (typeof isDebugPanelOpen === 'function') ? !!isDebugPanelOpen() : false;
    cb.checked = open;
}

function ensureColorThemeFields() {
    const grid = document.querySelector('#color-theme-modal .color-theme-modal__grid');
    if (!grid || grid.dataset.fieldsBuilt === 'true') return;
    const actions = grid.querySelector('.color-theme-modal__actions');
    if (!actions) return;

    const byKey = {};
    COLOR_FIELDS.forEach(function (f) { byKey[f.key] = f; });

    // All fields first so 2-col auto-placement puts actions on the last row.
    // 3-col still pins actions with CSS (col 3, rows 4–5).
    COLOR_EDITOR_KEYS.forEach(function (key) {
        const field = byKey[key];
        if (!field) return;
        grid.insertBefore(buildColorThemeField(field), actions);
    });
    grid.dataset.fieldsBuilt = 'true';
}

function openColorThemeModal() {
    closeSettingsModal(false);
    ensureColorThemeFields();
    const modal = document.getElementById('color-theme-modal');
    const colors = readStoredColors();

    COLOR_FIELDS.forEach(field => {
        const stored = colors[field.key];

        const pickerEl = document.getElementById(colorFieldPickerId(field));
        if (pickerEl) pickerEl.value = stored;

        const textEl = document.getElementById(colorFieldTextId(field));
        if (textEl) textEl.value = stored;
    });

    function setupSync(pickerId, textId) {
        const picker = document.getElementById(pickerId);
        const text = document.getElementById(textId);
        if (!picker || !text) return;

        picker.oninput = () => { text.value = picker.value; };
        text.oninput = () => {
            if (/^#[0-9A-Fa-f]{6}$/.test(text.value)) {
                picker.value = text.value;
            }
        };
    }

    COLOR_FIELDS.forEach(field => {
        setupSync(colorFieldPickerId(field), colorFieldTextId(field));
    });

    if (!modal.dataset.resetHandlersAttached) {
        modal.dataset.resetHandlersAttached = 'true';
        const grid = modal.querySelector('.color-theme-modal__grid');
        if (grid) {
            grid.addEventListener('click', (e) => {
                const btn = e.target.closest('.reset-single-color');
                if (!btn) return;
                e.preventDefault();
                const fieldKey = btn.dataset.field;
                if (fieldKey) {
                    resetSingleColor(fieldKey);
                }
            });
        }
    }

    updateColorThemeMobileLayout();
    openUiModal('color-theme-modal');
}

function closeColorThemeModal() {
    closeUiModal('color-theme-modal');
    openSettingsModal();
}

function applyAndSaveColors() {
    try {
        const colors = getCurrentColorValues();
        applyColors(colors);
        saveColorSettings(colors);
        closeColorThemeModal();
    } catch (e) {
        console.error("Error saving colors:", e);
        alert("There was an error saving the colors. Check the console for details.");
    }
}


function getCurrentColorValues() {
    const getVal = (id, def) => {
        const el = document.getElementById(id);
        return (el && el.value) ? el.value : def;
    };

    const colors = {};
    COLOR_FIELDS.forEach(field => {
        colors[field.key] = getVal(colorFieldTextId(field), field.light);
    });
    return colors;
}


function resetSingleColor(fieldKey) {
    const def = COLOR_DEFAULTS[fieldKey];
    const field = colorFieldByKey(fieldKey);
    if (!def || !field) {
        console.warn('Unknown color field:', fieldKey);
        return;
    }

    const pickerEl = document.getElementById(colorFieldPickerId(field));
    const textEl = document.getElementById(colorFieldTextId(field));

    if (pickerEl) pickerEl.value = def;
    if (textEl) textEl.value = def;

    const colors = getCurrentColorValues();
    applyColors(colors);
}

/** Apply palette to editor, live preview, and storage. */
function applyColorPalette(palette) {
    if (!palette) return;

    Object.keys(palette).forEach(key => {
        const field = colorFieldByKey(key);
        if (!field) return;
        const value = palette[key];
        const pickerEl = document.getElementById(colorFieldPickerId(field));
        if (pickerEl) pickerEl.value = value;

        const textEl = document.getElementById(colorFieldTextId(field));
        if (textEl) textEl.value = value;
    });

    applyColors(palette);
    saveColorSettings(palette);
}

/** @param {'light'|'dark'} mode */
function applyColorMode(mode) {
    const palette = mode === 'light' ? COLOR_LIGHT_DEFAULTS : COLOR_DEFAULTS;
    applyColorPalette(palette);
}


function openAttributionModal() {
    closeSettingsModal(false);
    openUiModal('attribution-modal');
}

function closeAttributionModal() {
    closeUiModal('attribution-modal');
    openSettingsModal();
}

function applyColors(colors) {
    const textColor = colors.text || COLOR_DEFAULTS.text;
    document.body.style.backgroundColor = colors.bg || COLOR_DEFAULTS.bg;
    document.body.style.color = textColor;
    document.documentElement.style.setProperty('--text-color', textColor);
    document.documentElement.style.setProperty('--background-color', colors.bg || COLOR_DEFAULTS.bg);

    document.documentElement.style.setProperty('--card-bg', colors.card || COLOR_DEFAULTS.card);
    document.documentElement.style.setProperty('--active-cat-bg', colors.activeCat || COLOR_DEFAULTS.activeCat);
    document.documentElement.style.setProperty('--active-cat-color', colors.activeCat || COLOR_DEFAULTS.activeCat);
    document.documentElement.style.setProperty('--category-bg', colors.category || COLOR_DEFAULTS.category);

    if (colors.textbox) document.documentElement.style.setProperty('--textbox-bg', colors.textbox);
    if (colors.activeText) {
        document.documentElement.style.setProperty('--active-text-color', colors.activeText);
        document.documentElement.style.setProperty('--active-cat-text', colors.activeText);
    }
    if (colors.emojiBg) document.documentElement.style.setProperty('--emoji-bg', colors.emojiBg);
    if (colors.hoverBlend) document.documentElement.style.setProperty('--hover-blend', colors.hoverBlend);
    if (colors.button) document.documentElement.style.setProperty('--button-bg', colors.button);
    if (colors.saveButton) document.documentElement.style.setProperty('--save-button-bg', colors.saveButton);
    if (colors.success) document.documentElement.style.setProperty('--success-color', colors.success);
    if (colors.caution) document.documentElement.style.setProperty('--caution-color', colors.caution);
}



function loadColorSettings() {
    const firstVisit = !hasStoredColorSettings();
    const colors = readStoredColors();
    applyColors(colors);
    if (firstVisit) saveColorSettings(colors);
}

function saveColorSettings(colors) {
    COLOR_FIELDS.forEach(field => {
        const val = colors[field.key];
        if (field.saveIfSet) {
            if (val) localStorage.setItem(field.storage, val);
        } else {
            localStorage.setItem(field.storage, val);
        }
    });
    localStorage.removeItem('startpage_search_color');
}

ensureColorThemeFields();
updateColorThemeMobileLayout();
window.addEventListener('resize', updateColorThemeMobileLayout);
try {
    var colorThemeMobileMq = window.matchMedia('(hover: none) and (pointer: coarse)');
    if (colorThemeMobileMq.addEventListener) {
        colorThemeMobileMq.addEventListener('change', updateColorThemeMobileLayout);
    } else if (colorThemeMobileMq.addListener) {
        colorThemeMobileMq.addListener(updateColorThemeMobileLayout);
    }
} catch (e) { /* ignore */ }










