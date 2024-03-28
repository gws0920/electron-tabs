import { app, shell, BrowserView, BrowserWindow, IpcMainEvent, WebContents, ipcMain, BrowserWindowConstructorOptions, dialog } from 'electron'
import { join } from 'path'
import { INDEX_HTML, PRELOAD, ROOT_URL, TITLE_BAR_HEIGHT } from './utils/const'

type ViewInfo = { id: string, view: BrowserView, loading?: boolean, progress?: number }
interface Win {
  window: BrowserWindow
  views: ViewInfo[]
  activeViewId: string
  perActiveViewId?: string // 上次选中的viewId
}


export default class TabManager {
  windows: Win[]
  constructor () {
    this.windows = []
    this.bindIpcEvent()
  }

  createWindow (options?: BrowserWindowConstructorOptions, path?: string, query?: string) {
    const win = new BrowserWindow({
      title: import.meta.env.VITE_APP_TITLE,
      icon: join(process.env.VITE_PUBLIC, 'favicon.ico'),
      width: 1200,
      height: 800,
      titleBarStyle: 'hidden',
      frame: process.platform === 'darwin',
      trafficLightPosition: { y: 14, x: 10 },
      webPreferences: {
        preload: PRELOAD,
        nodeIntegration: true,
        contextIsolation: false,
        spellcheck: false,
        webviewTag: true,
      },
      ...options
    })

    if (app.isPackaged) {
      win.loadFile(INDEX_HTML, { hash: path, search: query })
    } else {
      win.loadURL(`${ROOT_URL}/#${path || ''}${query ? `?${query}` : ''}`)
      win.webContents.openDevTools()
    }
 
    win.addListener('resize', () => {
      const info = this.windows.find(item => item.window === win)
      if (!info) return
      const viewInfo = info.views.find(item => item.id === info.activeViewId)
      viewInfo && this.setViewBounds(viewInfo.view, win, true)
    })
    win.addListener('closed', () => {
      const index = this.windows.findIndex(item => item.window === win)
      this.windows.splice(index, 1)
      win.destroy()
    })
    win.addListener('enter-full-screen', () => {
      win.webContents.send('update-full-screen-state', true)
    })
    win.addListener('leave-full-screen', () => {
      win.webContents.send('update-full-screen-state', false)
    })
    this.windows.push({ window: win, views: [], activeViewId: '' })
    return win
  }

  createViewInWindow (id: string, win: BrowserWindow, path?: string, query?: string) {
    const view = new BrowserView({
      webPreferences: {
        preload: PRELOAD,
        nodeIntegration: true,
        contextIsolation: false,
      },
    })
    win.addBrowserView(view)
    this.setViewBounds(view, win, true)

    if (app.isPackaged) {
      view.webContents.loadFile(INDEX_HTML, { hash: path, search: query })
    } else {
      view.webContents.loadURL(`${ROOT_URL}/#${path || ''}${query ? `?${query}` : ''}`)
      view.webContents.openDevTools()
    }

    const winInfo = this.windows.find(item => item.window === win)
    if (winInfo) {
      const viewInfo = { view, id, loading: true }
      winInfo.views.push(viewInfo)
      winInfo.activeViewId = id
      view.webContents.once('did-finish-load', () => {
        viewInfo.loading = false
        this.sendWinInfo(win)
      })
    }
    return view
  }

  setViewBounds (view: BrowserView, win: BrowserWindow, isShow = true) {
    const { width, height } = win.getContentBounds()
    view.setBounds({
      x: 0,
      y: TITLE_BAR_HEIGHT,
      width: isShow ? width : 0,
      height: isShow ? height - TITLE_BAR_HEIGHT : 0
    })
    return view
  }
  // 切换view
  switchView (id: string, win: BrowserWindow) {
    const info = this.windows.find(item => item.window === win)
    if (!info) return
    info.views.forEach(item => {
      this.setViewBounds(item.view, win, id === item.id)
    })
    info.perActiveViewId = info.activeViewId
    info.activeViewId = id
  }
  // 移除view
  removeView (id: string, win: BrowserWindow) {
    const winInfo = this.windows.find(item => item.window === win)
    if (!winInfo) return
    const index = winInfo.views.findIndex(item => item.id === id)
    if (index === -1) return

    const { view } = winInfo.views[index]
    win.removeBrowserView(view)
    winInfo.views.splice(index, 1)

    if (winInfo.activeViewId === id) { // 移除当前激活的view
      winInfo.activeViewId = winInfo.perActiveViewId || ''
      winInfo.perActiveViewId = ''
    } else { // 移除非激活的view
      if (id === winInfo.perActiveViewId) { // 移除的是上一个激活的view
        winInfo.perActiveViewId = ''
      }
    }
    return view
  }

