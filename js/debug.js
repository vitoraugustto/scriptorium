import Env from './env.js';
import State from './state.js';
import Upgrades from './upgrades.js';
import UI from './ui/index.js';
import Main from './main.js';

const _refresh = () => Main.refresh();

const _inputSections = [
  {
    title: 'Denarii',
    icon: 'coins',
    placeholder: 'amount',
    toast: (n) => `+${n} denarii added`,
    apply: (n) => State.addGold(n),
  },
  {
    title: 'Salt',
    icon: 'gem',
    placeholder: 'amount',
    toast: (n) => `+${n} g salt added`,
    apply: (n) => State.addSalt(n),
  },
  {
    title: 'Letters per keystroke',
    icon: 'pencil-line',
    placeholder: 'value',
    toast: (n) => `letters/keystroke set to ${n}`,
    apply: (n) => State.setStats({ click: n, auto: State.get().autoRate }),
  },
];

const _layoutSection = {
  title: 'Layout',
  icon: 'layout',
  actions: [
    { label: 'Single', fn: () => UI.setLayout('single') },
    { label: 'Double', fn: () => UI.setLayout('double') },
    { label: 'Quad',   fn: () => UI.setLayout('quad') },
  ],
};

const _resetSection = {
  title: 'Reset',
  icon: 'rotate-ccw',
  actions: [
    { label: 'Reset all progress', fn: () => { State.reset(); Upgrades.recompute(); UI.clearFolio(); } },
  ],
};

const _makeInputSection = ({ title, icon, placeholder, apply, toast }, divided) => {
  const section = document.createElement('div');
  section.className = 'debug-section' + (divided ? ' debug-section-divided' : '');

  const hdr = document.createElement('div');
  hdr.className = 'debug-section-title';
  hdr.innerHTML = `<i data-lucide="${icon}"></i><span>${title}</span>`;
  section.appendChild(hdr);

  const row = document.createElement('div');
  row.className = 'debug-action-row';

  const input = document.createElement('input');
  input.type = 'number';
  input.className = 'debug-input';
  input.placeholder = placeholder;
  input.min = '0';

  const btn = document.createElement('button');
  btn.className = 'debug-action';
  btn.textContent = 'Apply';
  btn.addEventListener('click', () => {
    const n = parseInt(input.value, 10);
    if (!isNaN(n) && n >= 0) {
      apply(n);
      _refresh();
      UI.showToast(toast(n));
      input.value = '';
    }
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') btn.click();
  });

  row.appendChild(input);
  row.appendChild(btn);
  section.appendChild(row);
  return section;
};

const _makeActionSection = ({ title, icon, actions }, divided) => {
  const section = document.createElement('div');
  section.className = 'debug-section' + (divided ? ' debug-section-divided' : '');

  const hdr = document.createElement('div');
  hdr.className = 'debug-section-title';
  hdr.innerHTML = `<i data-lucide="${icon}"></i><span>${title}</span>`;
  section.appendChild(hdr);

  const row = document.createElement('div');
  row.className = 'debug-action-row';
  actions.forEach(({ label, fn }) => {
    const b = document.createElement('button');
    b.className = 'debug-action';
    b.textContent = label;
    b.addEventListener('click', () => { fn(); _refresh(); });
    row.appendChild(b);
  });
  section.appendChild(row);
  return section;
};

const init = () => {
  if (!Env.DEBUG) return;

  const btn = document.createElement('button');
  btn.className = 'popup-btn debug-btn';
  btn.innerHTML = '<i data-lucide="bug"></i>';

  const panel = document.createElement('div');
  panel.className = 'popup-panel debug-panel';

  _inputSections.forEach((s) => {
    panel.appendChild(_makeInputSection(s, true));
  });
  panel.appendChild(_makeActionSection(_layoutSection, true));
  panel.appendChild(_makeActionSection(_resetSection, false));

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = panel.classList.toggle('open');
    btn.classList.toggle('open', open);
  });
  document.addEventListener('click', () => {
    panel.classList.remove('open');
    btn.classList.remove('open');
  });
  panel.addEventListener('click', (e) => e.stopPropagation());

  document.body.appendChild(panel);
  document.body.appendChild(btn);
  lucide.createIcons();
};

export default { init };
