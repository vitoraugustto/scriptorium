import { _electron as electron, ElectronApplication, Page } from 'playwright';
import path from 'path';
import { testIds } from '../selectors';

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

  // Dispatches keydown events directly in the renderer — use for large counts
  async dispatchKeydowns(key: string, n: number): Promise<void> {
    await this.page.evaluate(
      ({ key, n }: { key: string; n: number }) => {
        for (let i = 0; i < n; i++) {
          document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
        }
      },
      { key, n },
    );
  }

  async readGold(): Promise<number> {
    const text = await this.page.getByTestId(testIds.gold).innerText();
    return parseInt(text.replace(/[^0-9]/g, ''), 10);
  }

  async readSalt(): Promise<string> {
    return this.page.getByTestId(testIds.salt).innerText();
  }

  async readCodexCount(): Promise<number> {
    const text = await this.page.locator('#js-codex-count').innerText();
    return parseInt(text, 10);
  }

  async waitForGold(): Promise<void> {
    await this.page.waitForFunction(
      (id: string) => {
        const el = document.querySelector(`[data-testid="${id}"]`);
        return el ? parseInt(el.textContent!.replace(/[^0-9]/g, ''), 10) > 0 : false;
      },
      testIds.gold,
      { timeout: 5_000 },
    );
  }

  async waitForGoldChange(previous: number): Promise<void> {
    await this.page.waitForFunction(
      ({ id, prev }: { id: string; prev: number }) => {
        const el = document.querySelector(`[data-testid="${id}"]`);
        return el ? parseInt(el.textContent!.replace(/[^0-9]/g, ''), 10) > prev : false;
      },
      { id: testIds.gold, prev: previous },
      { timeout: 5_000 },
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
}
