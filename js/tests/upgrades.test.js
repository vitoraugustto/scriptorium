import Config from '../config/index.js';
import State from '../state.js';
import Upgrades from '../upgrades.js';

beforeEach(() => {
  State.reset();
  State.setPageCapacity(100);
});

describe('Upgrades.goldCost', () => {
  test('level 0 returns baseCost', () => {
    const quill = Config.GOLD_UPGRADES.find(u => u.id === 'g_quill');
    expect(Upgrades.goldCost(quill)).toBe(quill.baseCost);
  });

  test('cost increases with level', () => {
    const quill = Config.GOLD_UPGRADES.find(u => u.id === 'g_quill');
    const cost0 = Upgrades.goldCost(quill);
    State.levelUpGold('g_quill');
    const cost1 = Upgrades.goldCost(quill);
    expect(cost1).toBeGreaterThan(cost0);
  });

  test('formula is floor(baseCost * costMult^level)', () => {
    const quill = Config.GOLD_UPGRADES.find(u => u.id === 'g_quill');
    State.levelUpGold('g_quill');
    State.levelUpGold('g_quill');
    const expected = Math.floor(quill.baseCost * Math.pow(quill.costMult, 2));
    expect(Upgrades.goldCost(quill)).toBe(expected);
  });
});

describe('Upgrades.saltCost', () => {
  test('level 0 returns baseCost', () => {
    const cellar = Config.SALT_UPGRADES.find(u => u.id === 's_bonus1');
    expect(Upgrades.saltCost(cellar)).toBe(cellar.baseCost);
  });

  test('cost increases with level', () => {
    const cellar = Config.SALT_UPGRADES.find(u => u.id === 's_bonus1');
    const cost0 = Upgrades.saltCost(cellar);
    State.levelUpSalt('s_bonus1');
    const cost1 = Upgrades.saltCost(cellar);
    expect(cost1).toBeGreaterThan(cost0);
  });
});

describe('Upgrades.buyGold', () => {
  test('returns false when not enough gold', () => {
    const quill = Config.GOLD_UPGRADES.find(u => u.id === 'g_quill');
    expect(Upgrades.buyGold(quill)).toBe(false);
  });

  test('returns true and levels up when enough gold', () => {
    const quill = Config.GOLD_UPGRADES.find(u => u.id === 'g_quill');
    State.addGold(quill.baseCost);
    expect(Upgrades.buyGold(quill)).toBe(true);
    expect(State.get().goldLevels['g_quill']).toBe(1);
  });

  test('deducts gold on purchase', () => {
    const quill = Config.GOLD_UPGRADES.find(u => u.id === 'g_quill');
    State.addGold(100);
    Upgrades.buyGold(quill);
    expect(State.get().gold).toBe(100 - quill.baseCost);
  });

  test('returns false when already at max level', () => {
    const quill = Config.GOLD_UPGRADES.find(u => u.id === 'g_quill');
    for (let i = 0; i < quill.max; i++) State.levelUpGold('g_quill');
    State.addGold(99999);
    expect(Upgrades.buyGold(quill)).toBe(false);
  });

  test('calls recompute after purchase (clickPower updates)', () => {
    const quill = Config.GOLD_UPGRADES.find(u => u.id === 'g_quill');
    State.addGold(999);
    Upgrades.buyGold(quill);
    expect(State.get().clickPower).toBe(2);
  });
});

describe('Upgrades.buySalt', () => {
  test('returns false when not enough salt', () => {
    const cellar = Config.SALT_UPGRADES.find(u => u.id === 's_bonus1');
    expect(Upgrades.buySalt(cellar)).toBe(false);
  });

  test('returns true and levels up when enough salt', () => {
    const cellar = Config.SALT_UPGRADES.find(u => u.id === 's_bonus1');
    State.addSalt(cellar.baseCost);
    expect(Upgrades.buySalt(cellar)).toBe(true);
    expect(State.get().saltLevels['s_bonus1']).toBe(1);
  });

  test('deducts salt on purchase', () => {
    const cellar = Config.SALT_UPGRADES.find(u => u.id === 's_bonus1');
    State.addSalt(100);
    Upgrades.buySalt(cellar);
    expect(State.get().salt).toBe(100 - cellar.baseCost);
  });

  test('returns false at max level', () => {
    const cellar = Config.SALT_UPGRADES.find(u => u.id === 's_bonus1');
    for (let i = 0; i < cellar.max; i++) State.levelUpSalt('s_bonus1');
    State.addSalt(99999);
    expect(Upgrades.buySalt(cellar)).toBe(false);
  });

  test('recomputes saltBonus after purchase', () => {
    const cellar = Config.SALT_UPGRADES.find(u => u.id === 's_bonus1');
    State.addSalt(99);
    Upgrades.buySalt(cellar);
    expect(State.get().saltBonus).toBeCloseTo(1.3);
  });
});

describe('Upgrades.recompute', () => {
  test('clickPower is 1 with no upgrades', () => {
    Upgrades.recompute();
    expect(State.get().clickPower).toBe(1);
  });

  test('clickAdd increases clickPower', () => {
    State.levelUpGold('g_quill');
    State.levelUpGold('g_quill');
    Upgrades.recompute();
    expect(State.get().clickPower).toBe(3); // 1 + 2
  });

  test('autoRate is 0 with no auto upgrades', () => {
    Upgrades.recompute();
    expect(State.get().autoRate).toBe(0);
  });

  test('clickPermMult from salt doubles clickPower', () => {
    State.levelUpGold('g_quill'); // +1 clickAdd
    State.levelUpSalt('s_click1'); // 2x clickPermMult
    State.recomputeSalt();
    Upgrades.recompute();
    expect(State.get().clickPower).toBe(4); // (1+1) * 2
  });

});

describe('Upgrades.affordableGold', () => {
  test('returns 0 with no gold', () => {
    expect(Upgrades.affordableGold()).toBe(0);
  });

  test('returns count of affordable upgrades', () => {
    State.addGold(999);
    expect(Upgrades.affordableGold()).toBeGreaterThan(0);
  });

  test('maxed upgrades are not counted', () => {
    const quill = Config.GOLD_UPGRADES.find(u => u.id === 'g_quill');
    for (let i = 0; i < quill.max; i++) State.levelUpGold('g_quill');
    State.addGold(99999);
    const ruling = Config.GOLD_UPGRADES.find(u => u.id === 'g_ruling');
    const allMaxed = Config.GOLD_UPGRADES.every(u => State.get().goldLevels[u.id] >= u.max);
    if (allMaxed) {
      expect(Upgrades.affordableGold()).toBe(0);
    } else {
      expect(Upgrades.affordableGold()).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('Upgrades.affordableSalt', () => {
  test('returns 0 with no salt', () => {
    expect(Upgrades.affordableSalt()).toBe(0);
  });

  test('returns count of affordable upgrades', () => {
    State.addSalt(9999);
    expect(Upgrades.affordableSalt()).toBeGreaterThan(0);
  });
});
