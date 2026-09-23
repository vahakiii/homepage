# Start Page - Split Version

A beautiful, customizable browser start page / new tab replacement with quick links, categories, drag-and-drop reordering, accent colors, dark theme editor, and persistent localStorage storage.

Originally a single self-contained HTML file. Strategically split for better maintainability while keeping it zero-dependency and easy to run locally.

## File Structure

```
startpage/
├── index.html          # Main HTML structure (skeleton, modals, layout)
├── css/
│   └── styles.css      # Theme tokens, cards, modals, animations, scrollbars, etc.
├── js/
│   ├── config.js       # Constants (accent color palette)
│   ├── state.js        # Shared application state (links, filters, modal state, etc.)
│   ├── storage.js      # Data persistence (localStorage load/save + JSON import/export)
│   ├── render.js       # All UI rendering (categories sidebar, links grid, modal content)
│   └── app.js          # Actions, theming, font scaling, clock, initialization & event wiring (main entry)
└── README.md
```

## How to Use

1. Open `index.html` directly in any modern browser (Chrome, Firefox, Edge, etc.).
   - Works fully offline after first load (uses `localStorage` for your links & preferences).
2. All data stays in your browser — nothing is sent to any server.
3. Drag links to reorder (when not sorted by Date Added).
4. When **adding or editing a link**, click the big emoji button for a quick visual picker (40 useful emojis) or type any emoji manually in the input.
5. Use Settings (gear icon) → "Edit Colors" for full visual customization. Show by, View, Hide Categories, and Show Debug live under "Other Options".
6. Export/Import your links + theme as JSON backup.
7. **New:** Sync with GitHub Gist — Click "Sync with GitHub" (next to Import) to backup/restore your entire setup (links + colors + name) across devices using a private GitHub Gist. Requires a free GitHub account and a Personal Access Token with `gist` scope.

## Why Split This Way?

**Phase 1 (previous):** Split the original monolithic `.html` into 3 files (HTML + CSS + JS) for basic separation of concerns.

**Phase 2 (current):** Further split the JavaScript into **5 focused modules** while keeping classic `<script>` loading (no ES modules yet). This gives:

- Clear separation of responsibilities:
  - `config.js` — pure constants
  - `state.js` — shared mutable state (loaded first)
  - `storage.js` — data layer (persistence + backup)
  - `render.js` — view / DOM rendering layer
  - `app.js` — controller layer (business actions, theming, initialization, event wiring)
- Much easier to navigate, debug, and extend specific parts (e.g. change how links render without touching storage logic).
- All inline `onclick` handlers continue to work.
- Still zero build tools or dependencies — just open `index.html`.
- Total project is now well-organized for long-term maintenance.

No breaking changes — functionality is identical to the original single file.

## Future Improvements (optional)

- Migrate to ES modules (`type="module"`) + `import`/`export` for even cleaner dependency management.
- Add a lightweight bundler (esbuild / Vite) for minification + tree-shaking if desired.
- Progressive Web App (PWA) manifest + offline caching.

Created for Alan V. Terezian, 2026 — enjoy your clean start page!

