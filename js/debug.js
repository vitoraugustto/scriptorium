'use strict';

const Debug = (() => {
  const _refresh = () => {
    UI.refreshStats();
    UI.refreshUpgrades(() => {}, () => {});
    UI.refreshFolio();
  };

  const _sections = [
    {
      title: 'Denarii',
      icon: 'coins',
      actions: [
        { label: '+1,000',   fn: () => State.addGold(1000) },
        { label: '+10,000',  fn: () => State.addGold(10000) },
        { label: '+100,000', fn: () => State.addGold(100000) },
      ],
    },
    {
      title: 'Salt',
      icon: 'gem',
      actions: [
        { label: '+10 g',  fn: () => State.addSalt(10) },
        { label: '+100 g', fn: () => State.addSalt(100) },
        { label: '+1 kg',  fn: () => State.addSalt(1000) },
      ],
    },
    {
      title: 'Letters per keystroke',
      icon: 'pencil-line',
      actions: [
        { label: '+1',  fn: () => State.setStats({ click: State.get().clickPower + 1,  auto: State.get().autoRate }) },
        { label: '+5',  fn: () => State.setStats({ click: State.get().clickPower + 5,  auto: State.get().autoRate }) },
        { label: '+10', fn: () => State.setStats({ click: State.get().clickPower + 10, auto: State.get().autoRate }) },
        { label: '+25', fn: () => State.setStats({ click: State.get().clickPower + 25, auto: State.get().autoRate }) },
        { label: '+50', fn: () => State.setStats({ click: State.get().clickPower + 50, auto: State.get().autoRate }) },
      ],
    },
  ];

  const init = () => {
    if (!Env.DEBUG) return;

    const btn = document.createElement('button');
    btn.className = 'popup-btn debug-btn';
    btn.innerHTML = '<i data-lucide="bug"></i>';

    const panel = document.createElement('div');
    panel.className = 'popup-panel debug-panel';

    _sections.forEach(({ title, icon, actions }, i) => {
      const section = document.createElement('div');
      section.className = 'debug-section' + (i < _sections.length - 1 ? ' debug-section-divided' : '');

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
      panel.appendChild(section);
    });

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

  return { init };
})();
