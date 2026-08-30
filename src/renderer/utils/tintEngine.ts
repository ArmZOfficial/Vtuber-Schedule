/**
 * Tinted copies of the template artwork.
 *
 * Every raster part of the card is the same PNG with the theme's hue rotation on
 * top of it. That rotation used to run as a Konva filter: Konva can only filter a
 * cached node, so each of the ~30 tinted nodes built its own bitmap, read it back
 * with getImageData, walked every pixel in JavaScript, and wrote it back — once per
 * node, every time the hue moved. Measured at ~21 ms a step on a fast desktop, which
 * is a dropped frame per step there and a visibly draggy slider on a laptop.
 *
 * Two things changed here.
 *
 * The pixel work moved to the GPU: one fragment shader doing exactly the maths
 * `shiftColor` does, so the artwork and the text palette still agree to the last
 * digit. A pass that cost milliseconds of main-thread time now costs microseconds of
 * it, and the main thread is left free for the slider, the text field and the window.
 *
 * The results are shared and kept. A tinted bitmap is a pure function of
 * (source, tint, size), so the seven day rows asking for the same flower bullet get
 * one bitmap between them instead of seven, and dragging the hue slider back over a
 * value it already passed costs a Map lookup. The cache is bounded by both count and
 * total pixels, so a long drag cannot grow it without limit.
 *
 * There is no GPU requirement: `tintWithCpu` is the same maths in JavaScript, and it
 * runs whenever WebGL2 is unavailable or the context is lost. Callers cannot tell
 * the difference apart from speed.
 */

export interface Tint {
  hue: number
  saturation: number
  lightness: number
  /**
   * Set when this one part was pinned to an exact colour (ThemeTab's per-part
   * swatches). A pin replaces the rotation above for this node only — every pixel is
   * forced onto `pin`'s hue and saturation while keeping its own lightness, so
   * shading and highlights survive exactly as drawn.
   */
  pin?: { hue: number; sat: number }
}

/** anything the engine can read pixels from */
export type TintSource = HTMLImageElement | HTMLCanvasElement

/** anything it can hand back for Konva to draw */
export type TintedSource = HTMLImageElement | HTMLCanvasElement | ImageBitmap

export const NO_TINT: Tint = { hue: 0, saturation: 0, lightness: 0 }

export const isNeutralTint = (t: Tint) =>
  !t.pin && t.hue === 0 && t.saturation === 0 && t.lightness === 0

/** identity of a tint as far as the pixels are concerned */
export function tintKey(t: Tint): string {
  return t.pin ? `p${t.pin.hue}:${t.pin.sat}` : `h${t.hue}:${t.saturation}:${t.lightness}`
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)

/* ────────────────────────────── the shader ────────────────────────────── */

const VERT = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  /* a WebGL canvas is presented bottom-up, so the quad reads the texture flipped
     and the blit into the 2D canvas lands the right way up */
  vUv = vec2(aPos.x * 0.5 + 0.5, 0.5 - aPos.y * 0.5);
  gl_Position = vec4(aPos, 0.0, 1.0);
}`

/**
 * Same conversion as `hexToHsl` / `hslToHex` in utils/hue.ts, line for line — the
 * text colours are computed there in JavaScript and have to land on the artwork's
 * colours exactly, so the two must not drift.
 *
 * uMode 0 rotates hue/saturation/lightness by uP; uMode 1 forces hue and saturation
 * to uP and keeps the pixel's own lightness (Photoshop's "Colorize").
 */
const FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uTex;
uniform float uMode;
uniform vec3 uP;

float chan(float p, float q, float t) {
  if (t < 0.0) t += 1.0;
  if (t > 1.0) t -= 1.0;
  if (t < 1.0 / 6.0) return p + (q - p) * 6.0 * t;
  if (t < 0.5) return q;
  if (t < 2.0 / 3.0) return p + (q - p) * (2.0 / 3.0 - t) * 6.0;
  return p;
}

void main() {
  vec4 src = texture(uTex, vUv);
  /* a fully transparent pixel has no colour to rotate */
  if (src.a <= 0.0) {
    fragColor = vec4(0.0);
    return;
  }
  /* the texture is premultiplied so its mipmaps do not bleed dark edges */
  vec3 c = clamp(src.rgb / src.a, 0.0, 1.0);

  float mx = max(c.r, max(c.g, c.b));
  float mn = min(c.r, min(c.g, c.b));
  float l = (mx + mn) * 0.5;
  float d = mx - mn;
  float h = 0.0;
  float s = 0.0;
  if (d > 0.0) {
    s = l > 0.5 ? d / (2.0 - mx - mn) : d / (mx + mn);
    if (mx == c.r) h = (c.g - c.b) / d + (c.g < c.b ? 6.0 : 0.0);
    else if (mx == c.g) h = (c.b - c.r) / d + 2.0;
    else h = (c.r - c.g) / d + 4.0;
    h /= 6.0;
  }

  if (uMode > 0.5) {
    h = uP.x;
    s = uP.y;
  } else {
    h = fract(h + uP.x);
    s = clamp(s + uP.y, 0.0, 1.0);
  }
  l = clamp(l + uP.z, 0.0, 1.0);

  vec3 o;
  if (s <= 0.0) {
    o = vec3(l);
  } else {
    float q = l < 0.5 ? l * (1.0 + s) : l + s - l * s;
    float p = 2.0 * l - q;
    o = vec3(chan(p, q, h + 1.0 / 3.0), chan(p, q, h), chan(p, q, h - 1.0 / 3.0));
  }
  fragColor = vec4(o * src.a, src.a);
}`

