import Konva from 'konva'
import type { AnimSettings } from '../types'
import { applyAnim, resetAnim } from '../utils/anim'
import { getTintScale, setTintScale } from '../utils/tintEngine'

/**
 * รอฟอนต์โหลดครบก่อน capture ทุกครั้ง (กันฟอนต์ไทย/ตกแต่งไม่ทันโหลด)
 */
export async function ensureFontsReady() {
  await document.fonts.ready
}

export const nextPaint = () =>
  new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())))

/**
 * คืน path เต็มของไฟล์ที่เซฟสำเร็จ — `undefined` เมื่อผู้ใช้ยกเลิก หรือเมื่ออยู่ใน
 * เบราว์เซอร์ซึ่งไม่มีทางรู้ว่าไฟล์ไปลงที่ไหน ตัวเรียกใช้ค่านี้เพื่อโชว์ปุ่ม
 * "เปิดโฟลเดอร์" (แผนข้อ 8.5.4) จึงต้องเผื่อกรณีไม่มี path ไว้เสมอ
 */
export async function downloadURL(url: string, filename: string): Promise<string | undefined> {
  if (window.api?.export?.saveImage && url.startsWith('data:image')) {
    const res = await window.api.export.saveImage(url, filename)
    return res.success ? res.filePath : undefined
  }
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  return undefined
}

export async function downloadBlob(blob: Blob, filename: string): Promise<string | undefined> {
  if (window.api?.export?.saveImage) {
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
    const res = await window.api.export.saveImage(base64, filename)
    return res.success ? res.filePath : undefined
  }
  const url = URL.createObjectURL(blob)
  downloadURL(url, filename)
  setTimeout(() => URL.revokeObjectURL(url), 4000)
  return undefined
}

export interface CapturedImage {
  url: string
  filename: string
}

/**
 * บันทึกหลายไฟล์ในคลิกเดียว — ใน Electron จะเลือกโฟลเดอร์ปลายทางครั้งเดียว
 * (ไม่เด้ง Save As dialog ทีละไฟล์) ส่วนใน browser จะดาวน์โหลดทีละไฟล์
 */
export async function saveImagesBatch(files: CapturedImage[]): Promise<string | undefined> {
  if (files.length === 0) return undefined
  if (window.api?.export?.saveImagesBatch && files.every((f) => f.url.startsWith('data:image'))) {
    const res = await window.api.export.saveImagesBatch(
      files.map((f) => ({ base64: f.url, filename: f.filename })),
    )
    if (!res.success && !res.canceled) throw new Error(res.error || 'Batch save failed')
    // ชี้ไปที่ไฟล์ใบแรก ไม่ใช่ตัวโฟลเดอร์ — File Explorer จะได้เลือกไฟล์ให้เห็นเลย
    return res.written?.[0]
  }
  let first: string | undefined
  for (const f of files) {
    const p = await downloadURL(f.url, f.filename)
    first ??= p
  }
  return first
}

export function safeName(s: string): string {
  return (s || 'schedule').replace(/[^\wก-๙ぁ-んァ-ヶ一-龯+-]+/g, '-').replace(/^-+|-+$/g, '') || 'schedule'
}

/**
 * ชื่อ Konva ของ node ที่ cache ไว้ "เท่าขนาดที่เห็นบนจอ" เพื่อความลื่นของ preview
 * ต้องล้าง cache พวกนี้ก่อน capture ทุกครั้ง ไม่งั้นไฟล์ที่ได้จะเป็นภาพขยายจาก
 * bitmap ความละเอียดต่ำ
 *
 * เหลือแค่กลุ่มภาพตัวละครที่ต้องใช้ cache จริง ๆ (source-atop ตัดขอบได้เฉพาะใน cache)
 * ส่วนงานย้อมสีทั้งหมดย้ายไปที่ utils/tintEngine.ts ซึ่งคุมความละเอียดด้วย tint scale
 */
export const PREVIEW_CACHE_NAME = 'preview-cache'

/**
 * รัน fn โดยตั้ง stage กลับเป็นความละเอียด export เต็มชั่วคราว แล้วคืนค่าเดิม
 *
 * preview วาดที่ scale ย่อเพื่อความลื่น (ดู StageScaler ใน App.tsx) ถ้า capture
 * ตอนนั้นตรง ๆ จะได้ไฟล์เล็กตาม preview — ที่นี่จึงขยายกลับก่อนจับภาพ
 * และต้องล้าง cache ของ Layer ด้วย ไม่งั้น bitmap ที่ cache ไว้ตอน preview
 * จะถูกขยายขึ้นมาเบลอ
 */
