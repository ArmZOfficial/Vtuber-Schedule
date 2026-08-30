/**
 * ขั้นการซูมของพื้นที่พรีวิว (แผน UX/UI ข้อ 7.5.3)
 *
 * ขั้นเป็นชุดตายตัวแทนการคูณต่อเนื่อง เพราะการกด `+` ซ้ำ ๆ ควรไปหยุดที่ 100% พอดี
 * ทุกครั้ง ไม่ใช่ 97% หรือ 104% แล้วแต่ว่าเริ่มจากตรงไหน
 */
export const ZOOM_STEPS = [0.1, 0.15, 0.25, 0.33, 0.5, 0.66, 0.75, 1, 1.25, 1.5, 2, 3, 4] as const

export const ZOOM_MIN = ZOOM_STEPS[0]
export const ZOOM_MAX = ZOOM_STEPS[ZOOM_STEPS.length - 1]

export function clampZoom(v: number): number {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, v))
}

/** ขั้นถัดไปในทิศที่กด — เลยขอบแล้วอยู่กับที่ */
export function stepZoom(current: number, dir: 1 | -1): number {
  if (dir > 0) return ZOOM_STEPS.find((s) => s > current + 1e-4) ?? ZOOM_MAX
  const below = ZOOM_STEPS.filter((s) => s < current - 1e-4)
  return below.length ? below[below.length - 1] : ZOOM_MIN
}

/**
 * ปัดเป็นขั้นละ 0.002 ก่อนส่งให้ Konva
 *
 * ของเดิมใน StageScaler ทำแบบนี้อยู่แล้วเพื่อไม่ให้การลากขอบหน้าต่างสั่ง re-cache
 * ทุกเศษทศนิยม — ย้ายมาไว้ที่เดียวเพื่อให้ทั้งโหมดพอดีจอและโหมดซูมมือใช้ค่าเดียวกัน
 */
export function quantizeScale(v: number): number {
  return Math.max(0.02, Math.round(v * 500) / 500)
}

/** สเกลที่ทำให้การ์ดพอดีกล่อง (ไม่ขยายเกินขนาดจริง) */
export function fitScale(boxW: number, boxH: number, stageW: number, stageH: number): number {
  if (!boxW || !boxH) return 0.5
  return Math.min(boxW / stageW, boxH / stageH, 1)
}
