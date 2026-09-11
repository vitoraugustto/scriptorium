import { app, BrowserWindow } from 'electron';
import { join } from 'path';
import { is } from '@electron-toolkit/utils';
import Persistence from './persistence';

// unpackaged Electron derives both from its own name, which would store saves
// under a folder called "Electron"; setName alone does not move userData
app.setName('Scriptorium');
app.setPath('userData', join(app.getPath('appData'), 'Scriptorium'));

// must run before anything reads the path (E2E isolates the save per run)
const userDataOverride = process.env['ELECTRON_USER_DATA'];
if (userDataOverride) app.setPath('userData', userDataOverride);

Persistence.init();

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    title: 'Scriptorium',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // on macOS closing the window does not quit, so before-quit would not fire
  win.on('close', () => Persistence.flush());

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
