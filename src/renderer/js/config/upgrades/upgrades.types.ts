export interface GoldUpgrade {
  id: string;
  name: string;
  desc: string;
  baseCost: number;
  costMult: number;
  max: number;
  effect: 'clickAdd' | 'clickMult' | 'autoAdd' | 'autoMult' | 'pageAdd';
  val: number;
  unlocksAt?: number;
}

export interface SaltUpgrade {
  id: string;
  name: string;
  desc: string;
  baseCost: number;
  costMult: number;
  max: number;
  effect: 'saltBonus' | 'startingGold' | 'goldPerPage' | 'autoMult' | 'clickMult';
  val: number;
  unlocksAt?: number;
}
