# Scriptorium

Desktop idle/clicker game. The player types on the keyboard to write letters into a medieval codex. Target platform: Electron.

---

## Game loop

```
Keystroke (a–z)  →  letters written on current page
Page complete    →  earns Denarii (resets each codex)
Codex complete   →  earns Salt (permanent)
```

- 1 page = N letters (measured at runtime from font + layout — no hardcoded value)
- 1 codex = 300 pages
- **Denarii (Đ)** — main currency, resets on codex bind
- **Salt (⬡)** — prestige currency, never resets. Displayed as g / kg / t

---

## File structure

```
src/
  shared/
    channels.ts       — IPC channel names (imported by main + preload)
  main/
    index.ts          — Electron main process, BrowserWindow, app name/userData
    persistence/
      persistence.ts  — atomic save file I/O, IPC handlers, quit flush
  preload/
    index.ts          — contextBridge, exposes saveAPI to renderer
  renderer/
    index.html
    style.css
    env.d.ts          — Window.saveAPI and Window.__debug type declarations
    js/
      config/
        constants.ts        — PAGES_PER_CODEX, AUTO_TICK_MS, SCRIBE_TITLES, LOREM
        layouts.ts          — makeLayout, FOLIO_LAYOUTS, FOLIO
        layouts.types.ts    — ColDef, LayoutOpts
        index.ts            — re-exports all config as frozen default export
        upgrades/
          upgrades.ts       — GOLD_UPGRADES, SALT_UPGRADES definitions
          upgrades.types.ts — GoldUpgrade, SaltUpgrade
          index.ts
      ui/
        folio/
          folio.ts          — SVG rendering, line cache, countRedWords
          folio.types.ts    — SlotDef, RuleDef, FolioLayout
          index.ts
        hud/
          hud.ts            — fmt, fmtSalt, refreshStats, toasts, floats
          index.ts
        upgrades/
          upgrades.ts       — refreshUpgrades (upgrade shop UI)
          index.ts
        index.ts            — re-exports all UI as default export
      state/
        state.ts            — single source of truth, controlled mutations only
        state.types.ts      — GameState, PersistedState
        index.ts
      upgrades/
        upgrades.ts         — cost calculation, buy logic, stat derivation
        index.ts
      save/
        save.ts             — envelope, validation, migration, autosave timers
        save.types.ts       — SaveEnvelope, LoadOutcome, Migration
        index.ts
      types/
        config.ts           — GameConfig (aggregates types from modules)
        index.ts
      i18n/
        index.ts            — t(), setLocale(), getLocale()
        en.ts               — English strings
        pt-BR.ts            — Portuguese strings
      main.ts               — keyboard input, game loop, tab switching, init
      debug.ts              — debug panel (only when Env.DEBUG)
      app.ts                — entry point: imports main + debug, calls init
  test/
    setup.ts              — vitest global setup (SVGElement.getComputedTextLength mock)
```

Each module follows the pattern: `module.ts` + `module.types.ts` + `module.test.ts` + `index.ts` (barrel).

Module load order: `config → state → upgrades → save → ui → main → debug → app`

---

## Key design decisions

**Input:** `a–z` and spacebar count. `e.repeat`, modifier keys, and mouse clicks are ignored.

**Folio:** SVG 210×300 (7:10 proportion). No visible ruled lines — blank vellum. Text rendered line-by-line — completed lines at opacity 0.76, current line at 0.38. Line cache is append-only, never reordered. Text measurement uses `getComputedTextLength()` — mocked in tests since jsdom does not implement SVG layout.

**Folio layouts:** Three layouts rotate randomly on each page turn: `single` (1 column), `double` (2 columns), `quad` (2×2 blocks). Defined via `makeLayout(id, colDefs, opts)` in `config/layouts.ts` — adding new layouts is one line. Page capacity (letters per page) is measured at runtime by dry-running `_fitLine` across all slots; no hardcoded value.

**Currencies:**
- Denarii per page = `ceil((1 + goldPerPage) * saltBonus) + redWordCount`
- Salt per codex = codex number (1st = 1g, 2nd = 2g, ...)
- Player starts with 0 Đ

