import type { SoundId, SoundSettings, SoundSpec } from './sound.types';

import quillUrl     from '../../assets/sounds/quill.m4a';
import pageTurnUrl  from '../../assets/sounds/page-turn.m4a';
import codexBindUrl from '../../assets/sounds/codex-bind.m4a';
import upgradeUrl   from '../../assets/sounds/upgrade.m4a';

// `slice` turns one long recording into an endless supply of variations:
// every play starts at a random offset and stops after `slice` seconds, so
// repeated keystrokes never sound like the same clip twice.
const SPECS: Record<SoundId, SoundSpec> = {
  quill:     { url: quillUrl,     gain: 0.5, pool: 6, minIntervalMs: 40, slice: 0.22 },
  pageTurn:  { url: pageTurnUrl,  gain: 0.7, pool: 2, minIntervalMs: 0 },
  codexBind: { url: codexBindUrl, gain: 1,   pool: 1, minIntervalMs: 0 },
  upgrade:   { url: upgradeUrl,   gain: 0.6, pool: 2, minIntervalMs: 0 },
};

const DEFAULTS: SoundSettings = { volume: 0.6, muted: false };

// leave room at the end so a slice never runs past the recording
const SLICE_MARGIN = 0.05;

let _settings: SoundSettings = { ...DEFAULTS };
let _pools: Partial<Record<SoundId, HTMLAudioElement[]>> = {};
let _next: Partial<Record<SoundId, number>> = {};
let _lastPlayed: Partial<Record<SoundId, number>> = {};
let _stopTimers = new WeakMap<HTMLAudioElement, ReturnType<typeof setTimeout>>();
let _ready = false;

const _clamp01 = (n: number): number => Math.min(1, Math.max(0, n));

const _volumeFor = (id: SoundId): number =>
  _settings.muted ? 0 : _clamp01(_settings.volume * SPECS[id].gain);

const _applyVolume = (): void => {
  (Object.keys(_pools) as SoundId[]).forEach(id => {
    const vol = _volumeFor(id);
    _pools[id]?.forEach(el => { el.volume = vol; });
  });
};

const init = (settings: Partial<SoundSettings> = {}): void => {
  if (typeof Audio === 'undefined') return;

  _settings = {
    volume: _clamp01(settings.volume ?? DEFAULTS.volume),
    muted:  settings.muted ?? DEFAULTS.muted,
  };

  _pools = {};
  _next = {};
  _lastPlayed = {};
  _stopTimers = new WeakMap();

  (Object.keys(SPECS) as SoundId[]).forEach(id => {
    const pool: HTMLAudioElement[] = [];
    for (let i = 0; i < SPECS[id].pool; i++) {
      const el = new Audio(SPECS[id].url);
      el.preload = 'auto';
      pool.push(el);
    }
    _pools[id] = pool;
    _next[id] = 0;
  });

  _applyVolume();
  _ready = true;
};

// pick where in the recording this play should start
const _sliceStart = (el: HTMLAudioElement, slice: number): number => {
  const duration = el.duration;
  if (!Number.isFinite(duration) || duration <= slice + SLICE_MARGIN) return 0;
  return Math.random() * (duration - slice - SLICE_MARGIN);
};

const play = (id: SoundId): void => {
  if (!_ready || _settings.muted) return;

  const spec = SPECS[id];

  if (spec.minIntervalMs > 0) {
    const now = Date.now();
    const last = _lastPlayed[id];
    if (last !== undefined && now - last < spec.minIntervalMs) return;
    _lastPlayed[id] = now;
  }

  const pool = _pools[id];
  if (!pool || pool.length === 0) return;

  const idx = (_next[id] ?? 0) % pool.length;
  _next[id] = idx + 1;
  const el = pool[idx]!;

  const pending = _stopTimers.get(el);
  if (pending !== undefined) {
    clearTimeout(pending);
    _stopTimers.delete(el);
  }

  if (spec.slice !== undefined) {
    el.currentTime = _sliceStart(el, spec.slice);
    _stopTimers.set(el, setTimeout(() => {
      el.pause();
      _stopTimers.delete(el);
    }, spec.slice * 1000));
  } else {
    el.currentTime = 0;
  }

  // a missing or undecodable file must not break the game
  void el.play().catch(() => {});
};

const setVolume = (v: number): void => {
  _settings.volume = _clamp01(v);
  _applyVolume();
};

const setMuted = (m: boolean): void => {
  _settings.muted = m;
  _applyVolume();
};

const getSettings = (): SoundSettings => ({ ..._settings });

export default { init, play, setVolume, setMuted, getSettings };
