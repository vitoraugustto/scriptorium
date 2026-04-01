import Config from '../config/index.js';
import State from '../state.js';

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

export { fmt, fmtSalt, refreshStats, flashKey, spawnFloat, showToast };
