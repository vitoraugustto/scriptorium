import type { FolioLayout } from './folio';
import type { GoldUpgrade, SaltUpgrade } from './upgrade';

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