export async function withFullResolution<T>(
  stage: Konva.Stage | null,
  W: number,
  H: number,
  fn: () => Promise<T>,
): Promise<T> {
  if (!stage) throw new Error('stage not ready')
  const prev = { w: stage.width(), h: stage.height(), sx: stage.scaleX(), sy: stage.scaleY() }
  const cachedLayers = stage.getLayers().filter((l) => l.isCached())
  const layerPixelRatios = stage.getLayers().map((l) => l.getCanvas().getPixelRatio())
  const prevTintScale = getTintScale()

  // the scene is laid out in the template's own coordinate space — scale that space
  // up to the requested output size rather than cropping it
  const contentW = prev.sx ? prev.w / prev.sx : W
  const scale = contentW ? W / contentW : 1

  stage.size({ width: W, height: H })
  stage.scale({ x: scale, y: scale })
  // the preview may have dropped canvas resolution to stay within its pixel budget
  for (const l of stage.getLayers()) l.getCanvas().setPixelRatio(1)
  for (const l of cachedLayers) l.clearCache()

  /**
   * The preview tints the artwork at the handful of pixels it shows. Capturing now
   * would upscale that, so the engine is put on output scale and React is given a
   * paint to swap in the bigger bitmaps — only then is anything cached on top of
   * them, or the masked art group would be composited from the preview-sized art.
   */
  setTintScale(scale)
  await nextPaint()
  for (const n of stage.find(`.${PREVIEW_CACHE_NAME}`)) {
    n.clearCache()
    n.cache({ pixelRatio: scale })
  }
  stage.batchDraw()
  await nextPaint()
  try {
    return await fn()
  } finally {
    stage.size({ width: prev.w, height: prev.h })
    stage.scale({ x: prev.sx, y: prev.sy })
    stage.getLayers().forEach((l, i) => l.getCanvas().setPixelRatio(layerPixelRatios[i] ?? 1))
    for (const l of cachedLayers) l.cache({ pixelRatio: 1 })
    setTintScale(prevTintScale)
    for (const n of stage.find(`.${PREVIEW_CACHE_NAME}`)) {
      n.clearCache()
      n.cache({ pixelRatio: prev.sx || 1 })
    }
    stage.batchDraw()
  }
}

/** จับภาพ stage เป็น dataURL — แยกจากการเซฟ เพื่อรวมหลายภาพเป็น batch ได้ */
export async function capturePNG(
  stage: Konva.Stage | null,
  opts: { pixelRatio: number },
): Promise<string> {
  if (!stage) throw new Error('stage not ready')
  await ensureFontsReady()
  return stage.toDataURL({ pixelRatio: opts.pixelRatio })
}

export async function exportPNG(
  stage: Konva.Stage | null,
  opts: { pixelRatio: number; filename: string },
) {
  if (!stage) return
  const url = await capturePNG(stage, opts)
  await downloadURL(url, opts.filename)
}

export interface GifProgress {
  (pct: number, phase: 'capture' | 'encode'): void
}

/**
 * GIF export — จับ frame จาก stage แบบ deterministic:
 * หลักการคือ advance animation clock ทีละ frame (12 fps พอสำหรับไฟล์ไม่ใหญ่เกิน)
 * แล้วเขียนลง gif.js worker
 */
export async function exportGIF(
  stage: Konva.Stage | null,
  opts: {
    anim: AnimSettings
    onProgress?: GifProgress
    width: number
    height: number
  },
): Promise<Blob> {
  if (!stage) throw new Error('stage not ready')
  await ensureFontsReady()

  // gif.js + worker เป็นโค้ดที่ใช้เฉพาะตอน export GIF — โหลดตอนกดจริงเท่านั้น
  // ไม่ต้องติดมากับ chunk หลักที่ต้องดาวน์โหลด/แตกไฟล์ทุกครั้งที่เปิดแอป
  const { default: GIF } = await import('gif.js')
  const { default: gifWorkerUrl } = await import('gif.js/dist/gif.worker.js?url')

  const fps = 12
  const dur = Math.max(1000, Math.min(opts.anim.durationMs, 6000))
  const frames = Math.round((dur / 1000) * fps)
  const gif = new GIF({
    workers: 2,
    quality: 10,
    workerScript: gifWorkerUrl,
    width: opts.width,
    height: opts.height,
  })

  for (let i = 0; i < frames; i++) {
    const t = (i * 1000) / fps
    applyAnim(stage, t, opts.anim)
    stage.batchDraw()
    // pixelRatio ต้องระบุเสมอ — ค่า global ของ Konva ตั้งตาม devicePixelRatio ไว้ให้ preview คม
    // ถ้าไม่ระบุ เฟรมจะใหญ่กว่าที่ประกาศไว้ตอนสร้าง GIF แล้วภาพเพี้ยน
    const canvas = stage.toCanvas({ pixelRatio: 1 })
    gif.addFrame(canvas, { copy: true, delay: 1000 / fps })
    opts.onProgress?.(((i + 1) / frames) * 0.5, 'capture')
    // yield ให้ UI อัปเดต progress
    await new Promise((r) => setTimeout(r, 0))
  }

  resetAnim(stage)
  stage.batchDraw()

  return new Promise<Blob>((resolve, reject) => {
    gif.on('progress', (p: number) => opts.onProgress?.(0.5 + p * 0.5, 'encode'))
    gif.on('finished', (blob: Blob) => resolve(blob))
    gif.on('abort', () => reject(new Error('gif aborted')))
    gif.render()
  })
}
