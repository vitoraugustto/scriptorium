// @vitest-environment jsdom
import { vi } from 'vitest';
import Sound from './sound';

interface FakeAudio {
  src: string;
  volume: number;
  currentTime: number;
  preload: string;
  duration: number;
  pause: ReturnType<typeof vi.fn>;
  play: ReturnType<typeof vi.fn>;
}

let created: FakeAudio[] = [];
let playRejects = false;

class AudioStub {
  src: string;
  volume = 1;
  currentTime = 0;
  preload = '';
  duration = 11.6;
  pause = vi.fn();
  play = vi.fn(() => (playRejects ? Promise.reject(new Error('no codec')) : Promise.resolve()));

  constructor(src: string) {
    this.src = src;
    created.push(this as unknown as FakeAudio);
  }
}

const playsFor = (src: string): number =>
  created.filter(a => a.src.includes(src)).reduce((n, a) => n + a.play.mock.calls.length, 0);

beforeEach(() => {
  created = [];
  playRejects = false;
  vi.stubGlobal('Audio', AudioStub);
  vi.useFakeTimers();
  vi.setSystemTime(0);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('Sound.init', () => {
  test('creates a pool for every sound', () => {
    Sound.init();
    expect(created.length).toBeGreaterThan(0);
  });

  test('gives the quill a larger pool than the codex bind', () => {
    Sound.init();
    const quill = created.filter(a => a.src.includes('quill')).length;
    const bind = created.filter(a => a.src.includes('codex-bind')).length;
    expect(quill).toBeGreaterThan(bind);
  });

  test('applies default volume scaled by per-sound gain', () => {
    Sound.init({ volume: 1 });
    const bind = created.find(a => a.src.includes('codex-bind'))!;
    const quill = created.find(a => a.src.includes('quill'))!;
    expect(bind.volume).toBe(1);
    expect(quill.volume).toBeLessThan(bind.volume);
  });

  test('clamps volume above 1', () => {
    Sound.init({ volume: 5 });
    expect(Sound.getSettings().volume).toBe(1);
  });

  test('clamps negative volume to 0', () => {
    Sound.init({ volume: -2 });
    expect(Sound.getSettings().volume).toBe(0);
  });

  test('starts muted when asked', () => {
    Sound.init({ muted: true });
    expect(Sound.getSettings().muted).toBe(true);
  });

  test('is a no-op when Audio is unavailable', () => {
    vi.stubGlobal('Audio', undefined);
    expect(() => Sound.init()).not.toThrow();
  });
});

describe('Sound.play', () => {
  test('plays the requested sound', () => {
    Sound.init();
    Sound.play('pageTurn');
    expect(playsFor('page-turn')).toBe(1);
  });

  test('does nothing when muted', () => {
    Sound.init({ muted: true });
    Sound.play('pageTurn');
    expect(playsFor('page-turn')).toBe(0);
  });

  test('does nothing before init', () => {
    // no init call in this test
    expect(() => Sound.play('quill')).not.toThrow();
  });

  test('cycles through the pool so overlapping sounds do not cut each other', () => {
    Sound.init();
    const before = created.filter(a => a.src.includes('page-turn'));
    Sound.play('pageTurn');
    Sound.play('pageTurn');
    expect(before[0]!.play).toHaveBeenCalledTimes(1);
    expect(before[1]!.play).toHaveBeenCalledTimes(1);
  });

  test('rewinds a reused element', () => {
    Sound.init();
    const el = created.find(a => a.src.includes('codex-bind'))!;
    el.currentTime = 5;
    Sound.play('codexBind');
    expect(el.currentTime).toBe(0);
  });

  test('swallows a rejected play promise', () => {
    playRejects = true;
    Sound.init();
    expect(() => Sound.play('quill')).not.toThrow();
  });

  test('throttles the quill so auto scribes cannot buzz', () => {
    Sound.init();
    for (let i = 0; i < 10; i++) Sound.play('quill');
    expect(playsFor('quill')).toBe(1);
  });

  test('plays the quill again once the interval has passed', () => {
    Sound.init();
    Sound.play('quill');
    vi.setSystemTime(100);
    Sound.play('quill');
    expect(playsFor('quill')).toBe(2);
  });

  test('does not throttle the page turn', () => {
    Sound.init();
    Sound.play('pageTurn');
    Sound.play('pageTurn');
    expect(playsFor('page-turn')).toBe(2);
  });
});

describe('Sound.setVolume / setMuted', () => {
  test('setVolume updates live elements', () => {
    Sound.init({ volume: 0.2 });
    Sound.setVolume(1);
    const bind = created.find(a => a.src.includes('codex-bind'))!;
    expect(bind.volume).toBe(1);
  });

  test('setVolume clamps out-of-range input', () => {
    Sound.init();
    Sound.setVolume(9);
    expect(Sound.getSettings().volume).toBe(1);
  });

  test('setMuted silences the elements', () => {
    Sound.init({ volume: 1 });
    Sound.setMuted(true);
    const bind = created.find(a => a.src.includes('codex-bind'))!;
    expect(bind.volume).toBe(0);
  });

  test('unmuting restores the volume', () => {
    Sound.init({ volume: 1 });
    Sound.setMuted(true);
    Sound.setMuted(false);
    const bind = created.find(a => a.src.includes('codex-bind'))!;
    expect(bind.volume).toBe(1);
  });

  test('getSettings returns a copy', () => {
    Sound.init();
    const a = Sound.getSettings();
    a.volume = 0.123;
    expect(Sound.getSettings().volume).not.toBe(0.123);
  });
});

describe('Sound quill slicing', () => {
  const quills = (): FakeAudio[] => created.filter(a => a.src.includes('quill'));

  test('starts each play at a different offset', () => {
    Sound.init();
    const seen = new Set<number>();
    for (let i = 0; i < 6; i++) {
      vi.setSystemTime(i * 100);
      Sound.play('quill');
    }
    quills().forEach(a => seen.add(a.currentTime));
    expect(seen.size).toBeGreaterThan(1);
  });

  test('never starts so late that the slice runs past the end', () => {
    Sound.init();
    for (let i = 0; i < 6; i++) {
      vi.setSystemTime(i * 100);
      Sound.play('quill');
    }
    quills().forEach(a => {
      expect(a.currentTime).toBeGreaterThanOrEqual(0);
      expect(a.currentTime).toBeLessThanOrEqual(11.6 - 0.22);
    });
  });

  test('stops the slice after its duration', () => {
    Sound.init();
    Sound.play('quill');
    const playing = quills().find(a => a.play.mock.calls.length > 0)!;
    expect(playing.pause).not.toHaveBeenCalled();
    vi.advanceTimersByTime(250);
    expect(playing.pause).toHaveBeenCalled();
  });

  test('replaying the same element cancels the previous stop timer', () => {
    Sound.init();
    for (let i = 0; i < 7; i++) {
      vi.setSystemTime(i * 100);
      Sound.play('quill');
    }
    // pool of 6, so the 7th reuses the first element while it may still be pending
    expect(() => vi.advanceTimersByTime(500)).not.toThrow();
  });

  test('falls back to the start when duration is unknown', () => {
    Sound.init();
    quills().forEach(a => { a.duration = NaN; });
    Sound.play('quill');
    const playing = quills().find(a => a.play.mock.calls.length > 0)!;
    expect(playing.currentTime).toBe(0);
  });

  test('does not slice sounds that have no slice configured', () => {
    Sound.init();
    Sound.play('pageTurn');
    const el = created.find(a => a.src.includes('page-turn') && a.play.mock.calls.length > 0)!;
    expect(el.currentTime).toBe(0);
    vi.advanceTimersByTime(2000);
    expect(el.pause).not.toHaveBeenCalled();
  });
});
