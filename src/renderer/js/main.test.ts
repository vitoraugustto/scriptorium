// @vitest-environment jsdom
import { vi } from 'vitest';

// Mock UI modules that need DOM from import time (folio uses SVG APIs)
vi.mock('./ui/index', () => ({
  default: {
    refreshStats: vi.fn(),
    refreshUpgrades: vi.fn(),
    refreshFolio: vi.fn(),
    refreshStaticLabels: vi.fn(),
    showToast: vi.fn(),
    flashKey: vi.fn(),
    spawnFloat: vi.fn(),
    setLayout: vi.fn(),
    clearFolio: vi.fn(),
    initRules: vi.fn(),
    countRedWords: vi.fn(() => 0),
    fmt: vi.fn((n) => String(n)),
    fmtSalt: vi.fn((n) => `${n} g`),
  },
}));

// Mock Upgrades to avoid full recompute dependency
vi.mock('./upgrades', () => ({
  default: {
    recompute: vi.fn(),
    buyGold: vi.fn(() => true),
    buySalt: vi.fn(() => true),
    affordableGold: vi.fn(() => 0),
    affordableSalt: vi.fn(() => 0),
  },
}));

const DOM_FIXTURE = `
  <button id="js-codex-btn"></button>
  <div id="js-codex-note"></div>
  <button class="stab" data-tab="dn"></button>
  <button class="stab" data-tab="salt"></button>
  <div id="panel-dn" class="active"></div>
  <div id="panel-salt"></div>
  <button id="js-info-btn"></button>
  <div id="js-info-panel"></div>
  <select id="js-lang-select"><option value="en">EN</option><option value="pt-BR">PT-BR</option></select>
`;

import Main from './main';
import State from './state';

beforeEach(() => {
  document.body.innerHTML = DOM_FIXTURE;
  State.reset();
  State.setPageCapacity(100);
  Main.init();
});

describe('Main keyboard handler', () => {
  test('letter key adds letters to state', () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    expect(State.get().totalLetters).toBeGreaterThan(0);
  });

  test('space key adds letters to state', () => {
    const before = State.get().totalLetters;
    document.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
    expect(State.get().totalLetters).toBeGreaterThan(before);
  });

  test('ctrl+key is ignored', () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', ctrlKey: true }));
    expect(State.get().totalLetters).toBe(0);
  });

  test('repeated key is ignored', () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', repeat: true }));
    expect(State.get().totalLetters).toBe(0);
  });

  test('non-letter key is ignored', () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'F5' }));
    expect(State.get().totalLetters).toBe(0);
  });
});

describe('Main tab switching', () => {
  test('clicking salt tab activates salt panel', () => {
    const saltTab = document.querySelector('[data-tab="salt"]') as HTMLElement;
    saltTab.click();
    expect(document.getElementById('panel-salt').classList.contains('active')).toBe(true);
  });

  test('clicking salt tab deactivates dn panel', () => {
    const saltTab = document.querySelector('[data-tab="salt"]') as HTMLElement;
    saltTab.click();
    expect(document.getElementById('panel-dn').classList.contains('active')).toBe(false);
  });

  test('clicking dn tab activates dn panel', () => {
    const saltTab = document.querySelector('[data-tab="salt"]') as HTMLElement;
    saltTab.click();
    const dnTab = document.querySelector('[data-tab="dn"]') as HTMLElement;
    dnTab.click();
    expect(document.getElementById('panel-dn').classList.contains('active')).toBe(true);
  });
});

describe('Main info panel', () => {
  test('info button toggles panel open', () => {
    const btn = document.getElementById('js-info-btn') as HTMLElement;
    btn.click();
    expect(document.getElementById('js-info-panel').classList.contains('open')).toBe(true);
  });

  test('document click closes info panel', () => {
    const btn = document.getElementById('js-info-btn') as HTMLElement;
    btn.click();
    document.dispatchEvent(new MouseEvent('click'));
    expect(document.getElementById('js-info-panel').classList.contains('open')).toBe(false);
  });
});

describe('Main.refresh', () => {
  test('refresh runs without error', () => {
    expect(() => Main.refresh()).not.toThrow();
  });
});

describe('Main codex bind', () => {
  test('codex button click triggers bind when canBind is true', () => {
    State.setPageCapacity(1);
    for (let i = 0; i < 300; i++) State.addLetters(1);
    const btn = document.getElementById('js-codex-btn') as HTMLButtonElement;
    btn.click();
    expect(State.get().codices).toBe(1);
  });

  test('codex button click does nothing when canBind is false', () => {
    const btn = document.getElementById('js-codex-btn') as HTMLButtonElement;
    btn.click();
    expect(State.get().codices).toBe(0);
  });
});

import I18n from './i18n/index';
import UI from './ui/index';

describe('Main lang select', () => {
  test('changing lang select updates locale', () => {
    const select = document.getElementById('js-lang-select') as HTMLSelectElement;
    select.value = 'pt-BR';
    select.dispatchEvent(new Event('change'));
    expect(I18n.getLocale()).toBe('pt-BR');
    I18n.setLocale('en');
  });

  test('onLocaleChange callback is called when locale changes', () => {
    const cb = vi.fn();
    document.body.innerHTML = DOM_FIXTURE;
    Main.init(cb);
    const select = document.getElementById('js-lang-select') as HTMLSelectElement;
    select.value = 'pt-BR';
    select.dispatchEvent(new Event('change'));
    expect(cb).toHaveBeenCalled();
    I18n.setLocale('en');
  });
});

describe('Main page turn on key press', () => {
  test('completes a page and triggers layout change when letters fill a page', () => {
    State.setPageCapacity(1);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    expect(UI.setLayout).toHaveBeenCalled();
  });
});

describe('Main auto loop', () => {
  test('auto loop runs without error when autoRate > 0', () => {
    vi.useFakeTimers();
    State.setStats({ click: 1, auto: 20 });
    vi.advanceTimersByTime(200);
    vi.useRealTimers();
    expect(true).toBe(true);
  });

  test('auto loop skips when autoRate is 0', () => {
    vi.useFakeTimers();
    State.setStats({ click: 1, auto: 0 });
    vi.advanceTimersByTime(200);
    vi.useRealTimers();
    expect(State.get().totalLetters).toBe(0);
  });
});

import Config from './config/index';

describe('Main handleBuyGold / handleBuySalt', () => {
  test('buying gold upgrade via callback triggers toast', () => {
    const capturedCallbacks: any = {};
    (UI.refreshUpgrades as ReturnType<typeof vi.fn>).mockImplementationOnce((onGold, onSalt) => {
      capturedCallbacks.onGold = onGold;
      capturedCallbacks.onSalt = onSalt;
    });
    Main.refresh();
    const quill = Config.GOLD_UPGRADES.find(u => u.id === 'g_quill');
    State.addGold(100);
    capturedCallbacks.onGold?.(quill);
    expect(UI.showToast).toHaveBeenCalled();
  });

  test('buying salt upgrade via callback triggers toast', () => {
    const capturedCallbacks: any = {};
    (UI.refreshUpgrades as ReturnType<typeof vi.fn>).mockImplementationOnce((onGold, onSalt) => {
      capturedCallbacks.onGold = onGold;
      capturedCallbacks.onSalt = onSalt;
    });
    Main.refresh();
    const benefice = Config.SALT_UPGRADES.find(u => u.id === 's_benefice');
    State.addSalt(100);
    capturedCallbacks.onSalt?.(benefice);
    expect(UI.showToast).toHaveBeenCalled();
  });
});
