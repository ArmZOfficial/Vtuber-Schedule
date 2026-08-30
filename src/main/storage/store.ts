import Store from 'electron-store'
import { ipcMain } from 'electron'

const store = new Store()

export function initStoreHandlers() {
  ipcMain.handle('store:get', (_event, key: string) => {
    try {
      return store.get(key)
    } catch (err) {
      console.error(`[store:get] Error reading key "${key}":`, err)
      return null
    }
  })

  ipcMain.handle('store:set', (_event, key: string, value: any) => {
    try {
      store.set(key, value)
      return true
    } catch (err) {
      console.error(`[store:set] Error saving key "${key}":`, err)
      return false
    }
  })

  ipcMain.handle('store:delete', (_event, key: string) => {
    try {
      store.delete(key)
      return true
    } catch (err) {
      console.error(`[store:delete] Error deleting key "${key}":`, err)
      return false
    }
  })

  ipcMain.handle('store:list', () => {
    try {
      return store.store
    } catch (err) {
      console.error('[store:list] Error reading store:', err)
      return {}
    }
  })
}
