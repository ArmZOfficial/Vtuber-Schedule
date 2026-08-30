/**
 * Hue rotation shared by the raster assets and the text on top of them.
 *
 * The artwork is rotated a pixel at a time by utils/tintEngine.ts. Text is not part
 * of those PNGs, so the same shift is applied here with plain maths — the two stay
 * in sync without a hand-written palette per theme, and the shader in the engine is
 * a line-for-line copy of the conversions below so they cannot drift.
 */

export interface Hsl {
  h: number
  s: number
  l: number
}

export function hexToHsl(hex: string): Hsl {
  const c = hex.replace('#', '')
  const r = parseInt(c.slice(0, 2), 16) / 255
  const g = parseInt(c.slice(2, 4), 16) / 255
  const b = parseInt(c.slice(4, 6), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  const d = max - min
  if (d === 0) return { h: 0, s: 0, l }
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h: number
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
  else if (max === g) h = ((b - r) / d + 2) / 6
  else h = ((r - g) / d + 4) / 6
  return { h: h * 360, s, l }
}

export function hslToHex({ h, s, l }: Hsl): string {
  const hh = ((h % 360) + 360) % 360 / 360
  const f = (p: number, q: number, t: number) => {
    let x = t
    if (x < 0) x += 1
    if (x > 1) x -= 1
    if (x < 1 / 6) return p + (q - p) * 6 * x
    if (x < 1 / 2) return q
    if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6
    return p
  }
  let r: number
  let g: number
  let b: number
  if (s === 0) {
    r = g = b = l
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = f(p, q, hh + 1 / 3)
    g = f(p, q, hh)
    b = f(p, q, hh - 1 / 3)
  }
  const hex = (v: number) =>
    Math.round(Math.min(1, Math.max(0, v)) * 255)
      .toString(16)
      .padStart(2, '0')
  return `#${hex(r)}${hex(g)}${hex(b)}`
}

/**
 * The rotation that lands `from` exactly on `to`.
 *
 * Picking a colour is the inverse of turning the hue slider: the template's own
 * reference colour is known, so the shift that maps it onto the picked one drives
 * both the artwork filter and the text palette. The art keeps every internal
 * relationship it was drawn with — the whole set moves together.
 */
export function hslDelta(from: string, to: string): { hue: number; saturation: number; lightness: number } {
  const a = hexToHsl(from)
  const b = hexToHsl(to)
  return {
    hue: (((b.h - a.h) % 360) + 360) % 360,
    saturation: b.s - a.s,
    lightness: b.l - a.l,
  }
}

/** shift a base colour the same way Konva's HSL filter shifts the artwork */
export function shiftColor(hex: string, hueShift: number, satShift = 0, lightShift = 0): string {
  const c = hexToHsl(hex)
  return hslToHex({
    h: c.h + hueShift,
    s: Math.min(1, Math.max(0, c.s + satShift)),
    l: Math.min(1, Math.max(0, c.l + lightShift)),
  })
}
