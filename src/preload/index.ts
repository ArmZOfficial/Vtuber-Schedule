import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  export: {
    saveImage: (base64: string, defaultName?: string) =>
      ipcRenderer.invoke('dialog:save-image', { base64, defaultName }),
    saveImagesBatch: (files: { base64: string; filename: string }[]) =>
      ipcRenderer.invoke('dialog:save-images-batch', { files })
  },
  store: {
    get: (key: string) => ipcRenderer.invoke('store:get', key),
    set: (key: string, value: any) => ipcRenderer.invoke('store:set', key, value),
    delete: (key: string) => ipcRenderer.invoke('store:delete', key),
    list: () => ipcRenderer.invoke('store:list')
  },
  theme: {
    setSource: (theme: 'light' | 'dark' | 'system') => ipcRenderer.invoke('theme:set-source', theme)
  },
  shell: {
    showItemInFolder: (fullPath: string) => ipcRenderer.invoke('shell:show-item', fullPath)
  },
  fonts: {
    list: () => ipcRenderer.invoke('fonts:list'),
    read: (file: string) => ipcRenderer.invoke('fonts:read', file)
  },
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close'),
    onMaximizeChange: (callback: (isMaximized: boolean) => void) => {
      const listener = (_event: any, isMaximized: boolean) => callback(isMaximized)
      ipcRenderer.on('window:maximize-change', listener)
      return () => {
        ipcRenderer.removeListener('window:maximize-change', listener)
      }
    }
  }
})

// Types for the window.api object
declare global {
  interface Window {
    api: {
      export: {
        saveImage: (base64: string, defaultName?: string) => Promise<{ success: boolean, filePath?: string, canceled?: boolean, error?: string }>,
        saveImagesBatch: (files: { base64: string; filename: string }[]) => Promise<{ success: boolean, dir?: string, written?: string[], canceled?: boolean, error?: string }>
      },
      store: {
        get: (key: string) => Promise<any>
        set: (key: string, value: any) => Promise<boolean>
        delete: (key: string) => Promise<boolean>
        list: () => Promise<Record<string, any>>
      },
      theme: {
        setSource: (theme: 'light' | 'dark' | 'system') => Promise<void>
      },
      shell: {
        showItemInFolder: (fullPath: string) => Promise<boolean>
      },
      fonts: {
        list: () => Promise<{ family: string; file: string }[]>
        read: (file: string) => Promise<string | null>
      },
      window: {
        minimize: () => void
        maximize: () => void
        close: () => void
        onMaximizeChange: (callback: (isMaximized: boolean) => void) => () => void
      }
    }
  }
}
