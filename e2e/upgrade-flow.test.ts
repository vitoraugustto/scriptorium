import { test, expect } from '@playwright/test';
import { ScriptoriumPage } from './pom/ScriptoriumPage';
import { testIds } from './selectors';

const LETTERS_PER_PAGE = 2000;

let pom: ScriptoriumPage;

test.beforeAll(async () => {
  pom = new ScriptoriumPage();
  await pom.launch();
});

test.afterAll(async () => {
  await pom.close();
});

test('salt tab shows salt upgrade list', async () => {
  await pom.switchTab('tabSalt');
  await expect(pom.page.getByTestId(testIds.listSalt)).toBeVisible();
});

test('dn tab shows gold upgrade list', async () => {
  await pom.switchTab('tabDn');
  await expect(pom.page.getByTestId(testIds.listDn)).toBeVisible();
});

test('gold upgrade purchase deducts gold', async () => {
  await pom.dispatchKeydowns('a', LETTERS_PER_PAGE);
  await pom.waitForGold();
  const before = await pom.readGold();
  await pom.clickFirstUpgrade('listDn');
  const after = await pom.readGold();
  expect(after).toBeLessThan(before);
});

test('codex button enables after 300 pages', async () => {
  // Each dispatchKeydowns fills at least one page; repeat until codex is ready
  for (let i = 0; i < 300; i++) {
    await pom.dispatchKeydowns('a', LETTERS_PER_PAGE);
  }
  await pom.page.waitForFunction(() => {
    const btn = document.getElementById('js-codex-btn') as HTMLButtonElement;
    return btn ? !btn.disabled : false;
  }, { timeout: 10_000 });
  expect(await pom.page.getByTestId(testIds.codexBtn).isDisabled()).toBe(false);
});

test('binding codex increments codex count and resets gold', async () => {
  await pom.page.getByTestId(testIds.codexBtn).click();
  expect(await pom.readCodexCount()).toBe(1);
  expect(await pom.readGold()).toBe(0);
});
