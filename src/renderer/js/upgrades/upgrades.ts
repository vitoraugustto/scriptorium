import type { GoldUpgrade, SaltUpgrade } from '../config/upgrades/upgrades.types';
import Config from '../config/index';
import State from '../state';

const goldCost = (u: GoldUpgrade): number =>
  Math.floor(u.baseCost * Math.pow(u.costMult, State.get().goldLevels[u.id]));
const saltCost = (u: SaltUpgrade): number =>
  Math.floor(u.baseCost * Math.pow(u.costMult, State.get().saltLevels[u.id]));

const recompute = (): void => {
  const { goldLevels, saltLevels, saltBonus } = State.get();
  let ca = 0, cm = 1, aa = 0, am = 1;
  Config.GOLD_UPGRADES.forEach(u => {
    const l = goldLevels[u.id]; if (!l) return;
    if (u.effect === 'clickAdd')  ca += u.val * l;
    if (u.effect === 'clickMult') cm *= Math.pow(u.val, l);
    if (u.effect === 'autoAdd')   aa += u.val * l;
    if (u.effect === 'autoMult')  am *= Math.pow(u.val, l);
  });
  Config.SALT_UPGRADES.forEach(u => {
    const l = saltLevels[u.id]; if (!l) return;
    if (u.effect === 'clickMult') cm *= Math.pow(u.val, l);
    if (u.effect === 'autoMult')  am *= Math.pow(u.val, l);
  });
  State.setStats({
    click: Math.max(1, Math.round((1 + ca) * cm)),
    auto:  Math.round(aa * am * saltBonus),
  });
};

const buyGold = (u: GoldUpgrade): boolean => {
  const { gold, goldLevels } = State.get();
  const cost = goldCost(u);
  if (gold < cost || goldLevels[u.id] >= u.max) return false;
  State.spendGold(cost); State.levelUpGold(u.id); recompute();
  return true;
};

const buySalt = (u: SaltUpgrade): boolean => {
  const { salt, saltLevels } = State.get();
  const cost = saltCost(u);
  if (salt < cost || saltLevels[u.id] >= u.max) return false;
  State.spendSalt(cost); State.levelUpSalt(u.id);
  State.recomputeSalt(); recompute();
  return true;
};

const affordableGold = (): number => {
  const { gold, goldLevels } = State.get();
  return Config.GOLD_UPGRADES.filter(u =>
    goldLevels[u.id] < u.max && gold >= goldCost(u)).length;
};

const affordableSalt = (): number => {
  const { salt, saltLevels } = State.get();
  return Config.SALT_UPGRADES.filter(u =>
    saltLevels[u.id] < u.max && salt >= saltCost(u)).length;
};

export default { goldCost, saltCost, recompute, buyGold, buySalt, affordableGold, affordableSalt };
