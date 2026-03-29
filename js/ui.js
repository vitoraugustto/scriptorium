'use strict';

const UI = (() => {
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

  // ── Folio text — line-by-line ────────────────────────────────
  const F = Config.FOLIO;
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
    const svg = document.getElementById('js-folio');
    const t = document.createElementNS('http://www.w3.org/2000/svg','text');
    t.setAttribute('font-family','IM Fell English, serif');
    t.setAttribute('font-size', F.fontSize);
    t.setAttribute('font-style','italic');
    t.setAttribute('visibility','hidden');
    t.textContent = str;
    svg.appendChild(t);
    const w = t.getComputedTextLength();
    svg.removeChild(t);
    return w;
  };

  const _buildLines = (target) => {
    let cached = _lines.reduce((s,l)=>s+l.length, 0);
    if (cached >= target) return;
    while (cached < target && _lines.length < F.totalLines) {
      const capActive = (State.get().saltLevels['s_capital'] || 0) > 0;
      const narrow  = capActive && _lines.length < 3;
      const maxW    = narrow ? (F.xEnd - F.xCapEnd) : F.lineW;
      while (_buf.length < 200) _buf += ' ' + _nextWord();
      _buf = _buf.trimStart();
      let lo = 1, hi = _buf.length, fit = 1;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (_measureText(_buf.slice(0, mid)) <= maxW) { fit = mid; lo = mid + 1; }
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
      _lines.push(line);
      cached += line.length;
    }
  };

  const refreshFolio = () => {
    const chars = State.get().letters;
    if (chars === _lastChars) return;
    _lastChars = chars;

    const g = $('js-folio-text');
    g.innerHTML = '';

    // ── capital ───────────────────────────────────────────────
    const capLetter = $('js-cap-letter');
    const capBox    = $('js-cap-box');
    const capLvl    = State.get().saltLevels['s_capital']   || 0;
    const capLvl2   = State.get().saltLevels['s_capital2']  || 0;
    if (capLetter) {
      if (capLvl > 0 && chars > 0) {
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

    let rem = chars;
    for (let li=0; li<_lines.length && li<F.totalLines; li++) {
      const line = _lines[li]; if(!line||rem<=0) break;
      const isComplete = rem >= line.length;
      const display    = isComplete ? line : line.slice(0,rem);
      const capActive  = capLvl > 0 && chars > 0;
      const x = (li < 3 && capActive) ? 58 : F.xStart;
      const y = F.yFirst + li * F.yStep;
      const t = document.createElementNS('http://www.w3.org/2000/svg','text');
      t.setAttribute('x', x);
      t.setAttribute('y', y);
      t.setAttribute('font-family','IM Fell English, serif');
      t.setAttribute('font-size', F.fontSize);
      t.setAttribute('font-style','italic');
      t.setAttribute('fill','#1e1608');
      t.setAttribute('opacity', isComplete ? '0.76' : '0.38');
      t.textContent = display;
      g.appendChild(t);
      rem -= line.length;
    }
  };

  const clearFolio = () => {
    _lastChars=-1; _lines=[]; _words=[]; _buf=''; _refill(); refreshFolio();
  };

  // ── Stats ─────────────────────────────────────────────────────
  const refreshStats = () => {
    const s = State.get();

    // titlebar
    $('js-gold').textContent = fmt(s.gold);
    $('js-salt').textContent = fmtSalt(s.salt);

    // info panel
    const title = Config.SCRIBE_TITLES[Math.min(s.codices, Config.SCRIBE_TITLES.length-1)];
    $('js-scribe-title').textContent = title;
    $('js-info-gold').textContent    = fmt(s.gold);
    $('js-info-salt').textContent    = fmtSalt(s.salt);
    $('js-codex-count').textContent  = s.codices;
    $('js-auto-rate').textContent    = fmt(s.autoRate);
    $('js-info-click').textContent   = fmt(s.clickPower);
    $('js-info-bonus').textContent   = `+${Math.round((s.saltBonus-1)*100)}%`;

    // progress
    const pagePct  = (s.letters / Config.LETTERS_PER_PAGE * 100).toFixed(1);
    const codexPct = Math.min((s.currentPage-1) / Config.PAGES_PER_CODEX * 100, 100);
    $('js-prog-page').style.width  = pagePct + '%';
    $('js-prog-codex').style.width = codexPct + '%';
    $('js-prog-page-stat').textContent  =
      `${fmt(s.letters)} / ${fmt(Config.LETTERS_PER_PAGE)}`;
    $('js-prog-codex-stat').textContent =
      `p. ${Math.min(s.currentPage, Config.PAGES_PER_CODEX).toLocaleString()} / ${Config.PAGES_PER_CODEX.toLocaleString()}`;

    // codex button
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

  return { refreshStats, refreshUpgrades, refreshFolio, clearFolio,
           flashKey, spawnFloat, showToast, fmt, fmtSalt };
})();
