// @vitest-environment jsdom
import { setLayout, refreshFolio, clearFolio, initRules, countRedWords } from './folio';
import State from '../../state';

const SVG_NS = 'http://www.w3.org/2000/svg';

const buildFolioDOM = () => {
  document.body.innerHTML = `
    <svg id="js-folio" viewBox="0 0 210 300" xmlns="${SVG_NS}">
      <g id="js-folio-rules"></g>
      <rect id="js-cap-box" x="26" y="24" width="30" height="30"
        fill="rgba(0,0,0,0)" stroke="rgba(0,0,0,0)" stroke-width="0.8"/>
      <text id="js-cap-letter" x="41" y="49" text-anchor="middle"
        font-family="Uncial Antiqua, serif" font-size="30" opacity="0">V</text>
      <g id="js-folio-text"></g>
    </svg>
  `;
};

beforeEach(() => {
  buildFolioDOM();
  State.reset();
  State.setPageCapacity(100);
  clearFolio();
});

describe('initRules', () => {
  test('runs without error', () => {
    expect(() => initRules()).not.toThrow();
  });

  test('sets page capacity > 0', () => {
    initRules();
    expect(State.getPageCapacity()).toBeGreaterThan(0);
  });
});

describe('setLayout', () => {
  test('switches to double layout without error', () => {
    expect(() => setLayout('double')).not.toThrow();
  });

  test('switches to quad layout without error', () => {
    expect(() => setLayout('quad')).not.toThrow();
  });

  test('switches back to single layout', () => {
    setLayout('double');
    expect(() => setLayout('single')).not.toThrow();
  });
});

describe('countRedWords', () => {
  test('returns 0 when ruling level is 0', () => {
    expect(countRedWords()).toBe(0);
  });

  test('returns >= 0 when ruling level > 0 and lines present', () => {
    State.levelUpGold('g_ruling');
    State.setPageCapacity(50);
    State.addLetters(50);
    refreshFolio();
    expect(countRedWords()).toBeGreaterThanOrEqual(0);
  });

  test('returns a number based on ruling level', () => {
    for (let i = 0; i < 5; i++) State.levelUpGold('g_ruling');
    State.setPageCapacity(50);
    State.addLetters(50);
    refreshFolio();
    const count = countRedWords();
    expect(typeof count).toBe('number');
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

describe('refreshFolio', () => {
  test('does not throw when called with 0 letters', () => {
    expect(() => refreshFolio()).not.toThrow();
  });

  test('populates folio-text group with letter content', () => {
    State.addLetters(50);
    refreshFolio();
    const g = document.getElementById('js-folio-text')!;
    expect(g.children.length).toBeGreaterThan(0);
  });

  test('is a no-op when letter count unchanged', () => {
    State.addLetters(30);
    refreshFolio();
    const innerHTML1 = document.getElementById('js-folio-text')!.innerHTML;
    refreshFolio();
    const innerHTML2 = document.getElementById('js-folio-text')!.innerHTML;
    expect(innerHTML1).toBe(innerHTML2);
  });

  test('capital letter has opacity 0 when no s_capital upgrade', () => {
    State.addLetters(50);
    refreshFolio();
    const capLetter = document.getElementById('js-cap-letter')!;
    expect(capLetter.getAttribute('opacity')).toBe('0');
  });
});

describe('red word rendering', () => {
  test('renders SVG text with red words when ruling upgrade is at max', () => {
    for (let i = 0; i < 10; i++) State.levelUpGold('g_ruling');
    State.setPageCapacity(200);
    State.addLetters(100);
    refreshFolio();
    const g = document.getElementById('js-folio-text')!;
    expect(g.children.length).toBeGreaterThan(0);
    expect(g.innerHTML.length).toBeGreaterThan(0);
  });
});

describe('clearFolio', () => {
  test('clears the text layer (0 children when state also reset)', () => {
    State.addLetters(50);
    refreshFolio();
    State.reset();
    State.setPageCapacity(100);
    clearFolio();
    const g = document.getElementById('js-folio-text')!;
    expect(g.children.length).toBe(0);
  });
});
