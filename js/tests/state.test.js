import State from '../state.js';

// state is a singleton module — reset before each test
beforeEach(() => {
  State.reset();
  State.setPageCapacity(100);
});

describe('State.get', () => {
  test('returns a snapshot, not the internal object', () => {
    const a = State.get();
    const b = State.get();
    expect(a).not.toBe(b);
  });

  test('goldLevels and saltLevels are copies', () => {
    const snap = State.get();
    snap.goldLevels['g_quill'] = 99;
    expect(State.get().goldLevels['g_quill']).toBe(0);
  });

  test('initial gold is 0', () => {
    expect(State.get().gold).toBe(0);
  });

  test('initial salt is 0', () => {
    expect(State.get().salt).toBe(0);
  });

  test('initial currentPage is 1', () => {
    expect(State.get().currentPage).toBe(1);
  });

  test('initial codices is 0', () => {
    expect(State.get().codices).toBe(0);
  });
});

describe('State.addGold / spendGold', () => {
  test('addGold increases gold and totalGold', () => {
    State.addGold(50);
    expect(State.get().gold).toBe(50);
    expect(State.get().totalGold).toBe(50);
  });

  test('spendGold decreases gold', () => {
    State.addGold(50);
    State.spendGold(20);
    expect(State.get().gold).toBe(30);
  });

  test('totalGold does not decrease on spend', () => {
    State.addGold(50);
    State.spendGold(20);
    expect(State.get().totalGold).toBe(50);
  });
});

describe('State.addSalt / spendSalt', () => {
  test('addSalt increases salt and totalSalt', () => {
    State.addSalt(5);
    expect(State.get().salt).toBe(5);
    expect(State.get().totalSalt).toBe(5);
  });

  test('spendSalt decreases salt', () => {
    State.addSalt(10);
    State.spendSalt(3);
    expect(State.get().salt).toBe(7);
  });
});

describe('State.addLetters', () => {
  test('accumulates letters', () => {
    State.addLetters(10);
    expect(State.get().letters).toBe(10);
    expect(State.get().totalLetters).toBe(10);
  });

  test('returns pages=0 when page not yet complete', () => {
    const { pages } = State.addLetters(50);
    expect(pages).toBe(0);
  });

  test('completes a page when letters reach capacity', () => {
    const { pages, gold } = State.addLetters(100);
    expect(pages).toBe(1);
    expect(gold).toBeGreaterThanOrEqual(1);
  });

  test('advances currentPage on page complete', () => {
    State.addLetters(100);
    expect(State.get().currentPage).toBe(2);
  });

  test('resets letters remainder after page', () => {
    State.addLetters(150);
    expect(State.get().letters).toBe(50);
  });

  test('can complete multiple pages in one call', () => {
    const { pages } = State.addLetters(250);
    expect(pages).toBe(2);
  });

  test('base gold per page is 1 with no bonuses', () => {
    const { gold } = State.addLetters(100);
    expect(gold).toBe(1);
  });

  test('redWordBonus adds to gold on first page turn', () => {
    const { gold } = State.addLetters(100, 5);
    expect(gold).toBe(6);
  });

  test('redWordBonus only applies to first page in multi-page call', () => {
    const { gold } = State.addLetters(200, 3);
    expect(gold).toBe(1 + 3 + 1); // page1: 1+3, page2: 1
  });

  test('goldPerPage bonus is applied', () => {
    State.get(); // ensure state is accessible
    // simulate goldPerPage via recomputeSalt with a salt upgrade
    State.levelUpSalt('s_pages1');
    State.recomputeSalt();
    const { gold } = State.addLetters(100);
    expect(gold).toBe(2); // 1 base + 1 goldPerPage
  });

  test('saltBonus multiplier is applied', () => {
    State.levelUpSalt('s_bonus1');
    State.recomputeSalt();
    const saltBonus = State.get().saltBonus; // 1 + 0.3 = 1.3
    const { gold } = State.addLetters(100);
    expect(gold).toBe(Math.ceil(1 * saltBonus));
  });
});

describe('State.setStats', () => {
  test('sets clickPower and autoRate', () => {
    State.setStats({ click: 5, auto: 10 });
    const s = State.get();
    expect(s.clickPower).toBe(5);
    expect(s.autoRate).toBe(10);
  });
});

