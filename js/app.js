function filterByCategory(cat) {
    currentFilterCategory = cat;
    renderCategoriesSidebar();
    renderLinks();
    const ind = document.getElementById('filter-indicator');
    if (ind) ind.textContent = `• ${cat}`;
}

function clearCategoryFilter() {
    currentFilterCategory = null;
    categorySearchTerm = '';
    linkSearchTerm = '';

    const catSearch = document.getElementById('category-search');
    if (catSearch) catSearch.value = '';

    const linkSearch = document.getElementById('link-search-input');
    if (linkSearch) linkSearch.value = '';

    renderCategoriesSidebar();
    renderLinks();
    const ind = document.getElementById('filter-indicator');
    if (ind) ind.textContent = '';
}

function clearCategorySearch() {
    const input = document.getElementById('category-search');
    if (input) {
        input.value = '';
        categorySearchTerm = '';
        renderCategoriesSidebar();
    }
}

function clearLinkSearch() {
    const input = document.getElementById('link-search-input');
    if (input) {
        input.value = '';
        linkSearchTerm = '';
        renderLinks();
    }
}

function renameCategory(oldName) {
    const newName = prompt(`Rename "${oldName}" to:`, oldName);
    if (!newName || newName.trim() === oldName) return;
    const nn = newName.trim();
    links.forEach(l => {
        if (Array.isArray(l.categories)) {
            l.categories = l.categories.map(c => c === oldName ? nn : c);
        }
    });
    if (currentFilterCategory === oldName) currentFilterCategory = nn;
    saveLinks();
    renderCategoriesSidebar();
    renderLinks();
}

function deleteCategory(name) {
    if (!confirm(`Remove category "${name}" from all links?`)) return;
    links.forEach(l => {
        if (Array.isArray(l.categories)) l.categories = l.categories.filter(c => c !== name);
    });
    if (currentFilterCategory === name) currentFilterCategory = null;
    saveLinks();
    renderCategoriesSidebar();
    renderLinks();
}


function deleteLink(id) {
    const cardsBefore = document.querySelectorAll('#links-grid .link-card');
    let deletedIndex = -1;

    for (let i = 0; i < cardsBefore.length; i++) {
        if (Number(cardsBefore[i].dataset.id) === id) {
            deletedIndex = i;
            break;
        }
    }

    if (!confirm("Delete this link?")) return;

    links = links.filter(link => link.id !== id);
    saveLinks();
    renderLinks();
    renderCategoriesSidebar();

    const remainingCards = document.querySelectorAll('#links-grid .link-card');
    let focusIndex = -1;

    if (remainingCards.length === 0) {
        keyboardFocusedIndex = -1;
    } else {
        focusIndex = deletedIndex;
        if (focusIndex >= remainingCards.length) focusIndex = remainingCards.length - 1;
        if (focusIndex < 0) focusIndex = 0;

        keyboardFocusedIndex = focusIndex;
        applyLinkCardKeyboardFocus();
    }

    const linkSearch = document.getElementById('link-search-input');
    if (linkSearch) {
        linkSearch.focus();
        // focus() can clear highlight; re-apply after a short delay
        if (focusIndex !== -1 && remainingCards.length > 0) {
            setTimeout(() => {
                keyboardFocusedIndex = focusIndex;
                applyLinkCardKeyboardFocus();
            }, 50);
        }
    }
}



function moveCurrentEditLink(toEnd) {
    if (!currentEditId || isManualSortLocked()) return;
    const index = links.findIndex(l => l.id == currentEditId);
    if (index < 0) return;
    if (!toEnd && index === 0) return;
    if (toEnd && index >= links.length - 1) return;
    const [item] = links.splice(index, 1);
    if (toEnd) links.push(item);
    else links.unshift(item);
    saveLinks();
    renderLinks();
}

function moveLinkToTop() {
    moveCurrentEditLink(false);
}

function moveLinkToBottom() {
    moveCurrentEditLink(true);
}

function updateSortModeUI() {
    const sortDefaultBtn = document.getElementById('sort-default');
    const sortTallyBtn = document.getElementById('sort-tally');
    const sortAbcBtn = document.getElementById('sort-abc');
    const sortDateBtn = document.getElementById('sort-date');
    const sortNote = document.getElementById('sort-note');
    const dragReorderText = document.getElementById('drag-reorder-text');

    [sortDefaultBtn, sortTallyBtn, sortAbcBtn, sortDateBtn].forEach(btn => {
        if (btn) btn.classList.remove('is-active');
    });
    if (sortMode === 'tally' && sortTallyBtn) sortTallyBtn.classList.add('is-active');
    else if (sortMode === 'abc' && sortAbcBtn) sortAbcBtn.classList.add('is-active');
    else if (sortMode === 'date' && sortDateBtn) sortDateBtn.classList.add('is-active');
    else if (sortDefaultBtn) sortDefaultBtn.classList.add('is-active');

    if (sortNote) {
        sortNote.classList.add('is-hidden');
        sortNote.textContent = getManualSortLockMessage();
    }

    if (dragReorderText) {
        if (sortMode === 'default') {
            dragReorderText.textContent = 'Drag reorder enabled';
            dragReorderText.classList.remove('is-hidden');
        } else {
            dragReorderText.textContent = '';
            dragReorderText.classList.add('is-hidden');
        }
        dragReorderText.classList.remove('date-warning');
    }
    updatePerspectiveLabel();
}

function setSortMode(mode) {
    const allowed = ['default', 'tally', 'abc', 'date'];
    sortMode = allowed.includes(mode) ? mode : 'default';
    try {
        localStorage.setItem('startpage_sort_mode', sortMode);
    } catch (e) {
        console.error('Error saving sort mode', e);
    }
    updateSortModeUI();
    renderLinks();
}

