import { createIcons, Coins, Gem } from 'lucide';
import Config from '../../config/index';
import State from '../../state';
import I18n from '../../i18n/index';

const fmt = (n: number): string => {
  n = Math.floor(n);
  if (n >= 1e12) return (n / 1e12).toFixed(2) + 'T';
  if (n >= 1e9)  return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6)  return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3)  return (n / 1e3).toFixed(1) + 'K';
  return n.toLocaleString();
};

const fmtSalt = (n: number): string => {
  n = Math.floor(n);
  if (n >= 1e6) return (n / 1e6).toFixed(2) + ' t';
  if (n >= 1e3) return (n / 1e3).toFixed(2) + ' kg';
  return n + ' g';
};

const $ = (id: string): HTMLElement => document.getElementById(id)!;

const refreshStaticLabels = (): void => {
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach(el => {
    el.textContent = I18n.t(el.dataset['i18n'] ?? '');
  });
};

const refreshStats = (): void => {
  const s = State.get();

  $('js-gold').textContent = fmt(s.gold);
  $('js-salt').textContent = fmtSalt(s.salt);

  const title = I18n.t(`TITLE_${Math.min(s.codices, Config.SCRIBE_TITLES.length - 1)}`);
  $('js-scribe-title').textContent = title;
  $('js-info-gold').textContent    = fmt(s.gold);
  $('js-info-salt').textContent    = fmtSalt(s.salt);
  $('js-codex-count').textContent  = String(s.codices);
  $('js-auto-rate').textContent    = fmt(s.autoRate);
  $('js-info-click').textContent   = fmt(s.clickPower);
  $('js-info-bonus').textContent   = `+${Math.round((s.saltBonus - 1) * 100)}%`;

  const lpp = State.getPageCapacity();
  const pagePct  = (s.letters / lpp * 100).toFixed(1);
  const codexPct = Math.min((s.currentPage - 1) / Config.PAGES_PER_CODEX * 100, 100);
  $('js-prog-page').style.width  = pagePct + '%';
  $('js-prog-codex').style.width = codexPct + '%';
  $('js-prog-page-stat').textContent  = `${fmt(s.letters)} / ${fmt(lpp)}`;
  $('js-prog-codex-stat').textContent =
    `p. ${Math.min(s.currentPage, Config.PAGES_PER_CODEX).toLocaleString()} / ${Config.PAGES_PER_CODEX.toLocaleString()}`;

  const can = State.canBind();
  document.querySelector<HTMLButtonElement>('#js-codex-btn')!.disabled = !can;
  const left = Math.max(0, Config.PAGES_PER_CODEX - s.currentPage + 1);
  $('js-codex-note').textContent = can
    ? I18n.t('CODEX_READY', fmtSalt(s.codices + 1))
    : I18n.t(left !== 1 ? 'CODEX_REMAINING_PLURAL' : 'CODEX_REMAINING', left.toLocaleString());
};

const flashKey = (): void => {
  const el = $('js-flash');
  el.classList.remove('show');
  void el.offsetWidth;
  el.classList.add('show');
};

const spawnFloat = (x: number, y: number, html: string, cls = 'dn'): void => {
  const el = document.createElement('div');
  el.className = `float-num ${cls}`;
  el.innerHTML = html;
  el.style.cssText = `left:${x - 14 + Math.random() * 28}px;top:${y - 8}px`;
  document.body.appendChild(el);
  createIcons({ root: el, icons: { Coins, Gem } });
  setTimeout(() => el.remove(), 880);
};

let _tt: ReturnType<typeof setTimeout>;
const showToast = (msg: string): void => {
  const el = $('js-toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(_tt);
  _tt = setTimeout(() => el.classList.remove('show'), 2400);
};

export { fmt, fmtSalt, refreshStats, refreshStaticLabels, flashKey, spawnFloat, showToast };
