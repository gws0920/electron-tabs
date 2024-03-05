import { BrowserView, BrowserWindow, IpcMainEvent, ipcMain } from 'electron'
import { join } from 'path';
import { PRELOAD, URL, INDEX_HTML, TITLE_BAR_HEIGHT } from '../utils/const';

interface Win {
  window: BrowserWindow
  views: Record<string, BrowserView>
}

export default class WinManager {
  windows: Win[]
  constructor() {
    this.windows = []
    this.bindIpcEvent()
  }
  
  createWindow () {
    const win = new BrowserWindow({
      title: 'Main window',
      icon: join(process.env.VITE_PUBLIC, 'favicon.ico'),
      width: 1200,
      titleBarStyle: 'hidden',
      webPreferences: {
        preload: PRELOAD,
        nodeIntegration: true,
        contextIsolation: false,
      },
    })
  
    if (process.env.VITE_DEV_SERVER_URL) {
      win.loadURL(URL)
      win.webContents.openDevTools()
    } else {
      win.loadFile(INDEX_HTML)
    }
    this.addWinEvent(win)
    this.windows.push({window: win, views: {}})
    return win
  }

  createViewInWindow(path: string, id: string, win: BrowserWindow) {
    const view = new BrowserView({
      webPreferences: {
        preload: PRELOAD,
        nodeIntegration: true,
        contextIsolation: false,
      },
    })
    win.addBrowserView(view)
    const { width, height } = win.getBounds()
    view.setBounds({ 
      x: 0, 
      y: TITLE_BAR_HEIGHT, 
      width, 
      height: height - TITLE_BAR_HEIGHT
    })

    if (process.env.VITE_DEV_SERVER_URL) {
      view.webContents.loadURL(`${URL}#${path}`)
      view.webContents.openDevTools()
    } else {
      view.webContents.loadFile(INDEX_HTML, { hash: path })
    }

    const views = this.getViewsByWin(win)
    views[id] = view
  }

  addWinEvent (win: BrowserWindow) {
    win.addListener('resize', () => {
      this.windows.forEach(item => {
        if (item.window === win) {
          Object.values(item.views).forEach((view: BrowserView) => {
            view.setBounds({ 
              x: 0, 
              y: TITLE_BAR_HEIGHT, 
              width: 50, 
              height: win.getBounds().height - TITLE_BAR_HEIGHT
            })
          })
        }
      })
    })
  }

  removeView(id: string, win: BrowserWindow) {
    const views = this.getViewsByWin(win)
    const view = views?.[id]
    if (!view) return
    win.removeBrowserView(view)
    delete views[id]
  }

  getViewsByWin(win: BrowserWindow) {
    return this.windows.find(item => item.window === win)?.views || {}
  }

  switchView(id: string, win: BrowserWindow) {
    const views = this.getViewsByWin(win)
    for (const viewId in views) {
      if (Object.prototype.hasOwnProperty.call(views, viewId)) {
        const view = views[viewId];
        const { width, height } = win.getBounds()
        if (id === viewId) {
          view.setBounds({ 
            x: 0, 
            y: TITLE_BAR_HEIGHT, 
            width, 
            height: height - TITLE_BAR_HEIGHT
          })
        } else {
          view.setBounds({ 
            x: 0, 
            y: TITLE_BAR_HEIGHT, 
            width: 0, 
            height: 0
          })
        }
      }
    }
    win.setBrowserView(views[id])
  }

  bindIpcEvent() {
    ipcMain.on('create-view', (e: IpcMainEvent, id: string, path) => {
      const win = BrowserWindow.fromWebContents(e.sender)
      if (!win) return
      this.createViewInWindow(path, id, win)
    })
    ipcMain.on('remove-view', (e: IpcMainEvent, id) => {
      const win = BrowserWindow.fromWebContents(e.sender)
      if (!win) return
      this.removeView(id, win)
    })
    ipcMain.on('switch-view', (e: IpcMainEvent, id) => {
      const win = BrowserWindow.fromWebContents(e.sender)
      if (!win) return
      this.switchView(id, win)
    })
    ipcMain.on('get-views', (e: IpcMainEvent) => {
      
      const win = BrowserWindow.fromWebContents(e.sender)
      if (!win) return
      const views = this.getViewsByWin(win)
      const res = []
      for (const id in views) {
        if (Object.prototype.hasOwnProperty.call(views, id)) {
          const view = views[id];
          // const path = view?.webContents?.getUrl()
          console.log(view.webContents, Object.keys(view.webContents));
          res.push({ id, path: 'xxx' })
        }
      }
      ipcMain.emit('get-views-return', res)
      console.log('发送的views', res);
      
    })
  }
}

