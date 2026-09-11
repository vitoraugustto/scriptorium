import type { GameState, PersistedState } from './state.types';
import Config from '../config/index';

let _lettersPerPage = 0;

const setPageCapacity = (n: number): void => { _lettersPerPage = n; };

const _d: GameState = {
  gold: 0, totalGold: 0,
  salt: 0, totalSalt: 0,
  letters: 0, totalLetters: 0,
  currentPage: 1, codices: 0,
  saltBonus: 1.0,
  clickPower: 1, autoRate: 0,
  goldPerPage: 0, startingGold: 0,
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
  // capacity 0 would make the loop condition always true
  if (_lettersPerPage <= 0) return { pages, gold };
  while (_d.letters >= _lettersPerPage) {
    _d.letters -= _lettersPerPage;
    pages++;
    const gain = Math.ceil((1 + _d.goldPerPage) * _d.saltBonus);
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
  let sb = 1, gp = 0, sg = 0;
  Config.SALT_UPGRADES.forEach(u => {
    const l = _d.saltLevels[u.id]; if (!l) return;
    if (u.effect === 'saltBonus')   sb += u.val * l;
    if (u.effect === 'goldPerPage') gp += u.val * l;
    if (u.effect === 'startingGold') sg += u.val * l;
  });
  _d.saltBonus = sb;
  _d.goldPerPage = gp;
  _d.startingGold = sg;
};

const bindCodex = (): number => {
  _d.codices++;
  const saltGain = _d.codices;
  _d.salt += saltGain; _d.totalSalt += saltGain;
  _d.gold = _d.startingGold;
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
  _d.goldPerPage = 0; _d.startingGold = 0;
  Config.GOLD_UPGRADES.forEach(u => { _d.goldLevels[u.id] = 0; });
  Config.SALT_UPGRADES.forEach(u => { _d.saltLevels[u.id] = 0; });
};

const serialize = (): PersistedState => ({
  gold: _d.gold, totalGold: _d.totalGold,
  salt: _d.salt, totalSalt: _d.totalSalt,
  letters: _d.letters, totalLetters: _d.totalLetters,
  currentPage: _d.currentPage, codices: _d.codices,
  goldLevels: { ..._d.goldLevels },
  saltLevels: { ..._d.saltLevels },
});

// reset() first so the level key set always matches current config:
// ids added since the save default to 0, removed ids are never copied
const hydrate = (p: PersistedState): void => {
  reset();
  _d.gold = p.gold; _d.totalGold = p.totalGold;
  _d.salt = p.salt; _d.totalSalt = p.totalSalt;
  _d.letters = p.letters; _d.totalLetters = p.totalLetters;
  _d.currentPage = p.currentPage; _d.codices = p.codices;
  Config.GOLD_UPGRADES.forEach(u => {
    const l = p.goldLevels[u.id];
    if (typeof l === 'number') _d.goldLevels[u.id] = Math.min(l, u.max);
  });
  Config.SALT_UPGRADES.forEach(u => {
    const l = p.saltLevels[u.id];
    if (typeof l === 'number') _d.saltLevels[u.id] = Math.min(l, u.max);
  });
};

export default {
  get, addLetters, spendGold, spendSalt, addGold, addSalt, setStats,
  levelUpGold, levelUpSalt, canBind, recomputeSalt, bindCodex,
  setPageCapacity, getPageCapacity, reset, serialize, hydrate,
};
