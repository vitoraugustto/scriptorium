import { contextBridge, ipcRenderer } from 'electron';
import { SAVE_CHANNELS } from '../shared/channels';

contextBridge.exposeInMainWorld('saveAPI', {
  read:       (): Promise<string | null> => ipcRenderer.invoke(SAVE_CHANNELS.read),
  write:      (data: string): Promise<void> => ipcRenderer.invoke(SAVE_CHANNELS.write, data),
  wipe:       (): Promise<void> => ipcRenderer.invoke(SAVE_CHANNELS.wipe),
  quarantine: (): Promise<void> => ipcRenderer.invoke(SAVE_CHANNELS.quarantine),
  cache:      (data: string): void => { ipcRenderer.send(SAVE_CHANNELS.cache, data); },
});
