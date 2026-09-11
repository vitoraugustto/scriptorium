// @vitest-environment jsdom
import { vi } from 'vitest';
import Save from './save';
import State from '../state';
import Upgrades from '../upgrades';
import Config from '../config/index';

const CACHE_TICKS = 1_000;

let _disk: string | null = null;

const api = {
  read:       vi.fn(async () => _disk),
  write:      vi.fn(async (d: string) => { _disk = d; }),
  wipe:       vi.fn(async () => { _disk = null; }),
  quarantine: vi.fn(async () => { _disk = null; }),
  cache:      vi.fn(),
};

const validState = {
  gold: 42, totalGold: 100,
  salt: 5, totalSalt: 9,
  letters: 3, totalLetters: 250,
  currentPage: 12, codices: 2,
  goldLevels: { g_quill: 2 },
  saltLevels: { s_benefice: 3 },
};

const envelope = (over: Record<string, unknown> = {}): string =>
  JSON.stringify({ version: 1, savedAt: 1700000000000, state: validState, ...over });

const withState = (over: Record<string, unknown>): string =>
  JSON.stringify({ version: 1, savedAt: 1, state: { ...validState, ...over } });

beforeEach(async () => {
  _disk = null;
  vi.stubGlobal('saveAPI', api);
  Save.stopAutosave();
  await Save.wipe();          // also clears the dirty flag between tests
  vi.clearAllMocks();
  _disk = null;
  State.reset();
  State.setPageCapacity(100);
});

afterEach(() => {
  Save.stopAutosave();
  vi.useRealTimers();
});

describe('Save.load outcomes', () => {
  test('returns fresh when there is no file', async () => {
    expect(await Save.load()).toEqual({ kind: 'fresh' });
  });

  test('returns fresh when the bridge is unavailable', async () => {
    vi.stubGlobal('saveAPI', undefined);
    expect(await Save.load()).toEqual({ kind: 'fresh' });
  });

  test('loads a valid save', async () => {
    _disk = envelope();
    const out = await Save.load();
    expect(out.kind).toBe('loaded');
    if (out.kind === 'loaded') expect(out.state.gold).toBe(42);
  });

  test('rejects unparseable json', async () => {
    _disk = '{ not json';
    expect(await Save.load()).toEqual({ kind: 'rejected', reason: 'parse' });
  });

  test('rejects a save from a newer version', async () => {
    _disk = envelope({ version: 999 });
    expect(await Save.load()).toEqual({ kind: 'rejected', reason: 'future' });
  });

  test('quarantines a rejected save', async () => {
    _disk = '{ not json';
    await Save.load();
    expect(api.quarantine).toHaveBeenCalled();
  });

  test('does not quarantine a valid save', async () => {
    _disk = envelope();
    await Save.load();
    expect(api.quarantine).not.toHaveBeenCalled();
  });

  test('rejects a non-object envelope', async () => {
    _disk = '42';
    expect(await Save.load()).toEqual({ kind: 'rejected', reason: 'shape' });
  });

  test('rejects a missing version', async () => {
    _disk = JSON.stringify({ state: validState });
    expect(await Save.load()).toEqual({ kind: 'rejected', reason: 'shape' });
  });

  test('rejects a non-integer version', async () => {
    _disk = envelope({ version: 1.5 });
    expect(await Save.load()).toEqual({ kind: 'rejected', reason: 'shape' });
  });

  test('rejects a missing state', async () => {
    _disk = JSON.stringify({ version: 1 });
    expect(await Save.load()).toEqual({ kind: 'rejected', reason: 'shape' });
  });

  test('rejects a null state', async () => {
    _disk = envelope({ state: null });
    expect(await Save.load()).toEqual({ kind: 'rejected', reason: 'shape' });
  });

  test('rejects an array state', async () => {
    _disk = envelope({ state: [] });
    expect(await Save.load()).toEqual({ kind: 'rejected', reason: 'shape' });
  });
});

