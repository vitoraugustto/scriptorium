import type { GameState } from './types';
import Config from './config/index';

let _lettersPerPage = 0;

const setPageCapacity = (n: number): void => { _lettersPerPage = n; };

const _d: GameState = {
  gold: 0, totalGold: 0,
  salt: 0, totalSalt: 0,
  letters: 0, totalLetters: 0,
  currentPage: 1, codices: 0,
  saltBonus: 1.0,
  clickPower: 1, autoRate: 0,
  goldLevels: {}, saltLevels: {},
};

Config.GOLD_UPGRADES.forEach(u => { _d.goldLevels[u.id] = 0; });
Config.SALT_UPGRADES.forEach(u => { _d.saltLevels[u.id] = 0; });

const get = (): GameState => ({
  ..._d,
  goldLevels: { ..._d.goldLevels },
  saltLevels: { ..._d.saltLevels },
});

const addLetters = (n: number, redWordBonus = 0): { pages: number; gold: number } => {
  _d.letters += n; _d.totalLetters += n;
  let pages = 0, gold = 0;
  while (_d.letters >= _lettersPerPage) {
    _d.letters -= _lettersPerPage;
    pages++;
    const gain = Math.ceil(_d.saltBonus);
    const bonus = pages === 1 ? redWordBonus : 0;
    _d.gold += gain + bonus; _d.totalGold += gain + bonus; gold += gain + bonus;
    _d.currentPage++;
  }
  return { pages, gold };
};

const spendGold = (n: number): void => { _d.gold -= n; };
const spendSalt = (n: number): void => { _d.salt -= n; };
const addGold   = (n: number): void => { _d.gold += n; _d.totalGold += n; };
const addSalt   = (n: number): void => { _d.salt += n; _d.totalSalt += n; };
const setStats  = (s: { click: number; auto: number }): void => {
  _d.clickPower = s.click; _d.autoRate = s.auto;
};
const levelUpGold = (id: string): void => { _d.goldLevels[id]++; };
const levelUpSalt = (id: string): void => { _d.saltLevels[id]++; };
const canBind = (): boolean => _d.currentPage > Config.PAGES_PER_CODEX;

const recomputeSalt = (): void => {
  let sb = 1;
  Config.SALT_UPGRADES.forEach(u => {
    const l = _d.saltLevels[u.id]; if (!l) return;
    if (u.effect === 'saltBonus') sb += u.val * l;
  });
  _d.saltBonus = sb;
};

const bindCodex = (): number => {
  _d.codices++;
  const saltGain = _d.codices;
  _d.salt += saltGain; _d.totalSalt += saltGain;
  _d.gold = 0;
  _d.letters = 0; _d.currentPage = 1;
  Config.GOLD_UPGRADES.forEach(u => { _d.goldLevels[u.id] = 0; });
  return saltGain;
};

const getPageCapacity = (): number => _lettersPerPage;

const reset = (): void => {
  _d.gold = 0; _d.totalGold = 0;
  _d.salt = 0; _d.totalSalt = 0;
  _d.letters = 0; _d.totalLetters = 0;
  _d.currentPage = 1; _d.codices = 0;
  _d.saltBonus = 1.0;
  _d.clickPower = 1; _d.autoRate = 0;
  Config.GOLD_UPGRADES.forEach(u => { _d.goldLevels[u.id] = 0; });
  Config.SALT_UPGRADES.forEach(u => { _d.saltLevels[u.id] = 0; });
};

export default {
  get, addLetters, spendGold, spendSalt, addGold, addSalt, setStats,
  levelUpGold, levelUpSalt, canBind, recomputeSalt, bindCodex,
  setPageCapacity, getPageCapacity, reset,
};
