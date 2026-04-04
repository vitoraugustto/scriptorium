import type { FolioLayout } from '../types';
import Config from '../config/index';
import State from '../state';

const svgEl = <K extends keyof SVGElementTagNameMap>(tag: K): SVGElementTagNameMap[K] =>
  document.createElementNS('http://www.w3.org/2000/svg', tag) as SVGElementTagNameMap[K];

const $ = (id: string): HTMLElement => document.getElementById(id)!;
const $svg = (id: string): SVGSVGElement => document.getElementById(id) as unknown as SVGSVGElement;

// ── Active layout ────────────────────────────────────────────
let _layout: FolioLayout = Config.FOLIO_LAYOUTS.single;

const setLayout = (name: string): void => {
  _layout = Config.FOLIO_LAYOUTS[name];
  _renderRules();
  _measureCapacity();
  clearFolio();
};

// ── Ruled lines & margins (redrawn when layout changes) ──────
const _renderRules = (): void => {
  const g = $('js-folio-rules');
  g.innerHTML = '';
  for (const r of _layout.rules) {
    if (!r.red && !r.marg) continue;
    const el = svgEl('line');
    el.setAttribute('x1', String(r.x1)); el.setAttribute('y1', String(r.y1));
    el.setAttribute('x2', String(r.x2)); el.setAttribute('y2', String(r.y2));
    if (r.red) {
      el.setAttribute('stroke', 'rgba(139,58,26,0.45)');
      el.setAttribute('stroke-width', '0.8');
    } else {
      el.setAttribute('stroke', 'rgba(61,48,24,0.18)');
      el.setAttribute('stroke-width', '0.6');
    }
    g.appendChild(el);
  }
};

// ── Folio text — line-by-line ────────────────────────────────
let _words: string[] = [], _lines: string[] = [], _lastChars = -1, _buf = '';

const _refill = (): void => {
  const w = Config.LOREM;
  for (let i = 0; i < 120; i++) _words.push(w[Math.floor(Math.random() * w.length)]);
};
_refill();

const _nextWord = (): string => {
  if (_words.length < 10) _refill();
  return _words.shift()!;
};

const _FONT_SIZE = 6.2;

const _measureText = (str: string): number => {
  const svg = $svg('js-folio');
  const t = svgEl('text');
  t.setAttribute('font-family', 'IM Fell English, serif');
  t.setAttribute('font-size', String(_FONT_SIZE));
  t.setAttribute('font-style', 'italic');
  t.setAttribute('visibility', 'hidden');
  t.textContent = str;
  svg.appendChild(t);
  const w = t.getComputedTextLength();
  svg.removeChild(t);
  return w;
};

const _fitLine = (colW: number): string => {
  while (_buf.length < 200) _buf += ' ' + _nextWord();
  _buf = _buf.trimStart();
  let lo = 1, hi = _buf.length, fit = 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (_measureText(_buf.slice(0, mid)) <= colW) { fit = mid; lo = mid + 1; }
    else hi = mid - 1;
  }
  let line: string, rest: string;
  if (_buf[fit] === ' ' || _buf[fit - 1] === ' ') {
    line = _buf.slice(0, fit).trimEnd();
    rest = _buf.slice(fit).trimStart();
  } else {
    line = _buf.slice(0, fit - 1) + '-';
    rest = _buf.slice(fit - 1);
  }
  _buf = rest;
  return line;
};

const _buildLines = (target: number): void => {
  let cached = _lines.reduce((s, l) => s + l.length, 0);
  if (cached >= target) return;
  const L = _layout;
  const totalSlots = L.slots.reduce((s, sl) => s + sl.lines, 0);

  let slotIdx = 0, slotLine = _lines.length;
  for (const sl of L.slots) {
    if (slotLine < sl.lines) break;
    slotLine -= sl.lines;
    slotIdx++;
  }

  while (cached < target && _lines.length < totalSlots) {
    const sl = L.slots[slotIdx];
    const colW = sl.xEnd - sl.xStart;
    const line = _fitLine(colW);
    _lines.push(line);
    cached += line.length;
    slotLine++;
    if (slotLine >= sl.lines) { slotIdx++; slotLine = 0; }
  }
};

