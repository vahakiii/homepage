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
    if (typeof syncAddEditModalLayout === 'function') syncAddEditModalLayout();
    if (typeof syncGitHubCredentialsModalLayout === 'function') syncGitHubCredentialsModalLayout();
    if (typeof refreshAbcSectionNavLayout === 'function') {
        refreshAbcSectionNavLayout();
    }
    applyMobileZoomLock(mobile);
    updateSettingsMobileInfo();
    syncMobileLandscapeLock();
    if (typeof updateDatetimeVisibility === 'function') {
        updateDatetimeVisibility();
    }
}

var VIEWPORT_DESKTOP = 'width=device-width, initial-scale=1.0';
var VIEWPORT_MOBILE = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no';
var mobileZoomLocked = false;

function onMobileZoomGesture(e) {
    e.preventDefault();
}

function onMobilePinchTouch(e) {
    var scale = e.scale;
    if ((e.touches && e.touches.length > 1) || (typeof scale === 'number' && scale !== 1)) {
        e.preventDefault();
    }
}

/** Block pinch-zoom and double-tap zoom while the site is in mobile mode. */
function applyMobileZoomLock(mobile) {
    var meta = document.querySelector('meta[name="viewport"]');
    if (meta) meta.setAttribute('content', mobile ? VIEWPORT_MOBILE : VIEWPORT_DESKTOP);

    if (!!mobile === mobileZoomLocked) return;
    mobileZoomLocked = !!mobile;

    var opts = { passive: false, capture: true };
    if (mobile) {
        document.addEventListener('gesturestart', onMobileZoomGesture, opts);
        document.addEventListener('gesturechange', onMobileZoomGesture, opts);
        document.addEventListener('gestureend', onMobileZoomGesture, opts);
        document.addEventListener('touchstart', onMobilePinchTouch, opts);
        document.addEventListener('touchmove', onMobilePinchTouch, opts);
    } else {
        document.removeEventListener('gesturestart', onMobileZoomGesture, true);
        document.removeEventListener('gesturechange', onMobileZoomGesture, true);
        document.removeEventListener('gestureend', onMobileZoomGesture, true);
        document.removeEventListener('touchstart', onMobilePinchTouch, true);
        document.removeEventListener('touchmove', onMobilePinchTouch, true);
    }
}

function updateSettingsMobileInfo() {
    var info = document.getElementById('settings-mobile-info');
    if (!info) return;

    var mobile = isMobileBrowser();
    var field = info.closest('.settings-modal__field');
    if (mobile) {
        info.removeAttribute('hidden');
        if (field) field.classList.remove('is-hidden');
    } else {
        info.setAttribute('hidden', '');
        if (field) field.classList.add('is-hidden');
    }
}

function isLandscapeOrientation() {
    try {
        var mq = window.matchMedia('(orientation: landscape)');
        if (mq && typeof mq.matches === 'boolean') return mq.matches;
    } catch (e) { /* ignore */ }
    return (Number(window.innerWidth) || 0) > (Number(window.innerHeight) || 0);
}

var landscapeLockActive = false;

function onLandscapeLockKey(e) {
    if (!landscapeLockActive) return;
    e.preventDefault();
    e.stopImmediatePropagation();
}