/** Syncs Full / Compact toggle button active state to `viewMode`. */
function updateViewModeUI() {
    const viewFullBtn = document.getElementById('view-full');
    const viewCompactBtn = document.getElementById('view-compact');
    if (!viewFullBtn || !viewCompactBtn) return;

    viewFullBtn.classList.remove('is-active');
    viewCompactBtn.classList.remove('is-active');

    if (viewMode === 'compact') {
        viewCompactBtn.classList.add('is-active');
    } else {
        viewFullBtn.classList.add('is-active');
    }
    updatePerspectiveLabel();
}

function getViewModeLabel() {
    return viewMode === 'compact' ? 'Compact' : 'Full';
}

function updatePerspectiveLabel() {
    const el = document.getElementById('perspective-value');
    if (!el) return;
    const buttonId = sortMode === 'tally' ? 'sort-tally'
        : sortMode === 'abc' ? 'sort-abc'
        : sortMode === 'date' ? 'sort-date'
        : 'sort-default';
    const button = document.getElementById(buttonId);
    const fromButton = button && button.textContent.trim();
    const sortLabel = fromButton
        || ((typeof getSortModeLabel === 'function') ? getSortModeLabel() : 'My Order');
    const viewLabel = getViewModeLabel();
    el.textContent = sortLabel + ' / ' + viewLabel;
}

function setViewMode(mode) {
    viewMode = (mode === 'compact') ? 'compact' : 'full';
    try {
        localStorage.setItem('startpage_view_mode', viewMode);
    } catch (e) {
        console.error('Error saving view mode', e);
    }
    updateViewModeUI();
    renderLinks();
}

function reorderLinks(draggedId, targetId) {
    // Drop during derived sort → switch to Default so manual order sticks
    if (isManualSortLocked()) {
        sortMode = 'default';
        try {
            localStorage.setItem('startpage_sort_mode', sortMode);
        } catch (e) {
            console.error('Error saving sort mode', e);
        }
        updateSortModeUI();
    }

    const draggedIndex = links.findIndex(l => l.id === draggedId);
    const targetIndex = links.findIndex(l => l.id === targetId);
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    const [movedItem] = links.splice(draggedIndex, 1);
    links.splice(targetIndex, 0, movedItem);
    
    saveLinks();
    renderLinks();
    renderCategoriesSidebar();
    scrollToLinkCard(movedItem.id);
}

function scrollToLinkCard(linkId) {
    if (linkId == null) return;
    const id = String(linkId);
    requestAnimationFrame(() => {
        const cards = document.querySelectorAll('#links-grid .link-card');
        for (let i = 0; i < cards.length; i++) {
            if (String(cards[i].dataset.id) === id) {
                cards[i].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                return;
            }
        }
    });
}



function isInTextField(el) {
    if (!el) return false;
    const tag = el.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA';
}

function setupSearchModalForm() {
    const searchModalForm = document.getElementById('search-modal-form');
    if (!searchModalForm) return;
    searchModalForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const input = document.getElementById('search-modal-input');
        const query = input ? input.value.trim() : '';
        if (query) {
            window.open('https://www.google.com/search?q=' + encodeURIComponent(query), '_blank');
            closeSearchModal();
            input.value = '';
        }
    });
}

/** Lazy-load js/debug.js the first time Debug is opened. */
var __debugScriptPromise = null;
var __debugToggleQueued = false;

function ensureDebugLoaded() {
    if (typeof window.__debugModuleLoaded !== 'undefined' && window.__debugModuleLoaded) {
        return Promise.resolve();
    }
    if (typeof toggleDebugPanel === 'function' && toggleDebugPanel !== requestDebugToggle) {
        window.__debugModuleLoaded = true;
        return Promise.resolve();
    }
    if (__debugScriptPromise) return __debugScriptPromise;

    __debugScriptPromise = new Promise(function (resolve, reject) {
        var s = document.createElement('script');
        s.src = 'js/debug.js';
        s.onload = function () {
            window.__debugModuleLoaded = true;
            resolve();
        };
        s.onerror = function () {
            __debugScriptPromise = null;
            reject(new Error('Failed to load js/debug.js'));
        };
        document.head.appendChild(s);
    });
    return __debugScriptPromise;
}

function requestDebugToggle() {
    if (window.__debugModuleLoaded && typeof toggleDebugPanel === 'function'
        && toggleDebugPanel !== requestDebugToggle) {
        toggleDebugPanel();
        return;
    }
    if (__debugToggleQueued) return;
    __debugToggleQueued = true;
    ensureDebugLoaded().then(function () {
        __debugToggleQueued = false;
        toggleDebugPanel();
    }).catch(function (err) {
        __debugToggleQueued = false;
        console.error(err);
    });
}

function requestDebugSet(open) {
    ensureDebugLoaded().then(function () {
        if (typeof setDebugPanelOpen === 'function') setDebugPanelOpen(!!open);
    }).catch(function (err) {
        console.error(err);
    });
}

function requestDebugUpdate() {
    ensureDebugLoaded().then(function () {
        if (typeof updateDebugInfo === 'function' && updateDebugInfo !== requestDebugUpdate) {
            updateDebugInfo();
        }
    }).catch(function (err) {
        console.error(err);
    });
}

function refreshDebugIfOpen() {
    if (typeof isDebugPanelOpen !== 'function' || !isDebugPanelOpen()) return;
    if (typeof updateDebugInfo === 'function' && updateDebugInfo !== requestDebugUpdate) {
        updateDebugInfo();
    }
}

