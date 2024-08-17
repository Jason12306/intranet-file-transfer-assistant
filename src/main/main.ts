import { app, BrowserWindow, ipcMain, Menu } from 'electron'
import path, { resolve } from 'path'
import fs from 'fs'
import electronConfig from '../../electron-vue.config'
import { run as runInnerServer } from './inner-server'
import { GET_CONFIG } from '../constants'
import { EnvEnum, getRendererDir } from './utils'
import './ipc'

/**
 * @description 注入环境变量
 * process.env[attr] 值只能为字符串
 */
// electron 是否打包
process.env.GLOBAL_IS_PACKAGED = app.isPackaged ? EnvEnum.prod : EnvEnum.dev
// electron 的appPath
process.env.GLOBAL_ENV_PWD = app.getAppPath()

// 载入配置 start
const { main } = electronConfig()
const { browserWindowSize } = main

// 载入配置 end

const isMac = process.platform === 'darwin'

let win: BrowserWindow
const createWindow = async (localUrl: string) => {
  win = new BrowserWindow({
    width: browserWindowSize.minWidth,
    height: browserWindowSize.minHeight,
    minWidth: browserWindowSize.minWidth,
    minHeight: browserWindowSize.minHeight,
    titleBarStyle: isMac ? 'hidden' : 'default',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  win.setMenuBarVisibility(!false)
  win.loadURL(localUrl)

  if (!app.isPackaged) {
    win.webContents.openDevTools()
  }
  return win
}

app.whenReady().then(() => {
  runInnerServer()
    .then(async ({ localUrl, apiUrl }) => {
      // ipcMain.handle(GET_CONFIG, () => {
      //   return { apiUrl, localUrl }
      // })

      const params = '?api=' + apiUrl + '&localUrl=' + localUrl
      const url = app.isPackaged ? localUrl : process.env.CLIENT_URL + params

      createWindow(url)
    })
    .catch((err) => {
      console.log(err)
    })
})

/**
 * 设置菜单
 */
// https://www.electronjs.org/zh/docs/latest/api/menu#examples
// @ts-ignore
const menu = Menu.buildFromTemplate([
  {
    label: 'transfer assistant',
    submenu: [
      { role: 'copy', label: '复制' },
      { role: 'cut', label: '剪切' },
      { role: 'paste', label: '粘贴' },
      { role: 'selectAll', label: '全选' },
      { type: 'separator' },
      { role: 'toggleDevTools', label: '开发者工具', visible: true },
      { role: 'about', label: '关于' },
      { role: 'quit', label: '退出' },
    ],
  },
])
// Menu.setApplicationMenu(menu)