function onLandscapeLockInput(e) {
    if (!landscapeLockActive) return;
    var overlay = document.getElementById('landscape-lock');
    if (overlay && overlay.contains(e.target)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
}

/** Block the whole site on mobile devices held in landscape until they rotate to portrait. */
function syncMobileLandscapeLock() {
    var lock = !!(isMobileBrowser() && isLandscapeOrientation());
    var wasLocked = landscapeLockActive;
    landscapeLockActive = lock;
    document.documentElement.classList.toggle('is-landscape', lock);

    var overlay = document.getElementById('landscape-lock');
    var kids = document.body ? document.body.children : [];
    for (var i = 0; i < kids.length; i++) {
        if (overlay && kids[i] === overlay) continue;
        if (lock) kids[i].setAttribute('inert', '');
        else kids[i].removeAttribute('inert');
    }

    if (overlay) {
        overlay.setAttribute('aria-hidden', lock ? 'false' : 'true');
        if (lock && !wasLocked) {
            try { overlay.focus(); } catch (e) { /* ignore */ }
        }
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
    const byKey = {};
    COLOR_FIELDS.forEach(function (f) { byKey[f.key] = f; });

    COLOR_EDITOR_KEYS.forEach(function (key) {
        const field = byKey[key];
        if (!field) return;
        grid.appendChild(buildColorThemeField(field));
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
    const themeGrid = modal.querySelector('.color-theme-modal__grid');
    if (themeGrid) themeGrid.scrollTop = 0;
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
    const body = document.querySelector('#attribution-modal .attribution-modal__body');
    if (body) body.scrollTop = 0;
}

function closeAttributionModal() {
    closeUiModal('attribution-modal');
    openSettingsModal();
}

function openAboutModal() {
    closeSettingsModal(false);
    openUiModal('about-modal');
    const body = document.querySelector('#about-modal .about-modal__body');
    if (body) body.scrollTop = 0;
}

function closeAboutModal() {
    closeUiModal('about-modal');
    openSettingsModal();
}

var otherOptionsOpenedFromSettings = false;
var RESET_PHRASE = 'CLEAR EVERYTHING!';
var RESET_HIDE_SECONDS = 5;
var resetHideTimer = null;
var resetHideRemaining = RESET_HIDE_SECONDS;

function stopResetHideTimer() {
    if (resetHideTimer) {
        clearInterval(resetHideTimer);
        resetHideTimer = null;
    }
}

function updateResetHideLabel() {
    var el = document.getElementById('other-options-reset-timer');
    if (el) el.textContent = '(hides in ' + resetHideRemaining + ' seconds)';
}

function startResetHideTimer() {
    stopResetHideTimer();
    resetHideRemaining = RESET_HIDE_SECONDS;
    updateResetHideLabel();
    resetHideTimer = setInterval(function () {
        resetHideRemaining -= 1;
        if (resetHideRemaining <= 0) {
            stopResetHideTimer();
            hideOtherOptionsResetSection();
            return;
        }
        updateResetHideLabel();
    }, 1000);
}

function syncOtherOptionsSightSection() {
    var hidden = !otherOptionsOpenedFromSettings;
    var sight = document.getElementById('other-options-sight');
    var rule = document.getElementById('other-options-sight-rule');
    if (sight) sight.classList.toggle('is-hidden', hidden);
    if (rule) rule.classList.toggle('is-hidden', hidden);
}

function hideOtherOptionsResetSection() {
    stopResetHideTimer();
    var more = document.getElementById('other-options-show-more');
    var rest = document.getElementById('other-options-reset');
    if (rest) rest.classList.add('is-hidden');
    if (more) more.classList.toggle('is-hidden', !otherOptionsOpenedFromSettings);
}

function submitResetPhrase() {
    var phrase = document.getElementById('reset-confirm-phrase');
    if (phrase && phrase.value === RESET_PHRASE) {
        setResetConfirmStep('sure');
        return;
    }
    window.alert('Rest Failed!');
    closeUiModal('reset-confirm-modal');
    hideOtherOptionsResetSection();
}

function scrollOtherOptionsBodyToEnd() {
    var body = document.querySelector('#other-options-modal .other-options-modal__body');
    if (!body) return;
    body.scrollTop = body.scrollHeight;
}

function showOtherOptionsResetSection() {
    var more = document.getElementById('other-options-show-more');
    var rest = document.getElementById('other-options-reset');
    if (more) more.classList.add('is-hidden');
    if (rest) rest.classList.remove('is-hidden');
    startResetHideTimer();
    scrollOtherOptionsBodyToEnd();
    requestAnimationFrame(scrollOtherOptionsBodyToEnd);
}

function setResetConfirmStep(step) {
    var modal = document.getElementById('reset-confirm-modal');
    if (!modal) return;
    modal.querySelectorAll('[data-reset-step]').forEach(function (el) {
        el.classList.toggle('is-hidden', el.getAttribute('data-reset-step') !== step);
    });
    modal.querySelectorAll('[data-reset-actions]').forEach(function (el) {
        el.classList.toggle('is-hidden', el.getAttribute('data-reset-actions') !== step);
    });
    if (step === 'type') {
        var input = document.getElementById('reset-confirm-phrase');
        if (input) {
            input.value = '';
            setTimeout(function () { input.focus(); }, 0);
        }
    }
}

function openResetConfirmModal() {
    setResetConfirmStep('warn');
    openUiModal('reset-confirm-modal');
}

function cancelResetConfirm() {
    closeUiModal('reset-confirm-modal');
    hideOtherOptionsResetSection();
    var options = document.getElementById('other-options-modal');
    if (options && !options.classList.contains('is-open')) {
        openUiModal('other-options-modal');
        options.style.display = 'flex';
    }
}

function clearAllAppData() {
    try {
        localStorage.clear();
        localStorage.setItem('startpage_links', '[]');
    } catch (e) { /* ignore */ }
    window.location.reload();
}

function bindResetConfirmControls() {
    var more = document.getElementById('other-options-show-more');
    if (more) more.addEventListener('click', showOtherOptionsResetSection);
    var clearBtn = document.getElementById('other-options-clear-all');
    if (clearBtn) clearBtn.addEventListener('click', openResetConfirmModal);
    ['reset-confirm-close', 'reset-cancel-warn', 'reset-cancel-type', 'reset-no'].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.addEventListener('click', cancelResetConfirm);
    });
    var cont = document.getElementById('reset-continue');
    if (cont) cont.addEventListener('click', function () { setResetConfirmStep('type'); });
    var phrase = document.getElementById('reset-confirm-phrase');
    if (phrase) {
        phrase.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                submitResetPhrase();
            }
        });
    }
    var submit = document.getElementById('reset-submit');
    if (submit) submit.addEventListener('click', submitResetPhrase);
    var yes = document.getElementById('reset-yes');
    if (yes) yes.addEventListener('click', clearAllAppData);
}

