import { GET_CONFIG, SELECT_DIR } from '../constants'

import { contextBridge, ipcRenderer } from 'electron/renderer'

contextBridge.exposeInMainWorld('electronAPI', {
  selectDir: () => ipcRenderer.invoke(SELECT_DIR),
})
