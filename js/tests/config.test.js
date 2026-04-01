import Config from '../config/index.js';

describe('Config', () => {
  test('is frozen', () => {
    expect(Object.isFrozen(Config)).toBe(true);
  });

  test('PAGES_PER_CODEX is 300', () => {
    expect(Config.PAGES_PER_CODEX).toBe(300);
  });

  test('AUTO_TICK_MS is 50', () => {
    expect(Config.AUTO_TICK_MS).toBe(50);
  });

  test('SCRIBE_TITLES has 6 entries', () => {
    expect(Config.SCRIBE_TITLES).toHaveLength(6);
    expect(Config.SCRIBE_TITLES[0]).toBe('Novice Scribe');
    expect(Config.SCRIBE_TITLES[5]).toBe('Eternal Archivist');
  });

  test('LOREM has at least 20 words', () => {
    expect(Config.LOREM.length).toBeGreaterThanOrEqual(20);
    Config.LOREM.forEach(w => expect(typeof w).toBe('string'));
  });

  describe('FOLIO_LAYOUTS', () => {
    test('has single, double, quad', () => {
      expect(Config.FOLIO_LAYOUTS.single).toBeDefined();
      expect(Config.FOLIO_LAYOUTS.double).toBeDefined();
      expect(Config.FOLIO_LAYOUTS.quad).toBeDefined();
    });

    test('each layout has slots and rules', () => {
      for (const layout of Object.values(Config.FOLIO_LAYOUTS)) {
        expect(Array.isArray(layout.slots)).toBe(true);
        expect(Array.isArray(layout.rules)).toBe(true);
        expect(layout.slots.length).toBeGreaterThan(0);
      }
    });

    test('each slot has required geometry fields', () => {
      for (const layout of Object.values(Config.FOLIO_LAYOUTS)) {
        for (const slot of layout.slots) {
          expect(typeof slot.xStart).toBe('number');
          expect(typeof slot.xEnd).toBe('number');
          expect(typeof slot.yFirst).toBe('number');
          expect(typeof slot.yStep).toBe('number');
          expect(typeof slot.lines).toBe('number');
          expect(slot.xEnd).toBeGreaterThan(slot.xStart);
          expect(slot.lines).toBeGreaterThan(0);
        }
      }
    });

    test('single layout has xCapEnd for illuminated capital', () => {
      expect(Config.FOLIO_LAYOUTS.single.xCapEnd).toBeDefined();
    });

    test('double layout has 2 slots', () => {
      expect(Config.FOLIO_LAYOUTS.double.slots).toHaveLength(2);
    });

    test('quad layout has 4 slots', () => {
      expect(Config.FOLIO_LAYOUTS.quad.slots).toHaveLength(4);
    });

    test('all layouts share identical yFirst for first slot', () => {
      const yFirsts = Object.values(Config.FOLIO_LAYOUTS).map(l => l.slots[0].yFirst);
      expect(new Set(yFirsts).size).toBe(1);
    });

    test('all layouts share identical yStep', () => {
      const ySteps = Object.values(Config.FOLIO_LAYOUTS)
        .flatMap(l => l.slots.map(s => s.yStep));
      expect(new Set(ySteps).size).toBe(1);
    });

    test('FOLIO is an alias for single layout', () => {
      expect(Config.FOLIO).toBe(Config.FOLIO_LAYOUTS.single);
    });
  });

  describe('GOLD_UPGRADES', () => {
    test('has at least one upgrade', () => {
      expect(Config.GOLD_UPGRADES.length).toBeGreaterThan(0);
    });

    test('each upgrade has required fields', () => {
      for (const u of Config.GOLD_UPGRADES) {
        expect(typeof u.id).toBe('string');
        expect(typeof u.name).toBe('string');
        expect(typeof u.desc).toBe('string');
        expect(typeof u.baseCost).toBe('number');
        expect(typeof u.costMult).toBe('number');
        expect(typeof u.max).toBe('number');
        expect(typeof u.effect).toBe('string');
        expect(typeof u.val).toBe('number');
        expect(u.baseCost).toBeGreaterThan(0);
        expect(u.max).toBeGreaterThan(0);
      }
    });

    test('upgrade ids are unique', () => {
      const ids = Config.GOLD_UPGRADES.map(u => u.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    test('Goose Quill has clickAdd effect', () => {
      const quill = Config.GOLD_UPGRADES.find(u => u.id === 'g_quill');
      expect(quill).toBeDefined();
      expect(quill.effect).toBe('clickAdd');
    });

    test('Parchment Ruling has pageAdd effect and max 10', () => {
      const ruling = Config.GOLD_UPGRADES.find(u => u.id === 'g_ruling');
      expect(ruling).toBeDefined();
      expect(ruling.effect).toBe('pageAdd');
      expect(ruling.max).toBe(10);
    });
  });

  describe('SALT_UPGRADES', () => {
    test('has at least one upgrade', () => {
      expect(Config.SALT_UPGRADES.length).toBeGreaterThan(0);
    });

    test('each upgrade has required fields', () => {
      for (const u of Config.SALT_UPGRADES) {
        expect(typeof u.id).toBe('string');
        expect(typeof u.name).toBe('string');
        expect(typeof u.desc).toBe('string');
        expect(typeof u.baseCost).toBe('number');
        expect(typeof u.max).toBe('number');
        expect(typeof u.effect).toBe('string');
        expect(typeof u.val).toBe('number');
        expect(u.baseCost).toBeGreaterThan(0);
      }
    });

    test('upgrade ids are unique', () => {
      const ids = Config.SALT_UPGRADES.map(u => u.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });
});