interface Engine {
  /**
   * An OffscreenCanvas when the browser has one, because `transferToImageBitmap`
   * hands the finished frame straight over as a GPU-side bitmap. Copying it into a
   * 2D canvas instead makes the main thread wait for the GPU to finish each part —
   * measured at 8.2 ms a step against 4.1 ms for the transfer.
   */
  canvas: OffscreenCanvas | HTMLCanvasElement
  offscreen: boolean
  gl: WebGL2RenderingContext
  prog: WebGLProgram
  uTex: WebGLUniformLocation
  uMode: WebGLUniformLocation
  uP: WebGLUniformLocation
}

/** undefined = not tried yet, null = no GPU path on this machine */
let engine: Engine | null | undefined
/** bumped when a context is lost — every texture minted before it is dead */
let texGeneration = 0
const textures = new WeakMap<TintSource, { tex: WebGLTexture; gen: number }>()

function compile(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader | null {
  const sh = gl.createShader(type)
  if (!sh) return null
  gl.shaderSource(sh, source)
  gl.compileShader(sh)
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.warn('[tint] shader failed to compile:', gl.getShaderInfoLog(sh))
    gl.deleteShader(sh)
    return null
  }
  return sh
}

function buildEngine(): Engine | null {
  if (typeof document === 'undefined') return null
  const offscreen = typeof OffscreenCanvas !== 'undefined'
  const canvas: OffscreenCanvas | HTMLCanvasElement = offscreen
    ? new OffscreenCanvas(1, 1)
    : document.createElement('canvas')
  if (!offscreen) {
    canvas.width = 1
    canvas.height = 1
  }
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    preserveDrawingBuffer: false,
    powerPreference: 'high-performance',
  }) as WebGL2RenderingContext | null
  if (!gl) return null

  const vs = compile(gl, gl.VERTEX_SHADER, VERT)
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG)
  if (!vs || !fs) return null

  const prog = gl.createProgram()
  if (!prog) return null
  gl.attachShader(prog, vs)
  gl.attachShader(prog, fs)
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.warn('[tint] program failed to link:', gl.getProgramInfoLog(prog))
    return null
  }
  gl.deleteShader(vs)
  gl.deleteShader(fs)

  const uTex = gl.getUniformLocation(prog, 'uTex')
  const uMode = gl.getUniformLocation(prog, 'uMode')
  const uP = gl.getUniformLocation(prog, 'uP')
  if (!uTex || !uMode || !uP) return null

  // one full-screen triangle, bound once — every render reuses it
  const buf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW,
  )
  const aPos = gl.getAttribLocation(prog, 'aPos')
  gl.enableVertexAttribArray(aPos)
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

  gl.disable(gl.BLEND)
  gl.disable(gl.DEPTH_TEST)
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true)
  gl.useProgram(prog)
  gl.uniform1i(uTex, 0)

  /**
   * A lost context (driver reset, laptop switching GPUs) invalidates every texture
   * and the program with them. Rather than try to rebuild mid-frame, the engine
   * stands down and the CPU path takes over; the next `restore` builds it again.
   */
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault()
    engine = null
    texGeneration++
    clearTintCache()
  })
  canvas.addEventListener('webglcontextrestored', () => {
    engine = undefined
  })

  return { canvas, offscreen, gl, prog, uTex, uMode, uP }
}