function setupAppKeyboardShortcuts() {
    var uiModalCloseById = {
        'modal': closeModal,
        'settings-modal': closeSettingsModal,
        'color-theme-modal': closeColorThemeModal,
        'attribution-modal': closeAttributionModal,
        'about-modal': closeAboutModal,
        'other-options-modal': closeOtherOptionsModal,
        'reset-confirm-modal': cancelResetConfirm,
        'sync-modal': closeSyncModal,
        'sync-instructions-modal': closeSyncInstructionsModal,
        'github-credentials-modal': closeGitHubCredentialsModal,
        'gists-list-modal': closeGistsListModal,
        'search-modal': closeSearchModal
    };

    Object.keys(uiModalCloseById).forEach(function (id) {
        if (!isUiModalId(id)) console.warn('[Esc] close handler for unknown modal id:', id);
    });
    UI_MODAL_IDS.forEach(function (id) {
        if (typeof uiModalCloseById[id] !== 'function') {
            console.warn('[Esc] missing close handler for UI_MODAL_IDS entry:', id);
        }
    });

    function closeTopUiModal() {
        for (var i = 0; i < UI_MODAL_IDS.length; i++) {
            var id = UI_MODAL_IDS[i];
            if (!isUiModalOpen(id)) continue;
            var closeFn = uiModalCloseById[id];
            if (typeof closeFn === 'function') closeFn();
            return true;
        }
        return false;
    }

    document.addEventListener('keydown', e => {
        const modalOpen = isAnyUiModalOpen();
        const activeEl = document.activeElement;
        const targetEl = e.target;
        const inLinkSearch = !!(targetEl && targetEl.id === 'link-search-input');
        const linkCards = () => document.querySelectorAll('#links-grid .link-card');

        if (e.key === 'Escape') {
            closeTopUiModal();
            return;
        }

        // "/" → Google Search (page or link search; not other text fields)
        if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
            if (!isInTextField(targetEl)) {
                e.preventDefault();
                openSearchModal();
                return;
            }
            if (inLinkSearch && linkCards().length > 0) {
                e.preventDefault();
                openSearchModal();
                return;
            }
        }

        if (modalOpen) return;

        if (e.key === '+') {
            if (activeEl && activeEl.tagName === 'BODY') {
                e.preventDefault();
                openAddModal();
                return;
            }
            if (inLinkSearch && keyboardFocusedIndex !== -1) {
                e.preventDefault();
                openAddModal();
                return;
            }
        }

        if (e.key === '*') {
            if (activeEl && activeEl.tagName === 'BODY') {
                e.preventDefault();
                if (keyboardFocusedIndex !== -1) {
                    keyboardFocusedIndex = -1;
                    clearLinkCardKeyboardFocus();
                }
                const linkSearch = document.getElementById('link-search-input');
                if (linkSearch) {
                    linkSearch.focus();
                    linkSearch.select();
                    linkSearch.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                return;
            }
            if (inLinkSearch && keyboardFocusedIndex !== -1) {
                e.preventDefault();
                avt_ScrollToTop();
                return;
            }
        }

        if (e.key === '-') {
            if (keyboardFocusedIndex !== -1 || !inLinkSearch) {
                e.preventDefault();
                avt_ScrollToTop();
                clearCategoryFilter();
                keyboardFocusedIndex = -1;
                const linkSearch = document.getElementById('link-search-input');
                if (linkSearch) linkSearch.focus();
            }
        }
    });
}



function getDevicePixelRatio() {
    const dpr = Number(window.devicePixelRatio);
    return (isFinite(dpr) && dpr > 0) ? dpr : 1;
}

/** Viewport width used for every size breakpoint: window.innerWidth. */
function getLayoutWidth() {
    return Number(window.innerWidth) || 0;
}

function updateWidthBasedLayout() {
    if (typeof updateSettingsMobileInfo === 'function') {
        updateSettingsMobileInfo();
    }
    if (typeof updateMenuLabelsVisibility === 'function') {
        updateMenuLabelsVisibility();
    }
    if (typeof updateDatetimeVisibility === 'function') {
        updateDatetimeVisibility();
    }
    if (typeof updateListControlsLayout === 'function') {
        updateListControlsLayout();
    }
    updateSettingsHintsLayout();
    updatePageTitleSize();
    positionBackupMenu();
}

function bindLayoutWidthListeners() {
    window.addEventListener('resize', updateWidthBasedLayout);
}

/** Width threshold that grows with font scale: base / (1 - p), p = (fontScale - 100) / 100. */
function getFontAwareWidthThreshold(basePx) {
    const scale = currentFontScale || 100;
    const p = (scale - 100) / 100;
    const denom = 1 - p;
    if (!isFinite(denom) || denom <= 0) return 2000;
    return basePx / denom;
}

/** Header label collapse threshold: 1300 / (1 - p), p = (fontScale - 100) / 100. */
function getMenuCollapseThreshold() {
    let threshold = getFontAwareWidthThreshold(1300);
    threshold = Math.max(900, Math.min(threshold, 2000));
    return threshold;
}

function updateMenuLabelsVisibility() {
    const threshold = getMenuCollapseThreshold();
    const isNarrow = getLayoutWidth() < threshold;

    document.querySelectorAll('.menu-text-label').forEach(label => {
        if (isNarrow) {
            label.classList.add('is-hidden');
        } else {
            label.classList.remove('is-hidden');
        }
    });

    const actions = document.querySelector('.app-header__actions');
    const tightHeader = getLayoutWidth() <= 450;
    if (actions) {
        actions.classList.toggle('is-collapsed', isNarrow);
        actions.classList.toggle('is-tight-gap', tightHeader);
    }
    const logo = document.getElementById('header-logo');
    if (logo) logo.classList.toggle('is-button-size', tightHeader);
}

/** Visual rem size for the rocket title: 0.85 at 450px, 1.5 at 768px+. */
function getPageTitleVisualRem() {
    const minW = 450;
    const maxW = 768;
    const minRem = 0.85;
    const maxRem = 1.5;
    const t = (getLayoutWidth() - minW) / (maxW - minW);
    const clamped = Math.max(0, Math.min(1, t));
    return minRem + clamped * (maxRem - minRem);
}

