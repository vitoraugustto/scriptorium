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