function getEngine(): Engine | null {
  if (engine === undefined) engine = buildEngine()
  return engine
}

/** 'gpu' when the shader path is live — used to size the preview budget */
export function tintBackend(): 'gpu' | 'cpu' {
  return getEngine() ? 'gpu' : 'cpu'
}

/**
 * Compile the shader and upload the template art while the app is still starting.
 *
 * Both are one-off costs, but they are big ones — a shader link plus ten textures
 * with mipmaps is tens of milliseconds — and without this they would land on
 * whatever the user did first, which is usually the hue slider. Doing it here means
 * the first drag is as quick as the hundredth.
 */
export function warmTintEngine(sources: Iterable<TintSource>) {
  const e = getEngine()
  if (!e) return
  for (const src of sources) {
    try {
      textureFor(e, src)
    } catch {
      // an image that cannot be uploaded simply tints on first use instead
    }
  }
}

function textureFor(e: Engine, src: TintSource): WebGLTexture | null {
  const hit = textures.get(src)
  if (hit && hit.gen === texGeneration) return hit.tex

  const { gl } = e
  const tex = gl.createTexture()
  if (!tex) return null
  gl.bindTexture(gl.TEXTURE_2D, tex)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  /**
   * The preview asks for the artwork at a fraction of its drawn size. Sampling a
   * 4001px background straight down to 1400 with plain bilinear would alias every
   * fine line in it, so the texture carries mipmaps and the shader picks the level
   * that matches — the same quality the 2D canvas gives when it downscales.
   */
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
  gl.generateMipmap(gl.TEXTURE_2D)

  textures.set(src, { tex, gen: texGeneration })
  return tex
}

/** the shader path — null when there is no usable GPU context */
export function tintWithGpu(
  src: TintSource,
  tint: Tint,
  w: number,
  h: number,
): ImageBitmap | HTMLCanvasElement | null {
  const e = getEngine()
  if (!e) return null
  const { gl, canvas } = e
  const tex = textureFor(e, src)
  if (!tex) return null

  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w
    canvas.height = h
  }
  gl.viewport(0, 0, w, h)
  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, tex)
  if (tint.pin) {
    gl.uniform1f(e.uMode, 1)
    gl.uniform3f(e.uP, ((((tint.pin.hue % 360) + 360) % 360) / 360), clamp01(tint.pin.sat), 0)
  } else {
    gl.uniform1f(e.uMode, 0)
    gl.uniform3f(e.uP, tint.hue / 360, tint.saturation, tint.lightness)
  }
  gl.drawArrays(gl.TRIANGLES, 0, 3)
  if (gl.isContextLost()) return null

  // the frame leaves as a bitmap the compositor already owns — nothing is read back
  if (e.offscreen) return (canvas as OffscreenCanvas).transferToImageBitmap()

  const out = document.createElement('canvas')
  out.width = w
  out.height = h
  const ctx = out.getContext('2d')
  if (!ctx) return null
  ctx.drawImage(canvas as HTMLCanvasElement, 0, 0)
  return out
}

/* ─────────────────────────── the JavaScript path ─────────────────────────── */

/**
 * Only ever runs when there is no WebGL2. It is the code the Konva filter used to
 * be, including its colour memo: the template art is cel-shaded, so a downscaled
 * bitmap holds only a few thousand distinct colours and every pixel after the first
 * of a given colour is a table lookup rather than two HSL conversions.
 */
const MEMO_SLOTS = 1 << 15
const MEMO_MASK = MEMO_SLOTS - 1
const MEMO_PROBE = 4
const MEMO_MAX_TABLES = 6

class ColorMemo {
  readonly keys = new Int32Array(MEMO_SLOTS).fill(-1)
  readonly vals = new Int32Array(MEMO_SLOTS)
}

const memoTables = new Map<string, ColorMemo>()

