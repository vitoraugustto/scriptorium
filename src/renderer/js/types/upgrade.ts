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
