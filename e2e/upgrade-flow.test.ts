import { test, expect } from '@playwright/test';
import { ScriptoriumPage } from './pom/ScriptoriumPage';
import { testIds } from './selectors';

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
  test.setTimeout(120_000);
  while ((await pom.readGold()) < 5) {
    await pom.pressKey('a');
  }
  const before = await pom.readGold();
  await pom.clickFirstUpgrade('listDn');
  const after = await pom.readGold();
  expect(after).toBeLessThan(before);
});
