import { BrowserView, BrowserWindow, IpcMainEvent, WebContents, ipcMain, BrowserWindowConstructorOptions } from 'electron'
import { join } from 'path';
import { PRELOAD, INDEX_HTML, TITLE_BAR_HEIGHT, ROOT_URL } from '../utils/const';
import { URL } from 'url'

type ViewInfo = { id: string, view: BrowserView }
interface Win {
  window: BrowserWindow
  views: ViewInfo[]
  activeViewId: string
}

export default class WinManager {
  windows: Win[]
  constructor() {
    this.windows = []
    this.bindIpcEvent()
  }
  
  createWindow (options?: BrowserWindowConstructorOptions) {
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
      ...(options || {}),
    })
  
    if (process.env.VITE_DEV_SERVER_URL) {
      win.loadURL(ROOT_URL)
      win.webContents.openDevTools()
    } else {
      win.loadFile(INDEX_HTML)
    }
    this.addWinEvent(win)
    this.windows.push({window: win, views: [], activeViewId: ''})
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
    this.setViewBounds(view, win, true)

    if (process.env.VITE_DEV_SERVER_URL) {
      view.webContents.loadURL(`${ROOT_URL}#${path}`)
      view.webContents.openDevTools()
    } else {
      view.webContents.loadFile(INDEX_HTML, { hash: path })
    }

    const info = this.getWinInfoByWin(win)
    info.views.push({view, id})
    info.activeViewId = id
    // TODO: 监听view url变化，更新title
    
    return view
  }

  // 监听窗口大小变化，重新设置view的大小
  addWinEvent (win: BrowserWindow) {
    win.addListener('resize', () => {
      const { view } = this.getViewInfoByWin(win) || { view: null }
      view && this.setViewBounds(view, win, true)
    })
    win.addListener('closed', () => {
      const index = this.windows.findIndex(item => item.window === win)
      this.windows.splice(index, 1)
      win.destroy()
    })
  }

  // 移除view
  removeView(id: string, win: BrowserWindow) {
    const { views } = this.getWinInfoByWin(win)
    const index = views.findIndex(item => item.id === id)
    const { view } = views[index]
    win.removeBrowserView(view)
    views.splice(index, 1)
    return view
  }

  getWinInfoByWin(win: BrowserWindow) {
    return this.windows.find(item => item.window === win)
  }

  // 通过view id获取view信息，如果id为空则获取当前激活的view信息
  getViewInfoByWin(win: BrowserWindow, id?: string) {
    const info = this.getWinInfoByWin(win)
    return info.views.find(item => item.id === (id || info.activeViewId))
  }
  // 设置view的大小
  setViewBounds(view: BrowserView, win: BrowserWindow, isShow = true) {
    const { width, height } = win.getBounds()
    view.setBounds({ 
      x: 0, 
      y: TITLE_BAR_HEIGHT, 
      width: isShow ? width : 0, 
      height: isShow ? height - TITLE_BAR_HEIGHT : 0
    })
  }
  // 切换view
  switchView(id: string, win: BrowserWindow) {
    const info = this.getWinInfoByWin(win)
    info.views.forEach(item => {
      this.setViewBounds(item.view, win, id === item.id)
    })
    info.activeViewId = id
  }

  getRelativeUrl(webContents: WebContents) {
    const url = webContents.getURL()
    return url.replace((process.env.VITE_DEV_SERVER_URL ? ROOT_URL : INDEX_HTML) + '#', '')
  }

  getTabInfoWithWin(win: BrowserWindow) {
    const { views, activeViewId } = this.getWinInfoByWin(win)

    const tabs = views.map(item => ({
      id: item.id, 
      path: this.getRelativeUrl(item.view.webContents)
    }))

    return { tabs, activeViewId }
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
    // 获取当前窗口的view列表
    ipcMain.on('get-views', (e: IpcMainEvent) => {
      
      const win = BrowserWindow.fromWebContents(e.sender)
      if (!win) return
      const { tabs, activeViewId } = this.getTabInfoWithWin(win)
      e.sender.send('get-views-return', tabs, activeViewId)
    })
    // 拖拽view到窗口外：创建新的窗口
    // ipcMain.on('create-window-view', (e: IpcMainEvent, id: string, offset: { offsetX: number, offsetY: number}) => {
    //   const win = BrowserWindow.fromWebContents(e.sender)
    //   const { x, y } = win.getBounds()
    //   const { offsetX, offsetY } = offset

    //   // 在原window上删除view
    //   const view = this.removeView(id, win)
    //   const { tabs, activeViewId } = this.getTabInfoWithWin(win)
    //   e.sender.send('get-views-return', tabs, activeViewId)

    //   // 创建新窗口并添加view
    //   const newWin = this.createWindow({
    //     x: x + offsetX,
    //     y: y + offsetY,
    //   })
    //   newWin.addBrowserView(view)
    //   this.setViewBounds(view, newWin)
    //   this.windows.push({ 
    //     window: newWin, 
    //     views: [{ id, view }],
    //     activeViewId: id
    //   })
    //   console.log('push!!!', this.windows, id, view);
      
    //   newWin.webContents.once('did-finish-load', () => {
    //     newWin.webContents.send('get-views-return', [{ id, path: this.getRelativeUrl(view.webContents) }], id)
    //     console.log('send!!!', this.windows);
        
    //   })
    // })
  }
}
