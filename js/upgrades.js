import Config from './config/index.js';
import State from './state.js';

const goldCost = (u) =>
  Math.floor(u.baseCost * Math.pow(u.costMult, State.get().goldLevels[u.id]));
const saltCost = (u) =>
  Math.floor(u.baseCost * Math.pow(u.costMult, State.get().saltLevels[u.id]));

const recompute = () => {
  const { goldLevels, saltBonus } = State.get();
  let ca=0, cm=1, aa=0;
  Config.GOLD_UPGRADES.forEach(u => {
    const l=goldLevels[u.id]; if(!l) return;
    if(u.effect==='clickAdd')  ca += u.val*l;
    if(u.effect==='clickMult') cm *= Math.pow(u.val,l);
    if(u.effect==='autoAdd')   aa += u.val*l;
  });
  State.setStats({
    click: Math.max(1, Math.round((1 + ca) * cm)),
    auto:  Math.round(aa * saltBonus),
  });
};

const buyGold = (u) => {
  const { gold, goldLevels } = State.get();
  const cost = goldCost(u);
  if (gold < cost || goldLevels[u.id] >= u.max) return false;
  State.spendGold(cost); State.levelUpGold(u.id); recompute();
  return true;
};

const buySalt = (u) => {
  const { salt, saltLevels } = State.get();
  const cost = saltCost(u);
  if (salt < cost || saltLevels[u.id] >= u.max) return false;
  State.spendSalt(cost); State.levelUpSalt(u.id);
  State.recomputeSalt(); recompute();
  return true;
};

const affordableGold = () => {
  const { gold, goldLevels } = State.get();
  return Config.GOLD_UPGRADES.filter(u =>
    goldLevels[u.id] < u.max && gold >= goldCost(u)).length;
};

const affordableSalt = () => {
  const { salt, saltLevels } = State.get();
  return Config.SALT_UPGRADES.filter(u =>
    saltLevels[u.id] < u.max && salt >= saltCost(u)).length;
};

export default { goldCost, saltCost, recompute, buyGold, buySalt, affordableGold, affordableSalt };
