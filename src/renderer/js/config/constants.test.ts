import { PAGES_PER_CODEX, AUTO_TICK_MS, SCRIBE_TITLES, LOREM } from './constants';

test('PAGES_PER_CODEX is 300', () => {
  expect(PAGES_PER_CODEX).toBe(300);
});

test('AUTO_TICK_MS is 50', () => {
  expect(AUTO_TICK_MS).toBe(50);
});

describe('SCRIBE_TITLES', () => {
  test('has 6 entries', () => {
    expect(SCRIBE_TITLES).toHaveLength(6);
  });

  test('first is Novice Scribe, last is Eternal Archivist', () => {
    expect(SCRIBE_TITLES[0]).toBe('Novice Scribe');
    expect(SCRIBE_TITLES[5]).toBe('Eternal Archivist');
  });
});

describe('LOREM', () => {
  test('has at least 20 words', () => {
    expect(LOREM.length).toBeGreaterThanOrEqual(20);
  });

  test('all entries are strings', () => {
    LOREM.forEach(w => expect(typeof w).toBe('string'));
  });
});