describe('State.levelUpGold / levelUpSalt', () => {
  test('levelUpGold increments the level', () => {
    State.levelUpGold('g_quill');
    expect(State.get().goldLevels['g_quill']).toBe(1);
    State.levelUpGold('g_quill');
    expect(State.get().goldLevels['g_quill']).toBe(2);
  });

  test('levelUpSalt increments the level', () => {
    State.levelUpSalt('s_bonus1');
    expect(State.get().saltLevels['s_bonus1']).toBe(1);
  });
});

describe('State.canBind', () => {
  test('false when currentPage <= PAGES_PER_CODEX', () => {
    expect(State.canBind()).toBe(false);
  });

  test('true when currentPage exceeds PAGES_PER_CODEX', () => {
    // fill 300 pages worth of letters
    State.addLetters(100 * 300);
    expect(State.canBind()).toBe(true);
  });
});

describe('State.bindCodex', () => {
  beforeEach(() => {
    State.addLetters(100 * 300);
  });

  test('increments codices', () => {
    State.bindCodex();
    expect(State.get().codices).toBe(1);
  });

  test('returns salt gain equal to codex number', () => {
    const gain = State.bindCodex();
    expect(gain).toBe(1);
    const gain2 = State.bindCodex();
    expect(gain2).toBe(2);
  });

  test('adds salt to balance', () => {
    State.bindCodex();
    expect(State.get().salt).toBe(1);
  });

  test('resets letters and currentPage', () => {
    State.bindCodex();
    expect(State.get().letters).toBe(0);
    expect(State.get().currentPage).toBe(1);
  });

  test('resets gold upgrades', () => {
    State.levelUpGold('g_quill');
    State.bindCodex();
    expect(State.get().goldLevels['g_quill']).toBe(0);
  });

  test('sets gold to startGold after bind', () => {
    State.bindCodex();
    expect(State.get().gold).toBe(State.get().startGold);
  });
});

describe('State.recomputeSalt', () => {
  test('saltBonus accumulates with Salt Cellar levels', () => {
    State.levelUpSalt('s_bonus1');
    State.levelUpSalt('s_bonus1');
    State.recomputeSalt();
    expect(State.get().saltBonus).toBeCloseTo(1.6);
  });

  test('startGold increases with Scribe Provisions', () => {
    State.levelUpSalt('s_start1');
    State.recomputeSalt();
    expect(State.get().startGold).toBe(50);
  });

  test('goldPerPage increases with Prepared Vellum', () => {
    State.levelUpSalt('s_pages1');
    State.recomputeSalt();
    expect(State.get().goldPerPage).toBe(1);
  });

  test('autoPermMult doubles with Eternal Scriptorium', () => {
    State.levelUpSalt('s_auto1');
    State.recomputeSalt();
    expect(State.get().autoPermMult).toBe(2);
  });

  test('clickPermMult doubles with Golden Quill', () => {
    State.levelUpSalt('s_click1');
    State.recomputeSalt();
    expect(State.get().clickPermMult).toBe(2);
  });
});

describe('State.setPageCapacity / getPageCapacity', () => {
  test('stores and retrieves capacity', () => {
    State.setPageCapacity(420);
    expect(State.getPageCapacity()).toBe(420);
  });
});

describe('State.reset', () => {
  test('resets gold and salt to 0', () => {
    State.addGold(500);
    State.addSalt(10);
    State.reset();
    expect(State.get().gold).toBe(0);
    expect(State.get().salt).toBe(0);
  });

  test('resets totalGold and totalSalt', () => {
    State.addGold(100);
    State.reset();
    expect(State.get().totalGold).toBe(0);
    expect(State.get().totalSalt).toBe(0);
  });

  test('resets letters and currentPage', () => {
    State.addLetters(50);
    State.reset();
    expect(State.get().letters).toBe(0);
    expect(State.get().currentPage).toBe(1);
  });

  test('resets codices', () => {
    State.addLetters(100 * 300);
    State.bindCodex();
    State.reset();
    expect(State.get().codices).toBe(0);
  });

  test('resets all gold upgrade levels', () => {
    State.levelUpGold('g_quill');
    State.reset();
    expect(State.get().goldLevels['g_quill']).toBe(0);
  });

  test('resets all salt upgrade levels', () => {
    State.levelUpSalt('s_bonus1');
    State.reset();
    expect(State.get().saltLevels['s_bonus1']).toBe(0);
  });

  test('resets saltBonus to 1.0', () => {
    State.levelUpSalt('s_bonus1');
    State.recomputeSalt();
    State.reset();
    expect(State.get().saltBonus).toBe(1.0);
  });
});
