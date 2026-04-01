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
index.html
style.css
js/
  config.js    — constants: UPGRADES, FOLIO geometry, layout definitions
  env.js       — DEBUG flag (browser-compatible)
  state.js     — single source of truth, controlled mutations only
  upgrades.js  — cost calculation, buy logic, stat derivation
  ui.js        — all DOM access, folio rendering, floats, toasts
  main.js      — keyboard input, game loop, tab switching, init
```

Module load order: `env → config → state → upgrades → ui → main → debug`

---

## Key design decisions

**Input:** `a–z` and spacebar count. `e.repeat`, modifier keys, and mouse clicks are ignored.

**Folio:** SVG 210×300 (7:10 proportion). No visible ruled lines — blank vellum. Text rendered line-by-line — completed lines at opacity 0.76, current line at 0.38. Line cache is append-only, never reordered.

**Folio layouts:** Three layouts rotate randomly on each page turn: `single` (1 column), `double` (2 columns), `quad` (2×2 blocks). Defined via `makeLayout(id, colDefs, opts)` in config.js — adding new layouts is one line. Page capacity (letters per page) is measured at runtime by dry-running `_fitLine` across all slots; no hardcoded value.

**Currencies:**
- Denarii per page = `ceil((1 + goldPerPage) * saltBonus) + redWordCount`
- Salt per codex = codex number (1st = 1g, 2nd = 2g, ...)
- Player starts with 0 Đ

**Upgrades — two trees:**

Denarii (reset each codex): built one at a time. Current: Goose Quill (`clickAdd` +1/level, max 10, base 5 Đ), Parchment Ruling (max 10, base 10 Đ): renders 1% of words in red per level; each red word on the page earns +1 Đ when the page turns

Salt (permanent): Salt Cellar (+0.3 saltBonus/level), Scribe's Provisions (starting Đ), Prepared Vellum (+Đ/page via `goldPerPage`), Eternal Scriptorium (2x auto), Golden Quill (2x click), Illuminated Capital, Golden Capital

**Game loop:** `setInterval` every 50ms. Auto adds `autoRate / 20` letters per tick.

**Illuminated Capital:** unlocked via Salt. `s_capital` shows rust ink letter; `s_capital2` adds gold border. First 3 lines narrow to flow beside it.

---

## Roadmap

- [ ] Electron setup (main process, BrowserWindow, packaging)
- [ ] Save/load (electron-store or JSON via fs)
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

## Git workflow

- Commit autonomously when closing a feature, no need to ask
- Group commits by logical unit, not by file
- No co-author lines in commit messages

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
