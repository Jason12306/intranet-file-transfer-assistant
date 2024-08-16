import { SELECT_DIR } from '../constants'

const { contextBridge, ipcRenderer } = require('electron/renderer')

contextBridge.exposeInMainWorld('electronAPI', {
  selectDir: () => ipcRenderer.invoke(SELECT_DIR),
})
