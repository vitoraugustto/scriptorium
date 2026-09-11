import { test, expect } from '@playwright/test';
import { ScriptoriumPage } from '../pages/ScriptoriumPage';
import { testIds } from '../fixtures/selectors';

const LETTERS_PER_PAGE = 2000; // conservative upper bound for any layout/font

let pom: ScriptoriumPage;

test.beforeAll(async () => {
  pom = new ScriptoriumPage();
  await pom.launch();
});

test.afterAll(async () => {
  await pom.close();
});

test('keystroke causes folio text to appear', async () => {
  await pom.pressKey('a');
  expect(await pom.page.getByTestId(testIds.folioText).locator('text').count()).toBeGreaterThan(0);
});

test('page progress advances with keystrokes', async () => {
  const before = await pom.readPageProgress();
  await pom.pressKeyN('a', 10);
  expect(await pom.readPageProgress()).toBeGreaterThan(before);
});

test('completing a page earns gold', async () => {
  await pom.addLetters(LETTERS_PER_PAGE);
  await pom.waitForGold();
  expect(await pom.readGold()).toBeGreaterThan(0);
});

test('non-alpha keys are ignored', async () => {
  const before = await pom.readGold();
  await pom.pressKey('F1');
  await pom.pressKey('Control');
  await pom.pressKey('ArrowUp');
  expect(await pom.readGold()).toBe(before);
});
