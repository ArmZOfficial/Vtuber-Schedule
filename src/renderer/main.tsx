import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Konva from 'konva'
import './index.css'
import App from './App.tsx'
import { loadTemplateFonts } from './utils/fonts'
import { restoreCustomFonts } from './utils/customFonts'
import { useFontsReady } from './store/fontsReady'
import { useTextStyleStore } from './store/textStyleStore'
import { clearInkCache } from './components/canvas/InkText'
import { loadedTemplateImages, preloadTemplate, TEMPLATES } from './template/preload'
import { warmTintEngine } from './utils/tintEngine'

/**
 * ล็อกไว้ที่ 1 — พื้นที่วาดโตเป็น "กำลังสอง" ของ devicePixelRatio
 * จอ Windows ที่ตั้ง scaling 150% (dpr 1.5) = งานวาดมากกว่าเดิม 2.25 เท่า
 * จอ 4K ที่ 200% = 4 เท่า ซึ่งกินกว่าตอนยังไม่ทำ preview scaling เสียอีก
 *
 * ความคมของ preview คุมด้วยงบพิกเซลใน ScheduleStage แทน (ดู PREVIEW_PIXEL_BUDGET)
 * ไม่กระทบไฟล์ที่ export เพราะทุกจุดที่ capture ส่ง pixelRatio เข้าไปเองเสมอ
 */
Konva.pixelRatio = 1

/**
 * ปิดคำเตือนของ Konva ในโหมด production — ทุกคำเตือนคือการต่อสตริงและเรียก
 * console ซึ่งใน Electron ที่ไม่ได้เปิด devtools ก็ยังเสียเวลาอยู่ดี
 */
Konva.showWarnings = import.meta.env.DEV

/**
 * ระยะที่ต้องลากก่อนจะนับเป็นการลาก — ค่าเริ่มต้น 3px ทำให้การคลิกแถวบนการ์ด
 * ระหว่างที่มือสั่นเล็กน้อยกลายเป็น drag แล้วคลิกหาย
 */
Konva.dragDistance = 5

/**
 * Fonts and template art are fetched in the background so the window paints right
 * away. Konva measures text with whatever face is loaded at that moment, so the ink
 * measurements are dropped and the canvas redrawn once the real faces arrive.
 */
async function warmUp() {
  try {
    await Promise.all([loadTemplateFonts(), ...TEMPLATES.map(preloadTemplate)])
  } catch {
    // a missing asset must not block the app from starting
  }
  // shader and textures ready before the user reaches for the hue slider
  warmTintEngine(loadedTemplateImages())
  // user-uploaded faces come back from IndexedDB — before markReady so the first
  // real frame already measures with them
  try {
    for (const name of await restoreCustomFonts()) useTextStyleStore.getState().addCustomFont(name)
  } catch {
    // a broken IDB record must not block the app either
  } finally {
    clearInkCache()
    useFontsReady.getState().markReady()
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

warmUp()
