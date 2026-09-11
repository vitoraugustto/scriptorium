import { test, expect } from '@playwright/test';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { ScriptoriumPage } from '../pages/ScriptoriumPage';

test('save file lands on disk with the current envelope', async () => {
  const pom = new ScriptoriumPage();
  await pom.launch();
  try {
    await pom.addGold(500);
    await pom.saveNow();

    expect(existsSync(pom.savePath())).toBe(true);
    const envelope = JSON.parse(readFileSync(pom.savePath(), 'utf-8'));
    expect(envelope.version).toBe(1);
    expect(envelope.state.gold).toBe(500);
    expect(typeof envelope.savedAt).toBe('number');

    // derived values must not be persisted
    expect(envelope.state).not.toHaveProperty('clickPower');
    expect(envelope.state).not.toHaveProperty('autoRate');
    expect(envelope.state).not.toHaveProperty('saltBonus');

    // atomic write must not leave its temp file behind
    expect(existsSync(`${pom.savePath()}.tmp`)).toBe(false);
  } finally {
    await pom.close();
    pom.cleanup();
  }
});

test('progress survives a relaunch', async () => {
  const pom = new ScriptoriumPage();
  await pom.launch();
  try {
    // stay under 1000: the HUD abbreviates larger values as "1.2K"
    await pom.addGold(842);
    await pom.saveNow();
    await pom.relaunch();
    expect(await pom.readGold()).toBe(842);
  } finally {
    await pom.close();
    pom.cleanup();
  }
});

test('progress survives quitting without an explicit save', async () => {
  const pom = new ScriptoriumPage();
  await pom.launch();
  try {
    await pom.addGold(777);
    // no saveNow(): this exercises the before-quit synchronous write
    await pom.page.waitForTimeout(1500);
    await pom.relaunch();
    expect(await pom.readGold()).toBe(777);
  } finally {
    await pom.close();
    pom.cleanup();
  }
});

test('a corrupt save is set aside and the app still starts', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'scriptorium-e2e-'));
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, 'save.json'), '{ this is not json', 'utf-8');

  const pom = new ScriptoriumPage();
  pom.userDataDir = dir;
  await pom.launch();
  try {
    expect(await pom.readGold()).toBe(0);
    const quarantined = readdirSync(dir).filter(f => f.startsWith('save.corrupt-'));
    expect(quarantined.length).toBe(1);
  } finally {
    await pom.close();
    pom.cleanup();
  }
});

test('a save from a newer version is preserved, not overwritten', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'scriptorium-e2e-'));
  const future = JSON.stringify({
    version: 999,
    savedAt: Date.now(),
    state: { gold: 4242 },
  });
  writeFileSync(path.join(dir, 'save.json'), future, 'utf-8');

  const pom = new ScriptoriumPage();
  pom.userDataDir = dir;
  await pom.launch();
  try {
    expect(await pom.readGold()).toBe(0);
    const quarantined = readdirSync(dir).filter(f => f.startsWith('save.corrupt-'));
    expect(quarantined.length).toBe(1);
    // the newer save is still recoverable
    expect(JSON.parse(readFileSync(path.join(dir, quarantined[0]!), 'utf-8')).state.gold).toBe(4242);
  } finally {
    await pom.close();
    pom.cleanup();
  }
});

test('a non-finite letter count is rejected without hanging', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'scriptorium-e2e-'));
  writeFileSync(path.join(dir, 'save.json'), JSON.stringify({
    version: 1,
    savedAt: Date.now(),
    state: {
      gold: 10, totalGold: 10, salt: 0, totalSalt: 0,
      letters: 1e999, totalLetters: 0,
      currentPage: 1, codices: 0,
      goldLevels: {}, saltLevels: {},
    },
  }), 'utf-8');

  const pom = new ScriptoriumPage();
  pom.userDataDir = dir;
  await pom.launch();
  try {
    expect(await pom.readGold()).toBe(0);
  } finally {
    await pom.close();
    pom.cleanup();
  }
});

test('wiping the save returns to a fresh game', async () => {
  const pom = new ScriptoriumPage();
  await pom.launch();
  try {
    await pom.addGold(999);
    await pom.saveNow();
    await pom.wipeSave();
    expect(existsSync(pom.savePath())).toBe(false);

    await pom.relaunch();
    expect(await pom.readGold()).toBe(0);
  } finally {
    await pom.close();
    pom.cleanup();
  }
});

test('a fresh profile starts with no save file', async () => {
  const pom = new ScriptoriumPage();
  await pom.launch();
  try {
    expect(existsSync(pom.savePath())).toBe(false);
    expect(await pom.readGold()).toBe(0);
  } finally {
    await pom.close();
    pom.cleanup();
  }
});