  getTabInfoByWin (win: BrowserWindow) {
    const info = this.windows.find(item => item.window === win)
    if (!info) return { tabs: [], activeViewId: '' }
    const { views, activeViewId } = info
    const tabs = views.map(item => {
      return {
        id: item.id,
        loading: item.loading,
        progress: item.progress,
        path: item.view.webContents.getURL().replace((app.isPackaged ? INDEX_HTML : ROOT_URL) + '/#', ''),
      }
    })

    return { tabs, activeViewId }
  }
  sendWinInfo (win: BrowserWindow) {
    const { tabs, activeViewId } = this.getTabInfoByWin(win)
    win.webContents.send('get-views-return', tabs, activeViewId)
  }
  // 创建新窗口
  createNewWindow (path?: string, query?: string) {
    if (path && /^\/\?/.test(path)) {
      const win = this.createWindow({}, path, query)
      win.webContents.once('did-finish-load', () => {
        this.sendWinInfo(win)
      })
    } else {
      const win = this.createWindow()
      const view = this.createViewInWindow(Math.random() * 9999 + '', win, path, query)
      win.webContents.once('did-finish-load', () => {
        this.sendWinInfo(win)
      })
    }
  }
  bindIpcEvent () {
    ipcMain.on('create-view', (e: IpcMainEvent, id: string, path = '', query = '') => {
      const win = BrowserWindow.fromWebContents(e.sender)
      if (!win) return
      this.createViewInWindow(id, win, path, query)
      console.log('create-view', path, id)
      this.sendWinInfo(win)
    })
    ipcMain.on('remove-view', async (e: IpcMainEvent, id) => {
      const win = BrowserWindow.fromWebContents(e.sender)
      if (!win) return
      const winInfo = this.windows.find(item => item.window === win)
      if (!winInfo) return
      const viewInfo = winInfo.views.find(item => item.id === id)
      if (viewInfo?.loading) {
        const { response } = await dialog.showMessageBox({
          type: 'warning',
          buttons: ['取消', '仍然关闭'],
          title: '关闭',
          defaultId: 0,
          cancelId: -1,
          message: '窗口运行中，是否关闭？',
        })
        if (response !== 1) return
      }
      this.removeView(id, win)
      this.sendWinInfo(win)
    })
    ipcMain.on('switch-view', (e: IpcMainEvent, id) => {
      const win = BrowserWindow.fromWebContents(e.sender)
      if (!win) return
      this.switchView(id, win)
      this.sendWinInfo(win)
    })
    // 获取当前窗口的view列表
    ipcMain.on('get-views', (e: IpcMainEvent) => {
      const win = BrowserWindow.fromWebContents(e.sender)
      win && this.sendWinInfo(win)
    })
    // 修改当前view的状态, 主要用来更新loading和进度条状态
    ipcMain.on('update-view', (e: IpcMainEvent, state: {loading: boolean, progress: number}) => {
      const win = BrowserWindow.fromWebContents(e.sender)
      if (!win) return
      const winInfo = this.windows.find(item => item.window === win)
      if (!winInfo) return
      const viewInfo = winInfo.views.find(item => item.view.webContents === e.sender)
      if (!viewInfo) return
      viewInfo.loading = !!state.loading
      viewInfo.progress = +state.progress
      this.sendWinInfo(win)
    })
    ipcMain.on('isInBrowserWindow', (e: IpcMainEvent) => {
      const isInBrowserWindow = this.windows.some(item => item.window.webContents === e.sender)
      e.sender.send('isInBrowserWindow-return', isInBrowserWindow)
    })
    ipcMain.on('minimize', (e: IpcMainEvent) => {
      const win = BrowserWindow.fromWebContents(e.sender)
      if (!win) return
      win.minimize()
    })
    ipcMain.on('maximize', (e: IpcMainEvent) => {
      const win = BrowserWindow.fromWebContents(e.sender)
      if (!win) return
      if (win.isMaximized()) {
        win.unmaximize()
      } else {
        win.maximize()
      }
    })
    ipcMain.on('close', (e: IpcMainEvent) => {
      const win = BrowserWindow.fromWebContents(e.sender)
      if (!win) return
      win.close()
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
