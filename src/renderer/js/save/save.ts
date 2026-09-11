import type { PersistedState } from '../state/state.types';
import type { LoadOutcome, Migration, SaveEnvelope } from './save.types';
import Config from '../config/index';
import State from '../state';

const SAVE_VERSION = 1;
const CACHE_MS = 1_000;
const WRITE_MS = 15_000;

const MIGRATIONS: Record<number, Migration> = {};

let _dirty = false;
let _cacheTimer: ReturnType<typeof setInterval> | null = null;
let _writeTimer: ReturnType<typeof setInterval> | null = null;

const markDirty = (): void => { _dirty = true; };

// rejects "5", null, -1 and 1e999 (which JSON parses to Infinity)
const isNum = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v >= 0;

const isInt = (v: unknown): v is number => isNum(v) && Number.isInteger(v);

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const readLevels = (
  raw: unknown,
  defs: readonly { id: string; max: number }[],
): Record<string, number> => {
  const src = isPlainObject(raw) ? raw : {};
  const out: Record<string, number> = {};
  // walk config ids, never the file's keys
  defs.forEach(u => {
    const v = src[u.id];
    out[u.id] = isInt(v) ? Math.min(v, u.max) : 0;
  });
  return out;
};

const validate = (raw: unknown): PersistedState | null => {
  if (!isPlainObject(raw)) return null;
  if (!isNum(raw['gold']) || !isNum(raw['totalGold'])) return null;
  if (!isNum(raw['salt']) || !isNum(raw['totalSalt'])) return null;
  if (!isNum(raw['letters']) || !isNum(raw['totalLetters'])) return null;
  if (!isInt(raw['currentPage']) || raw['currentPage'] < 1) return null;
  if (!isInt(raw['codices'])) return null;
  if (!isPlainObject(raw['goldLevels']) || !isPlainObject(raw['saltLevels'])) return null;

  return {
    gold: raw['gold'], totalGold: raw['totalGold'],
    salt: raw['salt'], totalSalt: raw['totalSalt'],
    letters: raw['letters'], totalLetters: raw['totalLetters'],
    currentPage: raw['currentPage'], codices: raw['codices'],
    goldLevels: readLevels(raw['goldLevels'], Config.GOLD_UPGRADES),
    saltLevels: readLevels(raw['saltLevels'], Config.SALT_UPGRADES),
  };
};

const migrate = (version: number, state: Record<string, unknown>): Record<string, unknown> | null => {
  let s = state;
  for (let v = version; v < SAVE_VERSION; v++) {
    const step = MIGRATIONS[v];
    if (!step) return null;
    s = step(s);
  }
  return s;
};

const parse = (text: string): LoadOutcome => {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { kind: 'rejected', reason: 'parse' };
  }

  if (!isPlainObject(raw) || !isInt(raw['version'])) return { kind: 'rejected', reason: 'shape' };
  if (raw['version'] > SAVE_VERSION) return { kind: 'rejected', reason: 'future' };

  if (!isPlainObject(raw['state'])) return { kind: 'rejected', reason: 'shape' };

  const migrated = migrate(raw['version'], raw['state']);
  if (!migrated) return { kind: 'rejected', reason: 'shape' };

  const state = validate(migrated);
  if (!state) return { kind: 'rejected', reason: 'shape' };

  return { kind: 'loaded', state };
};

const load = async (): Promise<LoadOutcome> => {
  const api = window.saveAPI;
  if (!api) return { kind: 'fresh' };

  const text = await api.read();
  if (text === null) return { kind: 'fresh' };

  const outcome = parse(text);
  if (outcome.kind === 'rejected') await api.quarantine();
  return outcome;
};

const snapshot = (): string => {
  const envelope: SaveEnvelope = {
    version: SAVE_VERSION,
    savedAt: Date.now(),
    state: State.serialize(),
  };
  return JSON.stringify(envelope);
};

const flush = async (force = false): Promise<void> => {
  if (!_dirty && !force) return;
  const api = window.saveAPI;
  if (!api) return;
  _dirty = false;
  const json = snapshot();
  api.cache(json);
  await api.write(json);
};

const pushCache = (): void => {
  if (!_dirty) return;
  window.saveAPI?.cache(snapshot());
};

const startAutosave = (): void => {
  if (_cacheTimer === null) _cacheTimer = setInterval(pushCache, CACHE_MS);
  if (_writeTimer === null) _writeTimer = setInterval(() => { void flush(); }, WRITE_MS);
};

const stopAutosave = (): void => {
  if (_cacheTimer !== null) { clearInterval(_cacheTimer); _cacheTimer = null; }
  if (_writeTimer !== null) { clearInterval(_writeTimer); _writeTimer = null; }
};

const wipe = async (): Promise<void> => {
  _dirty = false;
  await window.saveAPI?.wipe();
};

export default {
  SAVE_VERSION, MIGRATIONS,
  load, flush, wipe, markDirty, startAutosave, stopAutosave, snapshot,
};
