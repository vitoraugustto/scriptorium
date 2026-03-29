# Scriptorium

Desktop idle/clicker game. The player types on the keyboard to write letters into a medieval codex. Target platform: Electron.

---

## Game loop

```
Keystroke (a–z)  →  letters written on current page
Page complete    →  earns Denarii (resets each codex)
Codex complete   →  earns Salt (permanent)
```

- 1 page = 1,200 letters
- 1 codex = 300 pages
- **Denarii (Đ)** — main currency, resets on codex bind
- **Salt (⬡)** — prestige currency, never resets. Displayed as g / kg / t

---

## File structure

```
index.html
style.css
js/
  config.js    — constants: LETTERS_PER_PAGE, UPGRADES, FOLIO geometry
  state.js     — single source of truth, controlled mutations only
  upgrades.js  — cost calculation, buy logic, stat derivation
  ui.js        — all DOM access, folio rendering, floats, toasts
  main.js      — keyboard input, game loop, tab switching, init
```

Module load order: `config → state → upgrades → ui → main`

---

## Key design decisions

**Input:** only `a–z` keystrokes count. `e.repeat`, modifier keys, and mouse clicks are ignored.

**Folio:** SVG 210×300 (7:10 proportion). 26 ruled lines. Text rendered line-by-line — completed lines at opacity 0.76, current line at 0.38. Line cache is append-only, never reordered.

**Currencies:**
- Denarii per page = `ceil(currentPage * saltBonus)`
- Salt per codex = codex number (1st = 1g, 2nd = 2g, …)
- Player starts with 5 Đ

**Upgrades — two trees:**

Denarii (reset each codex): `clickMult` (Goose Quill, Iron Gall Ink, Refined Calligraphy, Treated Vellum, Illumination) and `autoAdd` (Apprentice 1/s → Copyist 5/s → Benedictine Monk 25/s → Scriptorium Hall 100/s → Royal Library 500/s → Order of Scribes 2000/s)

Salt (permanent): Salt Cellar (+0.3 saltBonus/level), Scribe's Provisions (starting Đ), Prepared Vellum (+Đ/page), Eternal Scriptorium (2× auto), Golden Quill (2× click), Illuminated Capital, Golden Capital

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

- Branch: `feature/<name>` per feature
- When a feature is done: Claude asks before committing
- Flow: commit on feature branch → push → merge into `main` → delete branch

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
