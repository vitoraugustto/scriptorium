// @vitest-environment jsdom
import { vi } from 'vitest';
import { refreshUpgrades } from './upgrades';
import State from '../../state';
import Config from '../../config/index';

const DOM_FIXTURE = `
  <div id="list-dn"></div>
  <div id="list-salt"></div>
`;

beforeEach(() => {
  document.body.innerHTML = DOM_FIXTURE;
  State.reset();
  State.setPageCapacity(100);
});

describe('refreshUpgrades', () => {
  const noop = vi.fn();

  test('renders gold upgrade rows (only unlocked)', () => {
    const { codices } = State.get();
    const visible = Config.GOLD_UPGRADES.filter(u => !u.unlocksAt || codices >= u.unlocksAt);
    refreshUpgrades(noop, noop);
    const rows = document.querySelectorAll('#list-dn .upgrade-row');
    expect(rows.length).toBe(visible.length);
  });

  test('renders salt upgrade rows (only unlocked)', () => {
    const { codices } = State.get();
    const visible = Config.SALT_UPGRADES.filter(u => !u.unlocksAt || codices >= u.unlocksAt);
    refreshUpgrades(noop, noop);
    const rows = document.querySelectorAll('#list-salt .upgrade-row');
    expect(rows.length).toBe(visible.length);
  });

  test('locked class when cannot afford gold upgrade', () => {
    refreshUpgrades(noop, noop);
    const firstRow = document.querySelector('#list-dn .upgrade-row')!;
    expect(firstRow.classList.contains('u-locked')).toBe(true);
  });

  test('no locked class when can afford gold upgrade', () => {
    const quill = Config.GOLD_UPGRADES.find(u => u.id === 'g_quill')!;
    State.addGold(quill.baseCost);
    refreshUpgrades(noop, noop);
    const firstRow = document.querySelector('#list-dn .upgrade-row')!;
    expect(firstRow.classList.contains('u-locked')).toBe(false);
  });

  test('clicking a gold row calls onGold callback', () => {
    const onGold = vi.fn();
    const quill = Config.GOLD_UPGRADES.find(u => u.id === 'g_quill')!;
    State.addGold(quill.baseCost);
    refreshUpgrades(onGold, noop);
    const firstRow = document.querySelector('#list-dn .upgrade-row') as HTMLElement;
    firstRow.click();
    expect(onGold).toHaveBeenCalledWith(quill);
  });

  test('clicking a salt row calls onSalt callback', () => {
    const onSalt = vi.fn();
    const benefice = Config.SALT_UPGRADES.find(u => u.id === 's_benefice')!;
    State.addSalt(benefice.baseCost);
    refreshUpgrades(noop, onSalt);
    const firstRow = document.querySelector('#list-salt .upgrade-row') as HTMLElement;
    firstRow.click();
    expect(onSalt).toHaveBeenCalledWith(benefice);
  });

  test('maxed gold upgrade shows done text', () => {
    const quill = Config.GOLD_UPGRADES.find(u => u.id === 'g_quill')!;
    for (let i = 0; i < quill.max; i++) State.levelUpGold('g_quill');
    refreshUpgrades(noop, noop);
    const firstRow = document.querySelector('#list-dn .upgrade-row')!;
    expect(firstRow.classList.contains('u-maxed')).toBe(true);
  });

  test('upgrade name uses i18n translation', () => {
    refreshUpgrades(noop, noop);
    const firstRow = document.querySelector('#list-dn .u-name')!;
    expect(firstRow.textContent).toBe('Goose Quill');
  });

  test('salt upgrade locked when cannot afford', () => {
    refreshUpgrades(noop, noop);
    const firstSaltRow = document.querySelector('#list-salt .upgrade-row')!;
    expect(firstSaltRow.classList.contains('u-locked')).toBe(true);
  });
});
