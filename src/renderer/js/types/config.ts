import type { FolioLayout } from '../ui/folio/folio.types';
import type { GoldUpgrade, SaltUpgrade } from '../config/upgrades/upgrades.types';

export interface GameConfig {
  PAGES_PER_CODEX: number;
  AUTO_TICK_MS: number;
  SCRIBE_TITLES: string[];
  LOREM: string[];
  FOLIO: FolioLayout;
  FOLIO_LAYOUTS: Record<string, FolioLayout>;
  GOLD_UPGRADES: GoldUpgrade[];
  SALT_UPGRADES: SaltUpgrade[];
}
