import { app, dialog, ipcMain } from 'electron'
import { SELECT_DIR } from '../constants'
import path from 'path'
;(function () {
  ipcMain.handle(SELECT_DIR, () => {
    const dir =
      dialog.showOpenDialogSync({
        properties: ['openDirectory'],
      })?.[0] || ''

    return dir ? path.resolve(dir) : dir
  })
})()
