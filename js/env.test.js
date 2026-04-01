import Env from './env.js';

describe('Env', () => {
  test('is frozen', () => {
    expect(Object.isFrozen(Env)).toBe(true);
  });

  test('has DEBUG flag', () => {
    expect(typeof Env.DEBUG).toBe('boolean');
  });

  test('DEBUG is true in test environment', () => {
    expect(Env.DEBUG).toBe(true);
  });
});