describe('Save.load field validation', () => {
  test.each([
    ['a string number', { gold: '5' }],
    ['a negative', { gold: -1 }],
    ['null', { gold: null }],
    ['Infinity via 1e999', { gold: 1e999 }],
    ['a non-finite letter count', { letters: 1e999 }],
    ['currentPage 0', { currentPage: 0 }],
    ['a fractional currentPage', { currentPage: 1.5 }],
    ['a fractional codices', { codices: 1.5 }],
    ['null goldLevels', { goldLevels: null }],
    ['null saltLevels', { saltLevels: null }],
    ['a missing totalGold', { totalGold: undefined }],
  ])('rejects %s', async (_label, over) => {
    _disk = withState(over);
    expect(await Save.load()).toEqual({ kind: 'rejected', reason: 'shape' });
  });

  test('falls back to 0 for a bad value on a known id', async () => {
    _disk = withState({ goldLevels: { g_quill: 'x' } });
    const out = await Save.load();
    expect(out.kind).toBe('loaded');
    if (out.kind === 'loaded') expect(out.state.goldLevels['g_quill']).toBe(0);
  });

  test('clamps a level above max', async () => {
    _disk = withState({ goldLevels: { g_quill: 999 } });
    const out = await Save.load();
    if (out.kind === 'loaded') expect(out.state.goldLevels['g_quill']).toBe(10);
  });

  test('drops an unknown upgrade id', async () => {
    _disk = withState({ goldLevels: { not_real: 4 } });
    const out = await Save.load();
    if (out.kind === 'loaded') expect(out.state.goldLevels).not.toHaveProperty('not_real');
  });

  test('defaults an id absent from the save to 0', async () => {
    _disk = withState({ goldLevels: { g_quill: 1 } });
    const out = await Save.load();
    if (out.kind === 'loaded') expect(out.state.goldLevels['g_ruling']).toBe(0);
  });

  test('ignores a prototype-polluting key', async () => {
    _disk = withState({ goldLevels: JSON.parse('{"__proto__": 5, "g_quill": 1}') });
    const out = await Save.load();
    expect(out.kind).toBe('loaded');
    if (out.kind === 'loaded') expect(out.state.goldLevels['g_quill']).toBe(1);
  });
});

describe('Save migration chain', () => {
  afterEach(() => { delete Save.MIGRATIONS[0]; });

  test('runs a migration for an older version', async () => {
    Save.MIGRATIONS[0] = (s) => ({ ...s, gold: 7 });
    _disk = JSON.stringify({ version: 0, savedAt: 1, state: validState });
    const out = await Save.load();
    expect(out.kind).toBe('loaded');
    if (out.kind === 'loaded') expect(out.state.gold).toBe(7);
  });

  test('rejects when a migration step is missing', async () => {
    _disk = JSON.stringify({ version: 0, savedAt: 1, state: validState });
    expect(await Save.load()).toEqual({ kind: 'rejected', reason: 'shape' });
  });

  test('rejects when a migration produces an invalid shape', async () => {
    Save.MIGRATIONS[0] = () => ({ gold: 'broken' });
    _disk = JSON.stringify({ version: 0, savedAt: 1, state: validState });
    expect(await Save.load()).toEqual({ kind: 'rejected', reason: 'shape' });
  });
});

describe('Save restores derived state', () => {
  test('recomputes saltBonus, clickPower and autoRate from levels alone', () => {
    // play it live: buy real levels, capture the derived values
    const quill     = Config.GOLD_UPGRADES.find(u => u.id === 'g_quill')!;
    const apprentice = Config.GOLD_UPGRADES.find(u => u.id === 'g_apprentice')!;
    const benefice  = Config.SALT_UPGRADES.find(u => u.id === 's_benefice')!;
    const vellum    = Config.SALT_UPGRADES.find(u => u.id === 's_vellum')!;

    State.addSalt(10_000);
    State.addGold(1_000_000);
    Upgrades.buySalt(benefice);
    Upgrades.buySalt(benefice);
    Upgrades.buySalt(vellum);
    Upgrades.buyGold(quill);
    Upgrades.buyGold(apprentice);
    const live = State.get();
    expect(live.saltBonus).toBeGreaterThan(1);
    expect(live.autoRate).toBeGreaterThan(0);

    const persisted = State.serialize();
    State.reset();
    State.hydrate(persisted);
    State.recomputeSalt();
    Upgrades.recompute();

    const restored = State.get();
    expect(restored.saltBonus).toBe(live.saltBonus);
    expect(restored.clickPower).toBe(live.clickPower);
    expect(restored.autoRate).toBe(live.autoRate);
    expect(restored.goldPerPage).toBe(live.goldPerPage);
    expect(restored.startingGold).toBe(live.startingGold);
  });

  test('autoRate is wrong if recomputeSalt is skipped', () => {
    // 3 Benefice (saltBonus 1.3) x 3 Apprentice (autoAdd 6) -> 8 with, 6 without
    const persisted = {
      ...State.serialize(),
      goldLevels: { g_apprentice: 3 },
      saltLevels: { s_benefice: 3 },
    };

    State.hydrate(persisted);
    State.recomputeSalt();
    Upgrades.recompute();
    const correct = State.get().autoRate;

    State.hydrate(persisted);
    Upgrades.recompute();          // recomputeSalt skipped: saltBonus stays 1.0
    const wrong = State.get().autoRate;

    expect(correct).toBe(8);
    expect(wrong).toBe(6);
  });
});

