// Shared app state (var for cross-script visibility)
var links = [];
var currentEditId = null;
var draggedId = null;
var currentFilterCategory = null;
var modalCurrentCategories = [];
var modalCurrentAccent = null;
var categorySearchTerm = '';
var linkSearchTerm = '';
var sortMode = 'tally'; // 'default' | 'tally' | 'abc' | 'date'
var currentFontScale = 100;
var viewMode = 'compact'; // 'full' or 'compact'
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
    if (sortMode === 'default') return 'My Order';
    return 'My Order';
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

var DEFAULT_MOBILE_LINK_DESC_SECONDS = 5;
var DEFAULT_EMOJI_DESC_SECONDS = 4;
var MOBILE_LINK_DESC_SECONDS_KEY = 'startpage_mobile_link_desc_seconds';
var EMOJI_DESC_SECONDS_KEY = 'startpage_emoji_desc_seconds';

/** Positive whole seconds, or null when the value cannot be used. */
function parsePopupSeconds(value) {
    var n = Number(value);
    if (!isFinite(n)) return null;
    n = Math.round(n);
    if (n < 1 || n > 600) return null;
    return n;
}

function readPopupSeconds(key, fallback) {
    try {
        var raw = localStorage.getItem(key);
        if (raw == null || raw === '') return fallback;
        var parsed = parsePopupSeconds(raw);
        return parsed == null ? fallback : parsed;
    } catch (e) {
        return fallback;
    }
}

function getMobileLinkDescriptionSeconds() {
    return readPopupSeconds(MOBILE_LINK_DESC_SECONDS_KEY, DEFAULT_MOBILE_LINK_DESC_SECONDS);
}

function getEmojiDescriptionSeconds() {
    return readPopupSeconds(EMOJI_DESC_SECONDS_KEY, DEFAULT_EMOJI_DESC_SECONDS);
}

function savePopupSeconds(key, value, fallback) {
    var seconds = parsePopupSeconds(value);
    if (seconds == null) seconds = fallback;
    try {
        localStorage.setItem(key, String(seconds));
    } catch (e) { /* ignore quota */ }
    return seconds;
}