import type { GameConfig } from '../types';
import { PAGES_PER_CODEX, AUTO_TICK_MS, SCRIBE_TITLES, LOREM } from './constants';
import { FOLIO_LAYOUTS, FOLIO } from './layouts';
import { GOLD_UPGRADES, SALT_UPGRADES } from './upgrades/index';

export default Object.freeze({
  PAGES_PER_CODEX,
  AUTO_TICK_MS,
  SCRIBE_TITLES,
  LOREM,
  FOLIO,
  FOLIO_LAYOUTS,
  GOLD_UPGRADES,
  SALT_UPGRADES,
}) as GameConfig;