function memoFor(key: string): ColorMemo {
  const hit = memoTables.get(key)
  if (hit) {
    memoTables.delete(key)
    memoTables.set(key, hit)
    return hit
  }
  const fresh = new ColorMemo()
  memoTables.set(key, fresh)
  if (memoTables.size > MEMO_MAX_TABLES) {
    const oldest = memoTables.keys().next().value
    if (oldest !== undefined) memoTables.delete(oldest)
  }
  return fresh
}

function memoSlot(memo: ColorMemo, key: number): number {
  let i = (Math.imul(key, 2654435761) >>> 17) & MEMO_MASK
  for (let probe = 0; probe < MEMO_PROBE; probe++) {
    const k = memo.keys[i]
    if (k === key || k === -1) return i
    i = (i + 1) & MEMO_MASK
  }
  return -1
}

/** hue in turns (0..1), s and l in 0..1, packed back as 0xRRGGBB */
function packHsl(h: number, s: number, l: number): number {
  if (s === 0) {
    const v = (l * 255 + 0.5) | 0
    return (v << 16) | (v << 8) | v
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const ch = (t: number) => {
    let x = t
    if (x < 0) x += 1
    if (x > 1) x -= 1
    if (x < 1 / 6) return p + (q - p) * 6 * x
    if (x < 1 / 2) return q
    if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6
    return p
  }
  const r = (ch(h + 1 / 3) * 255 + 0.5) | 0
  const g = (ch(h) * 255 + 0.5) | 0
  const b = (ch(h - 1 / 3) * 255 + 0.5) | 0
  return (r << 16) | (g << 8) | b
}

/** rotate every pixel's hue/saturation/lightness in place */
export function hslShiftPixels(imageData: ImageData, hue: number, sat: number, light: number) {
  if (!hue && !sat && !light) return
  const d = imageData.data
  const memo = memoFor(`h|${hue}|${sat}|${light}`)
  const hueTurns = hue / 360

  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue
    const key = (d[i] << 16) | (d[i + 1] << 8) | d[i + 2]
    const slot = memoSlot(memo, key)
    let out = slot >= 0 && memo.keys[slot] === key ? memo.vals[slot] : -1

    if (out < 0) {
      const r = d[i] / 255
      const g = d[i + 1] / 255
      const b = d[i + 2] / 255
      const max = Math.max(r, g, b)
      const min = Math.min(r, g, b)
      let l = (max + min) / 2
      const delta = max - min

      let h = 0
      let s = 0
      if (delta !== 0) {
        s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min)
        if (max === r) h = ((g - b) / delta + (g < b ? 6 : 0)) / 6
        else if (max === g) h = ((b - r) / delta + 2) / 6
        else h = ((r - g) / delta + 4) / 6
      }

      h = (((h + hueTurns) % 1) + 1) % 1
      s = clamp01(s + sat)
      l = clamp01(l + light)

      out = packHsl(h, s, l)
      if (slot >= 0) {
        memo.keys[slot] = key
        memo.vals[slot] = out
      }
    }

    d[i] = (out >> 16) & 255
    d[i + 1] = (out >> 8) & 255
    d[i + 2] = out & 255
  }
}

/** force every pixel onto one hue and saturation, keeping its own lightness */
export function colorizePixels(imageData: ImageData, hue: number, sat: number, light: number) {
  const h = ((((hue % 360) + 360) % 360) / 360)
  const s = clamp01(sat)
  const d = imageData.data
  // only lightness survives the pass, so 256 entries cover every possible output
  const table = new Int32Array(256)
  for (let v = 0; v < 256; v++) table[v] = packHsl(h, s, clamp01(v / 255 + light))

  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue
    const r = d[i]
    const g = d[i + 1]
    const b = d[i + 2]
    const out = table[(Math.max(r, g, b) + Math.min(r, g, b)) >> 1]

    d[i] = (out >> 16) & 255
    d[i + 1] = (out >> 8) & 255
    d[i + 2] = out & 255
  }
}

