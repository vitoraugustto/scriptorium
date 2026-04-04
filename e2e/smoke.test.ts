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

test('window title is Scriptorium', async () => {
  expect(await pom.page.title()).toBe('Scriptorium');
});

test('HUD elements are visible', async () => {
  await expect(pom.page.getByTestId(testIds.gold)).toBeVisible();
  await expect(pom.page.getByTestId(testIds.salt)).toBeVisible();
  await expect(pom.page.getByTestId(testIds.scribeTitle)).toBeVisible();
});

test('initial gold is 0', async () => {
  expect(await pom.readGold()).toBe(0);
});

test('codex button is disabled initially', async () => {
  expect(await pom.page.getByTestId(testIds.codexBtn).isDisabled()).toBe(true);
});

test('scribe title is Novice Scribe', async () => {
  expect(await pom.page.getByTestId(testIds.scribeTitle).innerText()).toBe('Novice Scribe');
});

test('folio SVG is present', async () => {
  await expect(pom.page.getByTestId(testIds.folio)).toBeVisible();
});
