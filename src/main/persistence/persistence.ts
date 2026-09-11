import { app, ipcMain } from 'electron';
import {
  closeSync, fsyncSync, openSync, readFileSync, renameSync, unlinkSync, writeFileSync,
} from 'fs';
import { join } from 'path';
import { SAVE_CHANNELS } from '../../shared/channels';

const FILE = 'save.json';

const savePath = (): string => join(app.getPath('userData'), FILE);

let _cached: string | null = null;

const read = (): string | null => {
  try {
    return readFileSync(savePath(), 'utf-8');
  } catch {
    return null;
  }
};

// tmp + fsync + rename: a crash mid-write leaves the previous save intact
const write = (data: string): void => {
  const target = savePath();
  const tmp = `${target}.tmp`;
  const fd = openSync(tmp, 'w');
  try {
    writeFileSync(fd, data, 'utf-8');
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
  renameSync(tmp, target);
  _cached = data;
};

const wipe = (): void => {
  _cached = null;
  try {
    unlinkSync(savePath());
  } catch {
    // already absent
  }
};

const quarantine = (): void => {
  _cached = null;
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  try {
    renameSync(savePath(), join(app.getPath('userData'), `save.corrupt-${stamp}.json`));
  } catch {
    // nothing to set aside
  }
};

const flush = (): void => {
  if (_cached === null) return;
  try {
    write(_cached);
  } catch {
    // quitting: nothing useful left to do
  }
};

const init = (): void => {
  ipcMain.handle(SAVE_CHANNELS.read, () => read());
  ipcMain.handle(SAVE_CHANNELS.write, (_e, data: string) => { write(data); });
  ipcMain.handle(SAVE_CHANNELS.wipe, () => { wipe(); });
  ipcMain.handle(SAVE_CHANNELS.quarantine, () => { quarantine(); });
  ipcMain.on(SAVE_CHANNELS.cache, (_e, data: string) => { _cached = data; });

  app.on('before-quit', flush);
};

export default { init, flush };