describe('Save round-trip', () => {
  test('a played state survives serialize -> disk -> load -> hydrate', async () => {
    State.addGold(500);
    Upgrades.buyGold(Config.GOLD_UPGRADES.find(u => u.id === 'g_quill')!);
    State.addLetters(250);
    State.addSalt(20);
    Upgrades.buySalt(Config.SALT_UPGRADES.find(u => u.id === 's_benefice')!);
    State.recomputeSalt();
    Upgrades.recompute();
    const before = State.get();

    await Save.flush(true);
    State.reset();

    const out = await Save.load();
    expect(out.kind).toBe('loaded');
    if (out.kind !== 'loaded') return;
    State.hydrate(out.state);
    State.recomputeSalt();
    Upgrades.recompute();

    expect(State.get()).toEqual(before);
  });

  test('a bound codex survives the round-trip', async () => {
    State.addLetters(100 * 300);
    State.bindCodex();
    const before = State.get();

    await Save.flush(true);
    State.reset();
    const out = await Save.load();
    if (out.kind !== 'loaded') throw new Error('expected loaded');
    State.hydrate(out.state);
    State.recomputeSalt();
    Upgrades.recompute();

    expect(State.get().codices).toBe(before.codices);
    expect(State.get().salt).toBe(before.salt);
  });
});

describe('Save.flush and dirty tracking', () => {
  test('does nothing when clean', async () => {
    await Save.flush();
    expect(api.write).not.toHaveBeenCalled();
  });

  test('writes when dirty', async () => {
    Save.markDirty();
    await Save.flush();
    expect(api.write).toHaveBeenCalledTimes(1);
  });

  test('writes when forced even if clean', async () => {
    await Save.flush(true);
    expect(api.write).toHaveBeenCalledTimes(1);
  });

  test('clears the dirty flag after writing', async () => {
    Save.markDirty();
    await Save.flush();
    await Save.flush();
    expect(api.write).toHaveBeenCalledTimes(1);
  });

  test('also refreshes the quit cache', async () => {
    Save.markDirty();
    await Save.flush();
    expect(api.cache).toHaveBeenCalledTimes(1);
  });

  test('writes an envelope with the current version', async () => {
    await Save.flush(true);
    expect(JSON.parse(_disk!).version).toBe(Save.SAVE_VERSION);
  });

  test('does nothing when the bridge is unavailable', async () => {
    vi.stubGlobal('saveAPI', undefined);
    Save.markDirty();
    await Save.flush();
    expect(api.write).not.toHaveBeenCalled();
  });
});

describe('Save autosave timers', () => {
  test('caches every second while dirty without writing', () => {
    vi.useFakeTimers();
    Save.startAutosave();
    Save.markDirty();
    vi.advanceTimersByTime(CACHE_TICKS);
    expect(api.cache).toHaveBeenCalled();
    expect(api.write).not.toHaveBeenCalled();
  });

  test('does not cache while clean', () => {
    vi.useFakeTimers();
    Save.startAutosave();
    vi.advanceTimersByTime(CACHE_TICKS);
    expect(api.cache).not.toHaveBeenCalled();
  });

  test('writes durably on the slower tick', () => {
    vi.useFakeTimers();
    Save.startAutosave();
    Save.markDirty();
    vi.advanceTimersByTime(15_000);
    expect(api.write).toHaveBeenCalledTimes(1);
  });

  test('does not write again without a new mutation', async () => {
    vi.useFakeTimers();
    Save.startAutosave();
    Save.markDirty();
    vi.advanceTimersByTime(15_000);
    await Promise.resolve();
    vi.advanceTimersByTime(15_000);
    expect(api.write).toHaveBeenCalledTimes(1);
  });

  test('starting twice does not stack timers', () => {
    vi.useFakeTimers();
    Save.startAutosave();
    Save.startAutosave();
    Save.markDirty();
    vi.advanceTimersByTime(CACHE_TICKS);
    expect(api.cache).toHaveBeenCalledTimes(1);
  });

  test('stopAutosave halts the timers', () => {
    vi.useFakeTimers();
    Save.startAutosave();
    Save.markDirty();
    Save.stopAutosave();
    vi.advanceTimersByTime(60_000);
    expect(api.cache).not.toHaveBeenCalled();
    expect(api.write).not.toHaveBeenCalled();
  });
});

describe('Save.wipe', () => {
  test('deletes the file', async () => {
    _disk = envelope();
    await Save.wipe();
    expect(_disk).toBeNull();
  });

  test('clears the dirty flag so the next tick does not re-save', async () => {
    Save.markDirty();
    await Save.wipe();
    await Save.flush();
    expect(api.write).not.toHaveBeenCalled();
  });

  test('tolerates an unavailable bridge', async () => {
    vi.stubGlobal('saveAPI', undefined);
    await expect(Save.wipe()).resolves.toBeUndefined();
  });
});
