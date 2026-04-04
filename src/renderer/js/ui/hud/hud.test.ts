// @vitest-environment jsdom
import { vi } from 'vitest';

// Must set up DOM before importing hud (which calls document.getElementById at call time, not module load)
const DOM_FIXTURE = `
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
  <span data-i18n="LABEL_SALT">Salt</span>
  <span data-i18n="LABEL_DENARII">Denarii</span>
`;

import { fmt, fmtSalt, refreshStats, refreshStaticLabels, flashKey, showToast, spawnFloat } from './hud';
import State from '../../state';

beforeEach(() => {
  document.body.innerHTML = DOM_FIXTURE;
  State.reset();
  State.setPageCapacity(100);
});

describe('fmt', () => {
  test('formats small numbers as-is', () => {
    expect(fmt(42)).toBe('42');
  });

  test('formats thousands with K suffix', () => {
    expect(fmt(1500)).toBe('1.5K');
  });

  test('formats millions with M suffix', () => {
    expect(fmt(2_500_000)).toBe('2.50M');
  });

  test('formats billions with B suffix', () => {
    expect(fmt(3_000_000_000)).toBe('3.00B');
  });

  test('formats trillions with T suffix', () => {
    expect(fmt(4_000_000_000_000)).toBe('4.00T');
  });

  test('floors before formatting', () => {
    expect(fmt(999.9)).toBe('999');
  });
});

describe('fmtSalt', () => {
  test('formats grams for small values', () => {
    expect(fmtSalt(50)).toBe('50 g');
  });

  test('formats kilograms', () => {
    expect(fmtSalt(1500)).toBe('1.50 kg');
  });

  test('formats tonnes', () => {
    expect(fmtSalt(2_000_000)).toBe('2.00 t');
  });
});

describe('refreshStaticLabels', () => {
  test('updates elements with data-i18n', () => {
    refreshStaticLabels();
    expect(document.querySelector('[data-i18n="LABEL_SALT"]')!.textContent).toBe('Salt');
  });
});

describe('refreshStats', () => {
  test('updates gold display', () => {
    State.addGold(42);
    refreshStats();
    expect(document.getElementById('js-gold')!.textContent).toBe('42');
  });

  test('updates salt display', () => {
    State.addSalt(5);
    refreshStats();
    expect(document.getElementById('js-salt')!.textContent).toBe('5 g');
  });

  test('updates codex count', () => {
    State.setPageCapacity(1);
    for (let i = 0; i < 300; i++) State.addLetters(1);
    State.bindCodex();
    refreshStats();
    expect(document.getElementById('js-codex-count')!.textContent).toBe('1');
  });

  test('disables codex button when cannot bind', () => {
    refreshStats();
    expect((document.getElementById('js-codex-btn') as HTMLButtonElement)!.disabled).toBe(true);
  });

  test('enables codex button when can bind', () => {
    State.setPageCapacity(1);
    for (let i = 0; i < 300; i++) State.addLetters(1);
    refreshStats();
    expect((document.getElementById('js-codex-btn') as HTMLButtonElement)!.disabled).toBe(false);
  });

  test('shows CODEX_READY when can bind', () => {
    State.setPageCapacity(1);
    for (let i = 0; i < 300; i++) State.addLetters(1);
    refreshStats();
    const note = document.getElementById('js-codex-note')!.textContent;
    expect(note).toContain('ready to bind');
  });

  test('shows pages remaining (plural) when far from bind', () => {
    refreshStats();
    const note = document.getElementById('js-codex-note')!.textContent;
    expect(note).toContain('pages remaining');
  });

  test('shows page remaining (singular) when exactly 1 page left', () => {
    State.setPageCapacity(1);
    for (let i = 0; i < 299; i++) State.addLetters(1);
    refreshStats();
    const note = document.getElementById('js-codex-note')!.textContent;
    expect(note).toContain('page remaining');
  });

  test('updates auto rate', () => {
    State.setStats({ click: 1, auto: 10 });
    refreshStats();
    expect(document.getElementById('js-auto-rate')!.textContent).toBe('10');
  });

  test('updates click power', () => {
    State.setStats({ click: 5, auto: 0 });
    refreshStats();
    expect(document.getElementById('js-info-click')!.textContent).toBe('5');
  });

  test('updates salt bonus display', () => {
    State.levelUpSalt('s_benefice');
    State.recomputeSalt();
    refreshStats();
    expect(document.getElementById('js-info-bonus')!.textContent).toBe('+10%');
  });

  test('updates scribe title', () => {
    refreshStats();
    expect(document.getElementById('js-scribe-title')!.textContent).toBe('Novice Scribe');
  });
});

describe('flashKey', () => {
  test('adds show class to flash element', () => {
    flashKey();
    expect(document.getElementById('js-flash')!.classList.contains('show')).toBe(true);
  });
});

describe('showToast', () => {
  test('sets toast text and show class', () => {
    showToast('hello world');
    const el = document.getElementById('js-toast')!;
    expect(el.textContent).toBe('hello world');
    expect(el.classList.contains('show')).toBe(true);
  });
});

describe('spawnFloat', () => {
  test('appends float element to body', () => {
    spawnFloat(100, 100, '+1 <i data-lucide="coins"></i>', 'dn');
    expect(document.querySelector('.float-num.dn')).not.toBeNull();
  });
});
