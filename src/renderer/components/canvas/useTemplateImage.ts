/**
 * Loads template PNGs once and hands the same HTMLImageElement to every node.
 *
 * Paths are relative to BASE_URL so the same code works from the Vite dev server
 * and from file:// inside the packaged Electron app.
 */
import { useEffect, useMemo, useState } from 'react'
import { templateImageSources, type TemplateLayout } from '../../template/layout.schema'

const cache = new Map<string, HTMLImageElement>()
const pending = new Map<string, Promise<HTMLImageElement>>()

export const assetUrl = (src: string) => `${import.meta.env.BASE_URL}${src}`

export function loadTemplateImage(src: string): Promise<HTMLImageElement> {
  const hit = cache.get(src)
  if (hit) return Promise.resolve(hit)
  const inFlight = pending.get(src)
  if (inFlight) return inFlight

  const p = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      cache.set(src, img)
      pending.delete(src)
      resolve(img)
    }
    img.onerror = () => {
      pending.delete(src)
      reject(new Error(`failed to load ${src}`))
    }
    img.src = assetUrl(src)
  })
  pending.set(src, p)
  return p
}

export function useTemplateImage(src: string | undefined): HTMLImageElement | undefined {
  const [img, setImg] = useState<HTMLImageElement | undefined>(() => (src ? cache.get(src) : undefined))

  useEffect(() => {
    if (!src) {
      setImg(undefined)
      return
    }
    const hit = cache.get(src)
    if (hit) {
      setImg(hit)
      return
    }
    let alive = true
    loadTemplateImage(src)
      .then((i) => alive && setImg(i))
      .catch(() => alive && setImg(undefined))
    return () => {
      alive = false
    }
  }, [src])

  return img
}

/** an image the user uploaded (data URL), loaded the same way but never cached */
export function useDataUrlImage(url: string | undefined): HTMLImageElement | undefined {
  const [img, setImg] = useState<HTMLImageElement>()
  useEffect(() => {
    if (!url) {
      setImg(undefined)
      return
    }
    let alive = true
    const i = new Image()
    i.onload = () => alive && setImg(i)
    i.onerror = () => alive && setImg(undefined)
    i.src = url
    return () => {
      alive = false
    }
  }, [url])
  return img
}

/**
 * The dashed rule ships as one long strip. Repeating the whole strip would put a
 * broken dash at every seam, so a single 32px period is cut out of the real pixels
 * and used as the tile — no dash is drawn by hand.
 *
 * The tile is cut once for the whole app rather than once per row. Seven rows each
 * holding their own copy meant seven identical canvases, and — because the tint
 * cache is keyed on the source object — seven identical tinted bitmaps built on
 * every theme change instead of the one they all end up drawing.
 */
const dashTiles = new Map<string, HTMLCanvasElement>()

export function useDashTile(src: string | undefined, periodPx = 32): HTMLCanvasElement | undefined {
  const img = useTemplateImage(src)
  return useMemo(() => {
    if (!img || !src) return undefined
    const key = `${src}|${periodPx}`
    const hit = dashTiles.get(key)
    if (hit) return hit
    const c = document.createElement('canvas')
    c.width = periodPx
    c.height = img.naturalHeight
    c.getContext('2d')?.drawImage(img, 0, 0, periodPx, img.naturalHeight, 0, 0, periodPx, img.naturalHeight)
    dashTiles.set(key, c)
    return c
  }, [img, src, periodPx])
}

/** resolve every image a template needs — call before the first draw */
export function preloadTemplate(t: TemplateLayout): Promise<unknown> {
  return Promise.all(templateImageSources(t).map((s) => loadTemplateImage(s).catch(() => undefined)))
}

/** every template PNG fetched so far — what the tint engine warms its textures from */
export function loadedTemplateImages(): HTMLImageElement[] {
  return [...cache.values()]
}
