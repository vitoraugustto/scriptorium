import Config from './config/index.js';
import State from './state.js';
import Upgrades from './upgrades.js';
import UI from './ui/index.js';

let _activeTab = 'dn';

const refresh = () => {
  UI.refreshStats();
  UI.refreshUpgrades(handleBuyGold, handleBuySalt);
  UI.refreshFolio();
};

const handleBuyGold = (u) => {
  if (!Upgrades.buyGold(u)) return;
  refresh();
  UI.showToast(`${u.name} level ${State.get().goldLevels[u.id]}`);
};

const handleBuySalt = (u) => {
  if (!Upgrades.buySalt(u)) return;
  refresh();
  UI.showToast(`${u.name} permanent level ${State.get().saltLevels[u.id]}`);
};

// ── Keyboard input ───────────────────────────────────────────
const handleKey = (e) => {
  if (e.repeat) return;
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (!/^[a-zA-Z]$/.test(e.key) && e.key !== ' ') return;
  if (e.key === ' ') e.preventDefault();

  const gain = State.get().clickPower;
  const redBonus = UI.countRedWords();
  const { pages, gold } = State.addLetters(gain, redBonus);

  UI.flashKey();

  if (pages > 0) {
    const layouts = Object.keys(Config.FOLIO_LAYOUTS);
    UI.setLayout(layouts[Math.floor(Math.random() * layouts.length)]);
    UI.spawnFloat(
      window.innerWidth * 0.35,
      window.innerHeight * 0.5,
      `+${UI.fmt(gold)} <i data-lucide="coins" class="float-icon"></i>`, 'dn'
    );
    if (State.canBind()) UI.showToast('Codex complete, bind it in the sidebar!');
  }

  refresh();
};

const handleBind = () => {
  if (!State.canBind()) return;
  const saltGain = State.bindCodex();
  Upgrades.recompute();
  UI.clearFolio();
  refresh();
  UI.spawnFloat(
    window.innerWidth * 0.35,
    window.innerHeight * 0.4,
    `+${UI.fmtSalt(saltGain)} <i data-lucide="gem" class="float-icon"></i>`, 'salt'
  );
  UI.showToast(`Codex ${State.get().codices} bound, +${UI.fmtSalt(saltGain)} salt`);
};

// ── Game loop (auto scribes) ─────────────────────────────────
const startLoop = () => {
  setInterval(() => {
    const { autoRate } = State.get();
    if (autoRate <= 0) return;
    const autoRedBonus = UI.countRedWords();
    const { pages } = State.addLetters(autoRate / (1000/Config.AUTO_TICK_MS), autoRedBonus);
    if (pages > 0) {
      const layouts = Object.keys(Config.FOLIO_LAYOUTS);
      UI.setLayout(layouts[Math.floor(Math.random() * layouts.length)]);
      if (State.canBind()) UI.showToast('Codex complete, bind it in the sidebar!');
    }
    UI.refreshStats();
    UI.refreshUpgrades(handleBuyGold, handleBuySalt);
    UI.refreshFolio();
  }, Config.AUTO_TICK_MS);
};

// ── Init ─────────────────────────────────────────────────────
const init = () => {
  document.addEventListener('keydown', handleKey);

  document.getElementById('js-codex-btn').addEventListener('click', handleBind);

  document.querySelectorAll('.stab').forEach(btn => {
    btn.addEventListener('click', () => {
      _activeTab = btn.dataset.tab;
      document.querySelectorAll('.stab').forEach(b =>
        b.classList.toggle('active', b.dataset.tab===_activeTab));
      document.getElementById('panel-dn').classList.toggle('active',   _activeTab==='dn');
      document.getElementById('panel-salt').classList.toggle('active', _activeTab==='salt');
    });
  });

  const infoBtn   = document.getElementById('js-info-btn');
  const infoPanel = document.getElementById('js-info-panel');
  infoBtn.addEventListener('click', e => {
    e.stopPropagation();
    const open = infoPanel.classList.toggle('open');
    infoBtn.classList.toggle('open', open);
  });
  document.addEventListener('click', () => {
    infoPanel.classList.remove('open');
    infoBtn.classList.remove('open');
  });
  infoPanel.addEventListener('click', e => e.stopPropagation());

  Upgrades.recompute();
  UI.initRules();
  refresh();
  startLoop();
};

export default { init, refresh };
