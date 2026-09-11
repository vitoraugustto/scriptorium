import type { Icons, CreateIconsOptions } from 'lucide';
import State from './state';
import Upgrades from './upgrades';
import UI from './ui/index';
import Main from './main';
import I18n from './i18n/index';

type CreateIcons = (opts?: CreateIconsOptions) => void;

let _createIcons: CreateIcons = () => {};
let _icons: Icons = {};

const _refresh = (): void => { Main.refresh(); };

interface InputSection {
  titleKey: string;
  icon: string;
  phKey: string;
  toastKey: string;
  apply: (n: number) => void;
}

interface ActionItem {
  labelKey: string;
  fn: () => void;
}

interface ActionSection {
  titleKey: string;
  icon: string;
  actions: ActionItem[];
}

const _inputSections: InputSection[] = [
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

const _layoutSection: ActionSection = {
  titleKey: 'DEBUG_LAYOUT',
  icon: 'layout',
  actions: [
    { labelKey: 'DEBUG_SINGLE', fn: () => UI.setLayout('single') },
    { labelKey: 'DEBUG_DOUBLE', fn: () => UI.setLayout('double') },
    { labelKey: 'DEBUG_QUAD',   fn: () => UI.setLayout('quad') },
  ],
};

const _resetSection: ActionSection = {
  titleKey: 'DEBUG_RESET',
  icon: 'rotate-ccw',
  actions: [
    { labelKey: 'DEBUG_RESET_BTN', fn: () => { State.reset(); Upgrades.recompute(); UI.clearFolio(); } },
  ],
};

const _makeInputSection = (s: InputSection, divided: boolean): HTMLElement => {
  const section = document.createElement('div');
  section.className = 'debug-section' + (divided ? ' debug-section-divided' : '');

  const hdr = document.createElement('div');
  hdr.className = 'debug-section-title';
  hdr.innerHTML = `<i data-lucide="${s.icon}"></i><span>${I18n.t(s.titleKey)}</span>`;
  section.appendChild(hdr);

  const row = document.createElement('div');
  row.className = 'debug-action-row';

  const input = document.createElement('input');
  input.type = 'number';
  input.className = 'debug-input';
  input.placeholder = I18n.t(s.phKey);
  input.min = '0';

  const btn = document.createElement('button');
  btn.className = 'debug-action';
  btn.textContent = I18n.t('DEBUG_APPLY');
  btn.addEventListener('click', () => {
    const n = parseInt(input.value, 10);
    if (!isNaN(n) && n >= 0) {
      s.apply(n);
      _refresh();
      UI.showToast(I18n.t(s.toastKey, n));
      input.value = '';
    }
  });
  input.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter') btn.click();
  });

  row.appendChild(input);
  row.appendChild(btn);
  section.appendChild(row);
  return section;
};

const _makeActionSection = (s: ActionSection, divided: boolean): HTMLElement => {
  const section = document.createElement('div');
  section.className = 'debug-section' + (divided ? ' debug-section-divided' : '');

  const hdr = document.createElement('div');
  hdr.className = 'debug-section-title';
  hdr.innerHTML = `<i data-lucide="${s.icon}"></i><span>${I18n.t(s.titleKey)}</span>`;
  section.appendChild(hdr);

  const row = document.createElement('div');
  row.className = 'debug-action-row';
  s.actions.forEach(({ labelKey, fn }) => {
    const b = document.createElement('button');
    b.className = 'debug-action';
    b.textContent = I18n.t(labelKey);
    b.addEventListener('click', () => { fn(); _refresh(); });
    row.appendChild(b);
  });
  section.appendChild(row);
  return section;
};

let _panel: HTMLElement | null = null;
const _getPanel = (): HTMLElement => _panel as HTMLElement;

const _buildPanel = (): void => {
  if (_panel) _panel.remove();
  const panel = document.createElement('div');
  panel.className = 'popup-panel debug-panel';
  _inputSections.forEach((s) => panel.appendChild(_makeInputSection(s, true)));
  panel.appendChild(_makeActionSection(_layoutSection, true));
  panel.appendChild(_makeActionSection(_resetSection, false));
  panel.addEventListener('click', (e) => e.stopPropagation());
  document.body.appendChild(panel);
  _panel = panel;
};

const refreshLabels = (): void => {
  if (!_panel) return;
  const wasOpen = _panel.classList.contains('open');
  _buildPanel();
  if (wasOpen) _getPanel().classList.add('open');
};

const init = (createIcons: CreateIcons = () => {}, icons: Icons = {}): void => {
  _createIcons = createIcons;
  _icons = icons;

  if (import.meta.env.VITE_DEBUG !== 'true') return;

  window.__debug = {
    addGold:    (n) => { State.addGold(n); Main.refresh(); },
    addLetters: (n) => { State.addLetters(n); Main.refresh(); },
    reset:      ()  => { State.reset(); Upgrades.recompute(); UI.clearFolio(); Main.refresh(); },
  };

  const btn = document.createElement('button');
  btn.className = 'popup-btn debug-btn';
  btn.innerHTML = '<i data-lucide="bug"></i>';

  _buildPanel();

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = _getPanel().classList.toggle('open');
    btn.classList.toggle('open', open);
  });
  document.addEventListener('click', () => {
    _getPanel().classList.remove('open');
    btn.classList.remove('open');
  });

  document.body.appendChild(btn);
  _createIcons({ icons: _icons });
};

export default { init, refreshLabels };
