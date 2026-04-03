import Env from './env.js';
import State from './state.js';
import Upgrades from './upgrades.js';
import UI from './ui/index.js';
import Main from './main.js';
import I18n from './i18n/index.js';

const _refresh = () => Main.refresh();

const _inputSections = [
  {
    titleKey:  'DEBUG_DENARII',
    icon:      'coins',
    phKey:     'DEBUG_DENARII_PH',
    toastKey:  'DEBUG_DENARII_TOAST',
    apply:     (n) => State.addGold(n),
  },
  {
    titleKey:  'DEBUG_SALT',
    icon:      'gem',
    phKey:     'DEBUG_SALT_PH',
    toastKey:  'DEBUG_SALT_TOAST',
    apply:     (n) => State.addSalt(n),
  },
  {
    titleKey:  'DEBUG_LETTERS',
    icon:      'pencil-line',
    phKey:     'DEBUG_LETTERS_PH',
    toastKey:  'DEBUG_LETTERS_TOAST',
    apply:     (n) => State.addLetters(n),
  },
];

const _layoutSection = {
  titleKey: 'DEBUG_LAYOUT',
  icon: 'layout',
  actions: [
    { labelKey: 'DEBUG_SINGLE', fn: () => UI.setLayout('single') },
    { labelKey: 'DEBUG_DOUBLE', fn: () => UI.setLayout('double') },
    { labelKey: 'DEBUG_QUAD',   fn: () => UI.setLayout('quad') },
  ],
};

const _resetSection = {
  titleKey: 'DEBUG_RESET',
  icon: 'rotate-ccw',
  actions: [
    { labelKey: 'DEBUG_RESET_BTN', fn: () => { State.reset(); Upgrades.recompute(); UI.clearFolio(); } },
  ],
};

const _makeInputSection = ({ titleKey, icon, phKey, apply, toastKey }, divided) => {
  const section = document.createElement('div');
  section.className = 'debug-section' + (divided ? ' debug-section-divided' : '');

  const hdr = document.createElement('div');
  hdr.className = 'debug-section-title';
  hdr.innerHTML = `<i data-lucide="${icon}"></i><span>${I18n.t(titleKey)}</span>`;
  section.appendChild(hdr);

  const row = document.createElement('div');
  row.className = 'debug-action-row';

  const input = document.createElement('input');
  input.type = 'number';
  input.className = 'debug-input';
  input.placeholder = I18n.t(phKey);
  input.min = '0';

  const btn = document.createElement('button');
  btn.className = 'debug-action';
  btn.textContent = I18n.t('DEBUG_APPLY');
  btn.addEventListener('click', () => {
    const n = parseInt(input.value, 10);
    if (!isNaN(n) && n >= 0) {
      apply(n);
      _refresh();
      UI.showToast(I18n.t(toastKey, n));
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

const _makeActionSection = ({ titleKey, icon, actions }, divided) => {
  const section = document.createElement('div');
  section.className = 'debug-section' + (divided ? ' debug-section-divided' : '');

  const hdr = document.createElement('div');
  hdr.className = 'debug-section-title';
  hdr.innerHTML = `<i data-lucide="${icon}"></i><span>${I18n.t(titleKey)}</span>`;
  section.appendChild(hdr);

  const row = document.createElement('div');
  row.className = 'debug-action-row';
  actions.forEach(({ labelKey, fn }) => {
    const b = document.createElement('button');
    b.className = 'debug-action';
    b.textContent = I18n.t(labelKey);
    b.addEventListener('click', () => { fn(); _refresh(); });
    row.appendChild(b);
  });
  section.appendChild(row);
  return section;
};

let _panel = null;

const _buildPanel = () => {
  if (_panel) _panel.remove();
  _panel = document.createElement('div');
  _panel.className = 'popup-panel debug-panel';
  _inputSections.forEach((s) => _panel.appendChild(_makeInputSection(s, true)));
  _panel.appendChild(_makeActionSection(_layoutSection, true));
  _panel.appendChild(_makeActionSection(_resetSection, false));
  _panel.addEventListener('click', (e) => e.stopPropagation());
  document.body.appendChild(_panel);
};

const refreshLabels = () => {
  if (!_panel) return;
  const wasOpen = _panel.classList.contains('open');
  _buildPanel();
  if (wasOpen) _panel.classList.add('open');
};

const init = () => {
  if (!Env.DEBUG) return;

  const btn = document.createElement('button');
  btn.className = 'popup-btn debug-btn';
  btn.innerHTML = '<i data-lucide="bug"></i>';

  _buildPanel();

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = _panel.classList.toggle('open');
    btn.classList.toggle('open', open);
  });
  document.addEventListener('click', () => {
    _panel.classList.remove('open');
    btn.classList.remove('open');
  });

  document.body.appendChild(btn);
  lucide.createIcons();
};

export default { init, refreshLabels };
