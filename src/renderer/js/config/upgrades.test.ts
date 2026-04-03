import { GOLD_UPGRADES, SALT_UPGRADES } from './upgrades';

describe('GOLD_UPGRADES', () => {
  test('has at least one upgrade', () => {
    expect(GOLD_UPGRADES.length).toBeGreaterThan(0);
  });

  test('each upgrade has required fields', () => {
    for (const u of GOLD_UPGRADES) {
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

  test('ids are unique', () => {
    const ids = GOLD_UPGRADES.map(u => u.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('Goose Quill has clickAdd effect', () => {
    const quill = GOLD_UPGRADES.find(u => u.id === 'g_quill');
    expect(quill).toBeDefined();
    expect(quill.effect).toBe('clickAdd');
  });

  test('Parchment Ruling has pageAdd effect and max 10', () => {
    const ruling = GOLD_UPGRADES.find(u => u.id === 'g_ruling');
    expect(ruling).toBeDefined();
    expect(ruling.effect).toBe('pageAdd');
    expect(ruling.max).toBe(10);
  });
});

describe('SALT_UPGRADES', () => {
  test('has at least one upgrade', () => {
    expect(SALT_UPGRADES.length).toBeGreaterThan(0);
  });

  test('each upgrade has required fields', () => {
    for (const u of SALT_UPGRADES) {
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

  test('ids are unique', () => {
    const ids = SALT_UPGRADES.map(u => u.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
