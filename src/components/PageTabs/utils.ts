import { nanoid } from 'nanoid'
import { IpcRendererEvent, ipcRenderer } from 'electron'

export const createTab = (path: string) => {
  const id = nanoid()
  ipcRenderer.send('create-view', id, path)
}

export const switchTab = (id: string) => {
  ipcRenderer.send('switch-view', id)
}

export const removeTab = (id: string) => {
  ipcRenderer.send('remove-view', id)
}

export const updateTabs = () => {
  ipcRenderer.send('get-views')
}
export const updateTabSate = (state: { loading?: boolean, progress?: number }) => {
  ipcRenderer.send('update-view', state)
}

export function isInBrowserWindow () {
  return new Promise<boolean>((resolve, reject) => {
    ipcRenderer.once('isInBrowserWindow-return', (e: IpcRendererEvent, isIn: boolean) => {
      resolve(isIn)
    })
    ipcRenderer.send('isInBrowserWindow')
  })
}
