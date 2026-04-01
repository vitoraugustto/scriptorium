import Config from './index.js';

test('is frozen', () => {
  expect(Object.isFrozen(Config)).toBe(true);
});

test('exposes all expected keys', () => {
  const keys = ['PAGES_PER_CODEX', 'AUTO_TICK_MS', 'SCRIBE_TITLES', 'LOREM',
                 'FOLIO', 'FOLIO_LAYOUTS', 'GOLD_UPGRADES', 'SALT_UPGRADES'];
  for (const key of keys) expect(Config[key]).toBeDefined();
});

test('FOLIO is the same reference as FOLIO_LAYOUTS.single', () => {
  expect(Config.FOLIO).toBe(Config.FOLIO_LAYOUTS.single);
});