const _makeTextEl = (
  x: number, y: number, display: string, opacity: string,
  redWords = 0, lineIdx = 0,
): SVGTextElement => {
  const t = svgEl('text');
  t.setAttribute('x', String(x));
  t.setAttribute('y', String(y));
  t.setAttribute('font-family', 'IM Fell English, serif');
  t.setAttribute('font-size', String(_FONT_SIZE));
  t.setAttribute('font-style', 'italic');
  t.setAttribute('fill', '#1e1608');
  t.setAttribute('opacity', opacity);

  if (redWords <= 0) {
    t.textContent = display;
    return t;
  }

  const tokens = display.split(/(\s+)/);
  let wordIdx = 0;
  let first = true;
  for (const tok of tokens) {
    const span = svgEl('tspan');
    const isWord = /\S/.test(tok);
    if (isWord) {
      const hash = (lineIdx * 31 + wordIdx * 7 + 3) % 100;
      span.setAttribute('fill', hash < redWords ? '#8b3a1a' : 'inherit');
      wordIdx++;
    }
    if (first) { span.setAttribute('x', String(x)); first = false; }
    span.textContent = tok;
    t.appendChild(span);
  }
  return t;
};

const refreshFolio = (): void => {
  const chars = State.get().letters;
  if (chars === _lastChars) return;
  _lastChars = chars;

  const g = $('js-folio-text');
  g.innerHTML = '';

  const capLetter = document.getElementById('js-cap-letter');
  const capBox    = document.getElementById('js-cap-box');
  if (capLetter) {
    capLetter.setAttribute('opacity', '0');
    capBox!.setAttribute('stroke', 'rgba(184,146,10,0)');
    capBox!.setAttribute('fill', 'rgba(248,238,210,0)');
  }

  if (!chars) return;

  _buildLines(chars);
  const L = _layout;
  const rulingLvl = State.get().goldLevels['g_ruling'] || 0;
  let rem = chars;
  let lineIdx = 0;

  for (const sl of L.slots) {
    for (let i = 0; i < sl.lines; i++, lineIdx++) {
      const line = _lines[lineIdx]; if (!line || rem <= 0) break;
      const isComplete = rem >= line.length;
      const display    = isComplete ? line : line.slice(0, rem);
      const x = sl.xStart;
      const y = sl.yFirst + i * sl.yStep;
      g.appendChild(_makeTextEl(x, y, display, isComplete ? '0.76' : '0.38', rulingLvl, lineIdx));
      rem -= line.length;
    }
    if (rem <= 0) break;
  }
};

const clearFolio = (): void => {
  _lastChars = -1; _lines = []; _words = []; _buf = ''; _refill();
  refreshFolio();
};

const _measureCapacity = (): void => {
  const savedBuf = _buf;
  _buf = '';
  while (_buf.length < 400) _buf += ' ' + _nextWord();
  _buf = _buf.trimStart();

  let total = 0;
  for (const sl of _layout.slots) {
    const colW = sl.xEnd - sl.xStart;
    for (let li = 0; li < sl.lines; li++) {
      const line = _fitLine(colW);
      total += line.length;
    }
  }

  _buf = savedBuf;
  State.setPageCapacity(total);
};

const initRules = (): void => { _renderRules(); _measureCapacity(); };

const countRedWords = (): number => {
  const rulingLvl = State.get().goldLevels['g_ruling'] || 0;
  if (!rulingLvl) return 0;
  let count = 0;
  _lines.forEach((line, lineIdx) => {
    const words = line.split(/\s+/).filter(w => w.length > 0);
    words.forEach((_, wordIdx) => {
      const hash = (lineIdx * 31 + wordIdx * 7 + 3) % 100;
      if (hash < rulingLvl) count++;
    });
  });
  return count;
};

export { setLayout, refreshFolio, clearFolio, initRules, countRedWords };