/** Scale the 1.5rem title down (never up) so text stays sharp. */
function updatePageTitleSize() {
    const title = document.getElementById('page-title');
    if (!title) return;
    const baseRem = 1.5;
    const scale = getPageTitleVisualRem() / baseRem;
    title.classList.remove('is-wide');
    title.style.zoom = '';
    title.style.transformOrigin = 'left center';
    if (scale >= 0.999) {
        title.style.transform = '';
        title.style.marginRight = '';
        return;
    }
    title.style.transform = 'scale(' + scale + ')';
    title.style.marginRight = '';
    const layoutW = title.offsetWidth;
    title.style.marginRight = ((scale - 1) * layoutW) + 'px';
}

function updateDatetimeVisibility() {
    const el = document.querySelector('.header-datetime');
    if (!el) return;
    const layoutWidth = getLayoutWidth();
    const mobile = typeof isMobileBrowser === 'function' && isMobileBrowser();
    if (mobile) {
        el.classList.toggle('is-shown', layoutWidth >= 775);
        el.classList.add('is-stacked');
        return;
    }
    el.classList.toggle('is-shown', layoutWidth > 870);
    el.classList.toggle('is-stacked', layoutWidth < 1050);
}

/** Shrink Settings shortcut hints when width < 475px × font scale. */
function updateSettingsHintsLayout() {
    const hints = document.querySelector('.settings-modal__hints');
    if (!hints) return;
    const scale = (currentFontScale || 100) / 100;
    const threshold = 475 * scale;
    hints.classList.toggle('is-compact', getLayoutWidth() < threshold);
}

/** Stack "Show by" / "View" when width < 580 / font scale. */
function updateListControlsLayout() {
    const controls = document.getElementById('list-controls');
    if (!controls) return;

    const scale = (currentFontScale || 100) / 100;
    const threshold = 580 / scale;

    const shouldStack = getLayoutWidth() < threshold;

    if (shouldStack !== listControlsStacked) {
        listControlsStacked = shouldStack;

        const groups = controls.querySelectorAll('.list-controls__group');

        if (shouldStack) {
            controls.classList.add('is-stacked');

            // Stacked layout: drop trailing colon on labels (e.g. "Show by:")
            groups.forEach(group => {
                const label = group.querySelector('.list-controls__label') || group.querySelector('span');
                if (label) {
                    if (!label.dataset.originalText) {
                        label.dataset.originalText = label.textContent.trim();
                    }
                    label.textContent = '- ' + label.dataset.originalText.replace(/:$/, '');
                }
            });
        } else {
            controls.classList.remove('is-stacked');

            groups.forEach(group => {
                const label = group.querySelector('.list-controls__label') || group.querySelector('span');
                if (label && label.dataset.originalText) {
                    label.textContent = label.dataset.originalText;
                }
            });
        }
    }
}

function nearestFontScale(scale) {
    const steps = (typeof FONT_SCALE_STEPS !== 'undefined' && FONT_SCALE_STEPS.length)
        ? FONT_SCALE_STEPS
        : [95, 100, 105, 110];
    const n = Number(scale);
    if (!isFinite(n)) return 100;
    let best = steps[0];
    let bestDist = Math.abs(n - best);
    for (let i = 1; i < steps.length; i++) {
        const d = Math.abs(n - steps[i]);
        if (d < bestDist) {
            best = steps[i];
            bestDist = d;
        }
    }
    return best;
}

function updateFontScaleControl() {
    const steps = (typeof FONT_SCALE_STEPS !== 'undefined' && FONT_SCALE_STEPS.length)
        ? FONT_SCALE_STEPS
        : [95, 100, 105, 110];
    const idx = steps.indexOf(currentFontScale);

    document.querySelectorAll('.settings-modal__font-dot').forEach(dot => {
        const selected = Number(dot.dataset.scale) === currentFontScale;
        dot.classList.toggle('is-selected', selected);
        dot.setAttribute('aria-checked', selected ? 'true' : 'false');
    });

    const minus = document.getElementById('font-scale-minus');
    const plus = document.getElementById('font-scale-plus');
    if (minus) minus.disabled = idx <= 0;
    if (plus) plus.disabled = idx < 0 || idx >= steps.length - 1;
}

function applyFontScale(scale) {
    currentFontScale = nearestFontScale(scale);
    const scaleDecimal = currentFontScale / 100;

    document.documentElement.style.fontSize = currentFontScale + '%';
    document.documentElement.style.setProperty('--font-scale', scaleDecimal);

    localStorage.setItem('startpage_font_scale', currentFontScale);

    updateFontScaleControl();
    updateWidthBasedLayout();
}

function changeFontScale(delta) {
    const steps = (typeof FONT_SCALE_STEPS !== 'undefined' && FONT_SCALE_STEPS.length)
        ? FONT_SCALE_STEPS
        : [95, 100, 105, 110];
    let idx = steps.indexOf(nearestFontScale(currentFontScale));
    if (idx < 0) idx = steps.indexOf(100);
    if (idx < 0) idx = 1;
    const dir = Number(delta) < 0 ? -1 : 1;
    idx = Math.max(0, Math.min(steps.length - 1, idx + dir));
    applyFontScale(steps[idx]);
}

function loadFontScale() {
    const saved = localStorage.getItem('startpage_font_scale');
    const scale = saved ? parseInt(saved, 10) : 100;
    applyFontScale(scale);
}

function applyHideCategories(hide) {
    hideCategories = !!hide;
    const col = document.getElementById('categories-column');
    if (col) {
        if (hideCategories) {
            col.classList.add('is-hidden');
        } else {
            col.classList.remove('is-hidden');
        }
    }

    const checkbox = document.getElementById('hide-categories-checkbox');
    if (checkbox) checkbox.checked = hideCategories;
}

function loadHideCategories() {
    const raw = localStorage.getItem('startpage_hide_categories');
    if (raw === null) { // first visit: default hide categories on
        localStorage.setItem('startpage_hide_categories', 'true');
        applyHideCategories(true);
        return;
    }
    applyHideCategories(raw === 'true');
}

