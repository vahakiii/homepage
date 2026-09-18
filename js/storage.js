// Welcome modal for file:// installs — not in UI_MODAL_IDS (Esc won't close)
function showFileProtocolWarningModal() {
    const modal = document.createElement('div');
    modal.id = 'welcome-modal';
    modal.className = 'ui-modal ui-modal--cover is-open welcome-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'welcome-modal-title');

    modal.innerHTML = `
        <div onclick="event.stopImmediatePropagation()" class="ui-modal__panel ui-modal__panel--lg welcome-modal__panel modal">
            <!-- Header -->
            <div class="ui-modal__header welcome-modal__header">
                <h3 id="welcome-modal-title" class="ui-modal__title ui-modal__title--row welcome-modal__title">
                    <i class="welcome-modal__rocket ui-modal__title-icon--lg fa-solid fa-rocket"></i>
                    <span>Welcome to Your Start Page!</span>
                </h3>
                <button type="button" class="close-btn ui-modal__close welcome-modal__close" aria-label="Close">
                    <i class="fa-solid fa-times"></i>
                </button>
            </div>

            <!-- Body -->
            <div class="welcome-modal__body">
                <p class="welcome-modal__lead">Hello there 👋</p>
                
                <p>
                    Your beautiful new tab experience is ready! This is a fresh install, so we don't have any links loaded yet.
                </p>

                <div class="welcome-modal__callout">
                    <p class="welcome-modal__callout-title">
                        <i class="fa-solid fa-arrow-down-to-bracket"></i>
                        Quick Start
                    </p>
                    <ol class="welcome-modal__steps">
                        <li>Click the <strong>Backup</strong> dropdown (top right) → <strong>Import</strong></li>
                        <li>Select <strong>default.json</strong> to load a nice set of starter links</li>
                    </ol>
                </div>

                <p class="welcome-modal__hint">
                    Once imported, you can start customizing: add your own links, drag to reorder or remove them, change colors, pick emojis, and sync everything with GitHub.
                </p>
                
                <p class="welcome-modal__enjoy">
                    Enjoy building your perfect start page!
                </p>
            </div>

            <!-- Footer -->
            <div class="welcome-modal__footer">
                <button type="button" class="close-btn welcome-modal__cta">
                    Let's Go!
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const closeButtons = modal.querySelectorAll('.close-btn');
    closeButtons.forEach(btn => {
        btn.onclick = () => modal.remove();
    });

    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
}

function loadLinks() {
    try {
        const saved = localStorage.getItem('startpage_links');
        if (saved) {
            links = normalizeLinksArray(JSON.parse(saved));
            renderLinks();
            renderCategoriesSidebar();
        } else {
            fetch('default.json')
                .then(response => {
                    if (!response.ok) throw new Error('default.json not found');
                    return response.json();
                })
                .then(data => {
                    if (Array.isArray(data.links)) {
                        links = normalizeLinksArray(data.links);
                        saveLinks();
                        renderLinks();
                        renderCategoriesSidebar();
                    }
                })
                .catch(err => {
                    const isFileProtocol = window.location.protocol === 'file:';

                    if (isFileProtocol) {
                        showFileProtocolWarningModal();
                    } else {
                        console.warn("Failed to load default.json:", err);
                    }
                    links = [];
                });
        }
    } catch (e) {
        console.error("Error loading links", e);
        links = [];
        renderLinks();
        renderCategoriesSidebar();
    }
}

function saveLinks() {
    try {
        localStorage.setItem('startpage_links', JSON.stringify(links));
    } catch (e) {
        console.error("Error saving links", e);
    }
}

function getAllCategories() {
    const set = new Set();
    links.forEach(l => {
        if (Array.isArray(l.categories)) l.categories.forEach(c => set.add(c));
    });
    return Array.from(set).sort();
}

// Token obfuscation for export: insert random !@#$%^ after each char
const MASK_SPECIALS = ['!', '@', '#', '$', '%', '^'];

function maskToken(token) {
    if (!token || typeof token !== 'string') return '';
    let masked = '';
    for (let i = 0; i < token.length; i++) {
        masked += token[i];
        const randIdx = Math.floor(Math.random() * MASK_SPECIALS.length);
        masked += MASK_SPECIALS[randIdx];
    }
    return masked;
}

function unmaskToken(masked) {
    if (!masked || typeof masked !== 'string') return '';
    // Even length + odd-index chars from MASK_SPECIALS → unmask; else plain
    if (masked.length % 2 !== 0) {
        return masked;
    }
    let looksMasked = true;
    let original = '';
    for (let i = 0; i < masked.length; i++) {
        if (i % 2 === 0) {
            original += masked[i];
        } else {
            if (!MASK_SPECIALS.includes(masked[i])) {
                looksMasked = false;
                break;
            }
        }
    }
    if (looksMasked) {
        return original;
    } else {
        return masked;
    }
}

/** Coerce to non-negative integer tally; invalid → 0. */
function coerceTally(value) {
    if (value === null || value === undefined || value === '') return 0;
    const n = typeof value === 'number' ? value : parseInt(String(value).trim(), 10);
    if (!Number.isFinite(n) || n < 0) return 0;
    return Math.floor(n);
}

/** Normalize link shape; createdAt falls back to id for older backups. */
function normalizeLink(link) {
    link = link || {};
    return {
        id: (link.id != null && link.id !== '') ? link.id : Date.now(),
        name: link.name || '',
        url: link.url || '',
        description: link.description || '',
        emoji: link.emoji || '🔗',
        categories: Array.isArray(link.categories) ? link.categories : [],
        accentColor: (typeof link.accentColor === 'undefined') ? null : link.accentColor,
        isFavorite: !!link.isFavorite,
        tally: coerceTally(link.tally),
        createdAt: link.createdAt || link.id || Date.now()
    };
}

/** Map an array through normalizeLink; non-arrays become []. */
function normalizeLinksArray(arr) {
    if (!Array.isArray(arr)) return [];
    return arr.map(function (link) { return normalizeLink(link); });
}

/** Increment tally, open URL; re-render in Tally mode only if section order changes. */
function openLinkAndTally(link) {
    if (!link || !link.url) return;
    const oldTally = coerceTally(link.tally);
    link.tally = oldTally + 1;
    saveLinks();
    window.open(link.url, '_blank');
    if (sortMode === 'tally'
        && typeof tallySectionOrderWouldChange === 'function'
        && tallySectionOrderWouldChange(link, oldTally, link.tally)
        && typeof renderLinks === 'function') {
        renderLinks();
    }
}

/** Build backup payload for file export or Gist. */
function buildBackupPayload(options) {
    options = options || {};
    const username = (options.githubUsername != null)
        ? options.githubUsername
        : (localStorage.getItem('github_username') || '');
    const token = (options.githubToken != null)
        ? options.githubToken
        : (localStorage.getItem('github_token') || '');
    const gistId = (options.githubGistId != null)
        ? options.githubGistId
        : (localStorage.getItem('github_gist_id') || '');

    const payload = {
        links: links,
        colors: readStoredColors(),
        userName: localStorage.getItem('startpage_user_name') || '',
        fontScale: parseInt(localStorage.getItem('startpage_font_scale') || '100', 10),
        // sortMode/viewMode also in localStorage; optional on older backups
        sortMode: (typeof sortMode !== 'undefined' && sortMode)
            ? sortMode
            : (localStorage.getItem('startpage_sort_mode') || 'default'),
        viewMode: (typeof viewMode !== 'undefined' && viewMode)
            ? viewMode
            : (localStorage.getItem('startpage_view_mode') || 'full'),
        github: {
            username: username,
            token: maskToken(token),
            gistId: gistId || ''
        },
        githubLastSync: localStorage.getItem('github_last_sync') || null
    };

    if (options.includeLastSynced) {
        payload.lastSynced = new Date().toISOString();
    }
    return payload;
}

/** Apply parsed backup; options.mode 'file' | 'gist'. */
function applyBackupPayload(imported, options) {
    options = options || {};
    const mode = options.mode || 'file';
    const data = Array.isArray(imported) ? {} : (imported || {});

    if (mode === 'gist') {
        if (Array.isArray(data.links)) {
            links = normalizeLinksArray(data.links);
            saveLinks();
        }
    } else {
        const importedLinks = Array.isArray(imported) ? imported : (data.links || []);
        links = normalizeLinksArray(importedLinks);
        saveLinks();
    }

    if (data.colors) {
        const colors = importedColorMap(data.colors);
        const applyFn = (typeof applyColors === 'function') ? applyColors : window.applyColors;
        const saveFn = (typeof saveColorSettings === 'function') ? saveColorSettings : window.saveColorSettings;
        if (applyFn) applyFn(colors);
        if (saveFn) saveFn(colors);
    }

    if (options.updateUserName && data.userName !== undefined) {
        localStorage.setItem('startpage_user_name', data.userName || '');
        const pageTitle = document.getElementById('page-title');
        const nameInput = document.getElementById('theme-author-name');
        if (pageTitle) pageTitle.textContent = data.userName ? (data.userName + "'s Start Page") : 'Start';
        if (nameInput) nameInput.value = data.userName || '';
    }

    if (data.fontScale !== undefined) {
        const fontFn = (typeof applyFontScale === 'function') ? applyFontScale : window.applyFontScale;
        if (fontFn) fontFn(data.fontScale);
    }

    // sortMode/viewMode optional for older JSON/Gists
    if (data.sortMode !== undefined) {
        const allowedSort = ['default', 'tally', 'abc', 'date'];
        if (allowedSort.indexOf(data.sortMode) !== -1) {
            sortMode = data.sortMode;
            try {
                localStorage.setItem('startpage_sort_mode', sortMode);
            } catch (e) { /* ignore quota */ }
            if (typeof updateSortModeUI === 'function') updateSortModeUI();
        }
    }
    if (data.viewMode !== undefined) {
        if (data.viewMode === 'full' || data.viewMode === 'compact') {
            viewMode = data.viewMode;
            try {
                localStorage.setItem('startpage_view_mode', viewMode);
            } catch (e) { /* ignore quota */ }
            if (typeof updateViewModeUI === 'function') updateViewModeUI();
        }
    }

    if (data.github) {
        if (data.github.username) localStorage.setItem('github_username', data.github.username);
        if (data.github.token) {
            localStorage.setItem('github_token', unmaskToken(data.github.token));
        }

        if (mode === 'file') {
            if (data.github.gistId) localStorage.setItem('github_gist_id', data.github.gistId);
            githubUsername = data.github.username || '';
            githubToken = data.github.token ? unmaskToken(data.github.token) : '';
            githubGistId = data.github.gistId || '';
            if (data.githubLastSync) {
                localStorage.setItem('github_last_sync', data.githubLastSync);
                githubLastSync = parseInt(data.githubLastSync, 10) || null;
            }
        } else {
            githubUsername = data.github.username || githubUsername;
            githubToken = data.github.token ? unmaskToken(data.github.token) : githubToken;
        }
    }

    if (mode === 'gist') {
        if (options.forceGistId) {
            githubGistId = options.forceGistId;
            localStorage.setItem('github_gist_id', githubGistId);
        } else if (data.github && data.github.gistId) {
            githubGistId = data.github.gistId;
            localStorage.setItem('github_gist_id', githubGistId);
        } else if (options.fallbackGistId) {
            githubGistId = options.fallbackGistId;
            localStorage.setItem('github_gist_id', githubGistId);
        }

        if (data.githubLastSync) {
            localStorage.setItem('github_last_sync', data.githubLastSync);
            githubLastSync = parseInt(data.githubLastSync, 10) || null;
        } else if (options.touchLastSyncIfMissing) {
            githubLastSync = Date.now();
            localStorage.setItem('github_last_sync', githubLastSync);
        }
    }

    currentFilterCategory = null;
    renderLinks();
    renderCategoriesSidebar();

    if (options.successMessage) {
        alert(options.successMessage);
    }
}

function exportLinks() {
    const exportData = buildBackupPayload();
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `start-page-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importLinks() {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = '.json';
    inp.onchange = () => {
        const f = inp.files[0];
        if (!f) return;
        const r = new FileReader();
        r.onload = (ev) => {
            try {
                const imported = JSON.parse(ev.target.result);
                const importedLinks = Array.isArray(imported) ? imported : (imported.links || []);
                if (!confirm(`Replace current links with ${importedLinks.length} imported ones?`)) return;

                applyBackupPayload(imported, {
                    mode: 'file',
                    successMessage: 'Import successful!'
                });
            } catch (err) {
                alert("Invalid file.");
            }
        };
        r.readAsText(f);
    };
    inp.click();
}