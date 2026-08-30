import Konva from 'konva'
import type { AnimSettings } from '../types'

interface CachedAnimNodes {
  sparkles: Konva.Node[]
  moons: Konva.Node[]
  glows: Konva.Node[]
  lastCheck: number
}

const stageNodeCache = new WeakMap<Konva.Stage, CachedAnimNodes>()

export function invalidateAnimCache(stage?: Konva.Stage | null) {
  if (stage) stageNodeCache.delete(stage)
}

function getAnimNodes(stage: Konva.Stage): CachedAnimNodes {
  const now = performance.now()
  const cached = stageNodeCache.get(stage)
  if (cached && now - cached.lastCheck < 1000) {
    return cached
  }
  const fresh: CachedAnimNodes = {
    sparkles: stage.find('.anim-sparkle'),
    moons: stage.find('.anim-moon'),
    glows: stage.find('.anim-glow'),
    lastCheck: now,
  }
  stageNodeCache.set(stage, fresh)
  return fresh
}

/**
 * ระบบ animation แบบ pure-function-of-time:
 * - preview: rAF loop เรียกทุกเฟรมด้วย performance.now()
 * - GIF export: เรียกด้วย t ที่กำหนดเองทีละ frame แล้ว capture (deterministic)
 *
 * node ที่ขยับหาผ่าน name:
 * - 'anim-sparkle' (มี attr phase) = ดาวกระพริบ
 * - 'anim-moon' = ดวงจันทร์บนการ์ด Week แกว่ง/หมุน
 * - 'anim-glow' = เส้น glow รอบแถว highlight เต้นจังหวะ
 */
export function applyAnim(stage: Konva.Stage | null, t: number, cfg: AnimSettings) {
  if (!stage) return
  const { sparkles, moons, glows } = getAnimNodes(stage)
  if (sparkles.length === 0 && moons.length === 0 && glows.length === 0) return

  const dur = Math.max(500, cfg.durationMs)
  const k = (t % dur) / dur

  if (cfg.sparkle && sparkles.length > 0) {
    sparkles.forEach((n) => {
      const phase = (n.getAttr('phase') as number) || 0
      const s = 0.5 + 0.5 * Math.sin(k * Math.PI * 4 + phase)
      n.opacity(0.2 + 0.8 * s)
      const sc = 0.65 + 0.45 * s
      n.scaleX(sc)
      n.scaleY(sc)
    })
  }

  if (cfg.moon && moons.length > 0) {
    moons.forEach((n) => {
      n.rotation(-14 + 28 * Math.sin(k * Math.PI * 2))
    })
  }

  if (cfg.glow && glows.length > 0) {
    glows.forEach((n) => {
      const p = 0.5 + 0.5 * Math.sin(k * Math.PI * 4)
      n.opacity(0.25 + 0.65 * p)
    })
  }
}

/** คืนทุก node สู่สถานะพื้นฐาน (ใช้เมื่อปิด animation หรือหลัง export GIF) */
export function resetAnim(stage: Konva.Stage | null) {
  if (!stage) return
  const { sparkles, moons, glows } = getAnimNodes(stage)
  sparkles.forEach((n) => {
    n.opacity(0.75)
    n.scaleX(1)
    n.scaleY(1)
  })
  moons.forEach((n) => n.rotation(0))
  glows.forEach((n) => n.opacity(0.55))
}
