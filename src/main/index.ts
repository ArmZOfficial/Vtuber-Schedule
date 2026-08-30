import { app, BrowserWindow, ipcMain, dialog, nativeTheme, shell } from 'electron'
import { join, dirname, resolve, basename, extname } from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs/promises'
import { initStoreHandlers } from './storage/store'
import { initScheduler } from './autopost/scheduler'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// For ES modules __dirname is not available by default, 
// but vite-plugin-electron handles it for us in the bundled output.
// Or we can use import.meta.url

let mainWindow: BrowserWindow | null = null

/**
 * GPU switches.
 *
 * The canvas is one large composited bitmap per frame. By default Chromium plays
 * safe on Windows — several GPU paths are off unless the driver is on its allow
 * list, so the compositing and the canvas uploads fall back to the CPU and the
 * preview stutters on exactly the machines that have a perfectly usable GPU.
 *
 * These switches move that work onto the GPU where one exists. None of them force
 * a path that a machine cannot take: Chromium still falls back to software
 * rendering on its own when the driver refuses, so an integrated-graphics laptop
 * behaves as it did before rather than failing to start.
 *
 * Must be set before app.whenReady() — the GPU process reads them at launch.
 */
function tuneGpu() {
  // draw the page with the GPU instead of the CPU raster threads
  app.commandLine.appendSwitch('enable-gpu-rasterization')
  // upload textures without an extra CPU-side copy
  app.commandLine.appendSwitch('enable-zero-copy')
  // let a driver that is merely unlisted still be used (it is still probed first)
  app.commandLine.appendSwitch('ignore-gpu-blocklist')
  /**
   * On a laptop with both an integrated and a discrete GPU, Chromium picks the
   * integrated one to save power. The card is composited every frame and the theme
   * rotation now runs as a shader on it (renderer utils/tintEngine.ts), so the
   * faster of the two is the one worth using. A machine with only one GPU ignores
   * this switch entirely.
   */
  app.commandLine.appendSwitch('force_high_performance_gpu')
  // 2D canvas raster off the renderer's main thread — this is the stage itself
  app.commandLine.appendSwitch('enable-features', 'CanvasOopRasterization')
  // Windows reports a covered window as occluded and stops painting it; coming back
  // to the app then shows a stale frame for a beat
  app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion')
  // a background window keeps its timers and rAF at full rate, so switching back is
  // instant instead of catching up on a queue of skipped frames
  app.commandLine.appendSwitch('disable-renderer-backgrounding')
  app.commandLine.appendSwitch('disable-background-timer-throttling')
  app.commandLine.appendSwitch('disable-backgrounding-occluded-windows')
}

tuneGpu()

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    frame: false,
    // อย่าเพิ่งโชว์จนกว่าจะวาดเสร็จ — กันจอขาววาบตอนเปิดแอป
    show: false,
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      // ปล่อยให้ animation loop เดินต่อเมื่อหน้าต่างไม่ได้อยู่หน้าสุด
      // ไม่งั้น rAF ถูกหรี่เหลือ ~1fps แล้วภาพกระตุกตอนสลับกลับมา
      backgroundThrottling: false,
    },
  })

  // vite-plugin-electron provides process.env.VITE_DEV_SERVER_URL in dev mode
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    // __dirname in compiled output is dist-electron/main
    mainWindow.loadFile(join(__dirname, '../../dist/index.html'))
  }
  
  mainWindow.once('ready-to-show', () => mainWindow?.show())

  mainWindow.setMenu(null)

  mainWindow.on('maximize', () => {
    mainWindow?.webContents.send('window:maximize-change', true)
  })
  mainWindow.on('unmaximize', () => {
    mainWindow?.webContents.send('window:maximize-change', false)
  })
}

app.whenReady().then(() => {
  initStoreHandlers()
  initScheduler()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// IPC Handlers
function imageFilter(filename?: string) {
  const ext = (filename || '').split('.').pop()?.toLowerCase()
  if (ext === 'gif') return { name: 'Images', extensions: ['gif'] }
  return { name: 'Images', extensions: ['png'] }
}

/** ตัดอักขระที่เป็น path separator / ผิดกฎชื่อไฟล์ Windows ออกจากชื่อไฟล์ */
function safeFileName(name: string): string {
  return (name || 'image.png').replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, ' ').trim() || 'image.png'
}

ipcMain.handle('dialog:save-image', async (_event, { base64, defaultName }) => {
  if (!mainWindow) return { success: false, error: 'No main window' }

  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'Save Image',
    defaultPath: defaultName || 'vtuber-schedule.png',
    filters: [imageFilter(defaultName)],
  })

  if (canceled || !filePath) {
    return { success: false, canceled: true }
  }

  try {
    // base64 contains "data:image/png;base64,..."
    const base64Data = base64.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')
    await fs.writeFile(filePath, buffer)
    return { success: true, filePath }
  } catch (error: any) {
    console.error('Error saving file:', error)
    return { success: false, error: error.message }
  }
})

/**
 * บันทึกหลายไฟล์ในคลิกเดียว — เลือกโฟลเดอร์ปลายทางครั้งเดียว
 * แทนการเด้ง Save As dialog ทีละไฟล์ (ใช้กับ batch 3 ภาษา / export ทุกสัดส่วน)
 */
