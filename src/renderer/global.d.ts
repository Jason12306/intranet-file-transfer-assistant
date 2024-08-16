interface Window {
  electronAPI: {
    ipcRenderer: Electron.IpcRenderer
    selectDir: () => Promise<any>
    onFromMain: (opt: 'on' | 'off', callback: (...args: any) => void) => void
  }
}
