import { makeLayout, FOLIO_LAYOUTS, FOLIO } from './layouts.js';

describe('FOLIO_LAYOUTS', () => {
  test('has single, double, quad', () => {
    expect(FOLIO_LAYOUTS.single).toBeDefined();
    expect(FOLIO_LAYOUTS.double).toBeDefined();
    expect(FOLIO_LAYOUTS.quad).toBeDefined();
  });

  test('each layout has slots and rules arrays', () => {
    for (const layout of Object.values(FOLIO_LAYOUTS)) {
      expect(Array.isArray(layout.slots)).toBe(true);
      expect(Array.isArray(layout.rules)).toBe(true);
      expect(layout.slots.length).toBeGreaterThan(0);
    }
  });

  test('each slot has required geometry fields', () => {
    for (const layout of Object.values(FOLIO_LAYOUTS)) {
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
    expect(FOLIO_LAYOUTS.single.xCapEnd).toBeDefined();
  });

  test('double layout has 2 slots', () => {
    expect(FOLIO_LAYOUTS.double.slots).toHaveLength(2);
  });

  test('quad layout has 4 slots', () => {
    expect(FOLIO_LAYOUTS.quad.slots).toHaveLength(4);
  });

  test('all layouts share identical yFirst for first slot', () => {
    const yFirsts = Object.values(FOLIO_LAYOUTS).map(l => l.slots[0].yFirst);
    expect(new Set(yFirsts).size).toBe(1);
  });

  test('all layouts share identical yStep', () => {
    const ySteps = Object.values(FOLIO_LAYOUTS).flatMap(l => l.slots.map(s => s.yStep));
    expect(new Set(ySteps).size).toBe(1);
  });
});

test('FOLIO is an alias for single layout', () => {
  expect(FOLIO).toBe(FOLIO_LAYOUTS.single);
});

describe('makeLayout', () => {
  test('returns object with slots and rules', () => {
    const layout = makeLayout('test', [{ frac: 1, rows: 1 }]);
    expect(Array.isArray(layout.slots)).toBe(true);
    expect(Array.isArray(layout.rules)).toBe(true);
  });

  test('type matches id argument', () => {
    const layout = makeLayout('mytype', [{ frac: 1, rows: 1 }]);
    expect(layout.type).toBe('mytype');
  });

  test('xCapEnd is set when passed in opts', () => {
    const layout = makeLayout('single', [{ frac: 1, rows: 1 }], { xCapEnd: 60 });
    expect(layout.xCapEnd).toBe(60);
  });

  test('xCapEnd is absent when not passed', () => {
    const layout = makeLayout('double', [{ frac: 1, rows: 1 }, { frac: 1, rows: 1 }]);
    expect(layout.xCapEnd).toBeUndefined();
  });

  test('multi-row column produces multiple slots', () => {
    const layout = makeLayout('quad', [{ frac: 1, rows: 2 }, { frac: 1, rows: 2 }]);
    expect(layout.slots.length).toBe(4);
  });
});
