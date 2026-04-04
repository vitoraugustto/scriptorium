import { contextBridge } from 'electron';
import { is } from '@electron-toolkit/utils';

contextBridge.exposeInMainWorld('electronAPI', {
  isDebug: is.dev,
});
