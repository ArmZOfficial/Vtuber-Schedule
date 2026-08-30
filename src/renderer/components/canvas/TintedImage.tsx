/**
 * A template PNG with the theme's hue rotation applied.
 *
 * The rotation is not a Konva filter any more. Konva only filters a cached node, so
 * every tinted node used to build, read back and rewrite its own bitmap in
 * JavaScript on every hue change — thirty of those per step, several of them the
 * same picture at the same size. `tintedBitmap` does the rotation once on the GPU
 * and hands the same bitmap to everything that asked for it, so what is left here is
 * a plain image draw: no cache, no filter, no per-node pixel work.
 *
 * See utils/tintEngine.ts for the engine and its CPU fallback.
 */
import { memo, useMemo, useSyncExternalStore } from 'react'
import { Image as KImage, Rect } from 'react-konva'
import { hexToHsl } from '../../utils/hue'
import {
  getTintScale,
  subscribeTintScale,
  tintedBitmap,
  type Tint,
  type TintSource,
  type TintedSource,
} from '../../utils/tintEngine'

export type { Tint, TintSource, TintedSource } from '../../utils/tintEngine'
export { NO_TINT } from '../../utils/tintEngine'

/** every raster part of the template a colour pin can target independently */
export interface ArtTints {
  background: Tint
  frame: Tint
  panel: Tint
  titleFlowers: Tint
  weekRibbon: Tint
  rowAccent: Tint
  offlineRibbon: Tint
}

/** attach a pinned colour to a base rotation — undefined hex leaves the rotation alone */
export function withPin(base: Tint, hex: string | undefined): Tint {
  if (!hex) return base
  const { h, s } = hexToHsl(hex)
  return { ...base, pin: { hue: h, sat: s } }
}

/** re-render when the exporter (or a window resize) changes the drawing resolution */
function useTintScale(): number {
  return useSyncExternalStore(subscribeTintScale, getTintScale, getTintScale)
}

const naturalSize = (src: TintSource) =>
  'naturalWidth' in src
    ? { w: src.naturalWidth || src.width, h: src.naturalHeight || src.height }
    : { w: src.width, h: src.height }

/**
 * The tinted copy of `image` at the size it is about to be drawn at.
 *
 * Asking for more pixels than the source has would only blur it, and asking for more
 * than the screen shows would be work nobody sees — so the size is the drawn box
 * scaled by the current preview scale, capped at the artwork's own resolution.
 */
function useTinted(
  image: TintSource | undefined,
  tint: Tint,
  width: number,
  height: number,
): TintedSource | undefined {
  const scale = useTintScale()
  return useMemo(() => {
    if (!image) return undefined
    const nat = naturalSize(image)
    const w = Math.min(Math.max(1, Math.round(width * scale)), Math.max(1, nat.w))
    const h = Math.min(Math.max(1, Math.round(height * scale)), Math.max(1, nat.h))
    return tintedBitmap(image, tint, w, h)
    // the tint object is rebuilt on every theme change, so its fields are the deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image, width, height, scale, tint.hue, tint.saturation, tint.lightness, tint.pin?.hue, tint.pin?.sat])
}

export const TintedImage = memo(function TintedImage({
  image,
  x,
  y,
  width,
  height,
  tint,
  opacity,
  rotation,
  listening = false,
}: {
  image?: TintSource
  x: number
  y: number
  width: number
  height: number
  tint: Tint
  opacity?: number
  rotation?: number
  listening?: boolean
}) {
  const painted = useTinted(image, tint, width, height)
  if (!painted) return null

  return (
    <KImage
      image={painted as unknown as HTMLImageElement}
      x={x}
      y={y}
      width={width}
      height={height}
      rotation={rotation}
      opacity={opacity}
      listening={listening}
      perfectDrawEnabled={false}
      /* an unrotated node needs only a translate, so Konva can skip building and
         multiplying a full transform matrix for it on every draw */
      transformsEnabled={rotation ? 'all' : 'position'}
    />
  )
})

/**
 * The dashed rule, drawn as a repeating pattern of one real dash period so the
 * dash size never stretches with the row width.
 *
 * Only the 32px tile is tinted, at its own resolution — the seven rows share that
 * one bitmap however wide each of their rules happens to be, where the old code
 * cached and filtered every rule separately at full row width.
 */
export const TintedDash = memo(function TintedDash({
  tile,
  x,
  y,
  width,
  height,
  tint,
}: {
  tile?: HTMLCanvasElement
  x: number
  y: number
  width: number
  height: number
  tint: Tint
}) {
  const painted = useMemo(
    () => (tile ? tintedBitmap(tile, tint, tile.width, tile.height) : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tile, tint.hue, tint.saturation, tint.lightness, tint.pin?.hue, tint.pin?.sat],
  )

  if (!painted || !tile || width <= 0) return null

  return (
    <Rect
      x={x}
      y={y}
      width={width}
      height={height}
      listening={false}
      perfectDrawEnabled={false}
      shadowForStrokeEnabled={false}
      fillPatternImage={painted as unknown as HTMLImageElement}
      fillPatternRepeat="repeat-x"
      fillPatternScaleY={height / tile.height}
    />
  )
})
