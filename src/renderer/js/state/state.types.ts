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
  goldPerPage: number;
  startingGold: number;
  goldLevels: Record<string, number>;
  saltLevels: Record<string, number>;
}

// derived fields are omitted: recomputeSalt and Upgrades.recompute rebuild them
export type PersistedState = Pick<GameState,
  'gold' | 'totalGold' | 'salt' | 'totalSalt' | 'letters' | 'totalLetters' |
  'currentPage' | 'codices' | 'goldLevels' | 'saltLevels'>;
