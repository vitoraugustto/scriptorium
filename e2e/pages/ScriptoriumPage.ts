import { _electron as electron, ElectronApplication, Page } from 'playwright';
import path from 'path';
import { testIds } from '../fixtures/selectors';

declare global {
  interface Window {
    __debug?: {
      addGold: (n: number) => void;
      addLetters: (n: number) => void;
      reset: () => void;
    };
  }
}

export class ScriptoriumPage {
  app!: ElectronApplication;
  page!: Page;

  async launch(): Promise<void> {
    this.app = await electron.launch({
      args: [path.join(__dirname, '../../out/main/index.js')],
    });
    this.page = await this.app.firstWindow();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async close(): Promise<void> {
    await this.app.close();
  }

  async pressKey(key: string): Promise<void> {
    await this.page.keyboard.press(key);
  }

  async pressKeyN(key: string, n: number): Promise<void> {
    for (let i = 0; i < n; i++) await this.page.keyboard.press(key);
  }

  async dispatchKeydowns(key: string, n: number): Promise<void> {
    const BATCH = 2_000;
    for (let i = 0; i < n; i += BATCH) {
      const count = Math.min(BATCH, n - i);
      await this.page.evaluate(
        ({ key, count }: { key: string; count: number }) => {
          for (let j = 0; j < count; j++) {
            document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
          }
        },
        { key, count },
      );
    }
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