function syncPopupDurationFields(fromSettings) {
    var block = document.getElementById('popup-duration-settings');
    if (!block) return;
    if (typeof fromSettings === 'boolean') {
        block.classList.toggle('is-hidden', !fromSettings);
    }
    var linkInput = document.getElementById('mobile-link-desc-seconds');
    var emojiInput = document.getElementById('emoji-desc-seconds');
    if (linkInput && typeof getMobileLinkDescriptionSeconds === 'function') {
        linkInput.value = String(getMobileLinkDescriptionSeconds());
    }
    if (emojiInput && typeof getEmojiDescriptionSeconds === 'function') {
        emojiInput.value = String(getEmojiDescriptionSeconds());
    }
}

function openOtherOptionsModal() {
    var modal = document.getElementById('other-options-modal');
    if (!modal) return;
    if (modal.parentElement !== document.body) document.body.appendChild(modal);
    var settingsOpen = typeof isUiModalOpen === 'function' && isUiModalOpen('settings-modal');
    otherOptionsOpenedFromSettings = !!settingsOpen;
    if (typeof syncPopupDurationFields === 'function') {
        syncPopupDurationFields(otherOptionsOpenedFromSettings);
    }
    if (settingsOpen) closeSettingsModal(false);
    syncOtherOptionsSightSection();
    hideOtherOptionsResetSection();
    openUiModal('other-options-modal');
    modal.style.display = 'flex';
    var body = modal.querySelector('.other-options-modal__body');
    if (body) body.scrollTop = 0;
}

function closeOtherOptionsModal() {
    var modal = document.getElementById('other-options-modal');
    hideOtherOptionsResetSection();
    closeUiModal('other-options-modal');
    if (modal) modal.style.display = '';
    if (otherOptionsOpenedFromSettings) openSettingsModal();
    otherOptionsOpenedFromSettings = false;
}

document.addEventListener('click', function (e) {
    var btn = e.target && e.target.closest && e.target.closest('#open-other-options-btn');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    openOtherOptionsModal();
}, true);

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
bindResetConfirmControls();
updateColorThemeMobileLayout();
window.addEventListener('resize', updateColorThemeMobileLayout);
window.addEventListener('orientationchange', updateColorThemeMobileLayout);
document.addEventListener('keydown', onLandscapeLockKey, true);
document.addEventListener('click', onLandscapeLockInput, true);
document.addEventListener('pointerdown', onLandscapeLockInput, true);
document.addEventListener('mousedown', onLandscapeLockInput, true);
document.addEventListener('touchstart', onLandscapeLockInput, true);
try {
    var colorThemeMobileMq = window.matchMedia('(hover: none) and (pointer: coarse)');
    if (colorThemeMobileMq.addEventListener) {
        colorThemeMobileMq.addEventListener('change', updateColorThemeMobileLayout);
    } else if (colorThemeMobileMq.addListener) {
        colorThemeMobileMq.addListener(updateColorThemeMobileLayout);
    }
} catch (e) { /* ignore */ }
try {
    var landscapeMq = window.matchMedia('(orientation: landscape)');
    if (landscapeMq.addEventListener) {
        landscapeMq.addEventListener('change', updateColorThemeMobileLayout);
    } else if (landscapeMq.addListener) {
        landscapeMq.addListener(updateColorThemeMobileLayout);
    }
} catch (e2) { /* ignore */ }










