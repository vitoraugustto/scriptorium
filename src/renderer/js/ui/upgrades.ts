import { createIcons, Gem } from 'lucide';
import Config from '../config/index';
import State from '../state';
import UpgradesLogic from '../upgrades';
import I18n from '../i18n/index';
import { fmt, fmtSalt } from './hud';

const $ = (id) => document.getElementById(id);

const refreshUpgrades = (onGold, onSalt) => {
  const { gold, goldLevels, salt, saltLevels } = State.get();

  const gList = $('list-dn');
  gList.innerHTML = '';
  Config.GOLD_UPGRADES.forEach(u => {
    const lvl=goldLevels[u.id], cost=UpgradesLogic.goldCost(u);
    const isMax=lvl>=u.max, can=!isMax&&gold>=cost;
    const name=I18n.t(`UPGRADE_${u.id.toUpperCase()}_NAME`, u.name);
    const desc=I18n.t(`UPGRADE_${u.id.toUpperCase()}_DESC`, u.desc);
    const row=document.createElement('div');
    row.className='upgrade-row'+(isMax?' u-maxed':!can?' u-locked':'');
    let pips='';
    for(let i=0;i<u.max;i++) pips+=`<div class="pip${i<lvl?' on':''}"></div>`;
    row.innerHTML=`
      <div class="u-name">${name}</div>
      <div class="u-cost ${isMax?'is-maxed':can?'can-d':''}">${isMax?I18n.t('UPGRADE_DONE'):fmt(cost)+' Đ'}</div>
      <div class="u-desc">${desc}</div>
      <div class="u-pips">${pips}</div>`;
    if(!isMax) row.addEventListener('click',()=>onGold(u));
    gList.appendChild(row);
  });

  const sList = $('list-salt');
  sList.innerHTML = '';
  Config.SALT_UPGRADES.forEach(u => {
    const lvl=saltLevels[u.id], cost=UpgradesLogic.saltCost(u);
    const isMax=lvl>=u.max, can=!isMax&&salt>=cost;
    const name=I18n.t(`UPGRADE_${u.id.toUpperCase()}_NAME`, u.name);
    const desc=I18n.t(`UPGRADE_${u.id.toUpperCase()}_DESC`, u.desc);
    const row=document.createElement('div');
    row.className='upgrade-row'+(isMax?' u-maxed':!can?' u-locked':'');
    let pips='';
    for(let i=0;i<u.max;i++) pips+=`<div class="pip${i<lvl?' on salt':''}"></div>`;
    row.innerHTML=`
      <div class="u-name">${name}</div>
      <div class="u-cost ${isMax?'is-maxed':can?'can-s':''}">${isMax?I18n.t('UPGRADE_DONE'):fmtSalt(cost)+' <i data-lucide="gem" class="u-cost-icon"></i>'}</div>
      <div class="u-desc">${desc}</div>
      <div class="u-pips">${pips}</div>`;
    if(!isMax) row.addEventListener('click',()=>onSalt(u));
    sList.appendChild(row);
  });
  createIcons({ icons: { Gem } });
};

export { refreshUpgrades };
