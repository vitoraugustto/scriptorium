// @vitest-environment jsdom
import { vi } from 'vitest';

const DOM_FIXTURE = `
  <div id="list-dn"></div>
  <div id="list-salt"></div>
  <span id="js-gold"></span>
  <span id="js-salt"></span>
  <span id="js-scribe-title"></span>
  <span id="js-info-gold"></span>
  <span id="js-info-salt"></span>
  <span id="js-codex-count"></span>
  <span id="js-auto-rate"></span>
  <span id="js-info-click"></span>
  <span id="js-info-bonus"></span>
  <div id="js-prog-page" style="width:0%"></div>
  <div id="js-prog-codex" style="width:0%"></div>
  <span id="js-prog-page-stat"></span>
  <span id="js-prog-codex-stat"></span>
  <button id="js-codex-btn" disabled></button>
  <div id="js-codex-note"></div>
  <div id="js-flash"></div>
  <div id="js-toast"></div>
`;

// Mock UI to avoid needing full DOM (folio SVG, etc.)
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

// Mock Upgrades
vi.mock('./upgrades', () => ({
  default: {
    recompute: vi.fn(),
  },
}));

// Must mock Env.DEBUG = true before importing Debug
vi.mock('./env', () => ({ default: Object.freeze({ DEBUG: true }) }));

import Debug from './debug';
import State from './state';

const mockCreateIcons = vi.fn();
const mockIcons = {};

beforeEach(() => {
  document.body.innerHTML = DOM_FIXTURE;
  State.reset();
  State.setPageCapacity(100);
  mockCreateIcons.mockClear();
  Debug.init(mockCreateIcons, mockIcons);
});

describe('Debug.init', () => {
  test('appends debug button to body when DEBUG=true', () => {
    expect(document.querySelector('.debug-btn')).not.toBeNull();
  });

  test('appends debug panel to body', () => {
    expect(document.querySelector('.debug-panel')).not.toBeNull();
  });

  test('calls createIcons after init', () => {
    expect(mockCreateIcons).toHaveBeenCalled();
  });

  test('panel is closed initially', () => {
    const panel = document.querySelector('.debug-panel');
    expect(panel.classList.contains('open')).toBe(false);
  });

  test('panel opens on debug button click', () => {
    const btn = document.querySelector('.debug-btn') as HTMLElement;
    btn.click();
    const panel = document.querySelector('.debug-panel');
    expect(panel.classList.contains('open')).toBe(true);
  });

  test('panel closes on document click', () => {
    const btn = document.querySelector('.debug-btn') as HTMLElement;
    btn.click();
    document.dispatchEvent(new Event('click'));
    const panel = document.querySelector('.debug-panel');
    expect(panel.classList.contains('open')).toBe(false);
  });
});

describe('Debug.refreshLabels', () => {
  test('rebuilds panel without error', () => {
    expect(() => Debug.refreshLabels()).not.toThrow();
  });

  test('panel still exists after refreshLabels', () => {
    Debug.refreshLabels();
    expect(document.querySelector('.debug-panel')).not.toBeNull();
  });

  test('open state is preserved after refreshLabels', () => {
    const btn = document.querySelector('.debug-btn') as HTMLElement;
    btn.click();
    Debug.refreshLabels();
    const panel = document.querySelector('.debug-panel');
    expect(panel.classList.contains('open')).toBe(true);
  });

  test('is no-op when panel not initialized', () => {
    expect(() => Debug.refreshLabels()).not.toThrow();
  });
});

describe('Debug input sections', () => {
  test('apply button adds gold when value is valid', () => {
    const inputs = document.querySelectorAll('.debug-input');
    const goldInput = inputs[0] as HTMLInputElement;
    goldInput.value = '100';
    const btn = goldInput.nextElementSibling as HTMLElement;
    btn.click();
    expect(State.get().gold).toBe(100);
  });

  test('apply button adds salt when value is valid', () => {
    const inputs = document.querySelectorAll('.debug-input');
    const saltInput = inputs[1] as HTMLInputElement;
    saltInput.value = '5';
    const btn = saltInput.nextElementSibling as HTMLElement;
    btn.click();
    expect(State.get().salt).toBe(5);
  });

  test('apply button adds letters when value is valid', () => {
    const inputs = document.querySelectorAll('.debug-input');
    const lettersInput = inputs[2] as HTMLInputElement;
    lettersInput.value = '50';
    const btn = lettersInput.nextElementSibling as HTMLElement;
    btn.click();
    expect(State.get().totalLetters).toBe(50);
  });

  test('apply does nothing when value is NaN', () => {
    const inputs = document.querySelectorAll('.debug-input');
    const goldInput = inputs[0] as HTMLInputElement;
    goldInput.value = 'abc';
    const btn = goldInput.nextElementSibling as HTMLElement;
    btn.click();
    expect(State.get().gold).toBe(0);
  });

  test('apply does nothing when value is negative', () => {
    const inputs = document.querySelectorAll('.debug-input');
    const goldInput = inputs[0] as HTMLInputElement;
    goldInput.value = '-10';
    const btn = goldInput.nextElementSibling as HTMLElement;
    btn.click();
    expect(State.get().gold).toBe(0);
  });

  test('Enter key triggers apply button', () => {
    const inputs = document.querySelectorAll('.debug-input');
    const goldInput = inputs[0] as HTMLInputElement;
    goldInput.value = '50';
    goldInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(State.get().gold).toBe(50);
  });

  test('non-Enter key does not trigger apply', () => {
    const inputs = document.querySelectorAll('.debug-input');
    const goldInput = inputs[0] as HTMLInputElement;
    goldInput.value = '50';
    goldInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
    expect(State.get().gold).toBe(0);
  });
});

describe('Debug action sections (layout + reset)', () => {
  test('clicking Single layout button does not throw', () => {
    const actionBtns = document.querySelectorAll('.debug-action');
    const singleBtn = Array.from(actionBtns).find(b => b.textContent === 'Single') as HTMLElement;
    expect(() => singleBtn?.click()).not.toThrow();
  });

  test('clicking Double layout button does not throw', () => {
    const actionBtns = document.querySelectorAll('.debug-action');
    const doubleBtn = Array.from(actionBtns).find(b => b.textContent === 'Double') as HTMLElement;
    expect(() => doubleBtn?.click()).not.toThrow();
  });

  test('clicking Reset button resets state', () => {
    State.addGold(100);
    const actionBtns = document.querySelectorAll('.debug-action');
    const resetBtn = Array.from(actionBtns).find(b => b.textContent === 'Reset all progress') as HTMLElement;
    resetBtn?.click();
    expect(State.get().gold).toBe(0);
  });
});
