import Config from './config.js';
import State from './state.js';
import Upgrades from './upgrades.js';

const fmt = (n) => {
  n = Math.floor(n);
  if(n>=1e12) return (n/1e12).toFixed(2)+'T';
  if(n>=1e9)  return (n/1e9).toFixed(2)+'B';
  if(n>=1e6)  return (n/1e6).toFixed(2)+'M';
  if(n>=1e3)  return (n/1e3).toFixed(1)+'K';
  return n.toLocaleString();
};
const fmtSalt = (n) => {
  n = Math.floor(n);
  if(n>=1e6) return (n/1e6).toFixed(2)+' t';
  if(n>=1e3) return (n/1e3).toFixed(2)+' kg';
  return n+' g';
};
const $ = (id) => document.getElementById(id);
const svgEl = (tag) => document.createElementNS('http://www.w3.org/2000/svg', tag);

// ── Active layout ────────────────────────────────────────────
let _layout = Config.FOLIO_LAYOUTS.single;

const setLayout = (name) => {
  _layout = Config.FOLIO_LAYOUTS[name];
  _renderRules();
  _measureCapacity();
  clearFolio();
};

// ── Ruled lines & margins (redrawn when layout changes) ──────
const _renderRules = () => {
  const g = $('js-folio-rules');
  g.innerHTML = '';
  for (const r of _layout.rules) {
    if (!r.red && !r.marg) continue;
    const el = svgEl('line');
    el.setAttribute('x1', r.x1); el.setAttribute('y1', r.y1);
    el.setAttribute('x2', r.x2); el.setAttribute('y2', r.y2);
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
let _words=[], _lines=[], _lastChars=-1, _buf='';

const _refill = () => {
  const w=Config.LOREM;
  for(let i=0;i<120;i++) _words.push(w[Math.floor(Math.random()*w.length)]);
};
_refill();

const _nextWord = () => {
  if (_words.length < 10) _refill();
  return _words.shift();
};

const _measureText = (str) => {
  const svg = $('js-folio');
  const t = svgEl('text');
  t.setAttribute('font-family','IM Fell English, serif');
  t.setAttribute('font-size', _FONT_SIZE);
  t.setAttribute('font-style','italic');
  t.setAttribute('visibility','hidden');
  t.textContent = str;
  svg.appendChild(t);
  const w = t.getComputedTextLength();
  svg.removeChild(t);
  return w;
};

const _fitLine = (colW) => {
  while (_buf.length < 200) _buf += ' ' + _nextWord();
  _buf = _buf.trimStart();
  let lo = 1, hi = _buf.length, fit = 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (_measureText(_buf.slice(0, mid)) <= colW) { fit = mid; lo = mid + 1; }
    else hi = mid - 1;
  }
  let line, rest;
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

const _buildLines = (target) => {
  let cached = _lines.reduce((s,l)=>s+l.length, 0);
  if (cached >= target) return;
  const L = _layout;
  const capActive = L.type === 'single' && (State.get().saltLevels['s_capital'] || 0) > 0;
  const totalSlots = L.slots.reduce((s, sl) => s + sl.lines, 0);

  let slotIdx = 0, slotLine = _lines.length;
  for (const sl of L.slots) {
    if (slotLine < sl.lines) break;
    slotLine -= sl.lines;
    slotIdx++;
  }

  while (cached < target && _lines.length < totalSlots) {
    const sl = L.slots[slotIdx];
    const narrow = capActive && slotIdx === 0 && slotLine < 3;
    const colW = narrow ? (sl.xEnd - L.xCapEnd) : (sl.xEnd - sl.xStart);
    const line = _fitLine(colW);
    _lines.push(line);
    cached += line.length;
    slotLine++;
    if (slotLine >= sl.lines) { slotIdx++; slotLine = 0; }
  }
};

const _FONT_SIZE = 6.2;

const _makeTextEl = (x, y, display, opacity, redWords=0, lineIdx=0) => {
  const t = svgEl('text');
  t.setAttribute('x', x);
  t.setAttribute('y', y);
  t.setAttribute('font-family','IM Fell English, serif');
  t.setAttribute('font-size', _FONT_SIZE);
  t.setAttribute('font-style','italic');
  t.setAttribute('fill','#1e1608');
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
    if (first) { span.setAttribute('x', x); first = false; }
    span.textContent = tok;
    t.appendChild(span);
  }
  return t;
};

const refreshFolio = () => {
  const chars = State.get().letters;
  if (chars === _lastChars) return;
  _lastChars = chars;

  const g = $('js-folio-text');
  g.innerHTML = '';

  // ── capital (single layout only) ─────────────────────────
  const capLetter = $('js-cap-letter');
  const capBox    = $('js-cap-box');
  const capLvl    = State.get().saltLevels['s_capital']  || 0;
  const capLvl2   = State.get().saltLevels['s_capital2'] || 0;
  if (capLetter) {
    const showCap = capLvl > 0 && chars > 0 && _layout.type === 'single';
    if (showCap) {
      const first = _lines[0] ? _lines[0][0].toUpperCase() : 'V';
      capLetter.textContent = first;
      capLetter.setAttribute('fill','rgba(139,58,26,0.82)');
      capLetter.setAttribute('opacity','1');
      capBox.setAttribute('stroke', capLvl2>0 ? 'rgba(184,146,10,0.65)' : 'rgba(184,146,10,0)');
      capBox.setAttribute('fill',   capLvl2>0 ? 'rgba(248,238,210,0.5)' : 'rgba(248,238,210,0)');
    } else {
      capLetter.setAttribute('opacity','0');
      capBox.setAttribute('stroke','rgba(184,146,10,0)');
      capBox.setAttribute('fill','rgba(248,238,210,0)');
    }
  }

  if (!chars) return;

  _buildLines(chars);
  const L = _layout;
  const capActive = capLvl > 0 && chars > 0 && L.type === 'single';
  const rulingLvl = State.get().goldLevels['g_ruling'] || 0;
  let rem = chars;
  let lineIdx = 0;

  for (const sl of L.slots) {
    for (let i = 0; i < sl.lines; i++, lineIdx++) {
      const line = _lines[lineIdx]; if (!line || rem <= 0) break;
      const isComplete = rem >= line.length;
      const display    = isComplete ? line : line.slice(0, rem);
      const narrow     = capActive && lineIdx === 0 && i < 3;
      const x = narrow ? L.xCapEnd : sl.xStart;
      const y = sl.yFirst + i * sl.yStep;
      g.appendChild(_makeTextEl(x, y, display, isComplete ? '0.76' : '0.38', rulingLvl, lineIdx));
      rem -= line.length;
    }
    if (rem <= 0) break;
  }
};

const clearFolio = () => {
  _lastChars=-1; _lines=[]; _words=[]; _buf=''; _refill();
  refreshFolio();
};

// ── Stats ─────────────────────────────────────────────────────
const refreshStats = () => {
  const s = State.get();

  $('js-gold').textContent = fmt(s.gold);
  $('js-salt').textContent = fmtSalt(s.salt);

  const title = Config.SCRIBE_TITLES[Math.min(s.codices, Config.SCRIBE_TITLES.length-1)];
  $('js-scribe-title').textContent = title;
  $('js-info-gold').textContent    = fmt(s.gold);
  $('js-info-salt').textContent    = fmtSalt(s.salt);
  $('js-codex-count').textContent  = s.codices;
  $('js-auto-rate').textContent    = fmt(s.autoRate);
  $('js-info-click').textContent   = fmt(s.clickPower);
  $('js-info-bonus').textContent   = `+${Math.round((s.saltBonus-1)*100)}%`;

  const lpp = State.getPageCapacity();
  const pagePct  = (s.letters / lpp * 100).toFixed(1);
  const codexPct = Math.min((s.currentPage-1) / Config.PAGES_PER_CODEX * 100, 100);
  $('js-prog-page').style.width  = pagePct + '%';
  $('js-prog-codex').style.width = codexPct + '%';
  $('js-prog-page-stat').textContent  =
    `${fmt(s.letters)} / ${fmt(lpp)}`;
  $('js-prog-codex-stat').textContent =
    `p. ${Math.min(s.currentPage, Config.PAGES_PER_CODEX).toLocaleString()} / ${Config.PAGES_PER_CODEX.toLocaleString()}`;

  const can = State.canBind();
  $('js-codex-btn').disabled = !can;
  const left = Math.max(0, Config.PAGES_PER_CODEX - s.currentPage + 1);
  $('js-codex-note').textContent = can
    ? `ready to bind — gain ${fmtSalt(s.codices+1)}`
    : `${left.toLocaleString()} page${left!==1?'s':''} remaining`;
};

const refreshUpgrades = (onGold, onSalt) => {
  const { gold, goldLevels, salt, saltLevels } = State.get();

  const gList = $('list-dn');
  gList.innerHTML = '';
  Config.GOLD_UPGRADES.forEach(u => {
    const lvl=goldLevels[u.id], cost=Upgrades.goldCost(u);
    const isMax=lvl>=u.max, can=!isMax&&gold>=cost;
    const row=document.createElement('div');
    row.className='upgrade-row'+(isMax?' u-maxed':!can?' u-locked':'');
    let pips='';
    for(let i=0;i<u.max;i++) pips+=`<div class="pip${i<lvl?' on':''}"></div>`;
    row.innerHTML=`
      <div class="u-name">${u.name}</div>
      <div class="u-cost ${isMax?'is-maxed':can?'can-d':''}">${isMax?'done':fmt(cost)+' Đ'}</div>
      <div class="u-desc">${u.desc}</div>
      <div class="u-pips">${pips}</div>`;
    if(!isMax) row.addEventListener('click',()=>onGold(u));
    gList.appendChild(row);
  });

  const sList = $('list-salt');
  sList.innerHTML = '';
  Config.SALT_UPGRADES.forEach(u => {
    const lvl=saltLevels[u.id], cost=Upgrades.saltCost(u);
    const isMax=lvl>=u.max, can=!isMax&&salt>=cost;
    const row=document.createElement('div');
    row.className='upgrade-row'+(isMax?' u-maxed':!can?' u-locked':'');
    let pips='';
    for(let i=0;i<u.max;i++) pips+=`<div class="pip${i<lvl?' on salt':''}"></div>`;
    row.innerHTML=`
      <div class="u-name">${u.name}</div>
      <div class="u-cost ${isMax?'is-maxed':can?'can-s':''}">${isMax?'done':fmtSalt(cost)+' <i data-lucide="gem" class="u-cost-icon"></i>'}</div>
      <div class="u-desc">${u.desc}</div>
      <div class="u-pips">${pips}</div>`;
    if(!isMax) row.addEventListener('click',()=>onSalt(u));
    sList.appendChild(row);
  });
  lucide.createIcons();
};

const flashKey = () => {
  const el=$('js-flash');
  el.classList.remove('show');
  void el.offsetWidth;
  el.classList.add('show');
};

const spawnFloat = (x, y, html, cls='dn') => {
  const el=document.createElement('div');
  el.className=`float-num ${cls}`;
  el.innerHTML=html;
  el.style.cssText=`left:${x-14+Math.random()*28}px;top:${y-8}px`;
  document.body.appendChild(el);
  lucide.createIcons({ nodes: [el] });
  setTimeout(()=>el.remove(),880);
};

let _tt;
const showToast = (msg) => {
  const el=$('js-toast');
  el.textContent=msg;
  el.classList.add('show');
  clearTimeout(_tt);
  _tt=setTimeout(()=>el.classList.remove('show'),2400);
};

const _measureCapacity = () => {
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

const initRules = () => { _renderRules(); _measureCapacity(); };

export default { refreshStats, refreshUpgrades, refreshFolio, clearFolio,
                 flashKey, spawnFloat, showToast, fmt, fmtSalt, setLayout, initRules };
