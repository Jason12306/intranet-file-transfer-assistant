import { app, dialog, ipcMain } from 'electron'
import { SELECT_DIR } from '../constants'
;(function () {
  ipcMain.handle(SELECT_DIR, () => {
    return (
      dialog.showOpenDialogSync({
        properties: ['openDirectory'],
      })?.[0] + '/'
    )
  })
})()
