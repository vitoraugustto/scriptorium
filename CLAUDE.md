# Scriptorium — Handoff to Claude Code

## What this is
A desktop idle/clicker game where the player types on the keyboard to write letters into a medieval codex. Built for Electron. Currently a single HTML file — ready to be split into proper modules and packaged.

---

## Core game loop

```
Keystroke (a–z)  →  letters written on current page
Page complete    →  earns Denarii (resets each codex)
Codex complete   →  earns Salt (permanent, never resets)
```

- **1 page** = 1,200 letters
- **1 codex** = 300 pages = 360,000 letters
- **Denarii** = main currency, resets when a codex is bound
- **Salt** = prestige currency, permanent across all codices

---

## Tech stack
- Pure HTML/CSS/JS — no frameworks, no build step
- Target: **Electron** (desktop app)
- Fonts: Google Fonts — Uncial Antiqua, IM Fell English, Cormorant Garamond
- No localStorage yet — save system is a future task

---

## File structure (current)
```
scriptorium.html   ← entire game in one file
```

## File structure (target for Electron)
```
index.html
js/
  config.js        ← static constants (LETTERS_PER_PAGE, UPGRADES, FOLIO geometry, etc.)
  state.js         ← single source of truth, controlled mutations only
  upgrades.js      ← cost calculation, buy logic, stat derivation
  ui.js            ← all DOM access, folio text rendering, float numbers, toast
  main.js          ← keyboard input, game loop, tab switching, init
style.css
assets/
  fonts/           ← embed Google Fonts locally for offline Electron use
```

The JS is already written as IIFE namespaces (`const Config = (() => { ... })()`), so splitting into files is straightforward — just cut each block into its own file and load them in order via `<script src>`.

---

## Module dependency order
```
config.js  →  state.js  →  upgrades.js  →  ui.js  →  main.js
```
Each module only depends on those to its left.

---

## Key design decisions

### Input
- Only `a–z` keystrokes write letters (`/^[a-zA-Z]$/.test(e.key)`)
- `e.repeat` is ignored (holding a key does nothing)
- Ctrl/Cmd/Alt combos are ignored
- No mouse clicking — keyboard only

### Folio rendering
- SVG viewBox `0 0 210 300` (real 7:10 codex proportion)
- 26 ruled lines, spaced 10px apart
- Left margin red line at x=22 (historical manuscript style)
- Text rendered line-by-line: completed lines solid (opacity 0.76), current line faded (opacity 0.38)
- Line cache (`_lines[]`) is stable — never reorders text already written, only appends
- First 3 lines are narrower when Illuminated Capital is unlocked (text flows beside the capital)

### Illuminated Capital
- Hidden by default — unlocked via Salt upgrades
- `s_capital` (2 ⬡) → shows plain rust ink capital letter
- `s_capital2` (8 ⬡) → adds gold leaf border
- Capital letter = first letter of first line, uppercased
- Font: Uncial Antiqua, size 34, positioned at x=40 y=50

### Currency & progression
- **Denarii**: earned per page, amount = `ceil(currentPage * saltBonus)`. Page 1 gives 1 Đ, page 300 gives 300 Đ.
- **Salt**: earned per codex bound, amount = codex number (1st codex = 1g, 2nd = 2g, etc.)
- `saltBonus` starts at 1.0, increases via Salt Cellar upgrade (+0.3 per level)
- Player starts with 5 Đ

### Upgrades
Two separate upgrade trees:

**Denarii upgrades** (reset each codex):
- clickMult: Goose Quill, Iron Gall Ink, Refined Calligraphy, Treated Vellum, Illumination
- autoAdd: Apprentice (1/s), Copyist (5/s), Benedictine Monk (25/s), Scriptorium Hall (100/s), Royal Library (500/s), Order of Scribes (2000/s)

**Salt upgrades** (permanent):
- Salt Cellar: +30% bonus per level (max 10)
- Scribe's Provisions: start each codex with extra Đ
- Prepared Vellum: +1 Đ per page
- Eternal Scriptorium: doubles auto rate permanently
- Golden Quill: doubles click power permanently
- Illuminated Capital: unlocks capital letter on folio
- Golden Capital: adds gold border to capital

### Auto-scribes (game loop)
- `setInterval` every 50ms
- `autoRate` letters per second, added as `autoRate / 20` per tick
- Auto production triggers page completion and folio clear same as keystrokes

---

## UI layout (desktop)
```
┌─────────────────────────────────────────────┐
│ titlebar: [dots] [Scriptorium] [Đ] [⬡] [i] │
├──────────────────────────┬──────────────────┤
│                          │  [Đ tab][⬡ tab] │
│   progress bars          │                 │
│                          │  upgrade list   │
│   folio SVG (7:10)       │  (scrollable)   │
│                          │                 │
│   "press a–z to write"   │  [Bind Codex]   │
│                          │  [note]         │
└──────────────────────────┴──────────────────┘
```
- Left: folio area with parchment background + ruled lines texture
- Right sidebar: 280px fixed, Denarii/Salt tabs, upgrade rows, codex bind button at bottom
- Titlebar: macOS-style dots (decorative), centered title, resources + info button on right
- Info button (i): opens a tooltip panel with full stats

---

## What still needs to be built
- [ ] Electron setup (main process, BrowserWindow, packaging)
- [ ] Save/load system (JSON file via Electron fs or electron-store)
- [ ] Sound design (quill scratching on keystroke, page turn, codex bind)
- [ ] More Salt upgrades (ideas: faster page turns, bonus Đ on codex bind, visual upgrades)
- [ ] Visual polish on codex completion (animation, flash, particle effect)
- [ ] Settings (font size, volume, keybind remapping)
- [ ] Stats page (total letters written, total codices, time played)
- [ ] Offline progress calculation on load
- [ ] Localization (PT-BR and EN already partially done)

---

## Conventions
- Commit messages: English, single line, imperative
- No emojis anywhere in code or UI
- No comments in code unless logic is non-obvious
- No Portuguese in code (UI text is English, code is English)

## Git workflow
- Main branch: `main`
- Each feature gets its own branch, e.g. `feature/electron-setup`
- When a feature is complete: push branch → merge into `main` → delete branch
- When Claude considers a feature done, ask the user before creating a commit
- The user decides the commit message and whether to proceed

---

## Naming & theme reference
- Game: **Scriptorium**
- Player role: **Scribe**
- Main currency: **Denarii** (Đ) — historical daily payment for scribes
- Prestige currency: **Salt** (⬡, displayed in g/kg/t) — *salarium*, origin of "salary"
- Progression unit: **Codex** — a bound book of folios
- Upgrade names: medieval/latin themed (see config.js GOLD_UPGRADES and SALT_UPGRADES)
- Scribe titles (by codex count): Novice Scribe → Skilled Copyist → Master Calligrapher → Keeper of the Scriptorium → Royal Illuminator → Eternal Archivist
- UI language: English
- Fonts: Uncial Antiqua (titles/capital), IM Fell English (values/names), Cormorant Garamond (body/labels)