var snowFlakesReady = false;

function snowParticleCount() {
    var w = window.innerWidth || 1280;
    var h = window.innerHeight || 800;
    var count = Math.round((w * h) / 14000);
    if (count < 48) count = 48;
    if (count > 96) count = 96;
    return count;
}

function ensureSnowParticles() {
    if (snowFlakesReady) return;
    var layer = document.getElementById('snow-layer');
    if (!layer) return;
    var count = snowParticleCount();
    var frag = document.createDocumentFragment();
    for (var i = 0; i < count; i++) {
        var flake = document.createElement('span');
        var crystal = Math.random() < 0.34;
        flake.className = crystal ? 'snow-flake snow-flake--crystal' : 'snow-flake';
        var size = (crystal ? (12 + Math.random() * 8) : (4 + Math.random() * 5)) * 0.8;
        var duration = 18 + Math.random() * 16;
        var drift = (22 + Math.random() * 64) * (Math.random() < 0.5 ? -1 : 1);
        flake.style.left = (Math.random() * 100) + '%';
        flake.style.width = size + 'px';
        flake.style.height = size + 'px';
        flake.style.opacity = String(crystal ? (0.78 + Math.random() * 0.22) : (0.84 + Math.random() * 0.16));
        flake.style.animationDuration = duration.toFixed(2) + 's';
        flake.style.animationDelay = (-Math.random() * duration).toFixed(2) + 's';
        flake.style.setProperty('--snow-drift', drift.toFixed(1) + 'px');
        frag.appendChild(flake);
    }
    layer.appendChild(frag);
    snowFlakesReady = true;
}

function applySnowEffect(enabled) {
    snowEffect = !!enabled;
    var checkbox = document.getElementById('snow-effect-checkbox');
    if (checkbox) checkbox.checked = snowEffect;
    var layer = document.getElementById('snow-layer');
    if (!layer) return;
    if (snowEffect) {
        ensureSnowParticles();
        layer.classList.add('is-on');
    } else {
        layer.classList.remove('is-on');
    }
    if (typeof syncSnowLayerForPage === 'function') syncSnowLayerForPage();
}

function loadSnowEffect() {
    var enabled = (typeof readSnowEffectEnabled === 'function') ? readSnowEffectEnabled() : true;
    if (typeof setSnowEffectEnabled === 'function') setSnowEffectEnabled(enabled);
    else applySnowEffect(enabled);
}

