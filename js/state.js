import Config from './config.js';

let _lettersPerPage = 0;

const setPageCapacity = (n) => { _lettersPerPage = n; };

const _d = {
  gold:0, totalGold:0,
  salt:0, totalSalt:0,
  letters:0, totalLetters:0,
  currentPage:1, codices:0,
  saltBonus:1.0, startGold:5, goldPerPage:0,
  autoPermMult:1.0, clickPermMult:1.0,
  clickPower:1, autoRate:0, pageBonus:0,
  goldLevels:{}, saltLevels:{},
};
_d.gold = 0;

Config.GOLD_UPGRADES.forEach(u => { _d.goldLevels[u.id]=0; });
Config.SALT_UPGRADES.forEach(u => { _d.saltLevels[u.id]=0; });

const get = () => ({..._d, goldLevels:{..._d.goldLevels}, saltLevels:{..._d.saltLevels}});

const addLetters = (n) => {
  _d.letters += n; _d.totalLetters += n;
  let pages=0, gold=0;
  while (_d.letters >= _lettersPerPage) {
    _d.letters -= _lettersPerPage;
    pages++;
    const gain = Math.ceil((1 + _d.goldPerPage + _d.pageBonus) * _d.saltBonus);
    _d.gold += gain; _d.totalGold += gain; gold += gain;
    _d.currentPage++;
  }
  return { pages, gold };
};

const spendGold = (n) => { _d.gold -= n; };
const spendSalt = (n) => { _d.salt -= n; };
const addGold   = (n) => { _d.gold += n; _d.totalGold += n; };
const addSalt   = (n) => { _d.salt += n; _d.totalSalt += n; };
const setStats  = (s) => { _d.clickPower=s.click; _d.autoRate=s.auto; _d.pageBonus=s.pageBonus??_d.pageBonus; };
const levelUpGold = (id) => { _d.goldLevels[id]++; };
const levelUpSalt = (id) => { _d.saltLevels[id]++; };
const canBind = () => _d.currentPage > Config.PAGES_PER_CODEX;

const recomputeSalt = () => {
  let sb=1, sg=0, gpp=0, apm=1, cpm=1;
  Config.SALT_UPGRADES.forEach(u => {
    const l=_d.saltLevels[u.id]; if(!l) return;
    if(u.effect==='saltBonus')     sb  += u.val*l;
    if(u.effect==='startGold')     sg  += u.val*l;
    if(u.effect==='goldPerPage')   gpp += u.val*l;
    if(u.effect==='autoMult')      apm *= Math.pow(u.val,l);
    if(u.effect==='clickPermMult') cpm *= Math.pow(u.val,l);
  });
  _d.saltBonus=sb; _d.startGold=sg; _d.goldPerPage=gpp;
  _d.autoPermMult=apm; _d.clickPermMult=cpm;
};

const bindCodex = () => {
  _d.codices++;
  const saltGain = _d.codices;
  _d.salt += saltGain; _d.totalSalt += saltGain;
  _d.gold = _d.startGold;
  _d.letters = 0; _d.currentPage = 1;
  Config.GOLD_UPGRADES.forEach(u => { _d.goldLevels[u.id]=0; });
  return saltGain;
};

const getPageCapacity = () => _lettersPerPage;

const reset = () => {
  _d.gold=0; _d.totalGold=0;
  _d.salt=0; _d.totalSalt=0;
  _d.letters=0; _d.totalLetters=0;
  _d.currentPage=1; _d.codices=0;
  _d.saltBonus=1.0; _d.startGold=0; _d.goldPerPage=0;
  _d.autoPermMult=1.0; _d.clickPermMult=1.0;
  _d.clickPower=1; _d.autoRate=0; _d.pageBonus=0;
  Config.GOLD_UPGRADES.forEach(u => { _d.goldLevels[u.id]=0; });
  Config.SALT_UPGRADES.forEach(u => { _d.saltLevels[u.id]=0; });
};

export default { get, addLetters, spendGold, spendSalt, addGold, addSalt, setStats,
                 levelUpGold, levelUpSalt, canBind, recomputeSalt, bindCodex,
                 setPageCapacity, getPageCapacity, reset };
