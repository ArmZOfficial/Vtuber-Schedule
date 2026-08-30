import { defineConfig } from 'vite'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  // packaged app loads dist/index.html over file:// — asset URLs must stay relative
  base: './',
  build: {
    // แอปรันจาก file:// ใน Electron — ไม่ต้องมี sourcemap ใน .exe
    sourcemap: false,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        /**
         * แยก vendor ที่ไม่ค่อยเปลี่ยนออกจากโค้ดแอป — chunk ใหญ่ใบเดียวทำให้
         * เบราว์เซอร์/Electron ต้อง parse ทั้งก้อนก่อนวาดเฟรมแรก
         */
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return
          if (/node_modules[\\/](konva|react-konva)[\\/]/.test(id)) return 'konva'
          if (/node_modules[\\/]@radix-ui[\\/]/.test(id)) return 'radix'
          if (/node_modules[\\/](react|react-dom|scheduler|zustand)[\\/]/.test(id)) return 'vendor'
        },
      },
    },
  },
  plugins: [
    tailwindcss(),
    react(),
    electron([
      {
        entry: 'src/main/index.ts',
        onstart(options) {
          options.startup()
        },
        vite: {
          build: {
            outDir: 'dist-electron/main',
            rollupOptions: {
              external: ['electron', 'electron-store', 'electron-updater', 'node-cron'],
            },
          },
        },
      },
      {
        entry: 'src/preload/index.ts',
        onstart(options) {
          options.reload()
        },
        vite: {
          build: {
            outDir: 'dist-electron/preload',
            lib: {
              entry: 'src/preload/index.ts',
              formats: ['cjs'],
              fileName: () => 'index.js',
            },
          },
        },
      },
    ]),
    renderer(),
  ],
})