**Upgrades — two trees:** defined in `config/upgrades/upgrades.ts`, each with a stable string `id` and a `max`. Denarii upgrades (Goose Quill, Parchment Ruling, Apprentice Scribe, Brass Lectern) reset on codex bind; Salt upgrades (Benefice, Scribe's Provisions, Prepared Vellum, Eternal Scriptorium, Golden Quill) are permanent. `unlocksAt` gates an upgrade behind a codex count.

**Game loop:** `setInterval` every 50ms. Auto adds `autoRate / 20` letters per tick.

**Save/load:** atomic JSON at `app.getPath('userData')/save.json` (`~/Library/Application Support/Scriptorium` on macOS — `app.setName` is required, otherwise unpackaged Electron uses a folder named "Electron"). Main process owns all `fs` access and is a dumb blob store; the renderer's `save/` module owns the envelope, validation and migration. Three constraints worth knowing:

- **Only resources and upgrade levels are persisted.** Derived values (`saltBonus`, `goldPerPage`, `startingGold`, `clickPower`, `autoRate`) are rebuilt by `State.recomputeSalt()` **then** `Upgrades.recompute()` — that order matters, since `recompute` reads `saltBonus` and `addLetters` reads `goldPerPage`. Rebalancing upgrade values therefore does not invalidate saves.
- **`UI.initRules()` must run before loading**, because it measures page capacity, and `addLetters` loops on `letters >= capacity` (a capacity of 0 would never terminate; `addLetters` also guards against this).
- **A save from a newer version is never overwritten** — it is renamed to `save.corrupt-<timestamp>.json` and the game starts fresh, so downgrading cannot destroy progress. Same treatment for unparseable or malformed files.

Autosave runs on two timers (1s shadow copy to main, 15s durable write), both dirty-checked; the final write happens synchronously on `before-quit` and on window close (macOS closes windows without quitting). E2E isolates saves per run via `ELECTRON_USER_DATA`.

---

## Roadmap

- [x] Electron setup (main process, BrowserWindow)
- [x] Vite + TypeScript migration (electron-vite 5, strict mode, 90%+ coverage)
- [x] Save/load (atomic JSON in userData via fs + IPC, versioned schema)
- [ ] Sound (quill scratch, page turn, codex bind)
- [ ] Codex completion animation
- [ ] Stats page (total letters, codices, time played)
- [ ] Offline progress on load
- [ ] Settings (volume, keybind remapping)
- [ ] More Salt upgrades

---

## Conventions

- Commit messages: English, single line, imperative
- No emojis anywhere in code or UI
- No comments unless logic is non-obvious
- All code in English — UI text is also English
- TypeScript strict mode — no `any`, no `as unknown as X` outside of typed helpers

## Testing

- Test files live next to their source file (`module.test.ts` beside `module.ts`)
- Both pure logic and DOM/UI code are tested
- Coverage runs with every `yarn test` and must stay above 90% (branches: 75%)
- When closing a feature, ask the user whether to write tests before committing

## Git workflow

- Always work on feature branches — never commit directly to main
- Commit autonomously when closing a feature, no need to ask
- Group commits by logical unit, not by file
- No co-author lines in commit messages
- When a feature branch is ready, remind the user to run `/pr` — opens the PR on GitHub via MCP
- When the user confirms a PR was merged into main, remind them to run `/ship` — bumps version, updates CHANGELOG, creates git tag

---

## Theme & naming

| Term | Meaning |
|------|---------|
| Scriptorium | the game |
| Scribe | the player |
| Denarii (Đ) | main currency — historical scribe daily wage |
| Salt (⬡) | prestige currency — from *salarium* (origin of "salary") |
| Codex | progression unit — a bound book |

Scribe titles by codex count: Novice Scribe → Skilled Copyist → Master Calligrapher → Keeper of the Scriptorium → Royal Illuminator → Eternal Archivist

Fonts: Uncial Antiqua (titles/capital), IM Fell English (values/names), Cormorant Garamond (body/labels)
