/**
 * Text positioned by its ink box, the way the PSD records it.
 *
 * layout.default.json stores where the *pixels* of a text layer start — the top of
 * the capitals, not the top of the line box Konva lays out. Rather than guess the
 * gap, this mirrors Konva's own placement maths (Text._sceneFunc) using the same
 * font metrics it measures, so the ink lands on the recorded coordinate exactly.
 */
import { memo, useMemo } from 'react'
import { Text } from 'react-konva'
import Konva from 'konva'
import { useFontsReady } from '../../store/fontsReady'
import { useTextStyleStore } from '../../store/textStyleStore'
import { resolveFamily, type FontScript } from '../../utils/fonts'

let ctx: CanvasRenderingContext2D | null = null
function measureCtx(): CanvasRenderingContext2D | null {
  if (ctx) return ctx
  if (typeof document === 'undefined') return null
  ctx = document.createElement('canvas').getContext('2d')
  return ctx
}

const inkCache = new Map<string, { ascent: number; left: number }>()
const shiftCache = new Map<string, number>()
const widthCache = new Map<string, number>()

/**
 * Ink box of the real string, relative to the alphabetic baseline and the pen.
 *
 * Measuring the actual text rather than a stand-in capital picks up side bearings
 * and the overshoot on round letters — the difference between a 2px drift and an
 * exact match.
 */
function inkBox(text: string, family: string, weight: string, size: number) {
  const key = `${family}|${weight}|${size}|${text}`
  const hit = inkCache.get(key)
  if (hit) return hit
  const c = measureCtx()
  if (!c) return { ascent: size * 0.705, left: 0 }
  c.font = `${weight} ${size}px "${family}"`
  c.textBaseline = 'alphabetic'
  const m = c.measureText(text.split(String.fromCharCode(10))[0])
  const v = { ascent: m.actualBoundingBoxAscent || size * 0.705, left: m.actualBoundingBoxLeft || 0 }
  inkCache.set(key, v)
  return v
}

/**
 * Where Konva puts the alphabetic baseline of the first line, measured down from the
 * node's y. Taken from Konva's own Text renderer so the two cannot drift apart.
 */
function baselineShift(family: string, weight: string, size: number, lineHeight: number): number {
  const key = `${family}|${weight}|${size}|${lineHeight}`
  const hit = shiftCache.get(key)
  if (hit !== undefined) return hit
  const half = (size * lineHeight) / 2
  const c = measureCtx()
  if (!c || Konva.legacyTextRendering) return half
  c.font = `${weight} ${size}px "${family}"`
  c.textBaseline = 'alphabetic'
  const m = c.measureText('M')
  const ascent = m.fontBoundingBoxAscent ?? m.actualBoundingBoxAscent
  const descent = m.fontBoundingBoxDescent ?? m.actualBoundingBoxDescent
  const v = (ascent - descent) / 2 + half
  shiftCache.set(key, v)
  return v
}

/** advance width of a run — used to place what follows the day name */
export function measureInkWidth(text: string, family: string, weight: string, size: number): number {
  const key = `${family}|${weight}|${size}|${text}`
  const hit = widthCache.get(key)
  if (hit !== undefined) return hit
  const c = measureCtx()
  if (!c) return text.length * size * 0.55
  c.font = `${weight} ${size}px "${family}"`
  const v = c.measureText(text).width
  widthCache.set(key, v)
  return v
}

/** metrics change once the real faces land — drop what was measured on a fallback */
export function clearInkCache() {
  inkCache.clear()
  shiftCache.clear()
  widthCache.clear()
}

export type InkWeight = '500' | '800' | '900'

export const InkText = memo(function InkText({
  text,
  x,
  capTop,
  baseline,
  size,
  weight,
  fill,
  align = 'left',
  width,
  lineHeight = 1,
  rotation,
  script,
  opacity,
}: {
  text: string
  /** left edge for align=left, right edge for align=right, box left for center */
  x: number
  /** y of the top of the capitals, as recorded in the PSD */
  capTop?: number
  /** alternative anchor: the alphabetic baseline, as PSD text transforms record it */
  baseline?: number
  size: number
  weight: InkWeight
  fill: string
  align?: 'left' | 'right' | 'center'
  /** required for center; for right the box is anchored so its right edge sits at x */
  width?: number
  lineHeight?: number
  rotation?: number
  script?: FontScript | 'auto'
  opacity?: number
}) {
  // resubscribe so the first real-font frame recomputes the offsets
  const fontsReady = useFontsReady((s) => s.rev)
  const fontOverrides = useTextStyleStore((s) => s.fonts)
  const family = resolveFamily(fontOverrides, text, script)

  const { y, boxX } = useMemo(() => {
    const ink = inkBox(text, family, weight, size)
    const shift = baselineShift(family, weight, size, lineHeight)
    const top = baseline !== undefined ? baseline - shift : (capTop ?? 0) + ink.ascent - shift
    // only left-aligned runs are anchored on their own ink; the others sit in a box
    // whose edge is already the anchor
    if (align === 'right') return { y: top, boxX: x - (width ?? 0) }
    if (align === 'center') return { y: top, boxX: x }
    return { y: top, boxX: x + ink.left }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, capTop, baseline, family, weight, size, lineHeight, align, width, x, fontsReady])

  const boxWidth = align === 'left' ? undefined : (width ?? 0)

  return (
    <Text
      text={text}
      x={boxX}
      y={y}
      width={boxWidth}
      align={align}
      fontFamily={family}
      fontStyle={weight}
      fontSize={size}
      lineHeight={lineHeight}
      fill={fill}
      opacity={opacity}
      rotation={rotation}
      listening={false}
      perfectDrawEnabled={false}
      wrap="none"
    />
  )
})
