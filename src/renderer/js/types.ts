export interface GoldUpgrade {
  id: string;
  name: string;
  desc: string;
  baseCost: number;
  costMult: number;
  max: number;
  effect: 'clickAdd' | 'clickMult' | 'autoAdd' | 'pageAdd';
  val: number;
}

export interface SaltUpgrade {
  id: string;
  name: string;
  desc: string;
  baseCost: number;
  costMult: number;
  max: number;
  effect: 'saltBonus';
  val: number;
}

export interface GameState {
  gold: number;
  totalGold: number;
  salt: number;
  totalSalt: number;
  letters: number;
  totalLetters: number;
  currentPage: number;
  codices: number;
  saltBonus: number;
  clickPower: number;
  autoRate: number;
  goldLevels: Record<string, number>;
  saltLevels: Record<string, number>;
}

export interface SlotDef {
  xStart: number;
  xEnd: number;
  yFirst: number;
  yStep: number;
  lines: number;
}

export interface RuleDef {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  red?: boolean;
  marg?: boolean;
}

export interface FolioLayout {
  type: string;
  fontSize: number;
  slots: SlotDef[];
  rules: RuleDef[];
  xCapEnd?: number;
}

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
