import { _electron as electron, ElectronApplication, Page } from 'playwright';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { testIds } from '../fixtures/selectors';

declare global {
  interface Window {
    __debug?: {
      addGold: (n: number) => void;
      addLetters: (n: number) => void;
      reset: () => void;
      save: () => Promise<void>;
      load: () => Promise<void>;
      wipe: () => Promise<void>;
    };
  }
}

export class ScriptoriumPage {
  app!: ElectronApplication;
  page!: Page;
  userDataDir!: string;

  // each run gets its own userData dir so saves never leak between specs
  async launch(): Promise<void> {
    if (!this.userDataDir) this.userDataDir = mkdtempSync(path.join(tmpdir(), 'scriptorium-e2e-'));

    // ELECTRON_RUN_AS_NODE is set in the Playwright parent; inheriting it would
    // start Electron in Node mode, where it rejects Chromium flags
    const { ELECTRON_RUN_AS_NODE: _ignored, ...parentEnv } = process.env;

    this.app = await electron.launch({
      args: [path.join(__dirname, '../../out/main/index.js')],
      env: { ...parentEnv, ELECTRON_USER_DATA: this.userDataDir } as Record<string, string>,
    });
    this.page = await this.app.firstWindow();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async close(): Promise<void> {
    await this.app.close();
  }

  // same userData dir: this is how save survival is tested
  async relaunch(): Promise<void> {
    await this.close();
    await this.launch();
  }

  savePath(): string {
    return path.join(this.userDataDir, 'save.json');
  }

  cleanup(): void {
    if (this.userDataDir) rmSync(this.userDataDir, { recursive: true, force: true });
  }

  async saveNow(): Promise<void> {
    await this.page.evaluate(() => window.__debug?.save());
  }

  async wipeSave(): Promise<void> {
    await this.page.evaluate(() => window.__debug?.wipe());
  }

  async pressKey(key: string): Promise<void> {
    await this.page.keyboard.press(key);
  }

  async pressKeyN(key: string, n: number): Promise<void> {
    for (let i = 0; i < n; i++) await this.page.keyboard.press(key);
  }

  async readGold(): Promise<number> {
    const text = await this.page.getByTestId(testIds.gold).innerText();
    return parseInt(text.replace(/[^0-9]/g, ''), 10);
  }

  async waitForGold(): Promise<void> {
    await this.page.waitForFunction(
      (id: string) => {
        const el = document.querySelector(`[data-testid="${id}"]`);
        return el ? parseInt(el.textContent!.replace(/[^0-9]/g, ''), 10) > 0 : false;
      },
      testIds.gold,
      { timeout: 15_000 },
    );
  }

  async readPageProgress(): Promise<number> {
    return this.page.getByTestId(testIds.progressPage).evaluate(
      (el: HTMLElement) => parseFloat(el.style.width),
    );
  }

  async clickFirstUpgrade(list: 'listDn' | 'listSalt'): Promise<void> {
    await this.page.getByTestId(testIds[list]).locator('.upgrade-row').first().click();
  }

  async switchTab(tab: 'tabDn' | 'tabSalt'): Promise<void> {
    await this.page.getByTestId(testIds[tab]).click();
  }

  async addGold(n: number): Promise<void> {
    await this.page.evaluate((n) => window.__debug?.addGold(n), n);
  }

  async addLetters(n: number): Promise<void> {
    await this.page.evaluate((n) => window.__debug?.addLetters(n), n);
  }

  async resetGame(): Promise<void> {
    await this.page.evaluate(() => window.__debug?.reset());
  }
}
