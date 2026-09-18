// Shared app state (var for cross-script visibility)
var links = [];
var currentEditId = null;
var draggedId = null;
var currentFilterCategory = null;
var modalCurrentCategories = [];
var modalCurrentAccent = null;
var categorySearchTerm = '';
var linkSearchTerm = '';
var sortMode = 'default'; // 'default' | 'tally' | 'abc' | 'date'
var currentFontScale = 100;
var viewMode = 'full'; // 'full' or 'compact'
var hideCategories = true;
var keyboardFocusedIndex = -1; // keyboard highlight on #links-grid cards; -1 = none
var listControlsStacked = false;

/** Keep card highlight after focusing/selecting the link search box (select can fire focus and clear the index). */
function restoreLinkSearchFocus() {
    const linkSearch = document.getElementById('link-search-input');
    const savedIndex = keyboardFocusedIndex;
    if (linkSearch) linkSearch.select();
    keyboardFocusedIndex = savedIndex;
    if (typeof applyLinkCardKeyboardFocus === 'function') {
        applyLinkCardKeyboardFocus();
    }
}

/** True when the current sort view is derived (not manual order), so drag/move reorder is locked. */
function isManualSortLocked() {
    return sortMode === 'date' || sortMode === 'abc' || sortMode === 'tally';
}

function getSortModeLabel() {
    if (sortMode === 'date') return 'Date Added';
    if (sortMode === 'abc') return 'ABC';
    if (sortMode === 'tally') return 'Tally';
    return 'Default';
}

/** ABC section key: first char (letter upper, digit as-is, else "#"). */
function getLinkNameSectionKey(name) {
    const trimmed = (name || '').trim();
    if (!trimmed) return '#';
    const ch = trimmed.charAt(0);
    try {
        if (/\p{L}/u.test(ch)) return ch.toLocaleUpperCase();
        if (/\p{N}/u.test(ch)) return ch;
    } catch (e) {
        if (/[A-Za-z]/.test(ch)) return ch.toUpperCase();
        if (/\d/.test(ch)) return ch;
    }
    return '#';
}

/** Order ABC section headers: letters, then digits, then "#". */
function compareAbcSectionKeys(a, b) {
    const rank = (k) => {
        try {
            if (k && /\p{L}/u.test(k.charAt(0))) return 0;
            if (k && /\p{N}/u.test(k.charAt(0))) return 1;
        } catch (e) {
            if (/^[A-Za-z]/.test(k)) return 0;
            if (/^\d/.test(k)) return 1;
        }
        return 2;
    };
    const ra = rank(a);
    const rb = rank(b);
    if (ra !== rb) return ra - rb;
    return String(a).localeCompare(String(b), undefined, { sensitivity: 'base', numeric: true });
}

/** Stable DOM id for an ABC section label (Favorites, A, 7, #, …). */
function getAbcSectionElementId(label) {
    if (label === 'Favorites') return 'abc-section-favorites';
    if (label === '#') return 'abc-section-hash';
    const safe = String(label).replace(/[^A-Za-z0-9_-]/g, (ch) =>
        'u' + ch.charCodeAt(0).toString(16)
    );
    return 'abc-section-' + (safe || 'other');
}

/** Drag-hint / edit-warning copy for the active sort mode. */
function getManualSortLockMessage() {
    if (!isManualSortLocked()) return '(drag to reorder)';
    return 'Unable to sort when viewing by "' + getSortModeLabel() + '"';
}

var githubUsername = '';
var githubToken = '';
var githubGistId = '';
var githubLastSync = null;