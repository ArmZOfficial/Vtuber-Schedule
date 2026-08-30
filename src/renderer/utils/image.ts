import { useEffect, useState } from 'react'

const imageCache = new Map<string, HTMLImageElement>()

export function useImage(url?: string): HTMLImageElement | undefined {
  const cached = url ? imageCache.get(url) : undefined
  const [img, setImg] = useState<HTMLImageElement | undefined>(cached)

  useEffect(() => {
    if (!url || imageCache.has(url)) return
    let active = true
    const i = new Image()
    i.onload = () => {
      imageCache.set(url, i)
      if (active) setImg(i)
    }
    i.onerror = () => {
      if (active) setImg(undefined)
    }
    i.src = url
    return () => {
      active = false
    }
  }, [url])

  return url ? (imageCache.get(url) ?? img) : undefined
}

export function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = reject
    r.readAsDataURL(file)
  })
}

/** fit แบบ cover: คืน rect ของรูปที่วางในกล่อง (x,y อาจติดลบ = crop) */
export function coverRect(boxW: number, boxH: number, imgW: number, imgH: number) {
  const s = Math.max(boxW / imgW, boxH / imgH)
  const w = imgW * s
  const h = imgH * s
  return { x: (boxW - w) / 2, y: (boxH - h) / 2, w, h }
}

/** fit แบบ contain: คืน rect ของรูปที่วางในกล่อง (เห็นครบทั้งรูป ไม่ถูกครอป) */
export function containRect(boxW: number, boxH: number, imgW: number, imgH: number) {
  const s = Math.min(boxW / imgW, boxH / imgH)
  const w = imgW * s
  const h = imgH * s
  return { x: (boxW - w) / 2, y: (boxH - h) / 2, w, h }
}

/**
 * คูณ cover-rect ด้วย transform ของผู้ใช้ (ซูม + เลื่อนตำแหน่ง)
 * offset เป็นเศษส่วนของขนาดกล่อง เพื่อให้ทรงพลังเท่ากันทุกขนาดเฟรม
 */
export function applyArtTransform(
  r: { x: number; y: number; w: number; h: number },
  boxW: number,
  boxH: number,
  t?: { scale: number; offsetX: number; offsetY: number },
) {
  if (!t || (t.scale === 1 && t.offsetX === 0 && t.offsetY === 0)) return r
  const cx = r.x + r.w / 2 + t.offsetX * boxW
  const cy = r.y + r.h / 2 + t.offsetY * boxH
  const w = r.w * t.scale
  const h = r.h * t.scale
  return { x: cx - w / 2, y: cy - h / 2, w, h }
}