/** the JavaScript path — same output as the shader, several milliseconds slower */
export function tintWithCpu(
  src: TintSource,
  tint: Tint,
  w: number,
  h: number,
): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null
  const out = document.createElement('canvas')
  out.width = w
  out.height = h
  const ctx = out.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null
  ctx.drawImage(src, 0, 0, w, h)
  const data = ctx.getImageData(0, 0, w, h)
  if (tint.pin) colorizePixels(data, tint.pin.hue, tint.pin.sat, 0)
  else hslShiftPixels(data, tint.hue, tint.saturation, tint.lightness)
  ctx.putImageData(data, 0, 0)
  return out
}

/* ──────────────────────────── the shared cache ──────────────────────────── */

interface Entry {
  bitmap: ImageBitmap | HTMLCanvasElement
  px: number
}

const cache = new Map<string, Entry>()
let cachePx = 0

/** enough to hold every part of the card at several tints without hoarding */
const MAX_ENTRIES = 96
const MAX_PX = 40_000_000

let srcSeq = 0
const srcIds = new WeakMap<TintSource, string>()

function srcId(src: TintSource): string {
  let id = srcIds.get(src)
  if (!id) {
    id = `s${++srcSeq}`
    srcIds.set(src, id)
  }
  return id
}

/**
 * Evicted entries are dropped, never closed.
 *
 * A node that has not re-rendered yet can still be holding the bitmap this cache is
 * finished with, and drawing a closed ImageBitmap throws — which would take the
 * whole canvas down to save memory the garbage collector reclaims on its own a
 * moment later.
 */
function evict() {
  while (cache.size > MAX_ENTRIES || cachePx > MAX_PX) {
    const oldest = cache.keys().next()
    if (oldest.done) break
    const entry = cache.get(oldest.value)
    cache.delete(oldest.value)
    if (entry) cachePx -= entry.px
  }
}

export function clearTintCache() {
  cache.clear()
  cachePx = 0
}

/** for the dev parity check — not used by the app itself */
export function tintCacheStats() {
  return { entries: cache.size, megapixels: +(cachePx / 1e6).toFixed(2), backend: tintBackend() }
}

/**
 * The tinted copy of `src` at `w`x`h`, from cache when it has been asked for before.
 *
 * A neutral tint hands the source straight back: nothing to rotate, nothing to
 * allocate, and Konva draws the original PNG.
 */
export function tintedBitmap(
  src: TintSource | undefined,
  tint: Tint,
  w: number,
  h: number,
): TintedSource | undefined {
  if (!src) return undefined
  if (isNeutralTint(tint)) return src

  const ow = Math.max(1, Math.round(w))
  const oh = Math.max(1, Math.round(h))
  const key = `${srcId(src)}|${tintKey(tint)}|${ow}x${oh}`

  const hit = cache.get(key)
  if (hit) {
    // touch — the entries in use are not the ones evicted
    cache.delete(key)
    cache.set(key, hit)
    return hit.bitmap
  }

  const bitmap = tintWithGpu(src, tint, ow, oh) ?? tintWithCpu(src, tint, ow, oh)
  if (!bitmap) return src

  cache.set(key, { bitmap, px: ow * oh })
  cachePx += ow * oh
  evict()
  return bitmap
}

/* ─────────────────────── the resolution everything draws at ─────────────────────── */

/**
 * How many bitmap pixels one unit of the template's coordinate space is worth.
 *
 * The preview draws the 4001px-wide card at a few hundred pixels, so tinting it at
 * full size would be work nobody can see. The exporter puts this back to the output
 * scale for the duration of a capture, which is what keeps a saved PNG sharp without
 * the preview paying for it.
 */
let tintScale = 1
const scaleSubs = new Set<() => void>()
let notifyQueued = false

export const getTintScale = () => tintScale

/**
 * The stage sets this while it renders, so the nodes below it tint at the right size
 * on their very first pass rather than building a full-resolution bitmap and then
 * throwing it away. Telling React about the change is left to a microtask — a store
 * may be written during a render, but no component may be told to re-render there.
 */
export function setTintScale(next: number) {
  const v = Math.max(0.01, next)
  if (v === tintScale) return
  tintScale = v
  if (notifyQueued) return
  notifyQueued = true
  queueMicrotask(() => {
    notifyQueued = false
    for (const fn of scaleSubs) fn()
  })
}

export function subscribeTintScale(fn: () => void) {
  scaleSubs.add(fn)
  return () => {
    scaleSubs.delete(fn)
  }
}