ipcMain.handle(
  'dialog:save-images-batch',
  async (_event, { files }: { files: { base64: string; filename: string }[] }) => {
    if (!mainWindow) return { success: false, error: 'No main window' }
    if (!Array.isArray(files) || files.length === 0) {
      return { success: false, error: 'No files to save' }
    }

    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: 'Choose a folder to save the exported images',
      properties: ['openDirectory', 'createDirectory'],
    })

    if (canceled || !filePaths?.[0]) {
      return { success: false, canceled: true }
    }

    const dir = filePaths[0]
    const written: string[] = []
    try {
      for (const f of files) {
        const target = join(dir, safeFileName(f.filename))
        const base64Data = f.base64.replace(/^data:image\/\w+;base64,/, '')
        const buffer = Buffer.from(base64Data, 'base64')
        await fs.writeFile(target, buffer)
        written.push(target)
      }
      return { success: true, dir, written }
    } catch (error: any) {
      console.error('Error batch saving files:', error)
      return { success: false, error: error.message, written }
    }
  },
)

ipcMain.handle('theme:set-source', (_event, theme: 'light' | 'dark' | 'system') => {
  nativeTheme.themeSource = theme
})

/**
 * เปิด File Explorer ค้างไว้ที่ไฟล์ที่เพิ่ง export (แผนข้อ 8.5.4)
 *
 * `showItemInFolder` เปิดโฟลเดอร์แล้วเลือกไฟล์นั้นให้เลย ต่างจาก `openPath` ที่เปิด
 * ตัวไฟล์ด้วยโปรแกรมเริ่มต้น — ผู้ใช้ที่เพิ่ง export ต้องการหาไฟล์ ไม่ใช่เปิดดูรูป
 *
 * รับเฉพาะ path ที่ตัวแอปเป็นคนคืนให้ renderer ตอนเซฟสำเร็จเท่านั้น
 */
ipcMain.handle('shell:show-item', (_event, fullPath: string) => {
  if (typeof fullPath !== 'string' || !fullPath) return false
  shell.showItemInFolder(fullPath)
  return true
})

/* ────────────────────────── ฟอนต์ที่ติดตั้งในเครื่อง ────────────────────────── */

/**
 * Fonts installed on this machine.
 *
 * Chrome cannot open a font by name, so the renderer asks for a list and then for
 * the bytes of the one the user picked. Reads are confined to the font folders
 * below and to formats FontFace can parse — .ttc collections (most CJK faces on
 * Windows) are left out because Chrome cannot load them.
 */
const FONT_EXTS = new Set(['.ttf', '.otf', '.woff', '.woff2'])

function fontDirs(): string[] {
  const home = app.getPath('home')
  if (process.platform === 'win32') {
    return [
      join(process.env.WINDIR || 'C:\\Windows', 'Fonts'),
      join(process.env.LOCALAPPDATA || join(home, 'AppData', 'Local'), 'Microsoft', 'Windows', 'Fonts'),
    ]
  }
  if (process.platform === 'darwin') {
    return ['/System/Library/Fonts', '/Library/Fonts', join(home, 'Library', 'Fonts')]
  }
  return ['/usr/share/fonts', '/usr/local/share/fonts', join(home, '.local', 'share', 'fonts')]
}

/** "Kanit-SemiBoldItalic.ttf" reads as "Kanit SemiBold Italic" in the picker */
function prettyFamily(file: string): string {
  return basename(file, extname(file))
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
}

async function walkFonts(dir: string, depth = 0): Promise<string[]> {
  if (depth > 2) return []
  let entries
  try {
    entries = await fs.readdir(dir, { withFileTypes: true })
  } catch {
    return []
  }
  const out: string[] = []
  for (const e of entries) {
    const full = join(dir, e.name)
    if (e.isDirectory()) out.push(...(await walkFonts(full, depth + 1)))
    else if (FONT_EXTS.has(extname(e.name).toLowerCase())) out.push(full)
  }
  return out
}

ipcMain.handle('fonts:list', async () => {
  const seen = new Map<string, string>()
  for (const dir of fontDirs()) {
    for (const file of await walkFonts(dir)) {
      const family = prettyFamily(file)
      if (!seen.has(family)) seen.set(family, file)
    }
  }
  return [...seen.entries()]
    .map(([family, file]) => ({ family, file }))
    .sort((a, b) => a.family.localeCompare(b.family))
})

ipcMain.handle('fonts:read', async (_event, file: string) => {
  if (typeof file !== 'string') return null
  const target = resolve(file)
  const allowed = fontDirs().some((dir) => {
    const root = resolve(dir)
    return target === root || target.startsWith(root + (process.platform === 'win32' ? '\\' : '/'))
  })
  if (!allowed || !FONT_EXTS.has(extname(target).toLowerCase())) return null
  try {
    return (await fs.readFile(target)).toString('base64')
  } catch {
    return null
  }
})

ipcMain.on('window:minimize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender) || mainWindow
  win?.minimize()
})
ipcMain.on('window:maximize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender) || mainWindow
  if (win?.isMaximized()) {
    win?.unmaximize()
  } else {
    win?.maximize()
  }
})
ipcMain.on('window:close', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender) || mainWindow
  win?.close()
})
