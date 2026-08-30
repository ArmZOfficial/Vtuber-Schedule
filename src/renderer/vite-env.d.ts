/// <reference types="vite/client" />

declare global {
  interface Window {
    api?: {
      export: {
        saveImage: (base64: string, defaultName?: string) => Promise<{ success: boolean, filePath?: string, canceled?: boolean, error?: string }>
        saveImagesBatch: (files: { base64: string; filename: string }[]) => Promise<{ success: boolean, dir?: string, written?: string[], canceled?: boolean, error?: string }>
      },
      store?: {
        get: (key: string) => Promise<any>
        set: (key: string, value: any) => Promise<boolean>
        delete: (key: string) => Promise<boolean>
        list: () => Promise<Record<string, any>>
      },
      theme?: {
        setSource: (theme: 'light' | 'dark' | 'system') => Promise<void>
      },
      shell?: {
        /** เปิด File Explorer ค้างไว้ที่ไฟล์นั้น — ใช้หลัง export สำเร็จ */
        showItemInFolder: (fullPath: string) => Promise<boolean>
      },
      window?: {
        minimize: () => void
        maximize: () => void
        close: () => void
        /** คืนฟังก์ชันถอดตัวดักฟัง — ต้องเรียกตอน unmount ไม่งั้นตัวดักฟังทับกันไปเรื่อย */
        onMaximizeChange?: (callback: (isMaximized: boolean) => void) => () => void
      }
    }
  }
}

export {}
