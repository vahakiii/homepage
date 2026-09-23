# Software Design Document (SDD)

| Field | Value |
|--------|--------|
| **Project** | Startpage_NE |
| **Version** | 3.0 |
| **Date** | July 21, 2026 |
| **Author** | Vahak / Alan V. Terezian (with AI assistance) |
| **Status** | Living document — reorganized for review readability |
| **Primary code** | `index.html`, `js/*`, `css/*`, `default.json` |

---

## How to Read This Document

This SDD is large because it doubles as both an architecture overview and a detailed component pack. You do **not** need to read it top-to-bottom.

| If you need… | Go to |
|--------------|--------|
| What the product is | [§1](#1-project-overview) |
| Modules & load order | [§2](#2-system-architecture) |
| Screens & modals map | [§3](#3-user-interface-structure) |
| Link / storage schema | [§4](#4-data-model) |
| Theme roles | [§5](#5-color-theme-system) |
| Feature behavior (pick one) | [Feature Index](#feature-index-at-a-glance) → §6.x |
| Keyboard model | [§7](#7-keyboard-navigation--shortcuts) |
| Perf / CSS pipeline | [§8](#8-performance-architecture) |
| Security notes | [§10](#10-security--privacy-notes) |
| Boot sequence | [§12](#12-initialization-sequence) |
| Known gaps | [§13](#13-known-limitations--future-work) |
| Manual test checklist | [§15](#15-verification--manual-test-plan) |
| Term definitions | [Appendix A](#appendix-a--glossary) |
| REQ-ID lookup | [Appendix B](#appendix-b--requirements-id-index) |

**Conventions**

- **§N** = section number (stable across v3.0 reorganization).
- Deep feature specs use a common template: Purpose → Requirements → Architecture → Decisions → Schema → APIs → Security → NFRs → Risks.
- `*TBD*` in External ref columns means no Jira/BRD link is configured (personal project).
- Code wins if the live app and SDD ever disagree; update the SDD in the same change when possible.

---

## Table of Contents

### Part I — Foundation
1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [User Interface Structure](#3-user-interface-structure)
4. [Data Model](#4-data-model)
5. [Color Theme System](#5-color-theme-system)

### Part II — Features
6. [Feature Specifications](#6-feature-specifications) — start at [Feature Index](#feature-index-at-a-glance)
   - [6.0 Landing Screen](#60-landing-screen-main-shell)
   - [6.1 Link Management](#61-link-management) ([modal](#611-addedit-link-modal--component-design-specification), [cards](#612-link-cards-drag-and-drop--delete--component-design-specification))
   - [6.2 View Modes & Tooltips](#62-view-modes--compact-description-tooltips)
   - [6.3 Sort Modes](#63-sort-modes)
   - [6.4 Category Sidebar](#64-category-sidebar--component-design-specification)
   - [6.5 Link Search](#65-link-search-fuzzy)
   - [6.6 Emoji Quick Pick](#66-emoji-system--quick-pick-selection-ui)
   - [6.7 Google Search Modal](#67-google-search-modal)
   - [6.8 Settings & Theme](#68-settings-hub--related-modals)
   - [6.9 Font Scale Side Effects](#69-font-scale-side-effects)
   - [6.10 Daily Quote](#610-daily-quote-system-linkedlist)
   - [6.11 GitHub Gist Sync](#611-github-gist-sync-hub--related-modals)
   - [6.12 File Import/Export & First-Run](#612-file-import--export--local-persistence-bootstrap)
   - [6.13 Floating Actions](#613-floating-actions)
   - [6.14 Debug Panel](#614-debug-panel-developer)

### Part III — Cross-Cutting
7. [Keyboard Navigation & Shortcuts](#7-keyboard-navigation--shortcuts)
8. [Performance Architecture](#8-performance-architecture)
9. [Rendering & Algorithms](#9-rendering--algorithms-reference)
10. [Security & Privacy](#10-security--privacy-notes)
11. [Accessibility & UX](#11-accessibility--ux-conventions)
12. [Initialization Sequence](#12-initialization-sequence)
13. [Known Limitations & Future Work](#13-known-limitations--future-work)

### Part IV — Operations
14. [Repository Utilities & Documentation Policy](#14-repository-utilities--documentation-policy)
15. [Verification & Manual Test Plan](#15-verification--manual-test-plan)
16. [Document History](#16-document-history)

### Appendices
- [A. Glossary](#appendix-a--glossary)
- [B. Requirements ID Index](#appendix-b--requirements-id-index)

---

## Quick Reference Cards

### Modules (load order)

`config → state → storage → github → render → quotes → addeditlink → settingsmodal → gsmodal → debug → app → script`  
(all `defer` — see [§2.3](#23-script-load-order))

### Persistence (primary keys)

| Key | Holds |
|-----|--------|
| `startpage_links` | Link array |
| `startpage_user_name` | Title name |
| `startpage_font_scale` | 70–150 |
| `startpage_view_mode` | `full` \| `compact` |
| `startpage_*_color` | Theme roles |
| `github_*` | Sync credentials + gist id + last sync |

Full table: [§4.6](#46-localstorage-keys).

### Everyday shortcuts

| Key | Action |
|-----|--------|
| `/` | Google Search modal |
| `+` | Add Link |
| `*` | Focus link search |
| `-` | Clear filters |
| `Esc` | Close modal / clear card highlight |
| `Ctrl+Shift+D` | Debug panel |
| `↓↑←→` / Enter | Card nav from link search |

Full model: [§7](#7-keyboard-navigation--shortcuts).

---

<!-- ===== PART I — FOUNDATION ===== -->

## Part I — Foundation

Orientation for architects and new reviewers: what the product is, how it is built, and how data is stored.

---

## 1. Project Overview

Startpage_NE is a customizable browser **start page / new-tab page** built with static HTML, custom CSS, and vanilla JavaScript. It runs with **zero build step at runtime**: open `index.html` in a modern browser (or host as static files).

### 1.1 Goals

- Fast, lightweight, highly customizable start page
- Productivity-focused link management (categories, favorites, accents, views)
- Personalization (name, colors, font scale, daily quote)
- Cross-device backup via JSON export/import and optional **GitHub Gist** sync
- Clean dark-first UI with full light/dark color presets
- Keyboard-first workflows for search, add, filter, and open links

### 1.2 Non-Goals

- Server-side backend or user accounts (except optional GitHub API for Gists)
- Framework SPA (React/Vue/etc.) or mandatory bundler for daily use
- Secure vault-grade secret storage (GitHub tokens are convenience-stored in `localStorage`)

### 1.3 Runtime Constraints

- **No frameworks** — vanilla JS + static CSS
- **Classic scripts** (`defer`), not ES modules (supports simple local open and HTML `onclick` handlers)
- **Primary persistence:** `localStorage`
- **Optional network:** GitHub Gist API; `fetch('default.json')` for first-run seed data

---

## 2. System Architecture

### 2.1 High-Level Layers

```
┌─────────────────────────────────────────────────────────────┐
│  index.html  — shell, layout, modals, critical CSS, load order │
├─────────────────────────────────────────────────────────────┤
│  css/        — theme CSS + FA icon subset                       │
├─────────────────────────────────────────────────────────────┤
│  js/config   — constants (accents, emojis)                      │
│  js/state    — shared mutable globals                           │
│  js/storage  — localStorage + file import/export                │
│  js/github   — Gist sync                                        │
│  js/render   — DOM views (sidebar, cards, filters)              │
│  js/quotes   — daily quote LinkedList                           │
│  js/*modal*  — feature UI (add/edit, settings, search)          │
│  js/app      — controller: actions, keyboard, clock, init       │
│  js/script   — deferred boot tail                               │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
   localStorage  ◄──►  optional GitHub Gist / JSON files
```

### 2.2 Repository Structure

```
startpage_NE/
├── index.html                 # App shell, modals, critical CSS, script tags
├── default.json               # Seed links when localStorage is empty
├── manifest.json              # PWA manifest (standalone metadata)
├── README.md                  # User-facing overview
├── Clear_bak.bat              # Dev utility: recursive delete *.bak (§14.2)
│
├── css/
│   ├── styles.css             # Consolidated theme + component CSS (minified)
│   ├── fontawesome-subset.min.css  # Used icons only
│   └── fontawesome/webfonts/
│       ├── fa-solid-900.woff2
│       └── fa-brands-400.woff2
│
├── js/
│   ├── config.js              # ACCENT_COLORS, COMMON_EMOJIS, EMOJI_NAMES
│   ├── state.js               # Shared application state
│   ├── storage.js             # load/save, export/import, first-run UX
│   ├── github.js              # Gist credentials + sync API/UI
│   ├── render.js              # Sidebar, links grid, fuzzy match helpers
│   ├── quotes.js              # Quotes LinkedList + day-of-year picker
│   ├── addeditlink.js         # Add/Edit link modal, emoji picker, categories
│   ├── settingsmodal.js       # Settings, color theme, attribution, applyColors
│   ├── gsmodal.js             # Google Search modal (open/close/drag)
│   ├── debug.js               # Debug panel; keyboardFocusedIndex / listControlsStacked
│   ├── app.js                 # Actions, keyboard, font scale, clock, initializeApp
│   └── script.js              # Boot: initQuotes + idle font prefetch
│
├── docs/
│   └── SDD.md                 # This document
│
└── tools/
    └── optimize_css.py        # Offline CSS minify + FA subset rebuild helper
```

**Referenced by `manifest.json` (may not be in tree):** `icons/icon-192.png`, `icons/icon-512.png`.

### 2.3 Script Load Order

All scripts use **`defer`** (parallel download, ordered execution, non-blocking parse):

```
config → state → storage → github → render → quotes →
addeditlink → settingsmodal → gsmodal → debug → app → script
```

| Module | Responsibility |
|--------|----------------|
| `config.js` | Pure constants |
| `state.js` | Shared mutable state (`var` globals) |
| `storage.js` | Data layer (links I/O, JSON backup) |
| `github.js` | GitHub Gist sync |
| `render.js` | View / DOM rendering |
| `quotes.js` | Daily quote system |
| `addeditlink.js` | Add/Edit Link domain UI |
| `settingsmodal.js` | Settings & theming domain UI |
| `gsmodal.js` | Search modal domain UI |
| `debug.js` | Developer debug panel + some shared UI state vars |
| `app.js` | Controller: init, keyboard, clock, filters, FABs |
| `script.js` | Post-boot helpers |

**Global model:** modules share globals intentionally (no ES `import`/`export`) so HTML `onclick="..."` and multi-file scripts work without a bundler.

---

## 3. User Interface Structure

### 3.1 Main Layout Regions (Landing Screen)

Primary shell after load. Full component design: **§6.0**.

| Region | Key elements |
|--------|----------------|
| **Sticky header** | `#daily-quote`; brand `#header-logo` / `#page-title`; center (md+) `#greeting` / `#date` / `#clock`; actions Search · Settings · Backup · GitHub Sync (`.menu-text-label` width×scale collapse) |
| **Legacy Google field** | `#old-search-wrapper` **hidden**; modal search is primary (§6.7) |
| **Body (two-column)** | Left (lg+): categories sidebar; Main: Quick Access controls, `#links-grid`, `#privacy-note` |
| **Floating actions** | `#go-to-top`, `#go-to-bottom` (`.floating-goto`, `z-index: 90`) |

### 3.2 Modals (static HTML)

| Modal ID | Purpose |
|----------|---------|
| `#settings-modal` | Preferences hub — name, font scale, theme/attribution entry, shortcut hints (**§6.8**) |
| `#search-modal` | Draggable Google Search (**§6.7**) |
| `#color-theme-modal` | Color role editor (child of Settings; **§6.8**) |
| `#attribution-modal` | Credits / licenses (child of Settings; **§6.8**) |
| `#modal` | Add / Edit Link |
| `#sync-modal` | GitHub Gist sync hub (**§6.11**) |
| `#github-credentials-modal` | Username, PAT, bound Gist ID (child of Sync; **§6.11**) |
| `#gists-list-modal` | Pick among user’s JSON Gists for import (**§6.11**) |
| `#sync-instructions-modal` | PAT / Gist setup guide (child of Sync; **§6.11**) |

**Created dynamically in JS (not in static HTML):**

- File-protocol welcome / first-run modal (`storage.js`) — **§6.12**
- `#debug-panel` developer overlay (`debug.js`) — see **§6.14** (not a modal; no Escape stack; Ctrl+Shift+D)
- Compact-mode description tooltips (`.link-card-tooltip` in `render.js`) — **§6.1.2**

### 3.3 Add/Edit Link Modal — Summary

Primary CRUD surface for link records (`#modal`). Full component design: **§6.1.1**.

| Mode | Entry | Distinct UI |
|------|--------|-------------|
| **Add** | `#add-link-btn`, `#quick-add-btn`, keyboard **`+`** | Title “＋ Add New Link”; position radios (Top/Bottom, default Bottom); move controls hidden |
| **Edit** | Card `data-action="edit"` | Title with edit icon; form prefilled; position radios hidden; Move Top/Bottom (or date-sort warning) |

**Fields:** Name*, URL*, Description, Categories (multi-chip), Icon/emoji, Favorite, Accent color.  
**Actions:** Save Link, Close/Cancel, Escape; nested emoji Quick Pick and category autocomplete.

---

## 4. Data Model

### 4.1 Link Object

```js
{
  id: number,                 // typically Date.now(); used for identity & date sort
  createdAt: number,          // set on create (optional on older data)
  name: string,
  url: string,                // https:// prefixed if scheme missing
  description: string,        // default ""
  emoji: string,              // default "🔗"; may be short text (e.g. "X", "FB")
  categories: string[],       // multi-tag; case-insensitive dedupe on add
  accentColor: string | null, // key into ACCENT_COLORS (not a raw hex)
  isFavorite: boolean         // default false; pinned first in default sort
}
```

**Normalization** on create (and aligned load/import paths) via `normalizeLink()` in `addeditlink.js` ensures missing fields receive safe defaults. See **§6.1.1.6** for modal-owned schema rules.

### 4.2 Accent Color Keys (`config.js`)

| Key | Hex |
|-----|-----|
| red | `#ef4444` |
| orange | `#f97316` |
| yellow | `#eab308` |
| green | `#22c55e` |
| blue | `#3b82f6` |
| indigo | `#6366f1` |
| violet | `#8b5cf6` |

### 4.3 Backup / Gist Payload

```js
{
  links: Link[],
  colors: {
    bg, text, card, search, activeCat, category,
    textbox, activeText, emojiBg, hoverBlend,
    button, saveButton, success, caution
  },
  userName: string,
  fontScale: number,              // 70–150
  lastSynced?: string,            // ISO — gist export only
  github: {
    username: string,
    token: string,                // masked in export (see §4.5)
    gistId: string
  },
  githubLastSync: string | null   // ms timestamp string
}
```

Gist file name: **`startpage-backup.json`**.

### 4.4 `default.json` (Seed Catalog)

Starter link pack shipped with the repo. Used for first-run seed and as the file:// welcome Import target (**§6.12**, **§6.12.12**).

> *Detail note:* P3 expansion — catalog inventory, field conventions, maintenance rules (counts accurate as of this revision).

#### 4.4.1 Shape & load contract

| Rule | Detail |
|------|--------|
| **Shape** | `{ "links": [ Link, ... ] }` only — **no** `colors`, `userName`, `fontScale`, or `github` |
| **Auto-load** | When `startpage_links` is missing **and** `fetch('default.json')` succeeds (HTTP/HTTPS) |
| **On success** | Normalize each link → `saveLinks()` → `renderLinks` + sidebar |
| **`file://` failure** | Empty `links` + welcome modal → user Import of this file |
| **HTTP failure** | Empty `links`; `console.warn` (no modal) |

#### 4.4.2 Catalog statistics (current file)

| Metric | Value |
|--------|-------|
| Link count | **21** |
| Favorites (`isFavorite: true`) | **2** (GMail, Google Drive) |
| Accents set | **0** (all `accentColor: null`) |
| Distinct categories | **~26** labels (multi-tag; links may appear under several) |

**Category labels present (alphabetical):** AI, Anthropic, Cloud, Elon, Email, Encyclopedia, Entertainment, Failing Newspaper, Finance, Google, Knowledge, Liberal, Markets, Microsoft, News, Photos, Professional Networking, Shopping, Social Media, Storage, Twitter, UK, Videos, World, X, xAI.

#### 4.4.3 Seed link inventory

| Name | Icon | URL | Categories | Fav |
|------|------|-----|------------|-----|
| Google Photos | 📷 | https://photos.google.com | Photos, Google | |
| YouTube | 🎬 | https://YouTube.com | Entertainment, Google, Videos | |
| X | X | https://x.com | Entertainment, Social Media | |
| Facebook | FB | https://Facebook.com | Social Media | |
| Instagram | I | https://Instagram.com | Entertainment, Social Media | |
| GMail | 📧 | https://gmail.com | Email, Google | ★ |
| Google Drive | 💾 | https://drive.google.com | Google, Cloud, Storage | ★ |
| Reuters | 📰 | https://reuters.com | News | |
| Associated Press (AP) | 📰 | https://apnews.com | News | |
| BBC News | 📰 | https://bbc.com/news | UK, News, World | |
| The New York Times | 📰 | https://nytimes.com | Failing Newspaper, Liberal, News | |
| The Wall Street Journal | 📈 | https://wsj.com | Finance, News | |
| Bloomberg | 📊 | https://bloomberg.com | Finance, News, Markets | |
| LinkedIn | LI | https://linkedin.com | Social Media, Professional Networking | |
| Reddit | 🤖 | https://reddit.com | Social Media | |
| Gemini | ✨ | https://gemini.google.com | AI, Google | |
| Claude | 🧠 | https://claude.ai | Anthropic, AI | |
| Microsoft Copilot | 🤖 | https://copilot.microsoft.com | AI, Microsoft | |
| Grok | 🚀 | https://x.com/i/grok | AI, xAI, X, Twitter, Elon | |
| Wikipedia | 📖 | https://wikipedia.org | Knowledge, Encyclopedia | |
| Amazon | 🛒 | https://Amazon.com | Shopping | |

*(Emoji column may vary slightly by editor; source of truth is the JSON file. Text icons like `X`, `FB`, `I`, `LI` are intentional short labels.)*

#### 4.4.4 Field conventions in the seed

| Field | Practice in `default.json` |
|-------|----------------------------|
| `id` / `createdAt` | Numeric timestamps (ms); some entries omit `createdAt` — normalized on load if needed elsewhere |
| `description` | Optional; news/AI entries often longer prose |
| `emoji` | Unicode emoji **or** 1–2 char text badge |
| `categories` | Multi-tag arrays; informal labels allowed (e.g. opinionated news tags) |
| `accentColor` | All null in current pack |
| `isFavorite` | Only GMail + Google Drive |

#### 4.4.5 Maintenance rules

1. Keep root shape **`{ "links": [...] }`** — do not add settings here (those come from user prefs / full backups).  
2. After editing, verify JSON parses and each link has at least `name`, `url`, `id`.  
3. Prefer stable unique `id` values (do not reuse ids across entries).  
4. Update **§4.4.2–4.4.3** counts/table when the seed pack changes materially.  
5. Welcome modal copy (§6.12.12) still says “Import `default.json`” — keep filename stable.

### 4.5 Token Masking (export)

- `maskToken`: after each character, insert a random special from `! @ # $ % ^`.
- `unmaskToken`: even length + odd positions all specials → unmask; otherwise treat as plain (legacy).
- **Security:** PAT is still stored in **plaintext** in `localStorage`. Masking is obfuscation for shared JSON only, not encryption.

### 4.6 localStorage Keys

| Key | Purpose |
|-----|---------|
| `startpage_links` | JSON array of links |
| `startpage_user_name` | Page title personalization |
| `startpage_font_scale` | Font size percent (default 100) |
| `startpage_view_mode` | `full` \| `compact` |
| `startpage_bg_color` | Background |
| `startpage_text_color` | Primary text |
| `startpage_card_color` | Card background |
| `startpage_search_color` | Search / related surface |
| `startpage_active_cat_color` | Active & accent chrome |
| `startpage_category_color` | Pills / category surfaces |
| `startpage_textbox_color` | Input backgrounds |
| `startpage_active_text_color` | Strong / selected text |
| `startpage_emoji_bg_color` | Emoji tile background |
| `startpage_hover_blend_color` | Hover lighten partner for `color-mix` |
| `startpage_button_color` | Secondary buttons / FABs |
| `startpage_save_button_color` | Primary actions |
| `startpage_success_color` | Success / connected states |
| `startpage_connection_color` | Legacy fallback for success |
| `startpage_caution_color` | Warnings |
| `github_username` | Gist auth |
| `github_token` | Personal access token |
| `github_gist_id` | Bound gist id |
| `github_last_sync` | Last successful sync (ms) |

### 4.7 In-Memory State (`state.js` + related)

| Variable | Meaning |
|----------|---------|
| `links` | Working link array |
| `currentEditId` | Link id in edit modal |
| `draggedId` | Drag-reorder source |
| `currentFilterCategory` | Sidebar category filter (`null` = All) |
| `modalCurrentCategories` | Categories being edited in modal |
| `modalCurrentAccent` | Accent key in modal |
| `categorySearchTerm` / `linkSearchTerm` | Filter strings |
| `sortMode` | `default` \| `date` |
| `currentFontScale` | 70–150 |
| `viewMode` | `full` \| `compact` |
| `githubUsername` / `Token` / `GistId` / `LastSync` | Sync state |
| `keyboardFocusedIndex` | Card keyboard nav index (`debug.js`) |
| `listControlsStacked` | Layout flag for list controls (`debug.js`) |

---

## 5. Color Theme System

### 5.1 Color Role Vocabulary

| UI label | Role |
|----------|------|
| **Background** | Page background |
| **Text** | Default body / card text |
| **Textbox** | Input / textarea backgrounds |
| **Active & Accent** | Active category, borders, header logo, focus rings |
| **Active Text** | Text on active / hover emphasis |
| **Card** | Link card backgrounds |
| **Pill** | Category pill backgrounds |
| **Emoji Background** | Emoji square on cards / modal preview |
| **Hover Blend** | Partner color for `color-mix` hover lifts |
| **Button** | Secondary buttons, FABs, cancel-style actions |
| **Submit Button / Save** | Primary actions (Save Link, Save Colors, Clear Gist, etc.) |
| **Success** | Connected status, positive accents |
| **Caution** | Date-sort warnings, credential warnings |

### 5.2 CSS Custom Properties

Set by `applyColors()` (`settingsmodal.js`) and/or critical CSS:

| Field key | CSS variables |
|-----------|----------------|
| `bg` | `--background-color`, body background |
| `text` | `--text-color` |
| `card` | `--card-bg` |
| `search` | `--search-bg` |
| `activeCat` | `--active-cat-bg`, `--active-cat-color` |
| `category` | `--category-bg` |
| `textbox` | `--textbox-bg` |
| `activeText` | `--active-text-color`, `--active-cat-text` |
| `emojiBg` | `--emoji-bg` |
| `hoverBlend` | `--hover-blend` |
| `button` | `--button-bg` |
| `saveButton` | `--save-button-bg` |
| `success` | `--success-color` |
| `caution` | `--caution-color` |

**Also used:**

- `--app-font-body`, `--app-font-display`, `--app-font-mono`, `--app-ease`, `--app-elevation-*`, `--font-scale`
- Surface/chrome tokens: `--color-surface-page`, `--color-surface-chrome`, `--color-text-primary`, `--color-border*`, `--color-muted*`, `--color-save`, `--color-hairline`
- Per-card `--accent-color` (inline from `ACCENT_COLORS`)
- FA: `--fa`, `--fa-style-family`, `--fa-family-brands`

**Hover/focus model:** `styles.css` uses extensive `color-mix(in srgb, …)` with theme roles so custom palettes stay consistent.

### 5.3 Default Palettes

**Dark (default):** bg `#18181b`, text `#e4e4e7`, card `#27251f`, activeCat `#aa0000`, saveButton `#4f46e5`, success `#10b981`, caution `#fbbf24`, etc.

**Light:** alternate set via `applyColorMode` / light defaults in `app.js` (e.g. bg `#c9c9c9`, textbox `#a8a8a8`, activeCat `#e14c4c`).

Theme editor supports per-field reset and Light/Dark presets.

### 5.4 Header Fixed Colors

Independent of theme **Text** color (forced for visibility):

- `#page-title`, `#greeting`, `#date`, `#clock`, `.menu-text-label`, header action icons, `#daily-quote` → `#e4e4e7`

---

<!-- ===== PART II — FEATURES ===== -->

## Part II — Features

Product behavior. Start with the **Feature Index** below, then open only the deep subsections you need. Cross-cutting keyboard and performance topics are in Part III.

---

## 6. Feature Specifications

### Feature Index (at a glance)

Use this table for reviews. Open the deep section only when you need APIs, diagrams, or REQ tables.

| Area | One-line summary | Detail |
|------|------------------|--------|
| Landing shell | Sticky header, sidebar, Quick Access grid, FABs | [§6.0](#60-landing-screen-main-shell) |
| Link CRUD modal | Add/Edit form, categories, emoji, accent, favorite | [§6.1.1](#611-addedit-link-modal--component-design-specification) |
| Link cards | Render, open, delete, drag-reorder, tooltips | [§6.1.2](#612-link-cards-drag-and-drop--delete--component-design-specification) |
| View modes | Full vs Compact; compact description tooltips | [§6.2](#62-view-modes--compact-description-tooltips) |
| Sort modes | Default (favorites + drag) vs Date Added | [§6.3](#63-sort-modes) |
| Category sidebar | Filter, rename/delete tags, clear-filter IO | [§6.4](#64-category-sidebar--component-design-specification) |
| Link search | In-page fuzzy match (AND tokens) | [§6.5](#65-link-search-fuzzy) |
| Emoji Quick Pick | Catalog + nested picker + free-type | [§6.6](#66-emoji-system--quick-pick-selection-ui) |
| Google Search | Draggable modal → Google `q=` new tab | [§6.7](#67-google-search-modal) |
| Settings / theme | Name, font scale, color roles, attribution | [§6.8](#68-settings-hub--related-modals) |
| Font scale layout | Header label collapse + list-controls stack | [§6.9](#69-font-scale-side-effects) |
| Daily quote | Day-of-year → LinkedList index | [§6.10](#610-daily-quote-system-linkedlist) |
| GitHub Gist sync | Private gist export/import + credentials | [§6.11](#611-github-gist-sync-hub--related-modals) |
| File backup / first-run | JSON export/import; `default.json`; file:// welcome | [§6.12](#612-file-import--export--local-persistence-bootstrap) |
| Floating actions | Quick Add / Top / Bottom visibility | [§6.13](#613-floating-actions) |
| Debug panel | Ctrl+Shift+D live metrics | [§6.14](#614-debug-panel-developer) |
| Keyboard | Global chords + card/category nav | [§7](#7-keyboard-navigation--shortcuts) |
| CSS tooling | `optimize_css.py`, FA subset, class inventory | [§8](#8-performance-architecture) |

**Suggested review paths**

| Reviewer goal | Read |
|---------------|------|
| 15-minute orientation | Part I (§1–§5) + Feature Index + §13 |
| Feature / UX review | Feature Index → relevant §6.x + §7 |
| Security review | §4.5–4.6, §10, §6.11.8, §6.12.8 |
| Release smoke | §15 test plan |
| CSS / icons maintainer | §8.3, §8.5 |

### 6.0 Landing Screen (Main Shell)

The **Landing Screen** is the default post-load surface: sticky header, optional sidebar, Quick Access link workspace, privacy note, and floating actions. It hosts entry points into all modals and is the primary productivity view. Detailed feature rules for links, sort/view, sidebar search, quotes, and FABs remain in subsequent subsections; this section specifies the **shell as a product surface**.

> *Detail note:* New component design for the Landing Screen / main shell, aligned with `index.html` layout, `initializeApp` boot, `render.js` grid/sidebar, and responsive chrome behavior.

#### 6.0.1 Purpose & Scope

| Item | Description |
|------|-------------|
| **Purpose** | Present a fast, keyboard-friendly start page: personal greeting and time context, categorized link access, local search/filter, and one-click entry to search, settings, backup, and sync. |
| **In scope** | Header chrome (quote, brand/title, greeting/date/clock, action cluster); two-column body; category sidebar sticky stack; Quick Access toolbar (sort, view, link search, Add Link); links grid/cards empty states; privacy note; floating actions visibility; first paint/boot wiring that paints the shell; responsive menu-label and list-control stacking. |
| **Out of scope** | Modal internals (documented in §6.1.1, §6.6–§6.8, §6.11, §6.14); Gist/file backup payload details (§4, §6.12); offline CSS tooling (§8). |
| **Actors** | End user opening `index.html` (or hosted static start/new-tab page). |
| **Primary artifacts** | `index.html` shell; `js/app.js` (`initializeApp`, clock/greeting, FABs, shortcuts); `js/render.js` (sidebar + grid); `js/storage.js` (load links / first-run); `js/quotes.js` (daily quote); theme CSS vars (§5). |

#### 6.0.2 Requirements Traceability

No external BRD / FRS / Jira linkage in-repo. Internal IDs below; map **External ref** when enterprise tickets exist.

| Req ID | Requirement (shall) | Implementation | External ref |
|--------|---------------------|----------------|--------------|
| **REQ-LS-001** | Shell shall paint a dark critical frame before deferred JS | Inline critical CSS in `<head>` | *TBD* |
| **REQ-LS-002** | Header shall remain sticky while scrolling | `.app-header` (`position: sticky; top: 0; z-index: 50`) | *TBD* |
| **REQ-LS-003** | Header shall show day-of-year quote when available | `#daily-quote` + `displayDailyQuote` | *TBD* |
| **REQ-LS-004** | Page title shall reflect saved user name or `Start` | `#page-title` + `startpage_user_name` | *TBD* |
| **REQ-LS-005** | Header (md+) shall show greeting, date, and clock | `#greeting`, `#date`, `#clock`; 30s refresh | *TBD* |
| **REQ-LS-006** | Header shall expose Search, Settings, Backup, GitHub Sync | Buttons / dropdown → respective open/export APIs | *TBD* |
| **REQ-LS-007** | Menu text labels shall collapse by width × font scale | `updateMenuLabelsVisibility` (§6.9) | *TBD* |
| **REQ-LS-008** | Body shall use two columns on large screens; links full width below | `.categories-column` (`width: 16rem`; shown at `min-width: 1024px`) | *TBD* |
| **REQ-LS-009** | Sidebar shall list categories with counts and support filter | `renderCategoriesSidebar`, `#category-search` | *TBD* |
| **REQ-LS-010** | Clear-filter affordance shall appear when list scrolls past first item | IO on sidebar + `#clear-filter-link` | *TBD* |
| **REQ-LS-011** | Main column shall support Default / Date sort and Full / Compact view | `#list-controls` → `sortMode` / `viewMode` | *TBD* |
| **REQ-LS-012** | User shall filter links via fuzzy search field | `#link-search-input` (§6.5) | *TBD* |
| **REQ-LS-013** | User shall open Add Link from main button and floating quick-add | `#add-link-btn`, `#quick-add-btn` | *TBD* |
| **REQ-LS-014** | Links grid shall render cards or empty state | `renderLinks` | *TBD* |
| **REQ-LS-015** | Privacy note shall state local browser storage | `#privacy-note` static copy | *TBD* |
| **REQ-LS-016** | Floating top/quick-add shall hide when Add Link is in view | `IntersectionObserver` on `#add-link-btn` | *TBD* |
| **REQ-LS-017** | Floating go-bottom shall hide near document bottom | Scroll heuristic ~400px | *TBD* |
| **REQ-LS-018** | Initial focus shall prefer link search after short delay | Boot focus ~150 ms (§7) | *TBD* |
| **REQ-LS-019** | Header text/icons shall use fixed light color for legibility | Critical CSS force `#e4e4e7` (§5.4) | *TBD* |
| **REQ-LS-020** | List controls shall stack vertically under width/scale threshold | `updateListControlsLayout` (§6.9) | *TBD* |

**Cross-refs:** §6.1–§6.5 (content behavior), §6.9 (scale side effects), §6.10 (quote), §6.13 (FABs detail), §7 (shortcuts), §12 (init).

#### 6.0.3 High-Level Architecture & Diagrams

**Region map**

```
┌──────────────────────────────────────────────────────────────────┐
│ STICKY HEADER (z-50)                                             │
│  [ daily-quote ]                                                 │
│  [ logo | title ]   [ greeting | date/clock ]   [ actions… ]     │
├──────────────┬───────────────────────────────────────────────────┤
│ SIDEBAR      │ MAIN — QUICK ACCESS                               │
│ (lg+, sticky)│  title + filter indicator                         │
│  cat search  │  sort | view controls                             │
│  categories  │  link search              [ Add Link ]            │
│  clear filter│  ┌─────────────────────────────────────────────┐  │
│              │  │ #links-grid  (full list or compact 1–2 col) │  │
│              │  └─────────────────────────────────────────────┘  │
│              │  privacy-note                                     │
└──────────────┴───────────────────────────────────────────────────┘
                                              ┌──── FABs (z-90) ──┐
                                              │ quick-add / top   │
                                              │ bottom            │
                                              └───────────────────┘
```

**Data → view flow**

```
  localStorage / default.json
            │
            ▼
       loadLinks() ──► links[]
            │
            ├─► renderCategoriesSidebar()
            └─► renderLinks()  ← sortMode, viewMode, filters
  loadColorSettings / loadFontScale / displayDailyQuote
  clock/greeting interval (30s)
  IO + scroll → FAB visibility
```

**z-index stack (shell vs overlays)**

| Layer | Approx. z | Notes |
|-------|-----------|--------|
| Page content | auto | Body columns |
| Sticky header | `50` | Always accessible |
| Floating actions | `90` | Above content, below modals |
| Backup dropdown | `100` | Hover menu |
| App modals | `100–120` | Search/settings/sync/etc. |
| Debug panel | `99999` | Developer only |

#### 6.0.4 Tech Stack & Versions

| Layer | Technology | Version / note |
|-------|------------|----------------|
| Markup | HTML5 static shell | `index.html` |
| Scripting | Vanilla JS classic `defer` | Ordered modules (§2.3) |
| Styling | `styles.css` + critical inline CSS | No runtime CSS framework |
| Icons | Font Awesome **7** Free subset | Solid + brands WOFF2 |
| Persistence | `localStorage` | Links, prefs, theme, view mode |
| Optional seed | `fetch('default.json')` | HTTP(S) only; file:// welcome path |
| PWA meta | `manifest.json` | No service worker |
| Runtime deps | **None** at npm | Open static files |

#### 6.0.5 Key Design Decisions & Rationale

| # | Decision | Rationale | Status |
|---|----------|-----------|--------|
| L1 | Sticky two-row header (quote + chrome) | Quote always visible; actions remain reachable while scrolling links | **Current** |
| L2 | Fixed light header text independent of theme Text | Prevents low-contrast title/greeting on dark bar when user lightens body text (§5.4) | **Current** |
| L3 | Google search in modal, not inline hero | Frees vertical space; legacy field kept hidden for compatibility | **Current** |
| L4 | Categories sidebar only from `lg` breakpoint | Mobile/tablet prioritize full-width links | **Current** |
| L5 | Sticky sidebar under header (`top-20`) | Category filter remains usable during long lists | **Current** |
| L6 | Sort + view as segmented controls in toolbar | Discoverable without opening Settings | **Current** |
| L7 | Favorites pin in Default sort only; Date sort by `id` desc | Personal order vs chronological audit | **Current** (§6.3) |
| L8 | Drag reorder disabled in Date sort | Date order is derived, not free-form | **Current** |
| L9 | Dual search surfaces: category sidebar vs fuzzy link search | Different jobs; avoids overloading one box | **Current** |
| L10 | Empty grid state with CTA copy | First-run / empty filter guidance | **Current** |
| L11 | Privacy note under links column only | Sets expectation of local-only storage | **Current** |
| L12 | FABs tied to Add Link visibility + bottom proximity | Reduce chrome when primary Add is on screen | **Current** |
| L13 | Clock/greeting/date update every **30s** | Low cost; sufficient for minute-level clock | **Current** |
| L14 | Menu labels collapse by font-aware width threshold | Prevent header overflow at large font scales | **Current** (§6.9) |
| L15 | Critical CSS dark shell | Avoid white flash / stabilize LCP on slow disks | **Current** |
| L16 | Initial focus on link search | Keyboard-first link filtering is the common path | **Current** |
| L17 | Compact tooltips for descriptions | Dense grid without losing metadata (§6.2) | **Current** |

#### 6.0.6 Data Model / Schema

Landing Screen **reads** shared app state (does not define a separate entity model).

| Concern | Source | Notes |
|---------|--------|-------|
| Links | `links[]` / `startpage_links` | Card grid; see §4.1 |
| Category filter | `currentFilterCategory` | `null` = All |
| Link search term | `linkSearchTerm` | Fuzzy match §6.5 |
| Category search term | `categorySearchTerm` | Substring sidebar |
| Sort | `sortMode` | `default` \| `date` (session; not in localStorage today) |
| View | `viewMode` / `startpage_view_mode` | `full` \| `compact` |
| Font scale | `currentFontScale` / `startpage_font_scale` | 70–150 |
| User name | `startpage_user_name` | Title personalization |
| Colors | theme keys §4.6 / §5 | CSS variables |
| Quote | `window.dailyQuotes` + day-of-year | Display only |
| Keyboard card index | `keyboardFocusedIndex` | Nav highlight |
| List controls stack flag | `listControlsStacked` | Layout |

**Greeting bands** (`updateGreeting`, local hour):

| Hours (local) | Text |
|---------------|------|
| 0 | It's Past Midnight! |
| 1–2 | You're a Night Owl! |
| 3–4 | You're an Early Bird! |
| 5–11 | Good Morning! |
| 12 | Good Afternoon! |
| 13–14 | Midday Moment! |
| 15–16 | Golden hour incoming! |
| 17–19 | Good Evening! |
| 20–23 | Good Night! |

**Date/clock:** `toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' })`; time `hour:numeric, minute:2-digit, hour12:true`.

#### 6.0.7 API / Interface Specifications

**Boot / shell orchestration**

| Function | Role on Landing Screen |
|----------|------------------------|
| `initializeApp()` | Restore view mode; `loadLinks`; colors/font; menu + list layout; keyboard nav; emoji/category init; GitHub creds load; quote; name title; search/sort/view/FAB wiring; clock timers |
| `loadLinks()` | Populate `links`; first render; may show file:// welcome |
| `renderLinks()` | Rebuild `#links-grid` from filters/sort/view |
| `renderCategoriesSidebar()` | Rebuild category list + counts |
| `displayDailyQuote()` | Fill `#daily-quote` |
| `updateClock` / `updateDate` / `updateGreeting` | Header time context |
| `updateMenuLabelsVisibility()` | Collapse `.menu-text-label` |
| `updateListControlsLayout()` | Stack `#list-controls` |
| `applyFontScale` / `loadFontScale` | Global type scale |
| `applyColors` / `loadColorSettings` | Theme on shell + cards |

**User-facing controls (shell)**

| Control | Action |
|---------|--------|
| Search | `openSearchModal` (§6.7) |
| Settings | `openSettingsModal` (§6.8) |
| Backup → Export/Import | `exportLinks` / `importLinks` (§6.12) |
| GitHub Sync | `openSyncModal` (§6.11) |
| Category search / clear | Filter sidebar / `clearCategorySearch` |
| Sidebar category activate | Set `currentFilterCategory`; re-render |
| Clear filter link | Clear category filter |
| Sort Default / Date | Toggle `sortMode`; UI chrome for drag warning |
| View Full / Compact | Persist `viewMode`; re-render |
| Link search / clear | `linkSearchTerm`; re-render |
| Add Link / Quick Add | `openAddModal` |
| Card click | Open URL new tab; edit/delete via card actions |
| Drag handle (default sort) | Reorder `links` |
| Go Top / Bottom | Smooth scroll; adjust keyboard focus |

**DOM anchors (shell)**

| ID | Role |
|----|------|
| `#daily-quote` | Quote |
| `#header-logo`, `#page-title` | Brand |
| `#greeting`, `#date`, `#clock` | Time context |
| `#category-search`, `#categories-sidebar`, `#clear-filter-link` | Sidebar |
| `#YourLinkScroll`, `#filter-indicator`, `#drag-reorder-text` | Main headings |
| `#list-controls`, `#sort-default`, `#sort-date`, `#view-full`, `#view-compact` | Toolbar |
| `#link-search-input`, `#add-link-btn` | Search + add |
| `#links-grid` | Cards host |
| `#privacy-note` | Local-storage notice |
| `#floating-actions`, `#quick-add-btn`, `#go-to-top`, `#go-to-bottom` | FABs |
| `#old-search-wrapper` | Legacy hidden search |

#### 6.0.8 Security & Compliance Requirements

| Topic | Treatment |
|-------|-----------|
| **Data residency** | Links and prefs default to **browser localStorage** on the endpoint. Privacy note discloses this. |
| **Network** | Landing view itself needs no network after assets load (except optional `default.json` seed on HTTP and user-initiated Google/Gist). |
| **Secrets** | Shell does not display PATs; sync credentials behind Sync UI. |
| **XSS** | Cards render user-controlled name/description/URL/emoji; maintain safe DOM practices when templates change. Category sidebar actions use structured handlers. |
| **External navigation** | Card open and Google search use new tabs; user-supplied URLs are not server-validated. |
| **Regulated use** | Personal productivity page — **not** a system of record. Do not store confidential client data, account numbers, or production secrets in links/descriptions. |
| **Endpoint policy** | Deployments on shared or managed browsers should follow firm local-storage and bookmark policies. |

#### 6.0.9 Non-Functional Requirements

| Category | Requirement / observed behavior |
|----------|----------------------------------|
| **Performance** | Critical CSS + deferred JS; purged CSS; FA subset; idle brands font prefetch. Grid re-render is O(n) on filter/sort changes. |
| **First paint** | Dark shell + header icons before full CSS/JS to reduce FOUC. |
| **Responsiveness** | Sidebar from `lg`; greeting cluster from `md`; compact grid 1→2 columns from `md`; font-aware header/list stacking. |
| **Reliability** | `loadLinks` paths cover empty storage, HTTP seed, file:// welcome. Quote init race-safe. |
| **Availability** | Core landing usable offline after first load of static assets. |
| **Scalability** | Personal hundreds of links; not multi-tenant virtualized lists. |
| **Usability** | Sticky header; keyboard nav for cards/categories; FABs for long pages; empty states. |
| **Accessibility** | Category items focusable; keyboard shortcuts §7. Gaps: some hover-only menus (Backup); card a11y relies on click targets + titles. |
| **Maintainability** | Shell markup centralized in `index.html`; behavior split by module responsibility. |

#### 6.0.10 Assumptions, Risks, Dependencies & Constraints

**Assumptions**

- Modern evergreen browser with `localStorage`, `IntersectionObserver`, flex/grid.
- User opens via `index.html` or static host; script order preserved.
- Single-user browser profile (no multi-user shell session).

**Dependencies**

| Dependency | Type | Notes |
|------------|------|-------|
| Deferred JS modules in order | Hard | §2.3 |
| Theme CSS variables | Hard | Card/header theming |
| FA webfonts / subset CSS | Soft | Icons |
| `default.json` | Soft | First-run seed on HTTP |

**Constraints**

- Classic scripts / global functions for HTML handlers.
- `sortMode` not persisted across reloads (resets to default unless user reselects).
- Header chrome color intentionally not fully theme-driven.

**Risks**

| Risk | Impact | Mitigation / residual |
|------|--------|------------------------|
| Full grid re-render on each keystroke of link search | Jank at large n | Acceptable personal scale; residual |
| Shared machine localStorage | Link leakage | User clear / private window; residual |
| file:// cannot auto-seed | Empty first run | Welcome/import guidance |
| Hover-only Backup menu | Touch discoverability | Residual UX gap |
| User-supplied `javascript:` or malicious URLs | Browser navigation risk | No server allowlist; residual user trust |

#### 6.0.11 Updated Diagrams & Screenshots

**Diagrams (textual — authoritative)**

1. Region map — §6.0.3  
2. Data → view flow — §6.0.3  
3. z-index stack — §6.0.3  

**UI reference (reproduce for formal packs)**

| View | Steps | Capture |
|------|-------|---------|
| Default desktop | Open app with sample links | Full header, sidebar, full-view cards, privacy note |
| Compact view | Toggle Compact | Multi-column cards; tooltips on hover |
| Filtered | Select category + type link search | Filter indicator + reduced grid |
| Date sort | Toggle Date Added | Drag disabled messaging |
| Narrow / large font | Resize or scale font | Collapsed menu labels; stacked list controls |
| Scrolled | Scroll past Add Link | FABs visible (quick-add + top; bottom as appropriate) |
| Empty | No links / empty filter | Dashed empty state CTA |
| Mobile width | &lt; lg | No sidebar; full-width links |

**Recommended assets (not in-repo):** `docs/assets/landing-screen/`  
`desktop-full.png`, `desktop-compact.png`, `narrow-collapsed-chrome.png`, `empty-state.png`, `fabs-scrolled.png`.

Until captured, reviewers use live `index.html` against this section and §12 init sequence.

### 6.1 Link Management

- **CRUD:** add and edit via **Add/Edit Link Modal** (§6.1.1); delete via card action + confirm (**§6.1.2**)
- **Reorder:** drag-and-drop on cards (**§6.1.2**, default sort); Move Top/Bottom in edit modal
- **Favorites:** `isFavorite` → sorted first in default mode
- **Multi-categories:** chips in modal; rename/delete taxonomy in sidebar (**§6.4**)
- **Accent colors:** optional border/emoji accent per card (`ACCENT_COLORS` key)
- **URL display:** strip protocol/www, truncate ~23 chars with ellipsis (`render.js`)

#### 6.1.1 Add/Edit Link Modal — Component Design Specification

> *Detail note:* This subsection supersedes the prior short “key controls” list. It documents the current `index.html` `#modal` shell, `js/addeditlink.js` controller, and supporting render/state APIs as implemented.

##### 6.1.1.1 Purpose & Scope

| Item | Description |
|------|-------------|
| **Purpose** | Provide a single, consistent UI for creating and updating user link records (metadata, taxonomy, visual affordances, list placement) without a server-side form layer. |
| **In scope** | Open/close lifecycle; form field capture and validation; multi-category entry and autocomplete; emoji free-type + Quick Pick; accent selection; favorite flag; add-position (create) and list move (edit); persist to `localStorage` via `saveLinks()`; re-render list/sidebar; keyboard-focus restoration after save. |
| **Out of scope** | Remote URL validation/fetch; malware scanning of destinations; multi-user ACL; server-side persistence; bulk edit; delete (handled on the card, not in this modal); Gist sync (separate modals). |
| **Actors** | End user of the start page (local browser session). |
| **Primary artifact** | `#modal` in `index.html`; logic in `js/addeditlink.js`; presentation helpers in `js/render.js`; shared state in `js/state.js`; show/hide and move actions in `js/app.js`. |

##### 6.1.1.2 Requirements Traceability

No external BRD, FRS, or Jira project is currently linked in-repo. Traceability uses **internal requirement IDs** for this product. When enterprise tickets exist, map them in the **External ref** column.

| Req ID | Requirement (shall) | Implementation | External ref |
|--------|---------------------|----------------|--------------|
| **REQ-AEL-001** | User shall create a link with name and URL | `openAddModal` → `saveCurrentLink` (create branch) | *TBD* |
| **REQ-AEL-002** | User shall edit an existing link’s fields | `editLink(id)` → `saveCurrentLink` (update branch) | *TBD* |
| **REQ-AEL-003** | Name and URL shall be required | Guard + `alert` in `saveCurrentLink` | *TBD* |
| **REQ-AEL-004** | URL without scheme shall receive `https://` prefix | `if (!url.startsWith('http'))` | *TBD* |
| **REQ-AEL-005** | User shall assign zero or more categories | `modalCurrentCategories` + chips + `addCategoryToModal` | *TBD* |
| **REQ-AEL-006** | Category entry shall support comma-separated multi-add | Split/trim/dedupe in `addCategoryToModal` | *TBD* |
| **REQ-AEL-007** | Category autocomplete shall suggest existing categories | `initCategoryAutocomplete` | *TBD* |
| **REQ-AEL-008** | User shall set emoji icon (type or Quick Pick) | `#link-emoji`, `initEmojiPicker` | *TBD* |
| **REQ-AEL-009** | User shall optionally set accent color or None | `renderModalAccentColors`, `modalCurrentAccent` | *TBD* |
| **REQ-AEL-010** | User shall mark link as favorite | `#link-is-favorite` | *TBD* |
| **REQ-AEL-011** | On create, user shall choose Top or Bottom insert | `#position-options` / `add-position` radios | *TBD* |
| **REQ-AEL-012** | On edit (default sort), user shall move link Top/Bottom | `moveLinkToTop` / `moveLinkToBottom` | *TBD* |
| **REQ-AEL-013** | Move controls shall be unavailable under Date Added sort | Hide move buttons; show `#edit-date-warning` | *TBD* |
| **REQ-AEL-014** | Escape shall close emoji popover without closing modal when popover open | Capture-phase keydown in `initEmojiPicker` | *TBD* |
| **REQ-AEL-015** | Escape shall close the Add/Edit modal when it is the top open modal | Global keydown modal stack in `app.js` → `closeModal` | *TBD* |
| **REQ-AEL-016** | Save shall persist and refresh list + categories sidebar | `saveLinks`, `renderLinks`, `renderCategoriesSidebar` | *TBD* |
| **REQ-AEL-017** | After save, keyboard card focus shall target the affected card when applicable | Index resolution + `applyLinkCardKeyboardFocus` | *TBD* |

**Related cross-cutting specs:** §6.6 Emoji System (descriptor/search rules), §6.3 Sort Modes, §7 Keyboard Shortcuts (`+`, Esc).

##### 6.1.1.3 High-Level Architecture & Diagrams

**Layering (modal slice)**

```
┌──────────────────────────────────────────────────────────────────┐
│ Presentation                                                     │
│  index.html #modal  ·  emoji popover  ·  category chips/swatches │
│  renderModalCategories / renderModalAccentColors (render.js)     │
├──────────────────────────────────────────────────────────────────┤
│ Controller                                                       │
│  openAddModal · editLink · saveCurrentLink · closeModal          │
│  addCategoryToModal · initEmojiPicker · initCategoryAutocomplete │
│  openUiModal / closeUiModal · moveLinkToTop/Bottom (app.js)      │
├──────────────────────────────────────────────────────────────────┤
│ Domain / State                                                   │
│  links[] · currentEditId · modalCurrentCategories                │
│  modalCurrentAccent · sortMode · keyboardFocusedIndex            │
│  normalizeLink()                                                 │
├──────────────────────────────────────────────────────────────────┤
│ Persistence                                                      │
│  saveLinks() → localStorage key startpage_links                  │
└──────────────────────────────────────────────────────────────────┘
```

**Mode decision flow**

```
                 openAddModal()                    editLink(id)
                       │                                 │
                       ▼                                 ▼
              currentEditId = null              currentEditId = id
              empty form + defaults             load link into form
              show position radios              hide position radios
              hide move buttons                 move OR date warning
                       │                                 │
                       └────────────┬────────────────────┘
                                    ▼
                              openUiModal('modal')
                              focus #link-name
                                    │
                    Save Link ──────┤────── Close / Esc
                                    ▼
                           saveCurrentLink()
                     create (unshift/push) | update in place
                                    ▼
                     saveLinks → render → closeModal
                     restore keyboard card highlight
```

**Nested UI ownership**

| Surface | Parent | z-index / stacking | Close behavior |
|---------|--------|--------------------|----------------|
| `#modal` backdrop | `body` | `z-index: 100` | Esc (if topmost), Cancel, post-save |
| Emoji Quick Pick | Centered `fixed` inside form | `z-index: 200` | Esc (capture; does not close parent), Cancel, outside click, pick emoji — full design **§6.6** |
| Category suggestions | Absolute under input wrapper | `z-index: 200` | Esc, outside click, modal hide observer, select item |

##### 6.1.1.4 Tech Stack & Versions

| Layer | Technology | Version / note |
|-------|------------|----------------|
| Markup | HTML5 | Static shell in `index.html` |
| Scripting | Vanilla JavaScript | Classic `<script defer>` (not ES modules); ES2015+ features as used by modern browsers |
| Modal module | `js/addeditlink.js` | Application-owned; no npm package |
| Shared state | `js/state.js` | `var` globals for cross-file visibility |
| View helpers | `js/render.js` | Accent swatches, category pills |
| Controller helpers | `js/app.js` | `openUiModal` / `closeUiModal`, moves, Esc stack, init wiring |
| Constants | `js/config.js` | `ACCENT_COLORS`, `COMMON_EMOJIS`, `EMOJI_NAMES` |
| Styling | `styles.css` + critical inline CSS | Static CSS; no runtime CSS framework |
| Icons | Font Awesome **7** Free (subset) | `fa-solid` glyphs used in modal chrome (edit, smile, search, chevron, heart) |
| Persistence | `localStorage` | Via `storage.js` `saveLinks` / `loadLinks` |
| Runtime deps | **None** (zero npm at runtime) | Open `index.html` or host as static files |
| Target browsers | Modern evergreen (Chromium, Firefox, Safari/WebKit) | `color-mix`, flex/grid, `MutationObserver` |

##### 6.1.1.5 Key Design Decisions & Rationale

| # | Decision | Rationale | Status |
|---|----------|-----------|--------|
| D1 | Single modal for Add and Edit (`#modal`) | One form surface reduces HTML/CSS drift and validation duplication | **Current** |
| D2 | Mode flag via `currentEditId` (`null` = add) | Simple, serializable session state without a router | **Current** |
| D3 | Save is `type="button"` + `saveCurrentLink()`; native form submit not used for persistence | Avoids accidental Enter-submit; Enter reserved for category/autocomplete flows | **Current** *(explicit design)* |
| D4 | Create: position radios; Edit: Move Top/Bottom | Separates “initial insert policy” from “reorder existing item”; avoids confusing dual controls | **Current** |
| D5 | Move actions disabled / warning when `sortMode === 'date'` | Date order is derived from id timeline; manual order is not meaningful in that view | **Current** |
| D6 | Categories held in `modalCurrentCategories` until Save | Allows multi-edit without mutating `links[]` until commit | **Current** |
| D7 | Comma disables category autocomplete | Multi-add mode would fight suggestion UI; user intent is batch entry | **Current** |
| D8 | Emoji Esc handled in capture phase before modal Esc | Nested overlay must dismiss independently (accessibility / UX) | **Current** |
| D9 | URL scheme normalized only if not starting with `http` | Accepts `http`/`https`; bare hosts become `https://…` | **Current** |
| D10 | After successful save, re-focus keyboard selection on the affected card | Preserves keyboard-first workflows after mutation | **Current** *(post-bugfix behavior; edit path now always persist+render)* |
| D11 | On create, `clearCategoryFilter()` before render | Ensures new card is visible even if a sidebar filter would hide it | **Current** |
| D12 | `toTitleCase` invoked on category add but currently **identity** (returns input unchanged) | Full title-case rules exist commented in `app.js`; casing left as typed until re-enabled | **Current / note** |
| D13 | Accent stored as palette **key**, not hex | Theme-consistent smart blend on cards; palette central in `config.js` | **Current** |
| D14 | No network calls from this modal | Aligns with local-first privacy model; no SSRF/open-redirect server path | **Current** |

##### 6.1.1.6 Data Model / Schema

**Link record (modal read/write)** — same canonical shape as §4.1:

| Field | Type | Required | Default | Modal control |
|-------|------|----------|---------|---------------|
| `id` | number | Yes (system) | `Date.now()` on create | Not edited |
| `createdAt` | number | Yes (system) | `Date.now()` on create via `normalizeLink` | Not edited |
| `name` | string | Yes (user) | `''` | `#link-name` |
| `url` | string | Yes (user) | `''`; scheme-normalized on save | `#link-url` |
| `description` | string | No | `''` | `#link-description` |
| `emoji` | string | No | `'🔗'`; input `maxlength="2"` | `#link-emoji` |
| `categories` | string[] | No | `[]` | Chips ← `modalCurrentCategories` |
| `accentColor` | string \| null | No | `null` | `#accent-color-picker` ← `modalCurrentAccent` |
| `isFavorite` | boolean | No | `false` | `#link-is-favorite` |

**Transient modal state** (`state.js` / session):

| Variable | Type | Meaning |
|----------|------|---------|
| `currentEditId` | number \| null | Edit target; `null` = add mode |
| `modalCurrentCategories` | string[] | Working category set (not committed until Save) |
| `modalCurrentAccent` | string \| null | Working accent key |
| `emojiPopoverOpen` | boolean | Emoji Quick Pick visibility flag (`addeditlink.js`) |
| `categorySuggestionsBox` | HTMLElement \| null | Autocomplete dropdown node |
| `currentHighlightIndex` | number | Autocomplete keyboard highlight (−1 = none) |

**`normalizeLink(link)` contract:** fills missing `id`, `name`, `url`, `description`, `emoji`, `categories`, `accentColor`, `isFavorite`, `createdAt` with safe defaults; coerces `categories` to array and `isFavorite` to boolean.

**Category add rules:** split on `,`; trim; drop empties; case-insensitive dedupe against existing modal list and within the batch; append to `modalCurrentCategories`; clear input.

##### 6.1.1.7 API / Interface Specifications

**Public functions (global, classic script — callable from HTML `onclick` and other modules)**

| Function | Module | Signature / behavior |
|----------|--------|----------------------|
| `openAddModal()` | `addeditlink.js` | Reset form; add-mode chrome; `openUiModal('modal')`; focus name (~80 ms) |
| `editLink(id)` | `addeditlink.js` | Load link by id; edit chrome; date-aware move/warning; focus name (~60 ms) |
| `saveCurrentLink()` | `addeditlink.js` | Validate → create or update → persist → render → close → keyboard focus |
| `closeModal()` | `addeditlink.js` | `closeUiModal('modal')`; clear edit/transient state; hide move/position/warning; `closeEmojiPopover`; restore search/keyboard focus |
| `resetModalForm()` | `addeditlink.js` | Clear fields; default emoji; re-render chips/swatches |
| `normalizeLink(link?)` | `addeditlink.js` | Return normalized link object |
| `setModalEmoji(emoji)` | `addeditlink.js` | Set `#link-emoji` (default 🔗) |
| `addCategoryToModal()` | `addeditlink.js` | Parse input → update `modalCurrentCategories` → re-render chips |
| `initEmojiPicker()` | `addeditlink.js` | Wire Quick Pick (called from app init) |
| `closeEmojiPopover()` | `addeditlink.js` | Hide popover; clear search; clear grid |
| `initCategoryAutocomplete()` | `addeditlink.js` | Wire suggestions (called from app init) |
| `renderModalCategories()` | `render.js` | Removable sorted pills in `#modal-categories-list` |
| `renderModalAccentColors()` | `render.js` | Swatches + toggleable None |
| `openUiModal(modalId)` | `config.js` | Add `.is-open` |
| `closeUiModal(modalId)` | `config.js` | Remove `.is-open` |
| `moveLinkToTop()` | `app.js` | Reorder current edit id to index 0 if allowed |
| `moveLinkToBottom()` | `app.js` | Reorder current edit id to end if allowed |
| `toTitleCase(str)` | `app.js` | **Currently returns `str` unchanged** (see D12) |

**Entry points (UI / keyboard)**

| Entry | Action |
|-------|--------|
| `#add-link-btn` click | `openAddModal` |
| `#quick-add-btn` click | `openAddModal` |
| Keyboard **`+`** (when not blocked by other modal / context rules) | `openAddModal` |
| Card `[data-action="edit"]` | `editLink(id)` |
| Save Link button | `saveCurrentLink` |
| Close / Cancel button | `closeModal` |
| Escape | Popover first (if open); else `closeModal` if `#modal` topmost open |

**Validation interface (user-visible)**

| Condition | Response |
|-----------|----------|
| Missing name or URL | `alert("Name and URL are required")`; abort save |
| URL without `http` prefix | Prepend `https://` |
| Empty category input Add | No-op |
| Unknown edit id | `editLink` no-op if link not found |

**Persistence interface**

- Write path: `saveLinks()` after successful create/update (and after Move Top/Bottom).
- Storage key: `startpage_links` (JSON array of link objects). No dedicated REST API.

##### 6.1.1.8 Security & Compliance Requirements

| Topic | Treatment |
|-------|-----------|
| **Data residency** | Link data remains in browser `localStorage` unless user exports JSON or configures Gist sync (outside this modal). |
| **Secrets** | Modal does not collect or display tokens/credentials. |
| **Input handling** | Values written into controlled form fields and JSON storage; card open uses `window.open(url)`. Users may store arbitrary URLs — **no server-side URL allowlist**. |
| **XSS posture** | Category pills use `textContent` / structured DOM for labels; accent keys from fixed palette. Emoji/name/description are user-controlled strings rendered in templates elsewhere — maintain escaping discipline if templates change. |
| **CSRF / authn** | N/A (no session cookie auth for this modal). |
| **Transport** | No network I/O from Add/Edit save path. |
| **Audit logging** | Not implemented (client-only tool). |
| **Regulated use** | Suitable as a personal productivity page; **not** a system of record for regulated client data. Do not store confidential client PII, account numbers, or production secrets in link fields. |
| **Compliance note** | If deployed in an enterprise environment, treat localStorage and JSON backups under the firm’s endpoint and data-classification policies. |

##### 6.1.1.9 Non-Functional Requirements

| Category | Requirement / observed behavior |
|----------|----------------------------------|
| **Performance** | Modal open is DOM class toggle + local field fill; no network. Emoji grid rebuild is in-memory filter over static `COMMON_EMOJIS`. Category suggestions capped at **10** matches. |
| **Responsiveness** | `.ui-modal` full-viewport backdrop with padding; add/edit panel `.ui-modal__panel` / `.add-edit-modal__panel`; emoji picker `.emoji-picker` width `34rem`, grid min-height 420px / max-height 720px, popover max-height 860px. |
| **Reliability** | Save on edit always persists and re-renders (regression guard documented in code). Close resets transient state so reopen does not leak prior categories/accent. |
| **Availability** | Fully offline-capable after assets load; no third-party modal dependency. |
| **Scalability** | Practical for personal link sets (hundreds). Full list re-render on save is O(n) DOM; acceptable for intended scale, not multi-tenant SaaS. |
| **Usability** | Auto-focus name; labels uppercase tracking; favorite + position in two-column layout with emoji; clear add vs edit chrome. |
| **Accessibility** | Keyboard Esc paths; autocomplete arrow/Enter/Esc; focus return patterns. Gaps: native form `required` not the sole validation path; some controls rely on click + icon titles rather than full ARIA dialog pattern. |
| **Maintainability** | Modal logic isolated in `addeditlink.js`; HTML shell remains declarative for review. |
| **Observability** | No product analytics. Developer may use Debug Panel (§6.14) for counts/index. |

##### 6.1.1.10 Assumptions, Risks, Dependencies & Constraints

**Assumptions**

- User runs a modern browser with `localStorage` enabled.
- Single concurrent editor (one modal instance; one `currentEditId`).
- Link ids are stable numeric timestamps (`Date.now()`); collision risk is negligible for human-paced entry.
- `getAllCategories()`, `saveLinks()`, and render functions are loaded (script order: config → state → … → addeditlink → … → app).

**Dependencies**

| Dependency | Type | Notes |
|------------|------|-------|
| `js/state.js` globals | Hard | `links`, modal fields, `sortMode` |
| `js/config.js` | Hard | Accents + emoji catalogs |
| `js/storage.js` `saveLinks` | Hard | Persistence |
| `js/render.js` | Hard | List/sidebar + modal chip/swatch render |
| `js/app.js` | Hard | Show/hide, moves, Esc, init of pickers |
| Font Awesome subset | Soft visual | Icons degrade if CSS late; function remains |

**Constraints**

- Classic scripts / no bundler: APIs are globals.
- No ES module encapsulation — naming collisions avoided by convention.
- Sort mode Date Added forbids meaningful manual order edits in modal.
- Emoji input `maxlength="2"` may constrain some multi-codepoint sequences depending on browser counting.

**Risks**

| Risk | Impact | Mitigation / residual |
|------|--------|------------------------|
| User stores sensitive URLs or notes in description | Data exposure via backup/export/Gist | Documented in privacy note; user discipline |
| `toTitleCase` pass-through vs docs that assumed title case | Inconsistent category casing across entries | Case-insensitive dedupe; optional re-enable of title-case |
| Full grid re-render on every save | UI cost at very large n | Acceptable for personal use; future virtualize if needed |
| `alert` / `confirm` for validation & delete | Blocks main thread; limited styling | Acceptable for local tool; replace with in-modal errors if productized |
| Duplicate `setModalEmoji` definition in source | Confusion during maintenance | Harmless redefinition; consolidate when convenient |

##### 6.1.1.11 Updated Diagrams & Screenshots

**Diagrams (textual — authoritative for design review)**

1. **Layer diagram** — §6.1.1.3  
2. **Mode decision / save flow** — §6.1.1.3  
3. **Nested stacking table** — §6.1.1.3  

**UI reference (implementation source of truth; capture screenshots for formal packs as needed)**

| View | How to reproduce | What to capture |
|------|------------------|-----------------|
| Add mode | Open via Add Link / Quick Add / `+` | Title, empty fields, position radios (Bottom default), favorite, emoji, accent None, Save/Cancel |
| Edit mode (default sort) | Card → Edit | Prefill, move buttons visible, position radios hidden |
| Edit mode (date sort) | Set sort Date Added → Edit | Move buttons hidden; warning: *Unable to sort when viewing by "Date Added"* |
| Category chips | Add one or more categories | Sorted removable pills with × |
| Category autocomplete | Type partial existing category (no comma) | Dropdown ≤10, indigo match highlight |
| Emoji Quick Pick | Chevron next to emoji field | Centered popover, search, categorized grid, Cancel |
| Accent selected | Click swatch | Scale/border selection; toggle off returns to None |

**Asset location:** Screenshots are not stored in-repo as of this revision. Recommended path for a formal review pack: `docs/assets/add-edit-modal/` (`add-mode.png`, `edit-mode.png`, `emoji-picker.png`, `category-autocomplete.png`). Until added, reviewers should use the live `index.html` UI against this section.

**HTML structure anchors**

| ID / name | Role |
|-----------|------|
| `#modal` | Backdrop + dialog host |
| `#modal-title` | Mode title |
| `#modal-form` | Form container |
| `#link-name`, `#link-url`, `#link-description` | Core fields |
| `#category-input`, `#modal-categories-list` | Category entry + chips |
| `#position-options`, `#position-top`, `#position-bottom` | Add placement |
| `#link-is-favorite` | Favorite |
| `#link-emoji`, `#emoji-dropdown-btn`, `#emoji-picker-popover`, `#emoji-grid`, `#emoji-search-input` | Icon + Quick Pick |
| `#accent-color-picker` | Accent swatches host |
| `#move-buttons`, `#edit-date-warning` | Edit reorder / date caveat |

#### 6.1.2 Link Cards, Drag-and-Drop & Delete — Component Design Specification

Link cards are the primary presentation of `links[]` on the Landing Screen. Rendered into `#links-grid` by `renderLinks()` (`render.js`). Open / edit / delete / reorder are card-level behaviors (create/update form is §6.1.1).

> *Detail note:* P0 expansion — card anatomy, click routing, drag-reorder event model, delete + keyboard focus handoff, compact tooltip behavior.

##### 6.1.2.1 Purpose & Scope

| Item | Description |
|------|-------------|
| **Purpose** | Display each link as an actionable card: open destination, edit, delete, optional drag reorder, and compact-mode description discovery. |
| **In scope** | `renderLinks` pipeline (filter/sort/layout); card DOM anatomy; URL preview; empty state; grid click delegation; HTML5 drag-and-drop reorder; `deleteLink` confirm + focus; compact tooltips (delay, follow, clamp, hover-to-read); accent/favorite visuals. |
| **Out of scope** | Add/Edit form fields (§6.1.1); category rename/delete (§6.4); fuzzy search algorithm detail (§6.5); keyboard arrow nav full design (summary in §7). |
| **Primary artifacts** | `js/render.js` (`renderLinks`, tooltips); `js/app.js` (`deleteLink`, `reorderLinks`); styles for `.link-card`, `.keyboard-active`, `.dragging`. |

##### 6.1.2.2 Requirements Traceability

| Req ID | Requirement (shall) | Implementation | External ref |
|--------|---------------------|----------------|--------------|
| **REQ-LC-001** | Grid shall render filtered/sorted links per view mode | `renderLinks` | *TBD* |
| **REQ-LC-002** | Empty result shall show dashed empty state CTA | Empty HTML branch | *TBD* |
| **REQ-LC-003** | Card shall show emoji, name, and optional description/pills (full) | Card template | *TBD* |
| **REQ-LC-004** | URL preview shall strip scheme/www and truncate ~23 chars | `formatUrlPreview` | *TBD* |
| **REQ-LC-005** | Favorite links shall show heart indicator | Conditional heart icon | *TBD* |
| **REQ-LC-006** | Accent key shall set card `--accent-color` | `ACCENT_COLORS` | *TBD* |
| **REQ-LC-007** | Click card body shall open URL in new tab | `grid.onclick` → `window.open` | *TBD* |
| **REQ-LC-008** | Edit button shall open edit modal | `data-action="edit"` → `editLink` | *TBD* |
| **REQ-LC-009** | Delete shall confirm then remove link | `deleteLink` | *TBD* |
| **REQ-LC-010** | After delete, keyboard focus shall move to neighboring card | Index clamp + `applyLinkCardKeyboardFocus` | *TBD* |
| **REQ-LC-011** | Drag reorder shall be enabled only when sort ≠ date | `card.draggable`; handle opacity in date mode | *TBD* |
| **REQ-LC-012** | Drop on another card shall splice order and persist | `reorderLinks` | *TBD* |
| **REQ-LC-013** | If drag occurs while date sort, mode shall switch to default | `reorderLinks` UI chrome reset | *TBD* |
| **REQ-LC-014** | Compact mode shall show description via delayed tooltip | 1000 ms delay; `.link-card-tooltip` | *TBD* |
| **REQ-LC-015** | Tooltips shall follow mouse and clamp to viewport | 8px pad clamp | *TBD* |
| **REQ-LC-016** | Drag start shall dismiss active compact tooltips | Cleanup in `dragstart` | *TBD* |

##### 6.1.2.3 High-Level Architecture & Diagrams

```
  links[] + filters + sortMode + viewMode
                 │
                 ▼
           renderLinks()
                 │
      ┌──────────┼──────────┐
      ▼          ▼          ▼
  empty state  full list  compact grid
                 │
                 ▼
            .link-card × N
                 │
     click ──────┼────── drag (default sort)
       │         │            │
       ▼         ▼            ▼
   open URL   edit/delete  reorderLinks → saveLinks → re-render
```

**Card anatomy (left → right)**

```
[ grip ] [ emoji tile ] [ name
                          desc (full)
                          category pills (full) ] [ url preview ] [ ♥ ] [ edit ] [ del ]
```

##### 6.1.2.4 Tech Stack & Versions

| Layer | Technology | Notes |
|-------|------------|-------|
| DOM | Vanilla createElement / innerHTML template | Per-card build |
| DnD | HTML5 Drag and Drop API | `draggable`, `dataTransfer` |
| Layout | Custom CSS on `#links-grid.links-grid` | Full: flex column; Compact: `.is-compact` 1→2 columns from 768px |
| Theme | CSS vars + optional `--accent-color` | §5 |
| Navigation | `window.open(url, '_blank')` | User-supplied URLs |

##### 6.1.2.5 Key Design Decisions & Rationale

| # | Decision | Rationale | Status |
|---|----------|-----------|--------|
| C1 | Single delegated `grid.onclick` for open/edit/delete | Avoid per-card listener leak on re-render | **Current** |
| C2 | Drag handle click does not open URL | Separate reorder vs navigate | **Current** |
| C3 | Favorites sort only in default mode (stable among peers) | Pin without destroying relative order | **Current** |
| C4 | Date sort by `id` descending | Id is create timestamp convention | **Current** |
| C5 | Date mode: `draggable=false`, handle faded | Prevent meaningless reorder under derived sort | **Current** |
| C6 | `reorderLinks` forces default if called under date | Safety if DnD somehow fires | **Current** |
| C7 | Compact hides description/pills in layout; tooltip for desc | Density without total loss of metadata | **Current** |
| C8 | Tooltip delay **1s**; hide delays 250/150 ms | Reduce flicker; allow mouse into tooltip | **Current** |
| C9 | Delete focuses link search + re-applies keyboard highlight | Continuity after destructive action | **Current** |
| C10 | Orphan tooltip cleanup on every `renderLinks` | Prevent ghost tooltips after filter | **Current** |
| C11 | URL preview hidden below breakpoints (full: &lt;md; compact: &lt;1320px) | Prioritize name/actions on narrow widths | **Current** |

##### 6.1.2.6 Data Model / Schema

Uses **Link** (§4.1). Render-time only:

| Attribute | Source |
|-----------|--------|
| `card.dataset.id` | `link.id` |
| `card.dataset.accent` | `link.accentColor` (optional) |
| `card.dataset.description` | description (compact tooltip) |
| `--accent-color` | `ACCENT_COLORS[key]` |
| `keyboardFocusedIndex` | Global nav index into **visible** `.link-card` list |

**Filter pipeline order:** category filter → fuzzy link search → sort (favorites or date).

##### 6.1.2.7 API / Interface Specifications

| Function | Module | Behavior |
|----------|--------|----------|
| `renderLinks()` | `render.js` | Full grid rebuild; empty state; DnD wiring; tooltips; re-apply keyboard focus |
| `deleteLink(id)` | `app.js` | Confirm → filter out → save → re-render → focus neighbor index + link search |
| `reorderLinks(draggedId, targetId)` | `app.js` | Optional date→default; splice; save; re-render sidebar+grid |
| `formatUrlPreview(url)` | inner `renderLinks` | Strip `http(s)://`, `www.`, trailing `/`; max 23 chars with `...` after 20 |

**Click routing (`#links-grid`)**

| Target | Action |
|--------|--------|
| `[data-action="edit"]` | `editLink(id)` |
| `[data-action="delete"]` | `deleteLink(id)` |
| `.drag-handle` | No open |
| Other card area | `window.open(link.url, '_blank')` |

**DnD events (default sort):** `dragstart` (set `draggedId`, `.dragging`, clear tooltips) → `dragover` / `dragleave` (`.drag-over`, `.drop-indicator`) → `drop` → `reorderLinks` → `dragend` cleanup.

**Compact tooltip:** `mouseenter` → 1000 ms → show fixed `.link-card-tooltip` (`z-index` 99999, `textContent`); `mousemove` repositions; `mouseleave` hide after 250 ms unless pointer enters tooltip (tooltip leave hide 150 ms).

##### 6.1.2.8 Security & Compliance Requirements

| Topic | Treatment |
|-------|-----------|
| **URLs** | Opened as-is in new tab; no allowlist. User trust model. |
| **XSS** | Name/description injected via template strings — treat as trusted local data; harden if untrusted import becomes multi-user. Tooltip uses `textContent`. |
| **Delete** | Confirm dialog; no recycle bin. |
| **Regulated use** | Cards may open external sites; DLP/acceptable-use policies apply to destinations stored by the user. |

##### 6.1.2.9 Non-Functional Requirements

| Category | Behavior |
|----------|----------|
| **Performance** | Full DOM rebuild on filter/sort; fine for personal scale |
| **Reliability** | Tooltip orphan cleanup; DnD disabled under date sort |
| **Usability** | Empty CTA; grip affordance; edit/delete always visible on card |
| **Accessibility** | Keyboard card nav + Enter open (§7); delete via mouse primarily |

##### 6.1.2.10 Assumptions, Risks, Dependencies & Constraints

**Assumptions:** `links` normalized with defaults; `ACCENT_COLORS` loaded.  
**Risks:** Untrusted HTML in name/description; large-n re-render jank; confirm fatigue on delete.  
**Constraints:** No multi-select; no undo stack beyond re-import.

##### 6.1.2.11 Updated Diagrams & Screenshots

| View | Capture |
|------|---------|
| Full card | Grip, emoji, name, desc, pills, URL, heart, edit, delete |
| Compact card | Dense row; tooltip after 1s hover |
| Dragging | `.dragging` source; drop indicator on target |
| Empty | Dashed “No links yet” / filtered empty |
| Date sort | Faded grip; no drag |

**Recommended assets:** `docs/assets/link-cards/` — `full.png`, `compact-tooltip.png`, `dragging.png`, `empty.png`.

### 6.2 View Modes & Compact Description Tooltips

Controls density of the links grid on the Landing Screen. Toggle UI: `#view-full` / `#view-compact` inside `#list-controls`. Persistence: `startpage_view_mode`. Card layout and DnD shared with **§6.1.2**; this section specifies **mode switching** and **compact tooltip** behavior in full.

> *Detail note:* P1 expansion — view toggle contract, layout matrix, compact tooltip lifecycle (timing, clamp, hover-to-read, cleanup).

#### 6.2.1 Purpose & Scope

| Item | Description |
|------|-------------|
| **Purpose** | Let users choose a spacious (Full) or dense (Compact) presentation of link cards without changing underlying link data. |
| **In scope** | Mode enum; localStorage persistence; button chrome; grid class switching; what Full vs Compact shows/hides; compact description tooltips end-to-end. |
| **Out of scope** | Sort modes (§6.3); card open/edit/delete/DnD (§6.1.2); font-scale stacking of the control bar (§6.9). |
| **Primary artifacts** | `viewMode` (`state.js`); toggle in `initializeApp` (`app.js`); `renderLinks` layout + tooltip wiring (`render.js`). |

#### 6.2.2 Requirements Traceability

| Req ID | Requirement (shall) | Implementation | External ref |
|--------|---------------------|----------------|--------------|
| **REQ-VM-001** | User shall switch between Full and Compact | `#view-full` / `#view-compact` | *TBD* |
| **REQ-VM-002** | Mode shall persist across reloads | `localStorage.startpage_view_mode` | *TBD* |
| **REQ-VM-003** | Boot shall restore saved mode before first render | `initializeApp` early `viewMode` load | *TBD* |
| **REQ-VM-004** | Active mode button shall show selected chrome | `updateViewModeButtons` (`.list-toggle.is-active`) | *TBD* |
| **REQ-VM-005** | Full mode shall use single-column flex list | `.links-grid` (column flex, `gap: 0.75rem`) | *TBD* |
| **REQ-VM-006** | Compact mode shall use 1–2 column grid | `.links-grid.is-compact` (1 col; 2 cols at `min-width: 768px`) | *TBD* |
| **REQ-VM-007** | Full mode shall show description and category pills on card | Template branches | *TBD* |
| **REQ-VM-008** | Compact mode shall hide inline description/pills | Density layout + `.compact` class | *TBD* |
| **REQ-VM-009** | Compact + description shall offer delayed hover tooltip | 1000 ms show delay | *TBD* |
| **REQ-VM-010** | Tooltip shall follow pointer and stay in viewport | Mouse move + 8px clamp | *TBD* |
| **REQ-VM-011** | User shall be able to move pointer onto tooltip to read | `pointer-events: auto` + hide delays | *TBD* |
| **REQ-VM-012** | Tooltips shall not survive re-render or drag start | Orphan remove + dragstart cleanup | *TBD* |

#### 6.2.3 High-Level Architecture & Diagrams

```
  #view-full / #view-compact
           │
           ▼
    viewMode = 'full' | 'compact'
    localStorage.setItem(...)
    updateViewModeButtons()
    renderLinks()
           │
           ├─ full  → flex column; desc + pills in card
           └─ compact → CSS grid; tooltip path if description
```

**Compact tooltip state machine**

```
  mouseenter card ──► start 1000ms timer
        │                    │
        │ mouseleave early   ▼
        │ cancel timer     show .link-card-tooltip (fixed, z=99999)
        │                    │
        │              mousemove → reposition (centered above cursor, clamped)
        │                    │
        ▼                    ▼
  mouseleave card ──► 250ms hide (unless enter tooltip)
  tooltip mouseenter ── cancel hide
  tooltip mouseleave ── 150ms hide
  dragstart / renderLinks ── force remove all tooltips
```

#### 6.2.4 Tech Stack & Versions

| Layer | Technology | Notes |
|-------|------------|-------|
| State | `viewMode` global + localStorage | Default `full` |
| Layout | Custom CSS `.links-grid` / `.is-compact` | Rebuilt each render |
| Tooltip | Ephemeral `div.link-card-tooltip` on `document.body` | Not portaled framework |

#### 6.2.5 Key Design Decisions & Rationale

| # | Decision | Rationale | Status |
|---|----------|-----------|--------|
| V1 | Only two modes | Simple density choice | **Current** |
| V2 | Persist view, not sort | View is preference; sort often task-temporary | **Current** |
| V3 | Compact hides pills/desc inline | Maximize cards per viewport | **Current** |
| V4 | Tooltip only when `description` non-empty | No empty bubbles | **Current** |
| V5 | 1s show delay | Avoid noise while scrubbing list | **Current** |
| V6 | Fixed positioning + body append | Escape overflow clipping of cards | **Current** |
| V7 | Hover-to-read on tooltip | Long descriptions readable | **Current** |
| V8 | Aggressive cleanup on render/drag | Prevent ghost layers after filter/reorder | **Current** |

#### 6.2.6 Data Model / Schema

| Item | Type | Storage |
|------|------|---------|
| `viewMode` | `'full' \| 'compact'` | Memory + `startpage_view_mode` |
| Card class | includes `compact` when compact | DOM only |
| `card.dataset.description` | string | Compact tooltip source |
| `card._tooltipTimeout` / `_tooltipEl` | timers/nodes | Per-card ephemeral |

#### 6.2.7 API / Interface Specifications

| API | Behavior |
|-----|----------|
| Boot | Read `startpage_view_mode` if `full` or `compact`; else default full |
| `#view-full` click | `viewMode='full'`; persist; buttons; `renderLinks` |
| `#view-compact` click | `viewMode='compact'`; persist; buttons; `renderLinks` |
| `updateViewModeButtons()` | Selected: `.list-toggle.is-active` |
| Tooltip timers | Show **1000** ms; card leave hide **250** ms; tooltip leave hide **150** ms; clamp pad **8** px |

#### 6.2.8 Security & Compliance Requirements

| Topic | Treatment |
|-------|-----------|
| **Tooltip content** | `textContent` from description (safer than HTML) |
| **Data** | Mode preference only; no secrets |

#### 6.2.9 Non-Functional Requirements

| Category | Behavior |
|----------|----------|
| **Performance** | Mode switch = full re-render of visible cards |
| **Usability** | Instant toggle; tooltips for metadata recovery in compact |
| **Accessibility** | Tooltips are hover-only — keyboard users should use Full mode or Edit modal for descriptions (known gap) |

#### 6.2.10 Assumptions, Risks, Dependencies & Constraints

**Risks:** Hover-only tooltips exclude pure keyboard users; many open timers if rapid hover (cleared on leave/render).  
**Constraints:** Description still not visible in compact without hover; pills not in tooltip (categories hidden in compact).

#### 6.2.11 Updated Diagrams & Screenshots

| View | Capture |
|------|---------|
| Full mode | Single column, desc + pills visible |
| Compact mode | Two columns (md+), dense cards |
| Tooltip | Hover after 1s, above cursor, clamped |

**Recommended assets:** `docs/assets/view-modes/`.

### 6.3 Sort Modes

| Mode | Behavior |
|------|----------|
| **Default** | Preserve order; favorites first; drag enabled (**§6.1.2**) |
| **Date Added** | Sort by `id` descending; drag disabled; caution messaging on `#drag-reorder-text` / `#sort-note` |

`sortMode` is **session-only** (not written to localStorage). Toggle: `#sort-default` / `#sort-date`.

### 6.4 Category Sidebar — Component Design Specification

Left-rail taxonomy navigator (visible `lg+`). Built by `renderCategoriesSidebar()` (`render.js`); filter/rename/delete actions in `app.js`. Sticky under header on Landing Screen (§6.0).

> *Detail note:* P0 expansion — filter indicator, rename/delete taxonomy rewrite, clear-filter IO, keyboard listbox behavior.

#### 6.4.1 Purpose & Scope

| Item | Description |
|------|-------------|
| **Purpose** | Let users filter the link grid by category, discover category counts, and administer category labels across all links. |
| **In scope** | “All Links” row; per-category rows with counts; substring category search; active styling; rename/delete; clear filter link + IO; keyboard ↑/↓/Enter; filter indicator on main heading. |
| **Out of scope** | Multi-select categories; hierarchical tags; fuzzy category search (substring only). |
| **Primary artifacts** | `#category-search`, `#categories-sidebar`, `#clear-filter-link-container`, `#filter-indicator`; `render.js`, `app.js`. |

#### 6.4.2 Requirements Traceability

| Req ID | Requirement (shall) | Implementation | External ref |
|--------|---------------------|----------------|--------------|
| **REQ-CS-001** | Sidebar shall list All Links with total count | First row in `renderCategoriesSidebar` | *TBD* |
| **REQ-CS-002** | Sidebar shall list unique categories with counts, sorted | `getAllCategories` + filter count | *TBD* |
| **REQ-CS-003** | User shall filter category list by substring | `#category-search` → `categorySearchTerm` | *TBD* |
| **REQ-CS-004** | Selecting a category shall filter the links grid | `filterByCategory` | *TBD* |
| **REQ-CS-005** | Main heading shall show active filter label | `#filter-indicator` → `• {cat}` | *TBD* |
| **REQ-CS-006** | Selecting All / clear shall remove filter | `clearCategoryFilter` | *TBD* |
| **REQ-CS-007** | Clear filter shall also clear both search inputs | `clearCategoryFilter` resets category + link search | *TBD* |
| **REQ-CS-008** | User shall rename a category across all links | `renameCategory` + `prompt` | *TBD* |
| **REQ-CS-009** | User shall remove a category tag from all links | `deleteCategory` + `confirm` | *TBD* |
| **REQ-CS-010** | Active filter shall update if renamed/deleted | `currentFilterCategory` adjust | *TBD* |
| **REQ-CS-011** | Clear-filter control shall appear when first item scrolls away | `IntersectionObserver` root = sidebar | *TBD* |
| **REQ-CS-012** | Keyboard shall move focus among visible items | Arrow keys; Enter activates | *TBD* |
| **REQ-CS-013** | ArrowDown from category search shall focus first item | `catSearch` keydown | *TBD* |
| **REQ-CS-014** | Empty sidebar search shall show empty copy | “No matches” / “No categories yet” | *TBD* |

#### 6.4.3 High-Level Architecture & Diagrams

```
  getAllCategories() ← links[].categories
           │
           ▼
  optional categorySearchTerm filter (includes)
           │
           ▼
  #categories-sidebar DOM
     [ All Links | N ]
     [ Cat A | n | edit | trash ]
     ...
           │
     click / Enter
           ▼
  currentFilterCategory ──► renderLinks()
           │
           └──► #filter-indicator
```

**Clear filter visibility**

```
  sidebar scrollHeight > clientHeight ?
     no  → hide clear-filter control
     yes → observe first .sidebar-category
              not intersecting → show “clear filter”
              intersecting     → hide
```

#### 6.4.4 Tech Stack & Versions

| Layer | Technology | Notes |
|-------|------------|-------|
| Layout | Sticky `.categories-column` (`16rem`; lg+ via media query) | Landing §6.0 |
| Scroll | `.categories-sidebar` max-height `420px`, `.custom-scroll` | IO root |
| Interaction | Click + keyboard on `tabindex=0` rows | Listbox-like |
| Admin | `prompt` / `confirm` | Zero-dependency |

#### 6.4.5 Key Design Decisions & Rationale

| # | Decision | Rationale | Status |
|---|----------|-----------|--------|
| S1 | Categories derived from links (no separate store) | Single source of truth | **Current** |
| S2 | Rename rewrites string equality on all links | Global taxonomy consistency | **Current** |
| S3 | Delete removes tag only (does not delete links) | Safe taxonomy cleanup | **Current** |
| S4 | `clearCategoryFilter` clears **both** searches | `-` shortcut “reset workspace” semantics | **Current** |
| S5 | `clearCategorySearch` only clears category box | Local × control on category field | **Current** |
| S6 | Clear-filter link only when sidebar scrollable | Avoid noise when list fits | **Current** |
| S7 | Rename/delete use `stopImmediatePropagation` | Avoid accidental filter activate | **Current** |
| S8 | Category names escaped for single quotes in onclick | Reduce breakout in inline handlers | **Current** (prefer data attrs long-term) |
| S9 | Focus restore to active item after mouse/keyboard activate | Keeps listbox operable | **Current** |

#### 6.4.6 Data Model / Schema

| Variable | Type | Meaning |
|----------|------|---------|
| `currentFilterCategory` | `string \| null` | `null` = All Links |
| `categorySearchTerm` | string | Sidebar list filter only |
| Categories set | derived | `Set` of all `link.categories`, sorted locale |

No dedicated localStorage key for category master list.

#### 6.4.7 API / Interface Specifications

| Function | Module | Behavior |
|----------|--------|----------|
| `getAllCategories()` | `storage.js` | Unique sorted category names |
| `renderCategoriesSidebar()` | `render.js` | Rebuild list; wire IO |
| `setupClearFilterLinkVisibility()` | `render.js` | IO + clear-link click |
| `focusSidebarActiveItem()` | `render.js` | Focus `.active` or first |
| `filterByCategory(cat)` | `app.js` | Set filter; re-render; set indicator |
| `clearCategoryFilter()` | `app.js` | Clear filter + **both** search fields/terms; re-render; clear indicator |
| `clearCategorySearch()` | `app.js` | Clear category search UI + term; re-render sidebar only |
| `renameCategory(oldName)` | `app.js` | Prompt; map rename; persist; re-render |
| `deleteCategory(name)` | `app.js` | Confirm; strip tags; persist; re-render |

**DOM**

| ID | Role |
|----|------|
| `#category-search` | Substring filter input |
| `#categories-sidebar` | List host |
| `#clear-filter-link-container` / `#clear-filter-link` | Scroll affordance |
| `#filter-indicator` | Main column “• Category” label |
| `.sidebar-category` | Row; `.active` when selected |
| `.category-action` | Rename/delete button cluster |

#### 6.4.8 Security & Compliance Requirements

| Topic | Treatment |
|-------|-----------|
| **Data** | Category strings are user data stored on links in localStorage |
| **Injection** | Inline `renameCategory('…')` uses quote escaping; prefer `data-category` + listeners if hardened |
| **Destructive** | Delete category is soft (tags only) with confirm; not full link delete |

#### 6.4.9 Non-Functional Requirements

| Category | Behavior |
|----------|----------|
| **Performance** | O(categories × links) counts on each sidebar render |
| **Usability** | Counts, truncate long names, hover admin actions |
| **Accessibility** | `tabindex=0`, arrows, Enter; search ArrowDown entry |

#### 6.4.10 Assumptions, Risks, Dependencies & Constraints

**Assumptions:** Categories are flat strings; case-sensitive match on filter membership.  
**Risks:** Rename collision (two labels → one) not specially merged; prompt UX on touch devices.  
**Constraints:** Sidebar hidden below `lg` — mobile users rely on link search / All via clear shortcuts.

#### 6.4.11 Updated Diagrams & Screenshots

| View | Capture |
|------|---------|
| Default | All Links active; category list with counts |
| Filtered | Active category; main `• Cat` indicator |
| Search | Category search reducing list |
| Admin | Rename/delete buttons on hover |
| Scrolled | “clear filter” link visible |

**Recommended assets:** `docs/assets/category-sidebar/`.

### 6.5 Link Search (Fuzzy)

Primary in-page search: `#link-search-input`.

**Fields:** name, URL, description, categories.

**`strictSingleWordFuzzyMatch` (`render.js`):**

1. Lowercase; full-term substring match is a fast path.
2. Multi-word: **AND** — every token must match.
3. Token length **≤ 4:** substring only (no fuzzy).
4. Token length **≥ 5:** match token against each target word’s prefix of length `tokenLen + 2` with **Levenshtein distance ≤ 3** (target word length constraints apply).
5. Classic Levenshtein DP for distance.

Category sidebar search remains simple `includes` (not fuzzy).

### 6.6 Emoji System & Quick Pick Selection UI

Catalog data lives in `js/config.js`. Selection UI is the nested **Quick Pick Emojis** overlay (`#emoji-picker-popover`), owned by the Add/Edit Link modal (§6.1.1). Free-type into `#link-emoji` remains a parallel entry path.

> *Detail note:* This subsection expands the prior catalog-only notes into a full component design for the emoji selection surface, aligned with current `initEmojiPicker` / `closeEmojiPopover` behavior. Category multi-entry for links remains documented under **§6.1.1** (not here).

#### 6.6.1 Purpose & Scope

| Item | Description |
|------|-------------|
| **Purpose** | Let the user assign a compact visual icon (emoji or short text) to a link, either by free-typing or by browsing/searching a curated catalog. |
| **In scope** | Curated catalog (`COMMON_EMOJIS`, `EMOJI_NAMES`); Quick Pick open/close; categorized grid render; multi-word search filter; pick → write `#link-emoji`; hover name-only tooltips; middle-click full descriptors; parent-safe Escape; outside-click and Cancel dismiss; init wiring; free-type field constraints. |
| **Out of scope** | Full Unicode emoji browser; custom user-uploaded icons; SVG/icon-font picker; network emoji APIs; persisting catalog edits at runtime; ARIA dialog/roving-tabindex full compliance (known gap). |
| **Actors** | End user editing a link in Add/Edit mode. |
| **Primary artifacts** | Shell: `index.html` (`#link-emoji`, `#emoji-dropdown-btn`, `#emoji-picker-popover`, …). Logic: `js/addeditlink.js` (`initEmojiPicker`, `closeEmojiPopover`, `setModalEmoji`). Data: `js/config.js`. Init: `app.js` → `initEmojiPicker()` during `initializeApp`. |

**Relationship to Add/Edit:** Quick Pick is a **nested overlay**, not a top-level app modal. It does not appear in the Escape modal-id list as its own entry; Esc is handled in **capture phase** so the parent `#modal` stays open.

#### 6.6.2 Requirements Traceability

No external BRD / FRS / Jira linkage in-repo. Internal IDs below; map **External ref** when enterprise tickets exist.

| Req ID | Requirement (shall) | Implementation | External ref |
|--------|---------------------|----------------|--------------|
| **REQ-EMO-001** | User shall free-type an icon into the link emoji field | `#link-emoji` (`maxlength="2"`) | *TBD* |
| **REQ-EMO-002** | User shall open a Quick Pick catalog from the chevron control | `#emoji-dropdown-btn` toggles `#emoji-picker-popover` | *TBD* |
| **REQ-EMO-003** | Catalog shall be organized by category headers | `Object.keys(COMMON_EMOJIS)` → uppercase headers in grid | *TBD* |
| **REQ-EMO-004** | User shall filter catalog by search terms | `#emoji-search-input` → `renderEmojiGrid(term)` | *TBD* |
| **REQ-EMO-005** | Multi-word search shall require **all** tokens to match (AND) | `searchWords.every(...)` on descriptor + glyph | *TBD* |
| **REQ-EMO-006** | Selecting an emoji shall populate the field and close Quick Pick | Button `onclick` → `emojiInput.value` + `closeEmojiPopover()` | *TBD* |
| **REQ-EMO-007** | Hover tooltips shall show cleaned display names (no parentheticals) | `title` = descriptor with `\s*\(.*?\)\s*` stripped | *TBD* |
| **REQ-EMO-016** | Middle-click on a catalog cell shall show the full descriptor including parentheticals for 4 seconds without picking | `auxclick` / middle `click` (`button === 1`) → `.emoji-picker__detail` for **4000** ms; `mousedown` preventDefault to block autoscroll | *TBD* |
| **REQ-EMO-008** | Search shall use full descriptors including parenthetical keywords | Match against full `EMOJI_NAMES[emoji]` | *TBD* |
| **REQ-EMO-009** | Escape shall close Quick Pick without closing Add/Edit | Capture-phase `keydown` on Escape | *TBD* |
| **REQ-EMO-010** | Outside click and Cancel shall close Quick Pick | Document click listener; `#emoji-picker-cancel` | *TBD* |
| **REQ-EMO-011** | Opening Quick Pick shall clear prior search and focus search | Open path resets input, `renderEmojiGrid('')`, focus ~50 ms | *TBD* |
| **REQ-EMO-012** | Closing Add/Edit shall also close Quick Pick | `closeModal` → `closeEmojiPopover` | *TBD* |
| **REQ-EMO-013** | Default icon for new links shall be 🔗 | `setModalEmoji('🔗')` / `normalizeLink` | *TBD* |
| **REQ-EMO-014** | Catalog integrity rules shall guide content maintenance | Spec rules in `config.js` + §6.6.6 | *TBD* |
| **REQ-EMO-015** | Empty filter results shall show an empty state | “No matching emojis”; grid class `empty` | *TBD* |

**Cross-refs:** §6.1.1 (parent modal), §6.14 (debug counts for `COMMON_EMOJIS` / `EMOJI_NAMES`), §7 (Esc precedence).

#### 6.6.3 High-Level Architecture & Diagrams

**Layering (emoji slice)**

```
┌────────────────────────────────────────────────────────────────────┐
│ Presentation                                                       │
│  #link-emoji (free-type)  ·  #emoji-dropdown-btn                   │
│  #emoji-picker-popover (header / #emoji-grid / Cancel)             │
├────────────────────────────────────────────────────────────────────┤
│ Controller (addeditlink.js)                                        │
│  initEmojiPicker · renderEmojiGrid (inner) · closeEmojiPopover     │
│  setModalEmoji · open/close tied to parent closeModal              │
├────────────────────────────────────────────────────────────────────┤
│ Catalog (config.js)                                                │
│  COMMON_EMOJIS { category → emoji[] }                              │
│  EMOJI_NAMES { emoji → descriptor string }                         │
├────────────────────────────────────────────────────────────────────┤
│ Persistence (indirect)                                             │
│  Value stored only when parent Save writes link.emoji              │
│  No separate storage key for picker state                          │
└────────────────────────────────────────────────────────────────────┘
```

**Interaction flow**

```
  [Add/Edit open] ── setModalEmoji(default or link.emoji)
         │
         ├─► Free-type in #link-emoji ──────────────────────┐
         │                                                  │
         └─► Chevron toggle                                 │
                │ open                                      │
                ▼                                           │
         show popover · clear search · full grid · focus search
                │                                           │
                ├─ type search ──► filter grid (AND tokens) │
                ├─ click emoji ──► set input · close ───────┤
                ├─ middle-click emoji ──► full descriptor   │
                ├─ Cancel / outside / Esc ──► close only    │
                └─ parent closeModal ──► closeEmojiPopover  │
                                                            ▼
                                              saveCurrentLink → link.emoji
```

**Stacking & dismiss order**

| Surface | Stacking | Dismiss |
|---------|----------|---------|
| Add/Edit `#modal` | `z-index: 100` | Esc (bubble stack), Cancel, Save |
| Quick Pick `#emoji-picker-popover` | `fixed` centered, `z-index: 200` | Esc (**capture**), Cancel, outside click, pick, parent close |
| Free-type field | In parent form | N/A (always visible when parent open) |

#### 6.6.4 Tech Stack & Versions

| Layer | Technology | Version / note |
|-------|------------|----------------|
| Markup | HTML5 | Nested in `#modal` form (`index.html`) |
| Scripting | Vanilla JS | Classic `defer` scripts; no emoji npm package |
| Module | `js/addeditlink.js` | Picker lifecycle + grid render |
| Catalog | `js/config.js` | Static in-memory maps |
| Icons (chrome only) | Font Awesome **7** Free subset | `fa-face-smile`, `fa-search`, `fa-chevron-down` |
| Glyphs (content) | Unicode emoji / short text | Browser/OS font rendering; not FA |
| Styling | Custom CSS + inline size caps in init | Popover 34rem; grid min 420px / max 720px; popover max-height 860px |
| Runtime deps | **None** | Offline after load |
| Target browsers | Modern evergreen | Grid, `textContent`, capture-phase listeners |

#### 6.6.5 Key Design Decisions & Rationale

| # | Decision | Rationale | Status |
|---|----------|-----------|--------|
| E1 | Nested Quick Pick (not standalone app modal) | Icon selection is always in context of link edit; reduces modal stack complexity | **Current** |
| E2 | Dual entry: free-type **and** catalog | Power users paste any emoji/short label; catalog aids discovery | **Current** |
| E3 | Curated static catalog (not full Unicode) | Predictable UX, searchable descriptors, small bundle, no network | **Current** |
| E4 | Descriptor format `Name (keywords…)` with dual use | Short hover tooltips; full descriptor on middle-click; rich search without cluttering UI | **Current** |
| E5 | Multi-word **AND** substring search (not fuzzy) | Predictable filtering; distinct from link-list Levenshtein search | **Current** |
| E6 | Esc handled in **capture** phase | Prevents parent `#modal` from closing when picker is open | **Current** *(critical UX decision)* |
| E7 | On open: reset search + full grid + focus search | Clean session each open; keyboard-ready filter | **Current** |
| E8 | On close: hide, clear search, **clear grid DOM** (not full re-render until next open) | Consolidated `closeEmojiPopover`; grid rebuilt on open | **Current** |
| E9 | Pick writes field immediately; no separate “Apply” | One-click selection; Save on parent still commits to storage | **Current** |
| E10 | `maxlength="2"` on free-type field | Encourages single glyph / short text icons on cards | **Current** *(may clip some multi-codepoint emoji sequences)* |
| E11 | Default 🔗 for new / empty icons | Consistent “link” affordance | **Current** |
| E12 | Category headers uppercase in grid; categories alphabetical in data | Scannable UI; maintainable config | **Current** |
| E13 | `closeEmojiPopover` also defined in `app.js` | Historical consolidation; load order means **app.js definition wins** at runtime | **Current / tech debt** |
| E14 | No live re-render of grid after close’s clear | Avoids needing inner `renderEmojiGrid` export; open path always repaints | **Current** |
| E15 | Empty filter shows italic empty state + `empty` class | Clear zero-result feedback | **Current** |
| E16 | Middle-click shows full `EMOJI_NAMES` in a custom tip | Native `title` cannot be forced on click and omits parentheticals by design (REQ-EMO-007) | **Current** |

#### 6.6.6 Data Model / Schema

**A. Catalog — `COMMON_EMOJIS`**

```js
// category display name → ordered list of emoji characters
{
  "Animals": ["🐶", "🐱", /* … */],
  "Celestial": [/* … */],
  // … alphabetical category keys …
  "Zodiac": [/* … */]
}
```

| Property | Rule |
|----------|------|
| Keys | Human category labels; **strict alphabetical order** in source |
| Values | Arrays of emoji (or catalog) strings; **no cross-category duplicates** |
| New category | Prefer **≥ 5** emojis; **General** is last resort and should be reviewed periodically |
| Approx. size (current codebase) | **~25** categories; **~490** `COMMON_EMOJIS` entries; `EMOJI_NAMES` may lag by a few keys — verify parity when editing (maintain via config; Debug Panel shows live counts) |

**B. Descriptors — `EMOJI_NAMES`**

```js
{
  "🚀": "Rocket, Launch, Deploy, Startup",
  "🧘": "Yoga (Meditation, Lotus, Wellness)"
  // every catalog emoji → one string
}
```

| Aspect | Rule |
|--------|------|
| Format | `Name (Keyword1, Keyword2, …)` or plain comma-separated names |
| Tooltip | Parenthetical segment **stripped** for hover `title` |
| Middle-click | **Full** descriptor in `.emoji-picker__detail` (name + parentheticals); does not pick or close |
| Search | **Full** string lowercased; parentheses keywords **included** |
| Integrity | Every key in `EMOJI_NAMES` must appear in some `COMMON_EMOJIS` array and vice versa |
| Style | Searchability first; natural language; ~30–150 chars preferred; important terms near front |

**C. Link field (persisted via parent)**

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `link.emoji` | string | `"🔗"` | Free-type or Quick Pick; may be short non-emoji text (e.g. `X`, `FB`) |

**D. Transient picker state**

| Variable | Type | Meaning |
|----------|------|---------|
| `emojiPopoverOpen` | boolean | `true` while Quick Pick visible |
| Search box value | DOM | Cleared on open and on close |
| Grid contents | DOM | Built by inner `renderEmojiGrid`; cleared on close |
| `.emoji-picker__detail` | ephemeral DOM | Full descriptor tip after middle-click; auto-hides after **4000** ms; also removed on close, scroll, re-render, or later click |

**Search algorithm (filter)**

1. Lowercase/trim term; empty → show full catalog.  
2. Split on whitespace → tokens (empty tokens dropped).  
3. For each emoji in each category: keep if **every** token is a substring of descriptor **or** of the emoji character (lowercased).  
4. Skip categories with zero matches (no empty headers).  
5. If term non-empty and zero children → empty state message.

#### 6.6.7 API / Interface Specifications

**Functions**

| Function | Module | Behavior |
|----------|--------|----------|
| `initEmojiPicker()` | `addeditlink.js` | Idempotent wire-up of toggle, search, outside click, Cancel, Esc (capture), size caps; initial full `renderEmojiGrid()` |
| `closeEmojiPopover()` | `addeditlink.js` **and** `app.js` (duplicate) | Add `hidden` to popover; `emojiPopoverOpen = false`; clear search; clear `#emoji-grid` |
| `setModalEmoji(emoji)` | `addeditlink.js` (defined twice; same body) | Sets `#link-emoji` to `emoji` or `🔗` |
| Inner `renderEmojiGrid(filterTerm?)` | Closure inside `initEmojiPicker` | Rebuilds categorized buttons; **not** exported globally |

**DOM interface**

| ID / control | Role |
|--------------|------|
| `#link-emoji` | Free-type target; receives pick result; `maxlength="2"`; large centered display |
| `#emoji-dropdown-btn` | Toggle open/close; `title="Choose emoji"` |
| `#emoji-picker-popover` | Overlay root; starts `hidden`; centered `fixed` |
| `#emoji-search-input` | Live filter |
| `#emoji-grid` | `.emoji-picker__grid` scrollable host for headers + buttons |
| `#emoji-picker-cancel` | Explicit dismiss |

**Events**

| Event | Handler effect |
|-------|----------------|
| Chevron click | Toggle; on open reset search/grid/focus |
| Search `input` | `renderEmojiGrid(value)` |
| Emoji button click (left) | Write field + `closeEmojiPopover` |
| Emoji middle-click (`button === 1`) | Show full descriptor tip for 4s; do not pick; prevent autoscroll |
| Document click (outside popover & button) | `closeEmojiPopover` |
| Cancel click | `closeEmojiPopover` |
| Keydown Escape (capture) if popover visible | `preventDefault` + `stopImmediatePropagation` + close |
| Parent `closeModal` | Always `closeEmojiPopover` |

**Init**

- `initializeApp()` in `app.js` calls `initEmojiPicker()` once after layout setup.

**Persistence**

- Picker does **not** call `saveLinks`. Value commits only via parent `saveCurrentLink` → `link.emoji`.

#### 6.6.8 Security & Compliance Requirements

| Topic | Treatment |
|-------|-----------|
| **Data residency** | Catalog is static app content. Selected icon persists only as part of link JSON in `localStorage` / export / optional Gist. |
| **Secrets** | No credentials in picker. |
| **Network** | No fetch of emoji assets or third-party picker CDNs. |
| **XSS** | Grid cells use `textContent` for glyphs; hover titles from stripped descriptors; middle-click tip uses `textContent` of the static `EMOJI_NAMES` string. Free-type still becomes `link.emoji` rendered on cards — keep card render escaping disciplined. |
| **Content policy** | Curated list may include symbols some enterprises restrict in other channels; local personal page context. Catalog includes flags, religious symbols, etc., under user discretion. |
| **Regulated use** | Not a system of record. Do not encode confidential data into icon fields. |
| **Audit** | No picker-specific audit trail. |

#### 6.6.9 Non-Functional Requirements

| Category | Requirement / observed behavior |
|----------|----------------------------------|
| **Performance** | Filter/rebuild is in-memory over static ~hundreds of entries; acceptable on main thread for personal use. No virtualization. |
| **Responsiveness** | Popover `.emoji-picker` fixed center (`width: 34rem`); grid scroll with min-height 420px / max-height 720px; popover max-height 860px (avoids clipping Cancel). |
| **Reliability** | Esc capture prevents accidental parent close. Parent close always tears down picker. Open always resets filter state. |
| **Availability** | Fully offline; no external emoji service. Rendering depends on OS/browser emoji fonts. |
| **Scalability** | Catalog growth increases DOM node count on full render; fine for hundreds; not designed for tens of thousands. |
| **Usability** | Search-first open focus; category headers; hover names; middle-click full descriptors; empty state; free-type fallback. |
| **Accessibility** | Gaps: no `role="dialog"` / focus trap; grid is pointer-oriented buttons; free-type field is keyboard-accessible. Esc and Cancel available. |
| **Maintainability** | Catalog and descriptors co-located in `config.js` with inline `/spec` rules. Duplicate `closeEmojiPopover` / `setModalEmoji` should be consolidated. |
| **Observability** | Debug Panel (§6.14) surfaces `COMMON_EMOJIS` and `EMOJI_NAMES` counts for integrity checks. |
| **i18n** | Category labels and descriptors are English-only in current catalog. |

#### 6.6.10 Assumptions, Risks, Dependencies & Constraints

**Assumptions**

- Parent Add/Edit modal is the only host; picker not opened standalone.
- `COMMON_EMOJIS` and `EMOJI_NAMES` are loaded before `initEmojiPicker` (script order includes `config.js` first).
- User’s environment can render most modern Unicode emoji (ZWJ sequences may vary).

**Dependencies**

| Dependency | Type | Notes |
|------------|------|-------|
| `js/config.js` | Hard | Catalog + descriptors |
| Parent `#modal` / form | Hard | Field host and save path |
| Font Awesome subset | Soft | Header/search/chevron chrome only |
| Browser emoji fonts | Soft | Visual fidelity of glyphs |

**Constraints**

- Classic global scripts; inner `renderEmojiGrid` not reusable outside init closure.
- `maxlength="2"` may not equal “two grapheme clusters” for all emoji.
- Alphabetical category order is a **source** convention, not runtime-sorted.

**Risks**

| Risk | Impact | Mitigation / residual |
|------|--------|------------------------|
| Catalog / name map drift | Missing tooltips or orphan names | Spec rule 4; Debug Panel counts; manual review |
| Category with &lt; 5 emojis (e.g. **Parks**) | Spec inconsistency | Residual data debt — consolidate or grow category |
| Duplicate function definitions (`closeEmojiPopover`, `setModalEmoji`) | Maintenance confusion; last-loaded wins | Prefer single definition in `addeditlink.js` |
| Multi-codepoint emoji truncated by `maxlength` | User cannot free-type some glyphs | Use Quick Pick for complex emoji; consider grapheme-aware limit later |
| Large full-grid DOM on low-end devices | Brief jank on open | Acceptable at current size; virtualize if catalog grows sharply |
| Outside-click listener always registered after init | Minor global listener cost | Single listener; closes only when open |

#### 6.6.11 Updated Diagrams & Screenshots

**Diagrams (textual — authoritative)**

1. Layer diagram — §6.6.3  
2. Interaction / save flow — §6.6.3  
3. Stacking & dismiss table — §6.6.3  

**UI reference (reproduce for formal screenshot pack)**

| View | Steps | Capture |
|------|-------|---------|
| Closed control | Open Add/Edit | `#link-emoji` large field, hint “Type any emoji or click the arrow”, chevron |
| Quick Pick open | Click chevron | Centered “Quick Pick Emojis”, search focused, category headers, 12-col grid, Cancel footer |
| Filtered | Type e.g. `rocket` or `red h` | Reduced set; AND multi-word behavior |
| Empty filter | Type nonsense token | “No matching emojis” |
| After pick | Click a glyph | Popover closed; field shows selection |
| Hover name | Hover a glyph | Native `title` is cleaned name (no parentheticals) |
| Middle-click detail | Middle-click a glyph | Full descriptor including parentheses; picker stays open; field unchanged |
| Esc vs parent | Open picker, press Esc | Picker closes; Add/Edit remains |

**Recommended assets (not yet in-repo):** `docs/assets/emoji-quick-pick/`  
`closed-field.png`, `open-full.png`, `search-filter.png`, `empty-state.png`.

Until captured, reviewers use live UI: Add/Edit → chevron → exercise search and Esc.

### 6.7 Google Search Modal

Quick-launch overlay for a **Google web search** from the start page. Module: **`js/gsmodal.js`** (open/close/drag). Form submit and primary **`/`** / Esc wiring live in **`js/app.js`**. Distinct from in-page **link** search (`#link-search-input`, §6.5) and from the **legacy** inline Google field (`#old-search-wrapper` / `#search-input`, hidden).

> *Detail note:* Expands the prior bullet list into a full component design for `#search-modal`, including drag/clamp, focus restore, submit URL construction, and dual `/` shortcut paths.

#### 6.7.1 Purpose & Scope

| Item | Description |
|------|-------------|
| **Purpose** | Let the user run a Google search (new browser tab) without leaving the start-page chrome, via header control or keyboard **`/`**. |
| **In scope** | Open/close lifecycle; clear + autofocus input; form submit → Google query URL; backdrop and × dismiss; Esc; drag with viewport clamp; focus restore to link search / keyboard card highlight on close. |
| **Out of scope** | In-page link fuzzy search (§6.5); browser default search engine configuration; Google account/session; search suggestions/autocomplete API; true URL navigation (placeholder text implies URL; **implementation always searches Google** — see D7); enterprise search proxies. |
| **Actors** | End user of the local start page. |
| **Primary artifacts** | `index.html` `#search-modal`; `js/gsmodal.js`; submit + shortcut listeners in `js/app.js`. |

#### 6.7.2 Requirements Traceability

No external BRD / FRS / Jira linkage in-repo. Internal IDs below; map **External ref** when enterprise tickets exist.

| Req ID | Requirement (shall) | Implementation | External ref |
|--------|---------------------|----------------|--------------|
| **REQ-GSM-001** | User shall open Search modal from header | `onclick="openSearchModal()"` Search button | *TBD* |
| **REQ-GSM-002** | User shall open Search modal with **`/`** when not typing in an input/textarea | `DOMContentLoaded` keydown in `app.js` | *TBD* |
| **REQ-GSM-003** | User shall open Search modal with **`/`** when a link card is keyboard-selected | Link-search keydown path → `openSearchModal` | *TBD* |
| **REQ-GSM-004** | On open, query field shall clear and receive focus | `openSearchModal` clear + focus ~50 ms | *TBD* |
| **REQ-GSM-005** | On open, panel position shall reset to default layout | Clear inline left/top/transform/position/margin | *TBD* |
| **REQ-GSM-006** | Submit non-empty query shall open Google search in a new tab | `window.open(...google.com/search?q=...)` | *TBD* |
| **REQ-GSM-007** | Query shall be URL-encoded | `encodeURIComponent(query)` | *TBD* |
| **REQ-GSM-008** | Empty submit shall not navigate | Guard `if (query)` | *TBD* |
| **REQ-GSM-009** | After successful submit, modal shall close and field clear | `closeSearchModal` + `input.value = ''` | *TBD* |
| **REQ-GSM-010** | User shall close via ×, backdrop click, or Escape | `closeSearchModal`; backdrop `onclick`; Esc handlers | *TBD* |
| **REQ-GSM-011** | Panel shall be draggable except from input/buttons | `setupSearchModalDragging` | *TBD* |
| **REQ-GSM-012** | On drag end, panel shall clamp so all corners stay in viewport | **8px** edge padding clamp | *TBD* |
| **REQ-GSM-013** | Drag wiring shall initialize once per panel | `content.dataset.draggable === 'true'` guard | *TBD* |
| **REQ-GSM-014** | On close, link-search selection and keyboard card focus shall be restored | `linkSearch.select()` + `applyLinkCardKeyboardFocus` | *TBD* |
| **REQ-GSM-015** | Modal shall participate in known-modal Esc stack | `app.js` modal id list includes `search-modal` | *TBD* |

**Cross-refs:** §6.5 link search, §7 keyboard shortcuts, §3.1 legacy `#old-search-wrapper`.

#### 6.7.3 High-Level Architecture & Diagrams

**Layering**

```
┌────────────────────────────────────────────────────────────────────┐
│ Presentation                                                       │
│  #search-modal backdrop  ·  .modal panel  ·  #search-modal-form    │
│  Header Search button                                              │
├────────────────────────────────────────────────────────────────────┤
│ Controller                                                         │
│  gsmodal.js: openSearchModal · closeSearchModal · setupDragging    │
│  app.js: form submit → Google URL; / and Esc listeners             │
├────────────────────────────────────────────────────────────────────┤
│ External                                                           │
│  https://www.google.com/search?q=<encoded>  (new tab)              │
├────────────────────────────────────────────────────────────────────┤
│ Local state                                                        │
│  No persistence of query                                           │
│  Transient drag flags (closure); keyboardFocusedIndex on close     │
└────────────────────────────────────────────────────────────────────┘
```

**Interaction flow**

```
  Header Search  or  "/" (allowed context)
              │
              ▼
       openSearchModal()
       · reset position styles
       · show flex overlay (pt-[25vh] default)
       · clear input · focus
       · setupSearchModalDragging (once)
              │
     ┌────────┼──────────────┬─────────────┐
     ▼        ▼              ▼             ▼
  type     Enter/submit   drag panel    Esc / × / backdrop
     │        │              │             │
     │        ▼              ▼             │
     │   encode + open    free move;       │
     │   Google new tab   clamp on up      │
     │   close + clear                     │
     │        │                            │
     └────────┴────────────────────────────┘
                      ▼
               closeSearchModal()
               · hide · reset position
               · restore link-search select + keyboard focus
```

**Stacking / layout defaults**

| Property | Value |
|----------|--------|
| Backdrop | `.ui-modal` / `.search-modal`: `position: fixed; inset: 0`; `background rgb(0 0 0 / 0.7)` + `backdrop-filter: blur(4px)`; `.ui-modal--topmost` → `z-index: 120` |
| Vertical placement | `.ui-modal--top` (`align-items: flex-start`; padding-top `25vh`) |
| Panel | `.ui-modal__panel--lg` (`max-width: 32rem`), `border-radius: 1.5rem`, `.ui-modal__panel--draggable` (`cursor: move`) |
| Backdrop click | Closes (`onclick="closeSearchModal()"` on root) |
| Panel click | `stopImmediatePropagation` (does not close) |

#### 6.7.4 Tech Stack & Versions

| Layer | Technology | Version / note |
|-------|------------|----------------|
| Markup | HTML5 | Static `#search-modal` in `index.html` |
| Scripting | Vanilla JS classic `defer` | `gsmodal.js` + `app.js` listeners |
| Navigation | `window.open` | Target `_blank` (new tab/window) |
| Search provider | Google web search URL | Hard-coded host/path |
| Styling | Custom CSS + proprietary theme tokens (`--color-*`, `--app-*`) |
| Icons | Font Awesome **7** Free subset | `fa-search`, `fa-times` |
| Runtime deps | **None** (beyond browser + network for Google) | Offline open works; submit needs network |

#### 6.7.5 Key Design Decisions & Rationale

| # | Decision | Rationale | Status |
|---|----------|-----------|--------|
| D1 | Modal search replaces inline Google field as primary UX | Cleaner main layout; `#old-search-wrapper` kept hidden for legacy | **Current** |
| D2 | Open clears prior query every time | Avoid accidental re-submit of previous terms | **Current** |
| D3 | Autofocus after short delay (~50 ms) | Reliable focus after display toggle | **Current** |
| D4 | Position reset on open **and** close | Dragged offset must not stick across sessions of the modal | **Current** |
| D5 | Draggable panel; ignore drag from `INPUT`/`BUTTON` | Reposition without fighting text selection/close | **Current** |
| D6 | Clamp on **mouseup** (not live), padding **8px** | Smooth drag feel; keep panel fully on-screen | **Current** |
| D7 | Submit always builds Google `search?q=` even if query looks like a URL | Simple, predictable; placeholder “or type a URL” is **aspirational / legacy copy**, not implemented | **Current / copy gap** |
| D8 | `encodeURIComponent` on query | Safe query string construction | **Current** |
| D9 | Close restores `#link-search-input` selection + keyboard card highlight | Keyboard-first continuity after temporary Google search | **Current** |
| D10 | Dual `/` entry paths (global + card-nav context) | Users expect `/` as search even while navigating cards | **Current** |
| D11 | Residual legacy `/` path focuses hidden `#search-input` when `BODY` focused in one keydown branch | Historical dual behavior; can confuse vs modal open | **Current / tech debt** (also §13) |
| D12 | Form `preventDefault` + manual `window.open` | Avoid full-page navigation away from start page | **Current** |
| D13 | No storage of search history in app | Privacy-light; history is browser/Google’s domain | **Current** |
| D14 | Backdrop click closes (unlike some app modals) | Fast dismiss for a lightweight tool | **Current** |

#### 6.7.6 Data Model / Schema

No durable application schema. Transient only:

| Item | Type | Lifetime |
|------|------|----------|
| `#search-modal-input` value | string | Cleared on open and after successful submit |
| Drag session (`isDragging`, offsets) | closure locals in `setupSearchModalDragging` | Per drag |
| Panel inline geometry | CSS left/top/position/margin | Cleared on open/close |
| `content.dataset.draggable` | `'true'` once | Marks listeners attached |

**Outbound URL shape**

```
https://www.google.com/search?q=<encodeURIComponent(trimmedQuery)>
```

**Not persisted:** query text, drag position, open/closed flag.

#### 6.7.7 API / Interface Specifications

**Functions (`gsmodal.js`)**

| Function | Behavior |
|----------|----------|
| `openSearchModal()` | Guard DOM; reset panel styles; show modal (`flex`); clear input; focus ~50 ms; `setupSearchModalDragging` |
| `closeSearchModal()` | Hide modal; reset panel styles; select `#link-search-input`; preserve `keyboardFocusedIndex` and re-apply card focus |
| `setupSearchModalDragging(modal)` | One-time mousedown/mousemove/mouseup; clamp on release |

**Form submit (`app.js`, `DOMContentLoaded`)**

| Step | Behavior |
|------|----------|
| 1 | `preventDefault` on `#search-modal-form` submit |
| 2 | Read/trim `#search-modal-input` |
| 3 | If empty → no-op |
| 4 | `window.open(Google URL, '_blank')` |
| 5 | `closeSearchModal()`; clear input |

**Entry / exit**

| Trigger | Action |
|---------|--------|
| Header Search button | `openSearchModal` |
| **`/`** outside INPUT/TEXTAREA (DOMContentLoaded listener) | `openSearchModal` |
| **`/`** while card keyboard-selected (link-search handler) | `openSearchModal` |
| **`/`** on BODY in alternate keydown branch | Focuses **legacy** `#search-input` (hidden) — residual |
| Enter in form (implicit submit) | Google open + close |
| × button | `closeSearchModal` |
| Backdrop click | `closeSearchModal` |
| Escape (dedicated + modal stack) | `closeSearchModal` if open |

**DOM anchors**

| ID / class | Role |
|------------|------|
| `#search-modal` | Backdrop + host |
| `.modal` (child) | Draggable panel |
| `#search-modal-form` | Submit container |
| `#search-modal-input` | Query field |
| `#search-modal-icon-wrapper` | Leading search icon |
| `#old-search-wrapper` / `#search-input` | Legacy hidden Google field |
| `#link-search-input` | In-page link filter (focus restore target) |

#### 6.7.8 Security & Compliance Requirements

| Topic | Treatment |
|-------|-----------|
| **Network** | Submit opens third-party Google in a new tab; query string is visible to Google and may appear in browser history. |
| **Data residency** | App does **not** store the query in `localStorage`. |
| **Secrets** | Do not paste passwords, PATs, or confidential client data into the search field. |
| **Open redirect / injection** | Query is encoded into Google’s `q` parameter only; host is hard-coded to `www.google.com`. |
| **New tab** | `window.open(..., '_blank')` — browser popup policies may block in edge cases. |
| **Regulated environments** | Web search may be subject to firm acceptable-use and DLP policies. This control is a convenience launcher, not an approved enterprise search gateway. Prefer firm-approved search tools when required. |
| **Analytics** | No app-side search analytics; Google may log queries per their policies. |

#### 6.7.9 Non-Functional Requirements

| Category | Requirement / observed behavior |
|----------|----------------------------------|
| **Performance** | Open/close is CSS class + focus; no app network until submit. |
| **Responsiveness** | Panel `.ui-modal__panel--lg` (`max-width: 32rem`) with page padding; drag clamp keeps on-screen at **8px** inset. |
| **Reliability** | Empty submit ignored; position reset prevents stuck off-layout after drag. |
| **Availability** | Modal usable offline; successful search requires network + Google availability. |
| **Usability** | `/` shortcut, autofocus, clear-on-open, backdrop dismiss, draggable. |
| **Accessibility** | Keyboard Esc; form Enter submit; focus on open. Gaps: no explicit `role="dialog"` / focus trap; drag not keyboard-accessible. |
| **Maintainability** | Drag/open/close isolated in `gsmodal.js`; submit/shortcuts in `app.js` (split ownership). |
| **Consistency** | Visual shell matches other themed modals; z-index `120` (above many hubs at `110`). |

#### 6.7.10 Assumptions, Risks, Dependencies & Constraints

**Assumptions**

- User intends Google.com as search destination.
- Browser allows `window.open` to a new tab for user-gesture submit (Enter).
- `#link-search-input` exists when closing (focus restore).

**Dependencies**

| Dependency | Type | Notes |
|------------|------|-------|
| `gsmodal.js` load before use | Hard | Header onclick / shortcuts |
| `keyboardFocusedIndex` / `applyLinkCardKeyboardFocus` | Soft | Close path; defined in debug/app stack |
| Google web search | Soft (for success path) | External |
| Font Awesome subset | Soft | Icons |

**Constraints**

- Hard-coded Google URL; no alternate engine setting.
- Placeholder mentions URL; product does not special-case URLs (D7).
- Dual `/` handlers must stay consistent when refactoring (D11).

**Risks**

| Risk | Impact | Mitigation / residual |
|------|--------|------------------------|
| Sensitive query sent to Google | Data exposure | User discipline; residual |
| Legacy `/` focuses hidden field | User confusion | Documented debt; prefer consolidating to `openSearchModal` only |
| Popup blocker | Search fails silently if blocked | User gesture Enter usually allowed; residual |
| `closeSearchModal` assumes `linkSearch` non-null | Potential throw if DOM missing | Residual low on standard page |
| Drag listeners on `document` after first open | Permanent move/up handlers | Guarded by once-flag; residual minor |

#### 6.7.11 Updated Diagrams & Screenshots

**Diagrams (textual — authoritative)**

1. Layer diagram — §6.7.3  
2. Open / submit / drag / close flow — §6.7.3  
3. Layout & stacking table — §6.7.3  

**UI reference (reproduce for formal packs)**

| View | Steps | Capture |
|------|-------|---------|
| Default open | Header Search or `/` | Upper-third panel, empty focused field, search icon, × |
| Typing | Enter a query | Text in `#search-modal-input` |
| Submit | Enter | New tab Google results; modal closed |
| Drag | Drag chrome (not input) | Panel follows; release clamps inside viewport |
| Dismiss | Esc, ×, or backdrop | Modal hidden; link search selection restored |

**Recommended assets (not in-repo):** `docs/assets/google-search-modal/`  
`open-default.png`, `dragged.png`, `with-query.png`.

Until captured, reviewers use live UI against this section.

### 6.8 Settings Hub & Related Modals

Preferences surface for personalization (name, font scale), navigation into the Color Theme Editor and Attributions, and an in-UI keyboard shortcut cheat sheet. Module: `js/settingsmodal.js` (modal open/close, color apply/save); font scale and name wiring also in `js/app.js`. Role vocabulary and CSS variable map remain in **§5**; font-scale layout side effects in **§6.9**.

> *Detail note:* Expands the prior bullet list into a full component design for `#settings-modal` and its child flows (`#color-theme-modal`, `#attribution-modal`), aligned with current implementation.

#### 6.8.1 Purpose & Scope

| Item | Description |
|------|-------------|
| **Purpose** | Provide a single preferences hub so users can personalize identity (name/title), readability (font scale), visual theme (color roles), and view third-party/project attributions without leaving the local start page. |
| **In scope** | Open/close Settings; live name → title + `localStorage`; font scale ±5% / reset / clamp; open Color Theme Editor (load fields, dual picker/hex sync, per-field undo, Light/Dark presets, Save Colors); open Attribution credits; Esc stack participation; return-to-Settings navigation from children. |
| **Out of scope** | Link CRUD (§6.1.1); Gist sync credentials (§6.11); view/sort mode (main chrome); account/SSO; remote theme marketplace; WCAG audit certification. |
| **Actors** | End user of the local start page. |
| **Primary artifacts** | `index.html`: `#settings-modal`, `#color-theme-modal`, `#attribution-modal`. Logic: `settingsmodal.js`, font/name in `app.js` (`COLOR_DEFAULTS`, `COLOR_LIGHT_DEFAULTS`, `COLOR_ID_MAP`, `applyFontScale`). Persistence: `localStorage` keys in §4.6 / §6.8.6. |

#### 6.8.2 Requirements Traceability

No external BRD / FRS / Jira linkage in-repo. Use internal IDs; fill **External ref** when enterprise tickets exist.

| Req ID | Requirement (shall) | Implementation | External ref |
|--------|---------------------|----------------|--------------|
| **REQ-SET-001** | User shall open Settings from header | `onclick="openSettingsModal()"` | *TBD* |
| **REQ-SET-002** | User shall close Settings via Close or Escape | `closeSettingsModal`; Esc modal stack in `app.js` | *TBD* |
| **REQ-SET-003** | User shall set a display name that updates the page title | `#theme-author-name` `input` → `startpage_user_name` + `#page-title` | *TBD* |
| **REQ-SET-004** | Empty name shall yield title `Start` | Ternary in name handler | *TBD* |
| **REQ-SET-005** | User shall increase/decrease font scale by 5% | `changeFontScale(±5)` | *TBD* |
| **REQ-SET-006** | Font scale shall clamp to **70–150** | `applyFontScale` | *TBD* |
| **REQ-SET-007** | User shall reset font scale to 100% | `resetFontScale` | *TBD* |
| **REQ-SET-008** | Font scale shall persist and re-apply layout side effects | `startpage_font_scale`; menu + list-controls updates (§6.9) | *TBD* |
| **REQ-SET-009** | User shall open Color Theme Editor from Settings | `openColorThemeModal` | *TBD* |
| **REQ-SET-010** | Theme editor shall load stored or default colors into picker + hex | `colorFields` loop in `openColorThemeModal` | *TBD* |
| **REQ-SET-011** | Picker and hex shall stay two-way synced (hex when valid `#RRGGBB`) | `setupSync` | *TBD* |
| **REQ-SET-012** | User shall reset a single color role to dark default (live) | `.reset-single-color` → `resetSingleColor` | *TBD* |
| **REQ-SET-013** | User shall apply Light or Dark full presets | `applyColorMode('light'\|'dark')` | *TBD* |
| **REQ-SET-014** | User shall save theme colors and return to Settings | `applyAndSaveColors` → apply + `saveColorSettings` + close | *TBD* |
| **REQ-SET-015** | Closing theme without Save shall return to Settings | `closeColorThemeModal` → `openSettingsModal` | *TBD* |
| **REQ-SET-016** | User shall open Attributions from Settings | `openAttributionModal` | *TBD* |
| **REQ-SET-017** | Closing Attributions shall return to Settings | `closeAttributionModal` | *TBD* |
| **REQ-SET-018** | Settings shall display keyboard shortcut hints | Static copy: `/` `+` `*` `-` | *TBD* |
| **REQ-SET-019** | Success color load shall fall back to legacy connection color | `startpage_connection_color` if success unset | *TBD* |
| **REQ-SET-020** | Theme apply shall map roles to CSS custom properties | `applyColors` | *TBD* |

**Cross-refs:** §5 Color Theme System, §6.9 Font Scale Side Effects, §4.6 storage keys, §7 shortcuts.

#### 6.8.3 High-Level Architecture & Diagrams

**Layering (settings slice)**

```
┌────────────────────────────────────────────────────────────────────┐
│ Presentation                                                       │
│  #settings-modal  ·  #color-theme-modal  ·  #attribution-modal     │
│  Header gear entry  ·  #theme-author-name  ·  #font-scale-value    │
├────────────────────────────────────────────────────────────────────┤
│ Controller                                                         │
│  settingsmodal.js: open/close Settings, theme, attribution;        │
│    applyColors, load/saveColorSettings, applyColorMode, …          │
│  app.js: applyFontScale / change / reset / load; name input wire;  │
│    COLOR_* defaults & ID map; Esc stack; window.* exports          │
├────────────────────────────────────────────────────────────────────┤
│ State / Persistence                                                │
│  currentFontScale (memory)                                         │
│  localStorage: name, font scale, per-role color keys               │
│  CSS vars on :root + body styles (live theme)                      │
└────────────────────────────────────────────────────────────────────┘
```

**Navigation flow (hub + children)**

```
  Header gear ──► openSettingsModal() ──► #settings-modal
                         │
         ┌───────────────┼───────────────────┐
         │               │                   │
         ▼               ▼                   ▼
   Name / Font      Edit Color Theme    Attributions
   (inline, live)   openColorThemeModal openAttributionModal
                         │                   │
                    close Settings      close Settings
                    show theme modal    show attribution
                         │                   │
              Save Colors / Cancel      Close / Esc / ×
                         │                   │
                         └─────────┬─────────┘
                                   ▼
                          openSettingsModal()
                          (return to hub)
```

**Stacking**

| Modal | z-index | Esc closes via |
|-------|---------|----------------|
| `#settings-modal` | `z-index: 110` | `closeSettingsModal` |
| `#color-theme-modal` | `z-index: 110` | `closeColorThemeModal` (then reopens Settings) |
| `#attribution-modal` | `z-index: 120` | `closeAttributionModal` (then reopens Settings) |

Only one of these is intended open at a time (children close Settings before open).

#### 6.8.4 Tech Stack & Versions

| Layer | Technology | Version / note |
|-------|------------|----------------|
| Markup | HTML5 static modals | `index.html` |
| Scripting | Vanilla JS classic `defer` | `settingsmodal.js`, `app.js` |
| Styling | Custom CSS + proprietary theme tokens | Dark chrome via `--color-surface-*` / `--background-color` |
| Color inputs | Native `<input type="color">` + hex text | Browser color picker UI |
| Icons | Font Awesome **7** Free subset | gear, palette, info, undo, etc. |
| Persistence | `localStorage` | No server settings API |
| Runtime deps | **None** | Offline after assets load |

#### 6.8.5 Key Design Decisions & Rationale

| # | Decision | Rationale | Status |
|---|----------|-----------|--------|
| S1 | Settings as **hub**; theme & attribution as **child modals** | Keeps hub compact; deep editors get full surfaces | **Current** |
| S2 | Close child → **return to Settings** (not main page) | Preserves multi-step preference workflow | **Current** *(explicit UX)* |
| S3 | Name persists on every `input` (no Save button) | Immediate personalization feedback | **Current** |
| S4 | Font scale applies **immediately** + writes storage | Readability changes should be live; side effects recompute layout | **Current** |
| S5 | Font clamp **70–150**, step **5%**, reset **100%** | Bounded, predictable accessibility range | **Current** |
| S6 | Dual color control: native picker + hex text | Precision for power users; visual for others | **Current** |
| S7 | Hex updates picker only when `/^#[0-9A-Fa-f]{6}$/` | Avoid invalid partial hex thrashing the picker | **Current** |
| S8 | Per-field undo uses **dark** `COLOR_DEFAULTS` only | Stable reference; Light Mode is a full preset, not per-field light defaults | **Current** |
| S9 | `resetSingleColor` **live-applies** CSS without `saveColorSettings` | Instant preview; permanent only via Save Colors (or Light/Dark which do save) | **Current** *(nuance)* |
| S10 | Light/Dark presets call `applyColorPalette` → apply **and** save | One-click mode switch should stick across reloads | **Current** |
| S11 | `Save Colors` reads hex text fields via `getCurrentColorValues` | Hex is source of truth at commit time | **Current** |
| S12 | Color role system (not free-form global CSS) | Consistent `color-mix` theming across components (§5) | **Current** |
| S13 | Legacy `startpage_connection_color` → success fallback | Backward compatibility for older backups | **Current** |
| S14 | Shortcut hints are **documentation only** in Settings | Discoverability without re-implementing handlers | **Current** |
| S15 | Header chrome forces light text (`#e4e4e7`) independent of theme Text | Keeps header legible on dark sticky bar (§5.4) | **Current** |
| S16 | `search` color role has storage + apply path but **no Theme Editor UI control** in current HTML | Residual gap: search surface color only via defaults/import/Gist unless controls re-added | **Current / gap** |
| S17 | UI label “Interfaces / Headers” maps to **success** color key | Naming drift vs §5 “Success” vocabulary | **Current / note** |
| S18 | `resetColors()` deprecated alias → `applyColorMode('dark')` | Compatibility for older onclick/docs | **Current** |

#### 6.8.6 Data Model / Schema

**A. User identity**

| Key / field | Type | Default | Behavior |
|-------------|------|---------|----------|
| `startpage_user_name` | string | `''` | Live from `#theme-author-name` |
| Page title text | derived | `Start` | `{name}'s Start Page` if non-empty after trim |

**B. Font scale**

| Key / field | Type | Default | Constraints |
|-------------|------|---------|-------------|
| `startpage_font_scale` | number (stored as string) | `100` | Clamp **70–150** |
| `currentFontScale` | number (memory) | mirrors storage | Updated by `applyFontScale` |
| CSS | `html` font-size `N%`; `--font-scale` = `N/100` | | Side effects §6.9 |

**C. Color roles (object shape used in apply/save/export)**

```js
{
  bg, text, card, search, activeCat, category,
  textbox, activeText, emojiBg, hoverBlend,
  button, saveButton, success, caution
} // each: hex string e.g. "#18181b"
```

| Field key | localStorage key | Dark default | Light default | Theme UI label |
|-----------|------------------|--------------|---------------|----------------|
| `bg` | `startpage_bg_color` | `#18181b` | `#c9c9c9` | Background |
| `text` | `startpage_text_color` | `#e4e4e7` | `#2e2e2e` | Text |
| `card` | `startpage_card_color` | `#27251f` | `#898370` | Card |
| `search` | `startpage_search_color` | `#18181b` | `#dedede` | *(no editor control)* |
| `activeCat` | `startpage_active_cat_color` | `#aa0000` | `#e14c4c` | Active & Accent |
| `category` | `startpage_category_color` | `#27251f` | `#97917d` | Pill |
| `textbox` | `startpage_textbox_color` | `#18181b` | `#a8a8a8` | Textbox |
| `activeText` | `startpage_active_text_color` | `#ffffff` | `#000000` | Active Text |
| `emojiBg` | `startpage_emoji_bg_color` | `#27251f` | `#888686` | Emoji Background |
| `hoverBlend` | `startpage_hover_blend_color` | `#ffffff` | `#ffffff` | Hover Blend |
| `button` | `startpage_button_color` | `#27251f` | `#999999` | Button |
| `saveButton` | `startpage_save_button_color` | `#4f46e5` | `#7973e8` | Submit Button & Links |
| `success` | `startpage_success_color` | `#10b981` | `#0a6647` | Interfaces / Headers |
| `caution` | `startpage_caution_color` | `#fbbf24` | `#c0911b` | Caution |

**Legacy:** `startpage_connection_color` — read-only fallback when success is unset.

**D. DOM id mapping (`COLOR_ID_MAP`)**

Logical key → prefix for `{prefix}-color-picker` / `{prefix}-color-text` (e.g. `activeCat` → `active-cat`).

**E. Backup / Gist**

Export payload includes `colors`, `userName`, `fontScale` (§4.3). Import restores via `applyColors` / `applyFontScale` / name write.

#### 6.8.7 API / Interface Specifications

**Settings hub**

| Function | Module | Behavior |
|----------|--------|----------|
| `openSettingsModal()` | `settingsmodal.js` | `openUiModal('settings-modal')` |
| `closeSettingsModal()` | `settingsmodal.js` | `closeUiModal('settings-modal')` |

**Color theme**

| Function | Module | Behavior |
|----------|--------|----------|
| `openColorThemeModal()` | `settingsmodal.js` | Close Settings; load storage→fields; wire sync + once-only reset delegation; show theme modal |
| `closeColorThemeModal()` | `settingsmodal.js` | Hide theme; `openSettingsModal()` |
| `getCurrentColorValues()` | `settingsmodal.js` | Read hex text inputs (defaults if missing) |
| `applyColors(colors)` | `settingsmodal.js` | Body + CSS custom properties |
| `loadColorSettings()` | `settingsmodal.js` | Storage → `applyColors` (boot) |
| `saveColorSettings(colors)` | `settingsmodal.js` | Write per-key localStorage |
| `resetSingleColor(fieldKey)` | `settingsmodal.js` | Dark default into field + live `applyColors` (no save) |
| `applyColorPalette(palette)` | `settingsmodal.js` | Fields + apply + **save** |
| `applyColorMode('light'\|'dark')` | `settingsmodal.js` | Preset via `COLOR_LIGHT_DEFAULTS` / `COLOR_DEFAULTS` |
| `applyAndSaveColors()` | `settingsmodal.js` | get values → apply → save → close (back to Settings); try/catch + alert on error |
| `resetColors()` | `settingsmodal.js` | Deprecated → dark mode |

**Font scale (`app.js`)**

| Function | Behavior |
|----------|----------|
| `applyFontScale(scale)` | Clamp, set CSS, store, update `#font-scale-value`, menu + list-controls layout |
| `changeFontScale(delta)` | `applyFontScale(currentFontScale + delta)` |
| `resetFontScale()` | `applyFontScale(100)` |
| `loadFontScale()` | Boot from storage (default 100) |

**Attribution**

| Function | Behavior |
|----------|----------|
| `openAttributionModal()` | Close Settings; show `#attribution-modal` |
| `closeAttributionModal()` | Hide attribution; reopen Settings |

**Entry points**

| Entry | Action |
|-------|--------|
| Header Settings (gear) | `openSettingsModal` |
| Font − / + / Reset | `changeFontScale` / `resetFontScale` |
| Edit Color Theme | `openColorThemeModal` |
| Light / Dark Mode buttons | `applyColorMode` |
| Per-field undo | Delegated click → `resetSingleColor` |
| Save Colors | `applyAndSaveColors` |
| Cancel/Close (theme) | `closeColorThemeModal` |
| Attributions | `openAttributionModal` |
| Close (settings / attribution) | respective close |
| Escape | Topmost open modal in stack (settings / theme / attribution handlers) |

**Constants (`app.js`)**

- `COLOR_DEFAULTS`, `COLOR_LIGHT_DEFAULTS`, `COLOR_ID_MAP` — shared by theme editor.

**Window exports:** `openSettingsModal`, `closeSettingsModal`, `openColorThemeModal`, `closeColorThemeModal`, `applyAndSaveColors`, `applyColorMode`, `applyColorPalette`, `resetColors`, `applyColors`, `saveColorSettings`, `changeFontScale`, `resetFontScale`, `applyFontScale`, attribution open/close (see `app.js`).

#### 6.8.8 Security & Compliance Requirements

| Topic | Treatment |
|-------|-----------|
| **Data residency** | Name, font scale, and colors stored in browser `localStorage` (and optional user-initiated export/Gist). |
| **Secrets** | Settings modals do **not** collect tokens (GitHub credentials are separate sync UI). |
| **PII** | “Your Name” is free text personalization only; treat under local endpoint policy if deployed enterprise-wide. |
| **XSS** | Name written via `textContent` to title; color values applied as CSS. Prefer keep hex validation for picker sync; unvalidated hex on Save still set as CSS (browser ignores invalid). |
| **Network** | No network I/O from Settings/theme/attribution save paths. Attribution links open external sites (`target="_blank"`) when user clicks. |
| **Third-party notices** | Attribution modal documents Font Awesome licenses, GitHub Gists, xAI assistance, author credit. |
| **Regulated use** | Preferences UI is not a system of record; do not store confidential firm data in the name field. |
| **Audit** | No settings change audit log. |

#### 6.8.9 Non-Functional Requirements

| Category | Requirement / observed behavior |
|----------|----------------------------------|
| **Performance** | Open/close is class toggle; color apply sets a small fixed set of CSS variables; no network. |
| **Responsiveness** | Settings/theme `.ui-modal__panel--lg` (`max-width: 32rem`); attribution `.ui-modal__panel--xl` (`max-width: 600px`); theme uses 3-column compact grid. |
| **Reliability** | Boot calls `loadColorSettings` + `loadFontScale`. Theme Save wrapped in try/catch with user alert. Child close always returns to hub. |
| **Availability** | Fully offline preference editing. |
| **Scalability** | Fixed control count (O(1) color roles); independent of link count. |
| **Usability** | Live name and font feedback; dual color inputs; one-click Light/Dark; shortcut cheat sheet. |
| **Accessibility** | Native color inputs; Esc closes; labeled fields. Gaps: no focus trap/ARIA `dialog`; theme grid dense on small viewports. |
| **Maintainability** | Color logic centralized in `settingsmodal.js` + defaults in `app.js`; §5 remains role vocabulary source. |
| **Consistency** | Header fixed colors (§5.4) intentionally ignore theme Text for chrome stability. |

#### 6.8.10 Assumptions, Risks, Dependencies & Constraints

**Assumptions**

- Script order loads `settingsmodal.js` before `app.js` so functions exist at export/boot.
- User allows `localStorage`.
- Only one settings-family modal visible at a time by navigation design.

**Dependencies**

| Dependency | Type | Notes |
|------------|------|-------|
| `openUiModal` / `closeUiModal` | Hard | `config.js` |
| `COLOR_*` maps | Hard | Defined in `app.js` |
| `localStorage` | Hard | Preferences durability |
| Theme CSS consumers | Soft | Components must use vars / `color-mix` for custom themes to show |
| Font Awesome subset | Soft | Modal chrome icons |

**Constraints**

- Classic globals; HTML `onclick` handlers.
- Per-field reset always to **dark** defaults, even if user is on light palette.
- `search` role not editable in current Theme Editor markup (S16).

**Risks**

| Risk | Impact | Mitigation / residual |
|------|--------|------------------------|
| Unsaved live `resetSingleColor` / preview confusion | User expects undo to persist without Save | Document S9; Save Colors for commit of manual hex edits |
| Light/Dark auto-saves while manual edits need Save | Inconsistent commit model | Document S10 vs S14 Save path |
| Missing Search color control | Cannot tweak search surfaces in UI | Restore control or drop unused role |
| Label “Interfaces / Headers” vs Success | Support/docs mismatch | Align label with §5 vocabulary when convenient |
| Name field free text in shared kiosk | Misleading title on shared device | User education; clear storage on shared endpoints |

#### 6.8.11 Updated Diagrams & Screenshots

**Diagrams (textual — authoritative)**

1. Layer diagram — §6.8.3  
2. Hub ↔ child navigation flow — §6.8.3  
3. Stacking table — §6.8.3  

**UI reference (reproduce for formal packs)**

| View | Steps | Capture |
|------|-------|---------|
| Settings hub | Header gear | Name field, font − / % / +, Reset, Edit Color Theme, Attributions, shortcut hints, Close |
| Font scale change | Click + or − | `%` readout updates; page text size changes |
| Color Theme Editor | Edit Color Theme | 3-col role grid, pickers, hex, undo, Light/Dark, Cancel, Save Colors |
| Light Mode applied | Light Mode button | Fields + page adopt light palette (saved) |
| Per-field undo | Undo on a role | That role returns to dark default (live) |
| Attributions | Attributions button | Credits: author, Grok/xAI, GitHub Gists, Font Awesome |
| Esc / Cancel return | Close theme or attribution | Settings hub reappears |

**Recommended assets (not in-repo):** `docs/assets/settings-modal/`  
`settings-hub.png`, `color-theme-editor.png`, `light-mode.png`, `attributions.png`.

Until captured, reviewers use live UI against this section.

**HTML anchors**

| ID | Role |
|----|------|
| `#settings-modal` | Preferences hub |
| `#theme-author-name` | Display name |
| `#font-scale-value` | Scale readout |
| `#color-theme-modal` | Theme editor |
| `*-color-picker` / `*-color-text` | Dual color controls |
| `.reset-single-color` | Per-role undo (`data-field`) |
| `#attribution-modal` | Credits |

### 6.9 Font Scale Side Effects

Font scale is edited from Settings (§6.8) but affects global layout:

- `document.documentElement.style.fontSize = N%`
- CSS `--font-scale` for scaled fixed-size text
- Recalculates header label collapse and list-controls stacking

**Header menu collapse:**

```
p = (currentFontScale - 100) / 100
threshold = clamp(1235 / (1 - p), 900, 2000)
if innerWidth < threshold → hide .menu-text-label
```

**List controls stack:**

```
threshold = 580 / (currentFontScale / 100)
if innerWidth < threshold → stack Show list by / View vertically
```

### 6.10 Daily Quote System (LinkedList)

Header quote strip on the Landing Screen (`#daily-quote`). Module: **`js/quotes.js`**. Selects one motivational quote per calendar day using a custom singly linked list and day-of-year index. Boot-safe: eager `initQuotes()` at end of module + idempotent call from `script.js`; `displayDailyQuote()` from `initializeApp`.

> *Detail note:* P1 expansion — LinkedList API, day-of-year math, corpus maintenance, display/hover title, init race handling.

#### 6.10.1 Purpose & Scope

| Item | Description |
|------|-------------|
| **Purpose** | Show a single daily inspirational quote in the sticky header without network calls or user configuration. |
| **In scope** | `Node` / `LinkedList` implementation; quote corpus load; `getDayOfYear`; `initQuotes` / `displayDailyQuote`; global exports; console diagnostics. |
| **Out of scope** | User-editable quotes; multi-language packs; remote quote APIs; random-per-refresh (day-stable by design). |
| **Primary artifacts** | `js/quotes.js`; `#daily-quote` in `index.html`; fixed header color §5.4. |

#### 6.10.2 Requirements Traceability

| Req ID | Requirement (shall) | Implementation | External ref |
|--------|---------------------|----------------|--------------|
| **REQ-DQ-001** | App shall display a quote in the header when corpus non-empty | `displayDailyQuote` | *TBD* |
| **REQ-DQ-002** | Quote shall be stable for a given calendar day | `(dayOfYear - 1) % size` | *TBD* |
| **REQ-DQ-003** | Day-of-year shall be 1-based and leap-aware | `getDayOfYear` via date diff from Jan 1 | *TBD* |
| **REQ-DQ-004** | Corpus shall load into a LinkedList once | `initQuotes` idempotent guard | *TBD* |
| **REQ-DQ-005** | Empty / failed corpus shall leave quote area empty | Clear `textContent` | *TBD* |
| **REQ-DQ-006** | Full quote shall be available on hover when truncated | `title` attribute = quote text | *TBD* |
| **REQ-DQ-007** | Init shall not race past display on deferred load | Eager init at end of `quotes.js` + `script.js` | *TBD* |
| **REQ-DQ-008** | Only non-empty strings shall enter the list | `LinkedList.add` + forEach trim guard | *TBD* |

#### 6.10.3 High-Level Architecture & Diagrams

```
  quotes.js parse
       │
       ▼
  initQuotes() ──► LinkedList ──► window.dailyQuotes
       │
       │  (eager at module end)
       │  (again from script.js if needed — no-op if size>0)
       ▼
  initializeApp → displayDailyQuote()
       │
       ├─ day = getDayOfYear()          // 1..365/366
       ├─ index = (day - 1) % size
       ├─ quote = dailyQuotes.get(index)
       └─ #daily-quote textContent + title
```

**LinkedList structure**

```
  head → Node(value, next) → Node → … → null
         size = N
```

#### 6.10.4 Tech Stack & Versions

| Layer | Technology | Notes |
|-------|------------|-------|
| Structure | Custom singly linked list | Teaching/simplicity; not a performance bottleneck |
| Corpus | In-module string array → list | ~**360+** quotes (static; expands with source) |
| Calendar | Local `Date` | Browser timezone |
| Display | DOM text node | No HTML quote markup injection |

#### 6.10.5 Key Design Decisions & Rationale

| # | Decision | Rationale | Status |
|---|----------|-----------|--------|
| Q1 | Day-of-year modulo selection | Same quote all day; cycles yearly if N ≠ 365 | **Current** |
| Q2 | LinkedList vs array | Explicit educational structure; O(n) get acceptable for N~hundreds | **Current** |
| Q3 | Eager init at module bottom | Defers + app init order safe | **Current** |
| Q4 | Idempotent `initQuotes` | `script.js` may call again without duplicating | **Current** |
| Q5 | `textContent` + `title` | XSS-safe display; hover full text | **Current** |
| Q6 | No user preference / random button | Zero chrome; set-and-forget | **Current** |
| Q7 | Console log size + day on init | Dev visibility | **Current** |
| Q8 | Fixed light header color for quote | Legibility on sticky dark bar (§5.4) | **Current** |

#### 6.10.6 Data Model / Schema

**Node**

```js
{ value: string, next: Node | null }
```

**LinkedList**

| Field / method | Behavior |
|----------------|----------|
| `head` | First node or null |
| `size` | Count of nodes |
| `add(value)` | Append if non-empty string; else warn + no-op |
| `get(index)` | 0-based walk; null if OOB |

**Globals**

| Name | Meaning |
|------|---------|
| `window.dailyQuotes` | Populated `LinkedList` |
| `window.getDayOfYear` | Function export |
| `window.LinkedList` | Constructor export |
| `window.displayDailyQuote` | Render function |

**Selection formula**

```
index = (getDayOfYear() - 1) % dailyQuotes.size
```

**Corpus:** Static strings in `initQuotes` (attribution style: quote — author). Maintenance is source edit only; no runtime CMS.

#### 6.10.7 API / Interface Specifications

| Function | Behavior |
|----------|----------|
| `getDayOfYear()` | `floor((now - Jan1Local) / 86400000) + 1` |
| `initQuotes()` | If `dailyQuotes.size > 0` return; else build list from array; set global; log |
| `displayDailyQuote()` | Resolve index; set `#daily-quote` text + title; no-op if missing el/empty list |

**Call sites:** end of `quotes.js`; `script.js` idle path companion; `initializeApp` display.

#### 6.10.8 Security & Compliance Requirements

| Topic | Treatment |
|-------|-----------|
| **Content** | Static first-party strings; no user input |
| **XSS** | `textContent` assignment |
| **Privacy** | No tracking of which quote was shown |
| **Attribution** | Quotes are well-known aphorisms with attributed names in-string; not a licensed quote service |

#### 6.10.9 Non-Functional Requirements

| Category | Behavior |
|----------|----------|
| **Performance** | O(N) list build once; O(index) get per display (index &lt; N) |
| **Reliability** | Idempotent init; empty-safe display |
| **i18n** | English-only corpus |
| **Maintainability** | Add strings to array in `initQuotes`; keep non-empty |

#### 6.10.10 Assumptions, Risks, Dependencies & Constraints

**Assumptions:** Local clock roughly correct; header element present.  
**Risks:** Timezone change at midnight boundary; corpus size not equal to 365 → multi-year phase shift; very long quotes may truncate visually (title backup).  
**Constraints:** No shuffle without code change; LinkedList get is linear (fine at current N).

#### 6.10.11 Updated Diagrams & Screenshots

| View | Capture |
|------|---------|
| Header with quote | Italic centered text under top bar |
| Hover | Browser tooltip with full quote |
| Empty | Blank quote region if list empty |

**Recommended assets:** `docs/assets/daily-quote/header-quote.png`.

### 6.11 GitHub Gist Sync (Hub & Related Modals)

Cross-device backup/restore of start-page data via the **GitHub Gists REST API**, driven by a modal hub and child surfaces. Module: **`js/github.js`**. Depends on `state.js` (credential globals), `storage.js` (`maskToken` / `unmaskToken`, `saveLinks`), and theme helpers (`applyColors`, `saveColorSettings`, `applyFontScale`). Local file import/export remains separate (**§6.12**).

> *Detail note:* Expands the prior action table into a full component design for `#sync-modal` and children (`#github-credentials-modal`, `#gists-list-modal`, `#sync-instructions-modal`), aligned with current `github.js` behavior.

#### 6.11.1 Purpose & Scope

| Item | Description |
|------|-------------|
| **Purpose** | Enable optional, user-initiated backup and restore of links, colors, name, font scale, and bound Gist metadata using a private GitHub Gist and a classic Personal Access Token (PAT) with **`gist`** scope. |
| **In scope** | Sync hub UI; last-sync status; Export (create/PATCH Gist); Import (bound ID, manual ID, or Gist picker); credentials save/clear/show/copy; clear Gist ID; in-app setup instructions; token masking in exported JSON; Esc stack participation. |
| **Out of scope** | OAuth App / GitHub Apps; fine-grained PAT automation; conflict merge UI; scheduled/background sync; multi-Gist management beyond pick-for-import; server-side secret vault; enterprise SCIM/SSO. |
| **Actors** | End user with a GitHub account who voluntarily configures sync. |
| **Primary artifacts** | HTML: `#sync-modal`, `#github-credentials-modal`, `#gists-list-modal`, `#sync-instructions-modal`. Logic: `js/github.js`. Token obfuscation: `js/storage.js`. Boot: `loadGitHubCredentials()` from `initializeApp`. |

#### 6.11.2 Requirements Traceability

No external BRD / FRS / Jira linkage in-repo. Internal IDs below; map **External ref** when enterprise tickets exist.

| Req ID | Requirement (shall) | Implementation | External ref |
|--------|---------------------|----------------|--------------|
| **REQ-GHS-001** | User shall open Sync hub from header | `openSyncModal()` | *TBD* |
| **REQ-GHS-002** | Hub shall show relative last-sync time | `#last-sync-text` + `getLastSyncText`; refresh every **15s** while open | *TBD* |
| **REQ-GHS-003** | Hub shall show credentials status | `updateGitHubCredentialsStatus` | *TBD* |
| **REQ-GHS-004** | User shall export current state to a Gist | `exportToGitHub` | *TBD* |
| **REQ-GHS-005** | Export without credentials shall prompt credentials UI | Alert + delayed `openGitHubCredentialsModal` | *TBD* |
| **REQ-GHS-006** | First export shall create a **private** Gist with file `startpage-backup.json` | `POST /gists`, `public: false` | *TBD* |
| **REQ-GHS-007** | Subsequent export shall PATCH bound Gist when ID present | `PATCH /gists/{id}` | *TBD* |
| **REQ-GHS-008** | Failed update (401/404) shall create a new Gist and bind new ID | Recreate path in `exportToGitHub` | *TBD* |
| **REQ-GHS-009** | Export payload token shall be masked | `maskToken(githubToken)` in `github.token` | *TBD* |
| **REQ-GHS-010** | User shall import from bound Gist | `importFromGitHub` | *TBD* |
| **REQ-GHS-011** | Import without Gist ID shall offer Gist list or manual ID | confirm → `showUserGistsModal` or `prompt` | *TBD* |
| **REQ-GHS-012** | Import shall require confirm before replacing links | `confirm(...)` | *TBD* |
| **REQ-GHS-013** | Import shall restore links, colors, name, font scale, credentials, Gist id | Apply + `saveLinks` / `saveColorSettings` / storage | *TBD* |
| **REQ-GHS-014** | User shall save username + PAT to localStorage | `saveGitHubCredentials` | *TBD* |
| **REQ-GHS-015** | User shall clear credentials by saving empty fields | Both empty → remove keys | *TBD* |
| **REQ-GHS-016** | Token field shall support show/hide and copy | `toggleTokenVisibility`, `copyTokenToClipboard` | *TBD* |
| **REQ-GHS-017** | User shall clear bound Gist ID with confirm | `clearGitHubGistId` | *TBD* |
| **REQ-GHS-018** | User shall view setup instructions | `showSyncInstructions` / `#sync-instructions-modal` | *TBD* |
| **REQ-GHS-019** | Closing credentials or instructions shall return to Sync hub | Delayed reopen (~120–150 ms) | *TBD* |
| **REQ-GHS-020** | User shall pick a JSON-bearing Gist for import | `fetchUserGists` → `selectGistForImport` → `importFromGitHubWithGistId` | *TBD* |
| **REQ-GHS-021** | Gist list shall only include Gists with ≥1 `.json` file | Filter in `fetchUserGists` | *TBD* |
| **REQ-GHS-022** | Escape shall close the topmost sync-family modal | Esc stack in `app.js` | *TBD* |
| **REQ-GHS-023** | Hub disclaimer shall state token storage locations | `#sync-disclaimer` static copy | *TBD* |

**Cross-refs:** §4.3 payload, §4.5 token masking, §4.6 keys, §6.12 file backup, §10 security notes.

#### 6.11.3 High-Level Architecture & Diagrams

**Layering (sync slice)**

```
┌────────────────────────────────────────────────────────────────────┐
│ Presentation                                                       │
│  #sync-modal (hub) · credentials · gists list · instructions       │
│  Header “Sync with GitHub” entry                                   │
├────────────────────────────────────────────────────────────────────┤
│ Controller (github.js)                                             │
│  open/close · credentials · exportToGitHub · importFromGitHub*     │
│  fetchUserGists · showUserGistsModal · selectGistForImport         │
├────────────────────────────────────────────────────────────────────┤
│ Domain / State                                                     │
│  githubUsername · githubToken · githubGistId · githubLastSync      │
│  links[] · theme/name/font (via localStorage + helpers)            │
├────────────────────────────────────────────────────────────────────┤
│ External                                                           │
│  GitHub REST API  https://api.github.com  (gists)                  │
│  Auth: Authorization: Bearer <PAT>                                 │
├────────────────────────────────────────────────────────────────────┤
│ Local persistence                                                  │
│  localStorage credential keys + app data keys                      │
│  maskToken / unmaskToken (export/import payload only)              │
└────────────────────────────────────────────────────────────────────┘
```

**Hub navigation**

```
  Header ──► openSyncModal ──► #sync-modal
                  │
     ┌────────────┼──────────────┬──────────────────┐
     ▼            ▼              ▼                  ▼
  Export       Import      Instructions      Credentials
     │            │              │                  │
     │       no gist id?         │                  │
     │      ┌─────┴─────┐        │                  │
     │      ▼           ▼        │                  │
     │   Gist list   prompt ID   │                  │
     │      │                    │                  │
     ▼      ▼                    ▼                  ▼
  GitHub API …            close → reopen hub   close → reopen hub
  (sync modal closed at start of export/import)
```

**Stacking**

| Modal | z-index | Close behavior |
|-------|---------|----------------|
| `#sync-modal` | `z-index: 110` | × / Esc; export/import close hub first |
| `#sync-instructions-modal` | `z-index: 110` | Close → reopen Sync (~150 ms) |
| `#gists-list-modal` | `z-index: 110` | × / Esc; **does not** auto-reopen Sync |
| `#github-credentials-modal` | `z-index: 120` | Cancel/Save → reopen Sync (~120 ms); token reset to password |

#### 6.11.4 Tech Stack & Versions

| Layer | Technology | Version / note |
|-------|------------|----------------|
| Markup | HTML5 static modals | `index.html` |
| Scripting | Vanilla JS classic `defer` | `js/github.js` |
| HTTP | `fetch` | GitHub REST **v3** Accept header |
| Auth | Classic PAT | Scope: **`gist`** only (documented in UI) |
| API base | `https://api.github.com` | `POST/PATCH /gists`, `GET /gists/{id}`, `GET /users/{user}/gists` |
| Token UX | password field + clipboard API | Fallback `document.execCommand('copy')` |
| Icons | Font Awesome **7** brands/solid subset | GitHub brand, upload/download/key, etc. |
| Runtime deps | Browser + network to GitHub | Offline app works without sync |

#### 6.11.5 Key Design Decisions & Rationale

| # | Decision | Rationale | Status |
|---|----------|-----------|--------|
| G1 | Use **private Gists** as transport | Simple cross-device store without custom backend | **Current** |
| G2 | Classic PAT with **`gist` scope only** | Least privilege for intended operations | **Current** |
| G3 | Sync **hub + child modals** | Separates export/import actions from credential editing and help | **Current** |
| G4 | Bind one **Gist ID** per browser profile | Stable update target after first export | **Current** |
| G5 | PATCH then **recreate on 401/404** | Recovers from deleted/inaccessible Gists without trapping user | **Current** |
| G6 | Export closes hub before network work | Avoids stale UI during async; simple status via `alert` | **Current** |
| G7 | Token stored **plaintext in localStorage** | Required for silent API calls; disclosed in hub disclaimer | **Current** *(convenience-grade security)* |
| G8 | Token **masked** in JSON/Gist payload (`maskToken`) | Obfuscation for shared backups — **not** encryption | **Current** (see §4.5) |
| G9 | Import **replaces** links after confirm (no merge) | Deterministic restore; matches file import mental model | **Current** |
| G10 | No Gist ID → offer **list of JSON Gists** or manual prompt | Supports second-device bootstrap without knowing ID | **Current** |
| G11 | Gist list filters to files ending in `.json` | Reduces noise; matches backup file convention | **Current** |
| G12 | Last-sync relative clock + **15s** refresh while hub open | Live status without constant timers when closed | **Current** |
| G13 | Credentials empty save **clears** connection | Explicit disconnect path | **Current** |
| G14 | Token field always re-hidden on credentials close | Reduce shoulder-surfing residual | **Current** |
| G15 | Instructions/credentials return to hub; Gist list does not | List often leads straight into import; residual UX inconsistency | **Current / note** |
| G16 | Duplicate import paths (`importFromGitHub` vs `importFromGitHubWithGistId`) | Picker reuses shared apply logic with slight copy-paste | **Current / tech debt** |
| G17 | User messaging via `alert` / `confirm` / `prompt` | Zero-dependency; blocks until acknowledged | **Current** |
| G18 | Bearer token in `Authorization` header | GitHub-recommended auth for REST | **Current** |

#### 6.11.6 Data Model / Schema

**A. In-memory / localStorage credentials**

| Variable / key | Type | Meaning |
|----------------|------|---------|
| `githubUsername` / `github_username` | string | GitHub login name |
| `githubToken` / `github_token` | string | Classic PAT (**plaintext** at rest in localStorage) |
| `githubGistId` / `github_gist_id` | string | Bound Gist id for PATCH/GET |
| `githubLastSync` / `github_last_sync` | number (ms) / string | Last successful sync timestamp |

**B. Gist file**

| Property | Value |
|----------|--------|
| Filename | **`startpage-backup.json`** |
| Visibility | **Private** (`public: false` on create) |
| Description | `Start Page Backup - {username}` |

**C. Export / Gist JSON payload** (same family as §4.3)

```js
{
  links: Link[],
  colors: { bg, text, card, search, activeCat, category, textbox,
            activeText, emojiBg, hoverBlend, button, saveButton, success, caution },
  userName: string,
  fontScale: number,           // 70–150 typical
  lastSynced: string,          // ISO timestamp at export
  github: {
    username: string,
    token: string,             // maskToken(plaintext) in export
    gistId: string
  },
  githubLastSync: string | null  // ms timestamp string from localStorage
}
```

**D. Token masking** (`storage.js`)

- `maskToken`: after each character, insert a random special from `! @ # $ % ^`.
- `unmaskToken`: even length + odd positions all specials → unmask; else treat as plain (legacy).
- **Not** cryptographic; backups remain sensitive.

**E. Import normalization (links)**

Missing fields filled: `description`, `categories`, `emoji` (🔗), `accentColor`, `isFavorite` (inline in import paths; similar spirit to `normalizeLink`).

#### 6.11.7 API / Interface Specifications

**UI / lifecycle**

| Function | Behavior |
|----------|----------|
| `loadGitHubCredentials()` | Boot: load four keys into memory |
| `openSyncModal()` / `closeSyncModal()` | Show/hide hub; start/stop 15s last-sync interval |
| `getLastSyncText()` | Relative time or “Never synced with GitHub” |
| `updateGitHubCredentialsStatus()` | “Connected as {user}” vs “Not configured” |
| `openGitHubCredentialsModal()` | Close hub; fill fields; password mode; show Gist info if bound |
| `closeGitHubCredentialsModal()` | Hide token; reopen hub after short delay |
| `saveGitHubCredentials()` | Validate both or clear both; persist; alert |
| `clearGitHubGistId()` | Confirm; clear id + hide info panel |
| `toggleTokenVisibility()` | password ↔ text + eye icon |
| `copyTokenToClipboard()` | Clipboard API or fallback; brief check icon |
| `showSyncInstructions()` / `closeSyncInstructionsModal()` | Child help; return to hub |
| `showUserGistsModal()` / `closeGistsListModal()` | List UI; close only hides list |
| `selectGistForImport(id)` | Persist id; `importFromGitHubWithGistId(id)` |

**Network operations**

| Function | HTTP | Notes |
|----------|------|--------|
| `exportToGitHub()` | `PATCH /gists/{id}` or `POST /gists` | Closes hub; requires creds; sets id + lastSync; 401/404 recreate |
| `importFromGitHub()` | `GET /gists/{id}` | Resolves id via list/prompt if missing; confirm replace |
| `importFromGitHubWithGistId(id)` | `GET /gists/{id}` | Used after picker |
| `fetchUserGists()` | `GET /users/{username}/gists` | Auth headers; filter `.json` files |

**Common headers**

```
Authorization: Bearer <githubToken>
Accept: application/vnd.github.v3+json
Content-Type: application/json   // write operations
```

**Entry points**

| Entry | Action |
|-------|--------|
| Header Sync control | `openSyncModal` |
| Export / Import / Instructions / Credentials cards | Respective handlers |
| Save Credentials / Cancel | `saveGitHubCredentials` / `closeGitHubCredentialsModal` |
| Gist row click | `selectGistForImport` |
| Escape | Topmost of sync / credentials / gists / instructions |

**Window exports** (`github.js`): `openSyncModal`, `closeSyncModal`, `exportToGitHub`, `importFromGitHub`, `showSyncInstructions`, `closeSyncInstructionsModal`, `openGitHubCredentialsModal`, `closeGitHubCredentialsModal`, `saveGitHubCredentials`, `clearGitHubGistId`, `toggleTokenVisibility` (and other functions as classic globals for HTML onclick).

**HTML anchors**

| ID | Role |
|----|------|
| `#sync-modal` | Hub |
| `#last-sync-text` | Relative sync status |
| `#github-credentials-status` | Connected / not configured |
| `#sync-disclaimer` | Token storage notice |
| `#github-username`, `#github-token` | Credential fields |
| `#token-eye-icon` | Visibility toggle |
| `#github-gist-info`, `#current-gist-id` | Bound id display |
| `#gists-list-modal`, `#gists-list-container` | Picker |
| `#sync-instructions-modal` | Setup guide |

#### 6.11.8 Security & Compliance Requirements

| Topic | Treatment |
|-------|-----------|
| **Secrets** | PAT stored **unencrypted** in `localStorage`. Also embedded (masked) in Gist JSON and local file exports. Hub disclaimer states this explicitly. |
| **Least privilege** | UI instructs classic token with **`gist` scope only**. App does not request broader scopes. |
| **Transport** | HTTPS to `api.github.com` only for sync operations. |
| **Gist visibility** | Created **private**; still accessible to anyone with token + id. |
| **Token display** | Default `type=password`; re-hidden on credentials close; copy optional. |
| **Masking** | Reversible obfuscation for shared JSON — **not** encryption; do not treat as a control for regulated secret storage. |
| **Shoulder surfing / clipboard** | Show/copy features increase exposure window; user-controlled. |
| **Regulated environments** | **Do not** use firm production PATs or store confidential client data in link backups. PAT + start-page data may be classified as sensitive under local endpoint policy. Prefer firm-approved password managers / secret stores if this pattern is disallowed. |
| **Audit** | No immutable audit log of sync events (only `github_last_sync` timestamp). |
| **Compliance note** | Suitable as personal convenience sync; **not** an enterprise backup or records-management system. |
| **XSS note** | Gist list builds HTML with description/id interpolation; ids are API-sourced; descriptions are user-controlled on GitHub — residual injection risk if malicious Gist descriptions exist under the account. |

#### 6.11.9 Non-Functional Requirements

| Category | Requirement / observed behavior |
|----------|----------------------------------|
| **Performance** | Sync is user-initiated; payload size ≈ links + settings JSON. No pagination UI for large Gist lists (API default page). |
| **Reliability** | Export recreate-on-401/404; import/export try/catch with user-facing errors. Duplicate last-sync restore blocks in import (harmless redundancy). |
| **Availability** | App fully usable offline; sync requires network + GitHub API uptime and valid PAT. |
| **Scalability** | Intended for personal link catalogs; not multi-tenant. Very large `links` arrays increase Gist size and API latency. |
| **Usability** | Card-style hub actions; relative last sync; guided instructions; Gist picker when id unknown. |
| **Accessibility** | Esc closes; some buttons have aria-labels (token eye/copy). Gaps: `alert`/`confirm` blocking; no focus trap; spinner text for loading. |
| **Observability** | Console errors prefixed `[GitHub Sync]`; user alerts on success/failure. |
| **Maintainability** | Sync isolated in `github.js`; import apply logic duplicated (G16). |

#### 6.11.10 Assumptions, Risks, Dependencies & Constraints

**Assumptions**

- User creates a classic PAT with `gist` scope and pastes it correctly.
- User accepts localStorage token storage for convenience.
- Browser allows `fetch` to GitHub (not blocked by corporate proxy without exception).
- `maskToken` / `unmaskToken` and theme helpers are loaded (script order).

**Dependencies**

| Dependency | Type | Notes |
|------------|------|-------|
| GitHub Gists API | Hard (for sync) | External availability & auth |
| `state.js` globals | Hard | Credential memory |
| `storage.js` | Hard | mask/unmask, `saveLinks` |
| `applyColors` / `saveColorSettings` / `applyFontScale` | Hard | Import restore |
| Font Awesome brands | Soft | GitHub icon |

**Constraints**

- No OAuth device flow; manual PAT.
- Single bound Gist id per profile (clear to rebind).
- Synchronous modal messaging (`alert`/`confirm`/`prompt`).
- Classic global functions for HTML handlers.

**Risks**

| Risk | Impact | Mitigation / residual |
|------|--------|------------------------|
| PAT theft via localStorage / shared machine / XSS | Account gist access | Minimize scope; clear creds; endpoint controls; residual high for shared devices |
| Masked token in Gist treated as “safe to share” | Credential leak | Disclaimer; education; residual |
| Import overwrites local links | Data loss | Confirm dialog; residual user error |
| Gist deleted remotely | Export recreate path | 401/404 create new | 
| Corporate GitHub Enterprise URL not supported | Sync fails | Only `api.github.com` hard-coded |
| Gist list HTML injection via description | Unexpected UI/script | Residual; prefer textContent if hardened |
| Import logic duplication | Behavioral drift between paths | Tech debt G16 |

#### 6.11.11 Updated Diagrams & Screenshots

**Diagrams (textual — authoritative)**

1. Layer diagram — §6.11.3  
2. Hub navigation / export-import flow — §6.11.3  
3. Stacking table — §6.11.3  

**UI reference (reproduce for formal packs)**

| View | Steps | Capture |
|------|-------|---------|
| Sync hub | Header Sync | Title, last-sync line, Export/Import/Instructions/Credentials cards, disclaimer |
| Connected status | Save valid creds, reopen hub | “Connected as …” emerald status |
| Credentials | Open GitHub Credentials | Username, masked token, eye/copy, gist id panel if bound, warning copy |
| Export success | Export to GitHub | Success alert with Gist ID (and bound id stored) |
| Import confirm | Import with bound id | Confirm replace dialog |
| Gist picker | Import without id → Yes | List of JSON Gists, truncated ids, updated timestamps |
| Instructions | Sync Instructions | Steps 1–6, PAT scope, private gist tip |

**Recommended assets (not in-repo):** `docs/assets/github-sync/`  
`sync-hub.png`, `credentials.png`, `gists-list.png`, `instructions.png`.

Until captured, reviewers exercise live UI against this section (network + test PAT recommended in non-production accounts only).

### 6.12 File Import / Export & Local Persistence Bootstrap

Local backup and first-run data loading without GitHub. Module: **`js/storage.js`**. Complements Gist sync (**§6.11**) and shares payload shape (**§4.3**). Header **Backup** dropdown calls `exportLinks` / `importLinks`.

> *Detail note:* P0 expansion — export/import APIs, dual import shapes, first-run `default.json` / file:// welcome modal, `saveLinks`/`loadLinks` contract, token masking cross-ref. **P1:** §6.12.12 first-run/welcome chrome detail.

#### 6.12.1 Purpose & Scope

| Item | Description |
|------|-------------|
| **Purpose** | Persist links in `localStorage`; seed first run when possible; enable portable JSON backup/restore of links and optional preferences/credentials without a server. |
| **In scope** | `loadLinks` / `saveLinks`; `getAllCategories`; `exportLinks` / `importLinks`; `maskToken` / `unmaskToken`; `showFileProtocolWarningModal`; interaction with theme/font restore helpers. |
| **Out of scope** | GitHub network export/import (§6.11); live multi-device conflict merge; encrypted vault storage. |
| **Primary artifacts** | `js/storage.js`; `default.json`; Backup menu in `index.html`. |

#### 6.12.2 Requirements Traceability

| Req ID | Requirement (shall) | Implementation | External ref |
|--------|---------------------|----------------|--------------|
| **REQ-FIO-001** | App shall load links from localStorage when present | `loadLinks` | *TBD* |
| **REQ-FIO-002** | Missing storage shall attempt `default.json` via fetch | First-run branch | *TBD* |
| **REQ-FIO-003** | Successful seed shall normalize, save, and render | `saveLinks` + render | *TBD* |
| **REQ-FIO-004** | `file://` seed failure shall show welcome modal | `showFileProtocolWarningModal` | *TBD* |
| **REQ-FIO-005** | HTTP seed failure shall log and use empty links | `console.warn` | *TBD* |
| **REQ-FIO-006** | User shall export full backup JSON file | `exportLinks` | *TBD* |
| **REQ-FIO-007** | Export filename shall include ISO date | `start-page-backup-YYYY-MM-DD.json` | *TBD* |
| **REQ-FIO-008** | Export shall mask GitHub token | `maskToken` (§4.5) | *TBD* |
| **REQ-FIO-009** | User shall import a `.json` backup file | `importLinks` file input | *TBD* |
| **REQ-FIO-010** | Import shall accept full object or raw link array | Dual shape parse | *TBD* |
| **REQ-FIO-011** | Import shall confirm before replacing links | `confirm` with count | *TBD* |
| **REQ-FIO-012** | Import shall restore optional colors, font, github | Apply helpers + storage | *TBD* |
| **REQ-FIO-013** | Import shall clear active category filter | `currentFilterCategory = null` | *TBD* |
| **REQ-FIO-014** | Invalid JSON shall alert user | `alert("Invalid file.")` | *TBD* |
| **REQ-FIO-015** | Save shall write `startpage_links` | `saveLinks` | *TBD* |

#### 6.12.3 High-Level Architecture & Diagrams

**Load bootstrap**

```
  initializeApp → loadLinks()
        │
        ├─ localStorage startpage_links present?
        │     yes → parse → normalize fields → render
        │     no  → fetch('default.json')
        │              │
        │              ├─ OK + links[] → normalize → saveLinks → render
        │              └─ fail
        │                    ├─ protocol file: → Welcome modal (z-index: 300)
        │                    └─ else → console.warn; links = []
```

**Export / import**

```
  Backup → Export          Backup → Import
        │                        │
        ▼                        ▼
  assemble payload          <input type=file accept=.json>
  mask token                FileReader → JSON.parse
  Blob download                   │
                           array? or .links?
                                  │
                           confirm replace
                                  │
                    normalize links → save → render
                    optional: colors, fontScale, github*
```

\* `github` / `githubLastSync` only when import root is object (not bare array).

#### 6.12.4 Tech Stack & Versions

| Layer | Technology | Notes |
|-------|------------|-------|
| Persistence | `localStorage` | Primary |
| Seed | `fetch` + static `default.json` | CORS/`file://` limits |
| Export | `Blob` + object URL + `<a download>` | Client-only |
| Import | Hidden file input + `FileReader.readAsText` | `.json` accept |
| Welcome UI | Dynamically created DOM | Not in static HTML |

#### 6.12.5 Key Design Decisions & Rationale

| # | Decision | Rationale | Status |
|---|----------|-----------|--------|
| F1 | localStorage as system of record on device | Zero backend | **Current** |
| F2 | Auto-seed from `default.json` when empty | Better first run on HTTP hosts | **Current** |
| F3 | Welcome modal only on `file://` seed failure | Browsers block fetch; guide manual Import | **Current** |
| F4 | Full backup includes colors, name, font, github | One-file restore parity with Gist payload family | **Current** |
| F5 | Token masked in export, not encrypted | Obfuscation for casual share (§4.5, §10) | **Current** |
| F6 | Import accepts legacy **array-only** JSON | Backward compatibility | **Current** |
| F7 | Import is replace, not merge | Deterministic restore | **Current** |
| F8 | Normalize missing link fields on load/import/seed | Older backups still render | **Current** |
| F9 | Export does **not** include `lastSynced` ISO field (Gist export does) | File export omits that Gist-only stamp | **Current** / note |
| F10 | Welcome modal not in Esc modal id list | Dynamically removed; close via buttons/backdrop | **Current** |

#### 6.12.6 Data Model / Schema

**Storage key:** `startpage_links` — JSON array of Link (§4.1).

**File export payload** (`exportLinks`):

```js
{
  links: Link[],
  colors: { /* full role map §4.3 / §5 */ },
  userName: string,
  fontScale: number,
  github: { username, token /* masked */, gistId },
  githubLastSync: string | null
}
```

**Import accepted shapes**

| Shape | Links source | Optional restores |
|-------|--------------|-------------------|
| `Link[]` | entire JSON | none (links only) |
| `{ links, colors?, userName?, fontScale?, github?, githubLastSync? }` | `imported.links` | colors, font, github block |

**Note:** `userName` is present on export but **file import path does not currently restore `userName` / page title** (Gist import does). Documented as implementation asymmetry.

**Normalization on load/import/seed (per link):**  
`description` → `''`; `categories` → `[]`; `emoji` → `🔗`; `accentColor` → `null` if undefined; `isFavorite` → `false` if undefined.

**Welcome modal:** ephemeral DOM; `z-index: 300`; copy guides Backup → Import of `default.json`.

#### 6.12.7 API / Interface Specifications

| Function | Behavior |
|----------|----------|
| `loadLinks()` | Boot path: storage or seed or empty (+ welcome) |
| `saveLinks()` | `JSON.stringify(links)` → `startpage_links`; errors logged |
| `getAllCategories()` | Unique sorted categories from `links` |
| `exportLinks()` | Build payload; download file; revoke object URL |
| `importLinks()` | Open file picker; parse; confirm; apply; alert success/fail |
| `maskToken` / `unmaskToken` | §4.5 |
| `showFileProtocolWarningModal()` | Create welcome UI; close removes node |

**Entry points**

| UI | Handler |
|----|---------|
| Backup → Export to *.json | `exportLinks` |
| Backup → Import from *.json | `importLinks` |
| Welcome “Let’s Go!” / × / backdrop | `modal.remove()` |

**User messages**

| Condition | UI |
|-----------|-----|
| Import confirm | `Replace current links with N imported ones?` |
| Success | `Import successful!` |
| Parse/apply error | `Invalid file.` |
| Welcome | Guided import of `default.json` |

#### 6.12.8 Security & Compliance Requirements

| Topic | Treatment |
|-------|-----------|
| **Sensitivity** | Backup JSON may contain links, theme, **masked** PAT, gist id — treat as confidential |
| **localStorage** | Device-local; shared endpoints can expose data |
| **Import trust** | File is fully trusted; malicious JSON can inject link fields / overwrite prefs |
| **Masking** | Not encryption; do not share exports as “safe” |
| **Regulated use** | Prefer firm-approved backup channels if PAT or sensitive URLs are present; clear storage on shared machines |

#### 6.12.9 Non-Functional Requirements

| Category | Behavior |
|----------|----------|
| **Performance** | Export/import bounded by local file size; sync on main thread |
| **Reliability** | try/catch on load/save/import; confirm before destructive import |
| **Availability** | Fully offline except optional HTTP `default.json` seed |
| **Usability** | One-click export; file picker import; welcome path for file:// |

#### 6.12.10 Assumptions, Risks, Dependencies & Constraints

**Assumptions:** Browser allows downloads and file pickers; `applyColors` / `applyFontScale` available at import time (`window.*`).  
**Dependencies:** `links` global; render functions; theme helpers for full restore.  
**Risks:** QuotaExceeded on `saveLinks`; userName not restored on file import; bare-array import drops settings; untrusted file XSS if fields later rendered unsafely.  
**Constraints:** No merge/diff UI; no auto-backup schedule.

#### 6.12.11 Updated Diagrams & Screenshots

| View | Capture |
|------|---------|
| Backup dropdown | Export / Import menu |
| Export | Downloaded `start-page-backup-*.json` |
| Import confirm | Browser confirm with count |
| Welcome (`file://`) | Rocket header, Quick Start steps, Let’s Go |

**Recommended assets:** `docs/assets/file-backup/` — `backup-menu.png`, `welcome-file-protocol.png`.

**Comparison to Gist (§6.11)**

| Aspect | File (§6.12) | Gist (§6.11) |
|--------|--------------|--------------|
| Transport | Local download/upload | GitHub API |
| Network | No | Yes |
| Token in payload | Masked in file | Masked in Gist JSON |
| userName restore | **Not** in `importLinks` today | Yes |
| lastSynced ISO on export | No | Yes (`lastSynced`) |

#### 6.12.12 First-Run Experience & Welcome Modal (P1 detail)

Complements §6.12.3 load bootstrap with UX and chrome for the **first empty session**.

**When it appears**

| Condition | Result |
|-----------|--------|
| `startpage_links` present | Load normally; **no** welcome |
| Missing storage + `fetch('default.json')` succeeds | Auto-seed links; **no** welcome |
| Missing storage + fetch fails + `location.protocol === 'file:'` | **Welcome modal** + `links = []` |
| Missing storage + fetch fails + HTTP(S) | `console.warn`; empty links; **no** welcome |

**Welcome modal (`showFileProtocolWarningModal`)**

| Aspect | Spec |
|--------|------|
| Construction | Runtime `document.createElement`; not in static HTML |
| Stacking | `.ui-modal.ui-modal--cover.is-open`: `position: fixed; inset: 0`; `background rgb(0 0 0 / 0.7)` + blur; **`z-index: 300`** (above app modals ~110–120) |
| Panel | `.ui-modal__panel--lg`; surface `var(--color-surface-page)`; `border-radius: 1.5rem` |
| Header | Rocket icon + “Welcome to Your Start Page!”; × close |
| Body | Greeting; explains fresh install; **Quick Start** box: Backup → Import → select `default.json` |
| Footer | Primary **Let’s Go!** (`.welcome-modal__cta`, success color) |
| Dismiss | Any `.close-btn`, or backdrop click (`e.target === modal`) → `modal.remove()` |
| Esc stack | **Not** registered in `app.js` modal id list — residual: Esc may not close this overlay |
| Persistence | None; pure guidance |

**Intended user path after welcome**

1. Dismiss modal  
2. Header **Backup** → **Import from *.json file**  
3. Choose project `default.json` (or any backup)  
4. Confirm replace → links load (settings only if full backup object)

**HTTP first-run path:** silent auto-import of `default.json` into localStorage when fetch succeeds — user never sees welcome.

**Design decisions**

| # | Decision | Rationale | Status |
|---|----------|-----------|--------|
| W1 | Welcome only for `file://` | That is where `fetch(default.json)` reliably fails | **Current** |
| W2 | Guide to manual Import rather than bundling links in JS | Keeps default catalog as editable JSON asset | **Current** |
| W3 | High z-index 300 | Must appear over empty shell chrome | **Current** |

### 6.13 Floating Actions

- **Quick Add / Go Top:** hidden while `#add-link-btn` intersects viewport; shown when scrolled past
- **Go Bottom:** hidden near document bottom (~400px threshold)
- Scroll top/bottom can reset keyboard card selection

> Full FAB visibility rules also appear under Landing Screen **§6.0** (REQ-LS-016/017).

### 6.14 Debug Panel (developer)

**Module:** `js/debug.js`  
**Element:** `#debug-panel` (created dynamically on first open — not in static HTML)  
**Purpose:** Lightweight always-on-top developer overlay for live runtime values used while tuning layout, keyboard nav, and data counts. No persistence; hidden by default.

#### Entry points

| Trigger | Action |
|---------|--------|
| **Ctrl+Shift+D** | Global keydown in `app.js` → `preventDefault()` → `toggleDebugPanel()` |
| Close button (×) | `onclick="toggleDebugPanel()"` |
| Refresh button (↻) | `onclick="updateDebugInfo()"` |
| Console | `window.toggleDebugPanel` / `window.updateDebugInfo` (exported from `app.js`) |

#### Creation & lifecycle

1. First `toggleDebugPanel()` creates the panel DOM, appends to `document.body`, wires drag + document-level mouse listeners, and a `window` resize listener.
2. Panel starts with `display: none`.
3. **Open:** add `.is-open`, call `updateDebugInfo()`, start **3s** `setInterval` refresh if not already running.
4. **Close:** remove `.is-open`, clear interval (`debugUpdateInterval = null`).
5. Panel node is **kept** after close (not destroyed); subsequent toggles reuse the same element.

#### Looks & visuals

**Shell**

| Property | Value |
|----------|--------|
| Position | `fixed`; default `top: 1rem; right: 1rem` until first drag |
| Stacking | `z-index: 99999` — above all app modals and chrome |
| Size | width `18rem`, padding `1rem` (`.debug-panel`) |
| Surface | `color-mix(..., var(--color-surface-page) 95%, transparent)` + `backdrop-filter: blur(4px)` |
| Border / radius | `border: 1px solid var(--color-border)`; `border-radius: 1rem` |
| Shadow | `box-shadow: var(--app-elevation-3)` |
| Type | `.debug-panel` uses `--app-font-mono`; rows use scaled `0.75rem` |
| Cursor | `grab` idle; `grabbing` while dragging |

**Chrome layout (top → bottom)**

1. **Header row** (`.debug-panel__header` — flex; bottom border `var(--color-border)`)
   - Left: bug icon + label **DEBUG** — `.debug-panel__brand` / `.debug-panel__label` (caution/amber accent, semibold, `letter-spacing: 1.5px`)
   - Right: control cluster
     - **Refresh** — `.debug-panel__btn--refresh`; muted → active text on hover; hover bg `var(--color-hairline)`
     - **Close** — `.debug-panel__btn--close`; muted → active text on hover; hover bg `rgb(127 29 29 / 0.3)`
2. **Content** — `#debug-content` (`.debug-panel__content`); rows rebuilt by `updateDebugInfo()`
3. **Footer hint** — `.debug-panel__hint` (top border; centered; `var(--color-muted-strong)`; `user-select: none`)  
   Copy: *“Drag header/area to move • Ctrl+Shift+D to toggle • Auto-clamps on release”*

**Metric row pattern**

Each live value is a horizontal flex row (`.debug-panel__row`):

- Label: `.debug-panel__key` (`var(--color-muted)`)
- Value: `.debug-panel__val` (`font-weight: 600`; `tabular-nums`) + modifier by group
- Separator: bottom border `var(--color-hairline)` between most rows (`.debug-panel__row--last` clears)
- Units (width/height only): nested `.debug-panel__unit` for `px`

#### Live metrics (`updateDebugInfo`)

| Label | Source | Value class | Notes |
|-------|--------|-------------|--------|
| **Window Width** | `window.innerWidth` | `.debug-panel__val--size` | + `px` unit |
| **Window Height** | `window.innerHeight` | `.debug-panel__val--size` | + `px` unit |
| **Link Cards** | `links.length` (safe if undefined) | `.debug-panel__val--count` | First data-stats row; `.debug-panel__row--group` spacing |
| **Keyboard Card Index** | `keyboardFocusedIndex` | `.debug-panel__val--index` | −1 = no keyboard card selection |
| **Categories** | `getAllCategories().length` if function exists | `.debug-panel__val--count` | Unique categories across links |
| **COMMON_EMOJIS** | sum of array lengths in `COMMON_EMOJIS` | `.debug-panel__val--count` | Total emoji glyphs in config map |
| **EMOJI_NAMES** | `Object.keys(EMOJI_NAMES).length` | `.debug-panel__val--count` | Descriptor map size (should match COMMON count when config is healthy) |

Refresh paths: open panel, manual refresh button, window **resize** (while visible), and **every 3 seconds** while open.

#### Drag behavior

| Phase | Behavior |
|-------|----------|
| **Start** | `mousedown` on panel **except** when target is inside a `button`. Sets `isDraggingDebug`, records offset from panel top-left, disables CSS transition, cursor → grabbing. First drag converts CSS `right` placement to explicit `left`/`top` px and sets `right: auto`. |
| **Move** | Document `mousemove`: free `left`/`top` follow pointer (**no live clamp** — intentional for smooth feel). `preventDefault()` while dragging. |
| **End** | Document `mouseup`: clear drag flag, restore transition/cursor, **clamp** so entire panel stays inside viewport with **12px** edge padding (all four corners remain visible). |
| **Resize** | If panel visible and any edge breaches the 12px inset, re-clamp `left`/`top`; always refresh metrics when visible. |

#### Module-owned state (`debug.js`)

| Variable | Role |
|----------|------|
| `debugPanel` | Cached DOM node (`null` until first create) |
| `debugUpdateInterval` | Interval id while panel open; cleared on close |
| `isDraggingDebug` | Drag session flag |
| `debugDragOffsetX` / `debugDragOffsetY` | Pointer offset within panel at drag start |
| `keyboardFocusedIndex` | Shared card keyboard-nav index (**−1** = none); used app-wide, displayed live in panel |
| `listControlsStacked` | Shared flag for list-controls vertical stack layout (`app.js` font-scale responsive); **not** shown in the panel UI today |

#### Events & actions summary

| Event / action | Handler location | Effect |
|----------------|------------------|--------|
| Ctrl+Shift+D | `app.js` keydown | Toggle open/close |
| Click refresh | Inline `onclick` | Immediate `updateDebugInfo()` |
| Click close | Inline `onclick` | Toggle closed |
| mousedown (non-button) | Panel listener | Begin drag |
| mousemove (document) | Document listener | Live reposition |
| mouseup (document) | Document listener | End drag + clamp |
| resize (window) | Window listener | Refresh metrics + conditional clamp |
| Interval 3000 ms | `setInterval` while open | Live metric refresh |
| Open | `toggleDebugPanel` | Show + refresh + start interval |
| Close | `toggleDebugPanel` | Hide + stop interval |

#### Design notes

- **No app theme integration** — fixed developer value colors (`.debug-panel__val--size` / `--count` / `--index`) so the panel remains readable regardless of user color roles.
- **Lazy DOM** — zero cost until first open; safe on `file://` and static hosting.
- **Easy extension** — metrics are plain HTML rows inside `updateDebugInfo()`; add rows without HTML template changes.
- **Not a modal** — does not participate in Escape-to-close modal stack; only Ctrl+Shift+D / close button dismiss it.
- Coexists with keyboard card focus and layout flags it also hosts as globals for non-module classic-script sharing.

---

<!-- ===== PART III — CROSS-CUTTING ===== -->

## Part III — Cross-Cutting Concerns

Keyboard model, performance strategy, security, accessibility, boot sequence, and known gaps.

---

## 7. Keyboard Navigation & Shortcuts

Keyboard-first operation spans global chords, link-card roving focus from the link search field, and category sidebar listbox navigation. Primary implementation: `setupLinkKeyboardNavigation` + document `keydown` in `app.js`; category handlers in `initializeApp`; emoji Esc in `addeditlink.js` (§6.6).

> *Detail note:* P2 expansion — full navigation design beyond the shortcut table (focus model, step rules, modal gating, dual `/` residual).

### 7.1 Shortcut Reference Table

| Shortcut | Context | Action |
|----------|---------|--------|
| **`/`** | Not in INPUT/TEXTAREA (DOMContentLoaded listener); also from link-search when navigating cards | Open Google Search modal (§6.7) |
| **`/`** | `document.activeElement` is `BODY` (separate listener) | Residual: focuses **legacy** `#search-input` (hidden) |
| **`+`** | `BODY` focused; not when modal open | Open Add Link modal |
| **`+`** | Card keyboard-selected (link-search keydown) | Open Add Link modal |
| **`*`** | `BODY` focused | Clear card focus; focus + select `#link-search-input`; scroll into view |
| **`*`** | Card selected | Scroll top (clears card focus via `avt_ScrollToTop`) |
| **`-`** | Not (idle card focus **and** typing in link search) | Clear category + link filters; scroll top; focus link search |
| **`-`** | Card selected | Same clear path via link-search handler |
| **Esc** | Known modal open | Close first matching open modal in fixed id order |
| **Esc** | Card keyboard focus (link-search handler) | Clear `.keyboard-active` |
| **Esc** | Emoji popover open | Close popover only (capture phase) §6.6 |
| **↓ / →** | `#link-search-input` focused | Next card (column-aware step) |
| **↑ / ←** | `#link-search-input` focused | Previous card; past first → search field |
| **Enter** | Card keyboard-selected | Open link URL new tab; clear selection |
| **↑ / ↓ / Enter** | Focus on `.sidebar-category` | Navigate / activate category §6.4 |
| **↓** | `#category-search` focused | Focus first visible sidebar category |
| **Ctrl+Shift+D** | Global | Toggle debug panel §6.14 |

### 7.2 Purpose & Scope (Keyboard System)

| Item | Description |
|------|-------------|
| **Purpose** | Operate core workflows (search links, open destinations, add links, open Google, clear filters, close overlays) without a mouse. |
| **In scope** | Global shortcuts; link-card index focus; category keyboard; modal Esc stack; initial focus; interaction with `keyboardFocusedIndex`. |
| **Out of scope** | Full ARIA `application` mode; roving tabindex on every card; screen-reader live regions. |

### 7.3 Link-Card Keyboard Focus Model

**State:** `keyboardFocusedIndex` (`debug.js` global) indexes **currently rendered** `#links-grid .link-card` nodes (post-filter), not raw `links[]`.

| Value | Meaning |
|-------|---------|
| `-1` | No card selected (default) |
| `0 … n-1` | Highlighted card has `.keyboard-active` |

**API**

| Function | Behavior |
|----------|----------|
| `clearLinkCardKeyboardFocus()` | Remove `.keyboard-active` from all cards |
| `applyLinkCardKeyboardFocus()` | Clear all; clamp index; add class; `scrollIntoView({ block:'nearest', behavior:'smooth' })` |
| `getLinksGridColumns()` | Parse `getComputedStyle(grid).gridTemplateColumns`; `none` → **1** (full flex mode); else count tokens |
| `setupLinkKeyboardNavigation()` | Wire keydown + input reset on `#link-search-input` |

**Activation:** User focuses `#link-search-input` (boot ~150 ms, `*`, or click) then uses arrows.

**Step rules**

| Key | Step |
|-----|------|
| ArrowDown | `+ columns` |
| ArrowUp | `- columns` |
| ArrowRight | `+ 1` |
| ArrowLeft | `- 1` |

First ArrowDown/Right from `-1` sets index `0`. ArrowUp/Left past start returns focus to the search input and clears highlight.

**Enter:** Resolve `dataset.id` → `links.find` → `window.open(url, '_blank')` → clear focus.

**Input event:** Any typing in link search resets index to `-1` and clears highlight (except blocked paths when a card is selected — see below).

**When a card is selected (`index !== -1`):** intended to block ordinary character input in the search box and only allow nav keys and `/` `+` `-` `*`. Implementation note: the allow-list expression is written as `['/' + '+', '-', '*', …]` which concatenates to the single token `'/+'` — **Arrow keys are listed correctly**, but `/` and `+` as separate keys are **not** in that array as intended. Residual bug/tech debt: character keys may still fall through inconsistently; special-key branches for `/` `+` `-` `*` still run earlier/later in the same handler.

### 7.4 Global Document Keydown (Modals & Chords)

**Modal id order (Esc closes first open match):**  
`modal` → `settings-modal` → `color-theme-modal` → `attribution-modal` → `sync-modal` → `sync-instructions-modal` → `github-credentials-modal` → `gists-list-modal` → `search-modal`.

**Not in list:** Welcome modal (§6.12.12), emoji popover (own capture Esc), debug panel (Ctrl+Shift+D only).

If **any** listed modal is open (`!hidden`), handler returns after Esc handling — **suppresses** global `/` `+` `*` (and body-level chords) while modalOpen.

**`-` special case:** If focus is link search **and** no card selected, allow typing literal `-`. Otherwise preventDefault, scroll top, `clearCategoryFilter()`, clear card index, focus link search.

### 7.5 Category Sidebar Keyboard

See §6.4 for product behavior. Summary:

- Rows: `tabindex=0`
- ArrowDown/Up among **visible** `.sidebar-category`
- ArrowUp from first → `#category-search`
- ArrowDown from category search → first visible category
- Enter → `.click()` activate filter; re-focus active after re-render

### 7.6 Secondary Listeners

| Listener | Location | Role |
|----------|----------|------|
| DOMContentLoaded `/` + Esc for search modal | `app.js` | Open modal when not in input; Esc closes search modal |
| Emoji popover Esc capture | `addeditlink.js` | Nested dismiss |
| FAB top/bottom | `app.js` | Set index 0 / `links.length` then apply focus (may clamp) |

### 7.7 Initial Focus

After app init, a short delay (~**150** ms) focuses `#link-search-input` so arrow navigation is immediately available.

### 7.8 Requirements Traceability (Keyboard)

| Req ID | Requirement | Implementation |
|--------|-------------|----------------|
| **REQ-KB-001** | User shall open Google search via `/` when not typing in fields | DOMContentLoaded keydown |
| **REQ-KB-002** | User shall navigate filtered cards with arrows from link search | `setupLinkKeyboardNavigation` |
| **REQ-KB-003** | Enter shall open focused card URL | Enter branch |
| **REQ-KB-004** | Esc shall close topmost known modal | Modal stack loop |
| **REQ-KB-005** | Esc shall clear card keyboard selection when search handler runs | Escape branch |
| **REQ-KB-006** | `-` shall clear filters except when typing `-` in link search without card focus | Global `-` guard |
| **REQ-KB-007** | Modal open shall block global `+` / body chords | `modalOpen` early return |
| **REQ-KB-008** | Column-aware vertical steps in compact grid | `getLinksGridColumns` |
| **REQ-KB-009** | Category list shall be keyboard operable | Sidebar keydown |
| **REQ-KB-010** | Debug panel shall toggle with Ctrl+Shift+D | Global keydown |

### 7.9 Security, NFRs, Risks

| Topic | Notes |
|-------|-------|
| **Security** | Enter opens user-stored URLs; same trust model as click |
| **Performance** | Key handlers O(1) plus DOM query of visible cards |
| **A11y** | Visual `.keyboard-active`; not full ARIA listbox for cards |
| **Risks** | Dual `/` paths; allow-list bug for card-selected typing; FAB bottom sets index to `links.length` (clamped to last card) |

### 7.10 Diagrams

```
  [boot] focus link-search
       │
       ├─ type ── filter cards; index = -1
       ├─ ↓/→ ── index++, .keyboard-active
       ├─ ↑/← ── index-- or back to search
       ├─ Enter ── open URL
       ├─ / + - * ── global / card-context actions
       └─ Esc ── clear selection or close modal
```

---

## 8. Performance Architecture

### 8.1 CSS

| Technique | Detail |
|-----------|--------|
| Custom CSS | `css/styles.css` + critical inline CSS in `index.html` |
| Consolidated theme CSS | `styles.css` minified; duplicate rules merged |
| Critical CSS | Inline in `<head>`: vars, body, header colors, critical FA glyphs |
| Font preload | `fa-solid-900.woff2` + style preloads |
| Async icons | `fontawesome-subset.min.css` via preload + `onload` |
| FA subset | ~36 icons used by the app; full FA CSS removed from repo |
| Fonts on disk | Only solid + brands WOFF2 (OTF / unused WOFF2 removed) |

**Component inventory:** §8.5.

### 8.2 JavaScript

| Technique | Detail |
|-----------|--------|
| `defer` on all modules | Non-blocking parse; ordered execute |
| Idle prefetch | Brands font after `requestIdleCallback` (`script.js`, timeout 2000) |
| Quotes race-safe | `initQuotes()` at end of `quotes.js` before/with app boot |

### 8.3 Offline CSS Tooling (`tools/optimize_css.py`)

**Command**

```text
python tools/optimize_css.py
```

**Purpose:** Offline build helper for CSS size — not required at runtime. Idempotent-ish overwrites of `css/styles.css` and optionally `css/fontawesome-subset.min.css`.

> *Detail note:* P2 expansion — USED_ICONS allowlist, FA rebuild gate, minify/consolidate rules.

#### 8.3.1 Inputs / outputs

| Path | Role |
|------|------|
| `css/styles.css` | Read → consolidate + minify → write same path |
| `css/fontawesome/css/all.min.css` | **Optional input** — if missing, FA subset rebuild is **skipped** (stderr message) |
| `css/fontawesome-subset.min.css` | FA7 subset output when full FA present |
| Webfonts | Referenced as `fontawesome/webfonts/fa-solid-900.woff2`, `fa-brands-400.woff2` |

#### 8.3.2 Font Awesome subset (`USED_ICONS`)

Allowlist (~36 names) drives generated `.fa-{name}{--fa:"\…"}` rules:

`arrow-down`, `arrow-down-to-bracket`, `arrow-up`, `bug`, `check`, `chevron-down`, `clock`, `cog`, `copy`, `download`, `edit`, `eye`, `eye-slash`, `face-smile`, `font-awesome`, `gear`, `github`, `grip-lines`, `heart`, `info-circle`, `key`, `list`, `palette`, `plus`, `question-circle`, `robot`, `rocket`, `search`, `spinner`, `sync-alt`, `tag`, `times`, `trash`, `undo`, `upload`, `user`.

| Detail | Behavior |
|--------|----------|
| Code extraction | Scan full FA CSS for `fa-{name}` rule; read `--fa` or `content` unicode |
| Manual map | `arrow-down-to-bracket` → `\f56d` if not found |
| Missing icons | Printed as WARNING; omitted from subset |
| Spinner | Adds `@keyframes fa-spin` + `.fa-spin` if spinner in list |
| Base machinery | `:root` FA family vars; `@font-face` solid+brands; `.fa-solid`/`.fa-brands` before content helpers |

**Process note:** Full `all.min.css` was removed from the repo to save space; restore temporarily to regenerate the subset after adding icons to the app.

#### 8.3.3 `styles.css` consolidation

| Step | Behavior |
|------|----------|
| Parse | Flat rules + top-level `@` blocks (simple brace matcher) |
| Empty rules | Skipped |
| Duplicate selectors | Declarations merged; **last occurrence wins** placement in stream (cascade-safe vs earlier duplicates) |
| Adjacent identical decl blocks | Selectors combined with `,` |
| Minify | Strip comments; collapse whitespace; trim around `{}:;,>~+` |

Stats logged: `dup_selector_hits`, `combined_groups`, `empty_skipped`, `final_rules`, `unique_selectors`.

#### 8.3.4 Requirements / constraints

| Req | Rule |
|-----|------|
| **REQ-CSS-TOOL-001** | Runtime app must not depend on Python |
| **REQ-CSS-TOOL-002** | Adding a new FA icon class in HTML/JS requires adding the name to `USED_ICONS` and regenerating subset when full FA is available |
| **REQ-CSS-TOOL-003** | Critical CSS in `index.html` may still hardcode a few FA glyphs for first paint |

### 8.4 PWA

- `manifest.json` for installable / standalone metadata (`name`, `short_name`, `theme_color` `#aa0000`, `background_color` `#18181b`, icons 192/512)
- **No service worker** in repo — offline after first load relies on browser cache + localStorage, not SW caching
- Icon files may be missing from tree (§13)

### 8.5 CSS Component Inventory (`styles.css`)

Theme and interaction styles live in `styles.css`. File is **minified**; this inventory is the design map. Hover/focus heavily uses `color-mix(in srgb, …)` with CSS variables from §5.

> *Detail note:* P2 addition — component class catalog for theming and review.

#### 8.5.1 Global / tokens

| Selector / token | Role |
|------------------|------|
| `:root` | Font stacks (`--app-font-*`); elevations (`--app-elevation-*`); ease (`--app-ease`); color roles (`--card-bg`, `--active-cat-*`, `--text-color`, `--hover-blend`, `--caution-color`, `--success-color`, `--background-color`, `--color-surface-*`, `--color-border*`, `--color-muted*`, `--color-save`, `--color-hairline`, …) |
| `body` | Base font (`--app-font-body`); color transitions |
| `#page-title, #greeting, #date, #clock` | Display weight family (`--app-font-display`) |

Runtime `applyColors` overwrites many vars (§5.2).

#### 8.5.2 Link cards

| Selector | Role |
|----------|------|
| `.link-card` | Card surface (`--card-bg`); border; transition; `user-select: none` |
| `.link-card.dragging` | Opacity ~0.6; slight scale; elevated z |
| `.link-card.keyboard-active` | Accent/active border + shadow + lift (keyboard nav §7) |
| `.link-card[data-accent]:hover` | Accent border; emoji tile mix; title → active text |
| `.link-card:hover .link-card__name` | Active text color on hover |
| `.quick-link-icon` | Emoji tile sizing/border (hover scale/mix) |
| `.drag-handle` | Grip affordance |
| `.drag-over` / `.drop-indicator` | Drop target chrome during DnD |
| `.link-card-tooltip` | Compact description floating tip (§6.2) |
| `.link-card.compact` | Density modifier class |

#### 8.5.3 Categories & pills

| Selector | Role |
|----------|------|
| `.sidebar-category` | Sidebar row; hover/active use active-cat colors |
| `.sidebar-category.active` | Selected filter state |
| `.category-action` | Rename/delete button cluster |
| `.category-pill` | Tags on cards and modal chips (`--category-bg`) |

#### 8.5.4 Search & inputs

| Selector | Role |
|----------|------|
| `.search-input`, `#category-search`, `#link-search-input` | Textbox background (`--textbox-bg` / `--search-bg`) |
| `:focus` variants | Border active-cat; ring via color-mix; icon recolor |
| Clear buttons (`clearCategorySearch` / `clearLinkSearch`) | Muted icon color |
| Legacy `#search-form` focus-within icon rules | Hidden legacy field still styled |

#### 8.5.5 Chrome & layout helpers

| Selector | Role |
|----------|------|
| `.section-header` | “CATEGORIES” / “QUICK ACCESS” labels |
| `.menu-text-label` | Header action text; collapse driven by JS §6.9 |
| `.date-warning` | Caution-colored sort/reorder messaging |
| `.key-hint` | Keyboard shortcut chips (settings) |
| `.custom-scroll` | Themed scrollbar for sidebar / emoji grid |
| `#floating-actions` / FAB buttons | Fixed stack; theme button backgrounds |
| `.modal` | Shared modal panel surface |
| `.accent-none-btn` | Theme editor / accent “None” control |
| `#privacy-note` | Footer note under grid |

#### 8.5.6 Theming contract

| Concern | Rule |
|---------|------|
| Prefer CSS variables | Components should use `var(--*)` so Settings theme applies |
| Header fixed colors | Forced `#e4e4e7` in critical CSS for quote/title/clock (§5.4) |
| Layout vs theme | Layout and theme chrome both live in `styles.css` (plus critical inline CSS) |

#### 8.5.7 Maintenance

| When changing… | Also update… |
|----------------|--------------|
| New interactive surface colors | Role in §5 + `applyColors` + Theme Editor fields |
| New FA icon in markup | `USED_ICONS` + regenerate subset §8.3 |
| New component class | This inventory + keep selectors theme-aware |

---

## 9. Rendering & Algorithms (Reference)

| Algorithm | Location | Summary |
|-----------|----------|---------|
| Link fuzzy search | `render.js` | AND tokens; short exact; long prefix Levenshtein ≤ 3 |
| Menu label collapse | `app.js` | `1235 / (1 - p)` font-aware width |
| List controls stack | `app.js` | `580 / scale` |
| Favorites sort | `render.js` | Favorites before others; stable among peers |
| Date sort | `render.js` | `id` descending |
| Drag reorder | `app.js` | Splice to target index; disabled in date mode |
| Clear-filter visibility | `render.js` | IO on first sidebar item when scrollable |
| FAB visibility | `app.js` | IO on Add Link button + scroll bottom heuristic |
| Card keyboard step | `app.js` | Columns from computed grid |
| Daily quote | `quotes.js` | `(dayOfYear - 1) % size` |
| Gist update | `github.js` | PATCH then create-on-401/404 |
| URL preview | `render.js` | Strip scheme/www; truncate |
| Debug panel drag/clamp | `debug.js` | Free move while dragging; 12px viewport clamp on release/resize |

---

## 10. Security & Privacy Notes

1. All user data defaults to **browser localStorage** (device-local).
2. GitHub token is stored **unencrypted** in localStorage when sync is configured.
3. JSON export masks the token with a reversible interleave scheme — treat backups as sensitive.
4. Gists created by the app are **private** by default; access still requires token + gist id.
5. No analytics or third-party trackers in app code.
6. Privacy note under the links grid documents local-only storage for users.

---

## 11. Accessibility & UX Conventions

- Sticky header remains available while scrolling
- Sidebar categories are `tabindex=0` listbox-like with keyboard activation (**§6.4**, **§7.5**)
- Link cards: keyboard roving highlight via link search + arrows (**§7.3**); visual `.keyboard-active`
- Modals: Escape to close known stack (**§7.4**); many use semi-transparent blur backdrop
- Search/modal focus management on open
- Compact tooltips clamp to viewport; hover-only (**§6.2**) — Full mode or Edit for keyboard-visible descriptions
- Font scale range supports readability (70–150%)
- Color system separates Active Text from body Text for contrast on accents
- Known gaps: no full ARIA dialog/listbox for cards; welcome modal outside Esc stack; Backup menu is hover-oriented

---

## 12. Initialization Sequence

1. HTML parse; critical CSS paints dark shell + header icons  
2. Deferred scripts download in parallel, run in order  
3. `quotes.js` populates `window.dailyQuotes`  
4. `app.js` `initializeApp()` (or on DOM ready):
   - Restore `viewMode`
   - `loadLinks()` (localStorage or `default.json`)
   - `loadColorSettings()`, `loadFontScale()`
   - Menu labels + list controls layout
   - Keyboard navigation, emoji picker, category autocomplete
   - `loadGitHubCredentials()`, `displayDailyQuote()`
   - Wire name, clock/greeting timers, floating observers, etc.
5. `script.js`: idempotent `initQuotes()` + idle brands font prefetch  
6. Optional: focus link search after short delay  

---

## 13. Known Limitations & Future Work

### Limitations

- **README lag** — root `README.md` still describes an older 5-file `js/` layout and “~40 emojis”; **prefer this SDD** (policy §15.2)
- Dual `/` behaviors include a legacy path toward hidden `#search-input` (**§7**)
- Token security is convenience-grade only
- PWA icons may be missing unless `icons/` assets are added (`manifest.json` references them)
- `file://` cannot auto-fetch `default.json` (browser fetch rules) — welcome path **§6.12.12**
- No automated test suite in-repo; verification is manual (**§16**)
- File import does not restore `userName` (Gist import does) — **§6.12**

### Future / open items

- Align `README.md` with §2.2 tree and current feature set (tracked under §15.2)
- Migrate to ES modules + optional bundler if desired
- Service worker for true offline install
- When clearing filters, optional UX polish for keyboard/card selection state
- Further lazy-load of rarely used modules (e.g. debug, github) if needed
- Fix card-selected key allow-list (`'/+'` concatenation) in link-search handler (**§7.3**)
- Add Search color control to Theme Editor if role remains first-class (**§6.8**)

---

<!-- ===== PART IV — OPERATIONS ===== -->

## Part IV — Operations

Repo utilities, documentation policy, manual verification, and document history.

---

## 14. Repository Utilities & Documentation Policy

> *Detail note:* P3 — local utilities, README authority rules, related root artifacts.

### 14.1 Purpose

Document non-runtime repo artifacts that support development or packaging but are not part of the deferred JS app graph.

### 14.2 `Clear_bak.bat`

| Field | Value |
|-------|--------|
| **Path** | Repo root `Clear_bak.bat` |
| **Platform** | Windows (`cmd`) |
| **Contents** | `@echo off` then `del *.bak /s` |
| **Effect** | Recursively deletes `*.bak` files under the current directory tree |
| **Runtime dependency** | **None** — not referenced by `index.html` or app JS |
| **Intended use** | Local cleanup of editor/backup files before zip or commit |
| **Risk** | Destructive to any `*.bak` in the tree; run only from intended root; no recycle bin |

**Not** a product feature; safe to omit from end-user distribution.

### 14.3 `README.md` sync policy

| Rule | Detail |
|------|--------|
| **Authority** | **`docs/SDD.md` is authoritative** for architecture, module list, storage keys, and feature behavior |
| **README role** | End-user quick start, high-level description, “open `index.html`” instructions |
| **Known drift (current README)** | Lists only 5 JS files (missing `addeditlink`, `settingsmodal`, `gsmodal`, `debug`, `github`, `quotes`, `script`); emoji count “40”; tree name `startpage/` vs `startpage_NE` |
| **When to update README** | User-visible workflow changes; new major capability (e.g. sync); install steps; when releasing a cut for non-developers |
| **When SDD-only is enough** | Internal design, API tables, req IDs, algorithm details, CSS tooling |

**Recommended README refresh checklist**

1. Match §2.2 repository structure and script load order.  
2. Point emoji catalog to “hundreds / config-driven” (not “40”).  
3. List Backup **and** GitHub Sync distinctly.  
4. Link or cite `docs/SDD.md` for full design.  
5. Note optional `python tools/optimize_css.py` for maintainers.

### 14.4 Other root / packaging artifacts

| Artifact | Role | SDD cross-ref |
|----------|------|----------------|
| `manifest.json` | PWA metadata; theme `#aa0000`; icons paths | §8.4 |
| `icons/icon-192.png`, `icon-512.png` | Referenced by manifest; may be absent | §13 |
| `default.json` | Seed links only | §4.4 |
| `tools/optimize_css.py` | Offline CSS/FA pipeline | §8.3 |
| `tools/__pycache__/` | Python bytecode cache | Do not ship; gitignore recommended |

### 14.5 Distribution guidance

| Audience | Include |
|----------|---------|
| End user (static host / zip) | `index.html`, `css/**`, `js/**`, `default.json`, `manifest.json`, icons if available |
| Optional | `docs/SDD.md`, `README.md` |
| Dev-only | `tools/`, `Clear_bak.bat`, full FA source if regenerating subset |

---

## 15. Verification & Manual Test Plan

No automated unit/e2e suite ships in-repo. This section is the **manual regression checklist** for releases and SDD-aligned verification. Prefer a clean browser profile or cleared `localStorage` for first-run cases.

> *Detail note:* P3 — formal manual test plan.

### 15.1 Environment matrix

| ID | Setup |
|----|--------|
| E1 | Chrome/Edge, serve over `http://localhost` (or any static server) |
| E2 | Same browser, open `index.html` via **`file://`** |
| E3 | Narrow viewport (&lt; `lg`) and wide desktop |
| E4 | Optional: second profile for Gist import (non-production PAT only) |

### 15.2 First-run & persistence

| ID | Steps | Expected |
|----|--------|----------|
| T-FR-01 | E1, clear site data, load app | Seeds from `default.json` (~21 links); sidebar categories appear |
| T-FR-02 | E2, clear data, load app | Welcome modal; empty grid until Import |
| T-FR-03 | From T-FR-02 Import `default.json` | Confirm dialog; links load |
| T-FR-04 | Reload after T-FR-01 | Links persist from localStorage (no re-seed) |
| T-FR-05 | Export JSON; clear storage; Import file | Links (+ colors/font/github if present) restore; note userName may not restore on file import |

### 15.3 Landing & chrome

| ID | Steps | Expected |
|----|--------|----------|
| T-LS-01 | Observe header | Quote, title, greeting/date/clock (md+), actions |
| T-LS-02 | Resize narrow / raise font scale | Menu labels collapse; list controls may stack |
| T-LS-03 | Scroll past Add Link | Quick Add + Go Top FABs; Bottom near end of page |
| T-LS-04 | Privacy note | Visible under links column |

### 15.4 Links, cards, view, sort

| ID | Steps | Expected |
|----|--------|----------|
| T-LC-01 | Click card body | URL opens new tab |
| T-LC-02 | Edit / Save | Persists; card updates |
| T-LC-03 | Delete with confirm | Removed; focus behavior ok |
| T-LC-04 | Default sort: drag reorder | Order persists after reload |
| T-LC-05 | Date Added sort | Newest first; drag disabled / warning |
| T-LC-06 | Compact view | Multi-column; tooltip after ~1s on desc |
| T-LC-07 | Favorite in edit | Sorts to top in Default |

### 15.5 Categories & search

| ID | Steps | Expected |
|----|--------|----------|
| T-CS-01 | Click category | Grid filters; `• Cat` indicator |
| T-CS-02 | Rename category | All links updated; filter follows |
| T-CS-03 | Delete category | Tags removed; links remain |
| T-CS-04 | Category search + keyboard | ↓ from search; Enter activates |
| T-LSR-01 | Link fuzzy search | AND tokens; short exact; long fuzzy |
| T-LSR-02 | `-` shortcut | Clears filters; allows typing `-` in search when no card selected |

### 15.6 Modals & shortcuts

| ID | Steps | Expected |
|----|--------|----------|
| T-MD-01 | `/` outside inputs | Google Search modal; Enter → Google tab |
| T-MD-02 | `+` | Add Link modal |
| T-MD-03 | Esc | Closes top known modal; emoji Esc keeps parent |
| T-MD-04 | Settings name + font | Title + scale persist |
| T-MD-05 | Theme Save / Light / Dark | Colors apply; reload retains |
| T-MD-06 | Emoji Quick Pick | Search AND; pick sets field; hover name-only; middle-click full descriptor |
| T-MD-07 | Ctrl+Shift+D | Debug panel metrics + drag clamp |

### 15.7 GitHub sync (optional, non-prod)

| ID | Steps | Expected |
|----|--------|----------|
| T-GH-01 | Save username + gist-scoped PAT | Connected status |
| T-GH-02 | Export | Private gist / update; Gist ID stored |
| T-GH-03 | Import on other profile | Confirm replace; data restored |
| T-GH-04 | Clear credentials | Disconnect |

### 15.8 Tooling (maintainers)

| ID | Steps | Expected |
|----|--------|----------|
| T-TOOL-01 | `python tools/optimize_css.py` without full FA | Styles minify; FA skip message |
| T-TOOL-02 | With `all.min.css` present | Subset regenerates; icons still render |

### 15.9 Exit criteria (release smoke)

Minimum before tagging a release:

1. T-FR-01 or T-FR-03 pass  
2. T-LC-01, T-LC-04, T-LSR-01 pass  
3. T-MD-01, T-MD-03, T-MD-04 pass  
4. No console errors on cold load (E1)  
5. SDD version/history updated if behavior changed  

---

## 16. Document History

| Version | Date | Notes |
|---------|------|--------|
| 1.0 | June 12, 2026 | Initial SDD: emoji system, search, keyboard nav, debug panel |
| 2.0 | July 21, 2026 | Full rewrite: architecture, storage keys, theme roles, Gist, performance pass, complete UI/API map |
| 2.1 | July 21, 2026 | Expanded §6.14 Debug Panel: looks/visuals, live metrics, drag/clamp, events, lifecycle, module state |
| 2.2 | July 21, 2026 | Add/Edit Link Modal component design (§6.1.1): purpose, traceability, architecture, decisions, schema, APIs, security, NFRs, risks; §3.3 summary + title-case accuracy fix |
| 2.3 | July 21, 2026 | Emoji Quick Pick component design (§6.6): purpose, traceability, architecture, decisions, catalog schema, APIs, security, NFRs, risks, diagrams; catalog counts ~25 / ~490 |
| 2.4 | July 21, 2026 | Settings hub + Color Theme + Attribution component design (§6.8): purpose, traceability, architecture, decisions, schema, APIs, security, NFRs, risks; search-color UI gap noted |
| 2.5 | July 21, 2026 | GitHub Gist Sync hub + credentials/gists/instructions component design (§6.11): purpose, traceability, architecture, decisions, schema, APIs, security, NFRs, risks |
| 2.6 | July 21, 2026 | Google Search Modal component design (§6.7): purpose, traceability, architecture, drag/clamp, dual `/` paths, submit URL, security, NFRs |
| 2.7 | July 21, 2026 | Landing Screen / main shell component design (§6.0): purpose, traceability, architecture, decisions, shell APIs, security, NFRs; §3.1 summary table |
| 2.8 | July 21, 2026 | P0 expansions: §6.1.2 Link cards/DnD/delete; §6.4 Category Sidebar (rename/delete/filter); §6.12 File import/export + welcome modal + load bootstrap |
| 2.9 | July 21, 2026 | P1 expansions: §6.2 View modes + compact tooltips; §6.10 Daily Quote LinkedList; §6.12.12 first-run/welcome detail |
| 2.10 | July 21, 2026 | P2 expansions: §7 keyboard navigation design; §8.3 optimize_css/USED_ICONS pipeline; §8.5 CSS component inventory |
| 2.11 | July 21, 2026 | P3 expansions: §4.4 seed catalog; §14 repo utilities/README policy; §15 manual verification test plan |
| 3.0 | July 21, 2026 | Readability reorganization: How to Read, TOC, Parts I–IV, Feature Index, glossary, REQ index; greeting bands corrected to match `updateGreeting` |
| 3.1 | September 23, 2026 | Quick Pick middle-click shows full `EMOJI_NAMES` descriptor (REQ-EMO-016); hover remains name-only |

---


## Appendix A — Glossary

| Term | Meaning |
|------|---------|
| **Link** | User-saved start-page entry (`name`, `url`, categories, emoji, …) stored in `links[]` / `startpage_links` |
| **Landing Screen** | Default shell after load: header, sidebar, Quick Access, FABs |
| **viewMode** | `full` or `compact` card density; persisted |
| **sortMode** | `default` or `date`; session-only (not persisted) |
| **PAT** | GitHub Personal Access Token (classic, `gist` scope) |
| **Gist** | Private GitHub Gist used as optional cloud backup |
| **Quick Pick** | Nested emoji picker inside Add/Edit modal |
| **keyboardFocusedIndex** | Index of keyboard-highlighted card in the *filtered* grid (−1 = none) |
| **Seed / default.json** | First-run starter links file |
| **Masking** | Reversible token obfuscation in JSON exports — **not** encryption |
| **Classic scripts** | Multi-file `<script defer>` globals (no ES modules) |

## Appendix B — Requirements ID Index

Internal IDs used in feature specs. External BRD/FRS/Jira columns remain *TBD* / N/A for this personal project unless mapped later.

### B.1 Prefix → section map

| Prefix | Topic | Section |
|--------|--------|---------|
| `REQ-LS-*` | Landing shell | §6.0 |
| `REQ-AEL-*` | Add/Edit link modal | §6.1.1 |
| `REQ-LC-*` | Link cards / DnD / delete | §6.1.2 |
| `REQ-VM-*` | View modes / tooltips | §6.2 |
| `REQ-CS-*` | Category sidebar | §6.4 |
| `REQ-EMO-*` | Emoji Quick Pick | §6.6 |
| `REQ-GSM-*` | Google Search modal | §6.7 |
| `REQ-SET-*` | Settings / theme | §6.8 |
| `REQ-DQ-*` | Daily quote | §6.10 |
| `REQ-GHS-*` | GitHub Gist sync | §6.11 |
| `REQ-FIO-*` | File import/export | §6.12 |
| `REQ-KB-*` | Keyboard | §7 |
| `REQ-CSS-TOOL-*` | CSS tooling | §8.3 |

### B.2 Full ID list

Search the document for an ID (e.g. REQ-GHS-001) to open its requirement row.

| ID | Section |
|----|---------|
| REQ-AEL-001 | §6.1.1 |
| REQ-AEL-002 | §6.1.1 |
| REQ-AEL-003 | §6.1.1 |
| REQ-AEL-004 | §6.1.1 |
| REQ-AEL-005 | §6.1.1 |
| REQ-AEL-006 | §6.1.1 |
| REQ-AEL-007 | §6.1.1 |
| REQ-AEL-008 | §6.1.1 |
| REQ-AEL-009 | §6.1.1 |
| REQ-AEL-010 | §6.1.1 |
| REQ-AEL-011 | §6.1.1 |
| REQ-AEL-012 | §6.1.1 |
| REQ-AEL-013 | §6.1.1 |
| REQ-AEL-014 | §6.1.1 |
| REQ-AEL-015 | §6.1.1 |
| REQ-AEL-016 | §6.1.1 |
| REQ-AEL-017 | §6.1.1 |
| REQ-CS-001 | §6.4 |
| REQ-CS-002 | §6.4 |
| REQ-CS-003 | §6.4 |
| REQ-CS-004 | §6.4 |
| REQ-CS-005 | §6.4 |
| REQ-CS-006 | §6.4 |
| REQ-CS-007 | §6.4 |
| REQ-CS-008 | §6.4 |
| REQ-CS-009 | §6.4 |
| REQ-CS-010 | §6.4 |
| REQ-CS-011 | §6.4 |
| REQ-CS-012 | §6.4 |
| REQ-CS-013 | §6.4 |
| REQ-CS-014 | §6.4 |
| REQ-DQ-001 | §6.10 |
| REQ-DQ-002 | §6.10 |
| REQ-DQ-003 | §6.10 |
| REQ-DQ-004 | §6.10 |
| REQ-DQ-005 | §6.10 |
| REQ-DQ-006 | §6.10 |
| REQ-DQ-007 | §6.10 |
| REQ-DQ-008 | §6.10 |
| REQ-EMO-001 | §6.6 |
| REQ-EMO-002 | §6.6 |
| REQ-EMO-003 | §6.6 |
| REQ-EMO-004 | §6.6 |
| REQ-EMO-005 | §6.6 |
| REQ-EMO-006 | §6.6 |
| REQ-EMO-007 | §6.6 |
| REQ-EMO-008 | §6.6 |
| REQ-EMO-009 | §6.6 |
| REQ-EMO-010 | §6.6 |
| REQ-EMO-011 | §6.6 |
| REQ-EMO-012 | §6.6 |
| REQ-EMO-013 | §6.6 |
| REQ-EMO-014 | §6.6 |
| REQ-EMO-015 | §6.6 |
| REQ-EMO-016 | §6.6 |
| REQ-FIO-001 | §6.12 |
| REQ-FIO-002 | §6.12 |
| REQ-FIO-003 | §6.12 |
| REQ-FIO-004 | §6.12 |
| REQ-FIO-005 | §6.12 |
| REQ-FIO-006 | §6.12 |
| REQ-FIO-007 | §6.12 |
| REQ-FIO-008 | §6.12 |
| REQ-FIO-009 | §6.12 |
| REQ-FIO-010 | §6.12 |
| REQ-FIO-011 | §6.12 |
| REQ-FIO-012 | §6.12 |
| REQ-FIO-013 | §6.12 |
| REQ-FIO-014 | §6.12 |
| REQ-FIO-015 | §6.12 |
| REQ-GHS-001 | §6.11 |
| REQ-GHS-002 | §6.11 |
| REQ-GHS-003 | §6.11 |
| REQ-GHS-004 | §6.11 |
| REQ-GHS-005 | §6.11 |
| REQ-GHS-006 | §6.11 |
| REQ-GHS-007 | §6.11 |
| REQ-GHS-008 | §6.11 |
| REQ-GHS-009 | §6.11 |
| REQ-GHS-010 | §6.11 |
| REQ-GHS-011 | §6.11 |
| REQ-GHS-012 | §6.11 |
| REQ-GHS-013 | §6.11 |
| REQ-GHS-014 | §6.11 |
| REQ-GHS-015 | §6.11 |
| REQ-GHS-016 | §6.11 |
| REQ-GHS-017 | §6.11 |
| REQ-GHS-018 | §6.11 |
| REQ-GHS-019 | §6.11 |
| REQ-GHS-020 | §6.11 |
| REQ-GHS-021 | §6.11 |
| REQ-GHS-022 | §6.11 |
| REQ-GHS-023 | §6.11 |
| REQ-GSM-001 | §6.7 |
| REQ-GSM-002 | §6.7 |
| REQ-GSM-003 | §6.7 |
| REQ-GSM-004 | §6.7 |
| REQ-GSM-005 | §6.7 |
| REQ-GSM-006 | §6.7 |
| REQ-GSM-007 | §6.7 |
| REQ-GSM-008 | §6.7 |
| REQ-GSM-009 | §6.7 |
| REQ-GSM-010 | §6.7 |
| REQ-GSM-011 | §6.7 |
| REQ-GSM-012 | §6.7 |
| REQ-GSM-013 | §6.7 |
| REQ-GSM-014 | §6.7 |
| REQ-GSM-015 | §6.7 |
| REQ-KB-001 | §7 |
| REQ-KB-002 | §7 |
| REQ-KB-003 | §7 |
| REQ-KB-004 | §7 |
| REQ-KB-005 | §7 |
| REQ-KB-006 | §7 |
| REQ-KB-007 | §7 |
| REQ-KB-008 | §7 |
| REQ-KB-009 | §7 |
| REQ-KB-010 | §7 |
| REQ-LC-001 | §6.1.2 |
| REQ-LC-002 | §6.1.2 |
| REQ-LC-003 | §6.1.2 |
| REQ-LC-004 | §6.1.2 |
| REQ-LC-005 | §6.1.2 |
| REQ-LC-006 | §6.1.2 |
| REQ-LC-007 | §6.1.2 |
| REQ-LC-008 | §6.1.2 |
| REQ-LC-009 | §6.1.2 |
| REQ-LC-010 | §6.1.2 |
| REQ-LC-011 | §6.1.2 |
| REQ-LC-012 | §6.1.2 |
| REQ-LC-013 | §6.1.2 |
| REQ-LC-014 | §6.1.2 |
| REQ-LC-015 | §6.1.2 |
| REQ-LC-016 | §6.1.2 |
| REQ-LS-001 | §6.0 |
| REQ-LS-002 | §6.0 |
| REQ-LS-003 | §6.0 |
| REQ-LS-004 | §6.0 |
| REQ-LS-005 | §6.0 |
| REQ-LS-006 | §6.0 |
| REQ-LS-007 | §6.0 |
| REQ-LS-008 | §6.0 |
| REQ-LS-009 | §6.0 |
| REQ-LS-010 | §6.0 |
| REQ-LS-011 | §6.0 |
| REQ-LS-012 | §6.0 |
| REQ-LS-013 | §6.0 |
| REQ-LS-014 | §6.0 |
| REQ-LS-015 | §6.0 |
| REQ-LS-016 | §6.0 |
| REQ-LS-017 | §6.0 |
| REQ-LS-018 | §6.0 |
| REQ-LS-019 | §6.0 |
| REQ-LS-020 | §6.0 |
| REQ-SET-001 | §6.8 |
| REQ-SET-002 | §6.8 |
| REQ-SET-003 | §6.8 |
| REQ-SET-004 | §6.8 |
| REQ-SET-005 | §6.8 |
| REQ-SET-006 | §6.8 |
| REQ-SET-007 | §6.8 |
| REQ-SET-008 | §6.8 |
| REQ-SET-009 | §6.8 |
| REQ-SET-010 | §6.8 |
| REQ-SET-011 | §6.8 |
| REQ-SET-012 | §6.8 |
| REQ-SET-013 | §6.8 |
| REQ-SET-014 | §6.8 |
| REQ-SET-015 | §6.8 |
| REQ-SET-016 | §6.8 |
| REQ-SET-017 | §6.8 |
| REQ-SET-018 | §6.8 |
| REQ-SET-019 | §6.8 |
| REQ-SET-020 | §6.8 |
| REQ-VM-001 | §6.2 |
| REQ-VM-002 | §6.2 |
| REQ-VM-003 | §6.2 |
| REQ-VM-004 | §6.2 |
| REQ-VM-005 | §6.2 |
| REQ-VM-006 | §6.2 |
| REQ-VM-007 | §6.2 |
| REQ-VM-008 | §6.2 |
| REQ-VM-009 | §6.2 |
| REQ-VM-010 | §6.2 |
| REQ-VM-011 | §6.2 |
| REQ-VM-012 | §6.2 |


*Tip: search the document for the ID string (e.g. `REQ-GHS-001`) to jump to the full requirement row.*


---

*This document reflects the codebase as of the version date. Update it when features, storage keys, load order, or performance strategy change.*