function updateClock() {
    const clockEl = document.getElementById('clock');
    if (clockEl) clockEl.textContent = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function updateDate() {
    const dateEl = document.getElementById('date');
    if (!dateEl) return;
    const now = new Date();
    const options = { month: 'long', day: 'numeric', year: 'numeric' };
    dateEl.textContent = now.toLocaleDateString('en-US', options);
}

function updateGreeting() {
    const greetingEl = document.getElementById('greeting');
    if (!greetingEl) return;
    const hour = new Date().getHours();
    let text = "Good Night!";
    if (hour === 0) {
        text = "It's Past Midnight!";
    } else if (hour >= 1 && hour < 3) {
        text = "You're a Night Owl!";
    } else if (hour >= 3 && hour < 5) {
        text = "You're an Early Bird!";
    } else if (hour >= 5 && hour < 12) {
        text = "Good Morning!";
    } else if (hour === 12) {
        text = "Good Afternoon!";
    } else if (hour >= 13 && hour < 15) {
        text = "Midday Moment!";
    } else if (hour >= 15 && hour < 17) {
        text = "Golden hour incoming!";
    } else if (hour >= 17 && hour < 20) {
        text = "Good Evening!";
    } else if (hour >= 20 && hour < 24) {
        text = "Good Night!";
    }
    greetingEl.textContent = text;
}

window.toggleDebugPanel = requestDebugToggle;
window.updateDebugInfo = requestDebugUpdate;

function clearLinkCardKeyboardFocus() {
    document.querySelectorAll('.link-card.keyboard-active').forEach(card => {
        card.classList.remove('keyboard-active');
    });
}

/** @param {{ scroll?: boolean }} [options] `{ scroll: false }` skips scrollIntoView */
function applyLinkCardKeyboardFocus(options) {
    clearLinkCardKeyboardFocus();

    if (keyboardFocusedIndex < 0) {
        refreshDebugIfOpen();
        return;
    }

    const cards = document.querySelectorAll('#links-grid .link-card');
    if (keyboardFocusedIndex >= cards.length) {
        keyboardFocusedIndex = cards.length - 1;
    }

    const targetCard = cards[keyboardFocusedIndex];
    if (targetCard) {
        targetCard.classList.add('keyboard-active');
        if (!options || options.scroll !== false) {
            targetCard.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }

    refreshDebugIfOpen();
}

/** Column count in #links-grid (compact 1/2/3 from CSS; full flex → 1). */
function getLinksGridColumns() {
    const grid = document.getElementById('links-grid');
    if (!grid) return 1;

    const style = window.getComputedStyle(grid);
    const template = style.gridTemplateColumns;

    if (!template || template === 'none') {
        return 1;
    }
    return template.trim().split(/\s+/).filter(Boolean).length || 1;
}

/** Scroll container for link cards (page body itself does not scroll). */
function getLinksScrollEl() {
    return document.getElementById('links-scroll');
}

function avt_ScrollTo(top) {
    if (keyboardFocusedIndex !== -1) {
        keyboardFocusedIndex = -1;
        clearLinkCardKeyboardFocus();
        refreshDebugIfOpen();
    }

    const scroller = getLinksScrollEl();
    if (scroller) {
        scroller.scrollTo({
            top: top,
            behavior: 'smooth'
        });
    } else {
        window.scrollTo({
            top: top,
            behavior: 'smooth'
        });
    }
}

function avt_ScrollToBottom() {
    const scroller = getLinksScrollEl();
    avt_ScrollTo(scroller ? scroller.scrollHeight : document.documentElement.scrollHeight);
}

function avt_ScrollToTop() {
    avt_ScrollTo(0);
}

/** Inclusive start/end of the header-bounded card section containing `index`. */
function getLinkCardSectionRange(cards, index) {
    const card = cards[index];
    if (!card) return null;

    let start = index;
    let el = card.previousElementSibling;
    while (el) {
        if (el.classList.contains('abc-section-header')) break;
        if (el.classList.contains('link-card')) start--;
        el = el.previousElementSibling;
    }

    let end = index;
    el = card.nextElementSibling;
    while (el) {
        if (el.classList.contains('abc-section-header')) break;
        if (el.classList.contains('link-card')) end++;
        el = el.nextElementSibling;
    }

    return { start: start, end: end };
}

/** Step within a section first; don't skip leftover cards when crossing headers. */
function stepLinkCardIndex(cards, fromIndex, step) {
    const cardCount = cards.length;
    const raw = fromIndex + step;
    const section = getLinkCardSectionRange(cards, fromIndex);
    if (!section) {
        return Math.max(-1, Math.min(raw, cardCount - 1));
    }

    if (step > 0) {
        if (raw <= section.end) return raw;
        if (fromIndex < section.end) return section.end;
        return Math.min(section.end + 1, cardCount - 1);
    }

    if (step < 0) {
        if (raw >= section.start) return raw;
        if (fromIndex > section.start) return section.start;
        if (section.start === 0) return -1;
        return section.start - 1;
    }

    return fromIndex;
}

/** Arrow keys + Enter on link search for keyboard card navigation. */
function setupLinkKeyboardNavigation() {
    const linkSearchInput = document.getElementById('link-search-input');
    if (!linkSearchInput) return;

    linkSearchInput.addEventListener('keydown', (e) => {
        const cards = document.querySelectorAll('#links-grid .link-card');
        if (cards.length === 0) return;

        const columns = getLinksGridColumns();

        const navOrShortcutKeys = ['/', '+', '-', '*', 'ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'];
        if (keyboardFocusedIndex !== -1 && !navOrShortcutKeys.includes(e.key)) {
            avt_ScrollToTop();
            return;
        }

        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
            e.preventDefault();
            const step = (e.key === 'ArrowRight') ? 1 : columns;
            if (keyboardFocusedIndex === -1) {
                keyboardFocusedIndex = 0;
            } else {
                keyboardFocusedIndex = stepLinkCardIndex(cards, keyboardFocusedIndex, step);
            }
            applyLinkCardKeyboardFocus();
        } 
        else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
            e.preventDefault();
            const step = (e.key === 'ArrowLeft') ? 1 : columns;
            if (keyboardFocusedIndex === -1) {
                clearLinkCardKeyboardFocus();
                keyboardFocusedIndex = -1;
                linkSearchInput.focus();
            } else {
                const newIndex = stepLinkCardIndex(cards, keyboardFocusedIndex, -step);
                if (newIndex < 0) {
                    clearLinkCardKeyboardFocus();
                    keyboardFocusedIndex = -1;
                    linkSearchInput.focus();
                } else {
                    keyboardFocusedIndex = newIndex;
                    applyLinkCardKeyboardFocus();
                }
            }
        } 
        else if (e.key === 'Enter') {
            if (keyboardFocusedIndex >= 0 && keyboardFocusedIndex < cards.length) {
                e.preventDefault();
                const targetCard = cards[keyboardFocusedIndex];
                const linkId = targetCard.dataset.id;
                const link = links.find(l => l.id == linkId);
                if (link && link.url) {
                    openLinkAndTally(link);
                    clearLinkCardKeyboardFocus();
                    keyboardFocusedIndex = -1;
                }
            }
        } 
        else if (e.key === 'Escape') {
            clearLinkCardKeyboardFocus();
            keyboardFocusedIndex = -1;
        }
    });

    linkSearchInput.addEventListener('input', () => {
        keyboardFocusedIndex = -1;
        clearLinkCardKeyboardFocus();
    });
}

/** Keep the open backup menu inside the viewport. Centered until an edge would clip, then shifted so that edge sits 8px inside the screen. */
function positionBackupMenu() {
    const menu = document.querySelector('.backup-dropdown__menu');
    const panel = document.querySelector('.backup-dropdown__panel');
    if (!menu || !panel) return;

    if (getComputedStyle(menu).display === 'none') {
        menu.style.transform = '';
        return;
    }

    menu.style.transform = '';
    const rect = panel.getBoundingClientRect();
    const view = window.visualViewport;
    const viewLeft = view ? view.offsetLeft : 0;
    const viewRight = view ? view.offsetLeft + view.width : window.innerWidth;
    const margin = 8;
    let shift = 0;

    if (rect.right > viewRight - margin) {
        shift -= rect.right - (viewRight - margin);
    }
    if (rect.left + shift < viewLeft + margin) {
        shift += (viewLeft + margin) - (rect.left + shift);
    }

    if (shift) {
        menu.style.transform = 'translateX(calc(-50% + ' + shift + 'px))';
    }
}

/** Blur backup dropdown 1s after pointer leaves (closes :focus-within menu). */
function setupBackupDropdownAutoHide() {
    const root = document.querySelector('.backup-dropdown');
    if (!root) return;

    let hideTimer = null;

    function clearHideTimer() {
        if (hideTimer !== null) {
            clearTimeout(hideTimer);
            hideTimer = null;
        }
    }

    function scheduleHide() {
        clearHideTimer();
        hideTimer = setTimeout(function () {
            hideTimer = null;
            const active = document.activeElement;
            if (active && root.contains(active) && typeof active.blur === 'function') {
                active.blur();
            }
        }, 1000);
    }

    root.addEventListener('mouseenter', function () {
        clearHideTimer();
        positionBackupMenu();
        requestAnimationFrame(positionBackupMenu);
    });
    root.addEventListener('focusin', positionBackupMenu);
    root.addEventListener('mouseleave', scheduleHide);
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', positionBackupMenu);
    }
}

