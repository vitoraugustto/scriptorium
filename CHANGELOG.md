# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-09-11

### Added
- Save/load: progress is written to disk automatically and restored on launch
- Autosave every 15 seconds, plus a final save when the game is closed
- Corrupt or unreadable save files are set aside instead of discarded, and the game starts fresh
- A save written by a newer version of the game is never overwritten, so downgrading cannot destroy progress

### Changed
- Saves are stored under `Scriptorium/` in the system application data folder

## [1.0.0] - 2026-04-19

### Added
- Core game loop: keystroke (a–z, spacebar) → letters written into folio → Denarii earned on page complete → Salt earned on codex complete
- Three rotating folio layouts: single column, double column, quad (2x2 blocks)
- Upgrade tree: Goose Quill (clickAdd), Parchment Ruling (red words for bonus Denarii), Benefice (Salt multiplier)
- Scribe titles that progress with codex count (Novice Scribe → Eternal Archivist)
- i18n support with English and Portuguese (PT-BR) locales
- `/pr`, `/ship` — Claude Code skills for development workflow
