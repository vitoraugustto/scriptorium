import { test, expect } from '@playwright/test';
import { ScriptoriumPage } from '../pages/ScriptoriumPage';
import { testIds } from '../fixtures/selectors';

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
  await pom.addGold(10);
  const before = await pom.readGold();
  await pom.switchTab('tabDn');
  await pom.clickFirstUpgrade('listDn');
  const after = await pom.readGold();
  expect(after).toBeLessThan(before);
});