function initializeApp() {
    const savedViewMode = localStorage.getItem('startpage_view_mode');
    if (savedViewMode === 'compact' || savedViewMode === 'full') {
        viewMode = savedViewMode;
    } else {
        viewMode = 'compact';
        try { localStorage.setItem('startpage_view_mode', viewMode); } catch (e) {}
    }

    const savedSortMode = localStorage.getItem('startpage_sort_mode');
    if (savedSortMode === 'default' || savedSortMode === 'tally' ||
        savedSortMode === 'abc' || savedSortMode === 'date') {
        sortMode = savedSortMode;
    } else {
        sortMode = 'tally';
        try { localStorage.setItem('startpage_sort_mode', sortMode); } catch (e) {}
    }

    loadHideCategories();
    loadSnowEffect();
    loadLinks();

    loadColorSettings();
    loadFontScale();
    bindLayoutWidthListeners();
    updateWidthBasedLayout();

    setupLinkKeyboardNavigation();
    setupBackupDropdownAutoHide();
    setupSearchModalForm();
    setupAppKeyboardShortcuts();
    updateListControlsLayout();

    initEmojiPicker();
    initCategoryAutocomplete();
    loadGitHubCredentials();

    if (typeof displayDailyQuote === 'function') {
      displayDailyQuote();
    }

    const nameInput = document.getElementById('theme-author-name');
    const pageTitle = document.getElementById('page-title');
    const savedName = localStorage.getItem('startpage_user_name') || '';
    if (nameInput) {
        nameInput.value = savedName;
        if (pageTitle) pageTitle.textContent = savedName ? `${savedName}'s Start Page` : 'Start';
        nameInput.addEventListener('input', () => {
            const name = nameInput.value.trim();
            localStorage.setItem('startpage_user_name', name);
            if (pageTitle) pageTitle.textContent = name ? `${name}'s Start Page` : 'Start';
        });
    }

    const hideCategoriesCheckbox = document.getElementById('hide-categories-checkbox');
    if (hideCategoriesCheckbox) {
        hideCategoriesCheckbox.addEventListener('change', () => {
            localStorage.setItem('startpage_hide_categories', hideCategoriesCheckbox.checked ? 'true' : 'false');
            applyHideCategories(hideCategoriesCheckbox.checked);
        });
    }

    const snowEffectCheckbox = document.getElementById('snow-effect-checkbox');
    if (snowEffectCheckbox) {
        snowEffectCheckbox.addEventListener('change', () => {
            setSnowEffectEnabled(snowEffectCheckbox.checked);
        });
    }

    function bindPopupSecondsInput(inputId, storageKey, fallback) {
        const input = document.getElementById(inputId);
        if (!input) return;
        const commit = () => {
            const parsed = parsePopupSeconds(input.value);
            const seconds = parsed == null
                ? readPopupSeconds(storageKey, fallback)
                : savePopupSeconds(storageKey, parsed, fallback);
            input.value = String(seconds);
        };
        input.addEventListener('input', () => {
            const parsed = parsePopupSeconds(input.value);
            if (parsed != null) savePopupSeconds(storageKey, parsed, fallback);
        });
        input.addEventListener('change', commit);
        input.addEventListener('blur', commit);
    }
    bindPopupSecondsInput('mobile-link-desc-seconds', MOBILE_LINK_DESC_SECONDS_KEY, DEFAULT_MOBILE_LINK_DESC_SECONDS);
    bindPopupSecondsInput('emoji-desc-seconds', EMOJI_DESC_SECONDS_KEY, DEFAULT_EMOJI_DESC_SECONDS);

    const debugPanelCheckbox = document.getElementById('debug-panel-checkbox');
    if (debugPanelCheckbox) {
        debugPanelCheckbox.addEventListener('change', () => {
            requestDebugSet(debugPanelCheckbox.checked);
        });
    }

    const catSearch = document.getElementById('category-search');
    if (catSearch) {
        catSearch.addEventListener('input', (e) => {
            categorySearchTerm = e.target.value.trim();
            renderCategoriesSidebar();
        });

        catSearch.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                const sidebar = document.getElementById('categories-sidebar');
                if (!sidebar) return;

                const firstVisible = sidebar.querySelector('.sidebar-category:not([style*="display: none"])');
                if (firstVisible) {
                    firstVisible.focus();
                }
            }
        });
    }

    const catSidebar = document.getElementById('categories-sidebar');
    if (catSidebar) {
        catSidebar.addEventListener('keydown', (e) => {
            const items = Array.from(catSidebar.querySelectorAll('.sidebar-category'))
                .filter(el => el.offsetParent !== null);

            if (items.length === 0) return;

            const currentIndex = items.indexOf(document.activeElement);

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (currentIndex >= 0 && currentIndex < items.length - 1) {
                    items[currentIndex + 1].focus();
                } else if (currentIndex === -1) {
                    items[0].focus();
                }
            } 
            else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (currentIndex > 0) {
                    items[currentIndex - 1].focus();
                } else if (currentIndex === 0) {
                    if (catSearch) catSearch.focus();
                }
            } 
            else if (e.key === 'Enter') {
                e.preventDefault();
                const focusedItem = document.activeElement;
                if (focusedItem && focusedItem.classList.contains('sidebar-category')) {
                    focusedItem.click();

                    setTimeout(() => {
                        const sidebar = document.getElementById('categories-sidebar');
                        if (!sidebar) return;
                        let target = sidebar.querySelector('.sidebar-category.active');
                        if (!target) {
                            target = sidebar.querySelector('.sidebar-category');
                        }

                        if (target) {
                            target.focus();
                        }
                    }, 0);
                }
            }
        });
    }

    const linkSearch = document.getElementById('link-search-input');
		
    if (linkSearch) {
        linkSearch.addEventListener('input', (e) => {
            linkSearchTerm = e.target.value.trim();
            renderLinks();
        });

        const clearKbFocus = () => {
            keyboardFocusedIndex = -1;
            clearLinkCardKeyboardFocus();
        };
        linkSearch.addEventListener('focus', clearKbFocus);
        linkSearch.addEventListener('click', clearKbFocus);
    }

    setTimeout(() => {
        const linkSearchInput = document.getElementById('link-search-input');
        if (linkSearchInput) {
            linkSearchInput.focus();
        }
    }, 150);

    const sortDefaultBtn = document.getElementById('sort-default');
    const sortTallyBtn = document.getElementById('sort-tally');
    const sortAbcBtn = document.getElementById('sort-abc');
    const sortDateBtn = document.getElementById('sort-date');

    updateSortModeUI();

    if (sortDefaultBtn) {
        sortDefaultBtn.onclick = () => setSortMode('default');
    }
    if (sortTallyBtn) {
        sortTallyBtn.onclick = () => setSortMode('tally');
    }
    if (sortAbcBtn) {
        sortAbcBtn.onclick = () => setSortMode('abc');
    }
    if (sortDateBtn) {
        sortDateBtn.onclick = () => setSortMode('date');
    }

    const viewFullBtn = document.getElementById('view-full');
    const viewCompactBtn = document.getElementById('view-compact');

    if (viewFullBtn) {
        viewFullBtn.onclick = () => setViewMode('full');
    }

    if (viewCompactBtn) {
        viewCompactBtn.onclick = () => setViewMode('compact');
    }

    updateViewModeUI();

    const addBtn = document.getElementById('add-link-btn');
    if (addBtn) addBtn.onclick = openAddModal;

    const topBtn = document.getElementById('go-to-top');
    const bottomBtn = document.getElementById('go-to-bottom');
    const linksScrollEl = getLinksScrollEl();

    function updateFloatingScrollButtons() {
        const scroller = getLinksScrollEl();
        if (!scroller) return;

        const scrollTop = scroller.scrollTop;
        const clientHeight = scroller.clientHeight;
        const scrollHeight = scroller.scrollHeight;
        const canScroll = scrollHeight > clientHeight + 8;

        if (topBtn) {
            if (canScroll && scrollTop > 80) {
                topBtn.classList.remove('is-hidden');
            } else {
                topBtn.classList.add('is-hidden');
            }
        }

        if (bottomBtn) {
            if (canScroll && scrollTop + clientHeight < scrollHeight - 80) {
                bottomBtn.classList.remove('is-hidden');
            } else {
                bottomBtn.classList.add('is-hidden');
            }
        }
    }

    if (topBtn || bottomBtn) {
        if (linksScrollEl) {
            linksScrollEl.addEventListener('scroll', updateFloatingScrollButtons, { passive: true });
        }
        window.addEventListener('resize', updateFloatingScrollButtons);
        updateFloatingScrollButtons();

		if (topBtn) {
			topBtn.onclick = () => {
				// Default/Tally/ABC: pin Favorites header in view, then highlight first card without scrollIntoView overshoot
				const pinToFavorites = sortMode === 'default' || sortMode === 'tally' || sortMode === 'abc';
				const favoritesHeader = document.getElementById('abc-section-favorites');

				if (pinToFavorites && favoritesHeader) {
					if (keyboardFocusedIndex !== -1) {
						keyboardFocusedIndex = -1;
						clearLinkCardKeyboardFocus();
					}
					favoritesHeader.scrollIntoView({ behavior: 'smooth', block: 'start' });
				} else {
					avt_ScrollToTop();
				}

				const linkSearch = document.getElementById('link-search-input');
				if (linkSearch) linkSearch.focus();
				keyboardFocusedIndex = 0;
				applyLinkCardKeyboardFocus({ scroll: false });
			};
		}

		if (bottomBtn) {
			bottomBtn.onclick = () => {
				avt_ScrollToBottom();
				const linkSearch = document.getElementById('link-search-input');
				if (linkSearch) linkSearch.focus();
				const cards = document.querySelectorAll('#links-grid .link-card');
				keyboardFocusedIndex = Math.max(0, cards.length - 1);
				applyLinkCardKeyboardFocus();
			};
		}
    }

    if (linksScrollEl && typeof MutationObserver !== 'undefined') {
        const mo = new MutationObserver(() => {
            requestAnimationFrame(updateFloatingScrollButtons);
        });
        mo.observe(linksScrollEl, { childList: true, subtree: true });
    }

    updateDate();
    updateClock();
    updateGreeting();
    setInterval(() => {
        updateDate();
        updateClock();
        updateGreeting();
    }, 30000);
}

window.openSettingsModal = openSettingsModal;
window.exportLinks = exportLinks;
window.importLinks = importLinks;
window.changeFontScale = changeFontScale;
window.openColorThemeModal = openColorThemeModal;
window.applyColorMode = applyColorMode;
window.applyColorPalette = applyColorPalette;
window.applyAndSaveColors = applyAndSaveColors;
window.closeColorThemeModal = closeColorThemeModal;
window.closeSettingsModal = closeSettingsModal;
window.openAttributionModal = openAttributionModal;
window.closeAttributionModal = closeAttributionModal;
window.openAboutModal = openAboutModal;
window.closeAboutModal = closeAboutModal;
window.openOtherOptionsModal = openOtherOptionsModal;
window.closeOtherOptionsModal = closeOtherOptionsModal;
window.addCategoryToModal = addCategoryToModal;
window.moveLinkToTop = moveLinkToTop;
window.moveLinkToBottom = moveLinkToBottom;
window.saveCurrentLink = saveCurrentLink;

window.applyColors = applyColors;
window.saveColorSettings = saveColorSettings;
window.applyFontScale = applyFontScale;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
