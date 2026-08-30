/**
 * Export PSD layers that have no matching .png asset yet.
 *
 * Rule from the build spec: never redraw artwork by hand — if a layer is missing
 * a .png, pull the real pixels out of the .psd and name the file after the layer.
 *
 *   node scripts/extract-layers.mjs
 *
 * ag-psd returns raw RGBA for each layer; PNG encoding is done here with zlib so
 * the project needs no native canvas/pngjs dependency.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { deflateSync } from 'node:zlib'
import { readPsd, initializeCanvas } from 'ag-psd'

/**
 * ag-psd wants a DOM canvas. Only raw RGBA is needed here, so a plain object with
 * the right shape is enough — no native canvas dependency.
 */
initializeCanvas(
  () => {
    throw new Error('ag-psd asked for a real canvas — layer is not plain raster')
  },
  (width, height) => ({ width, height, data: new Uint8ClampedArray(width * height * 4) }),
)

const PSD = process.argv[2] ?? 'For prompt app/theme1.psd'
const OUT_DIR = process.argv[3] ?? 'public/template'

/** Layers to export: PSD layer path -> output filename */
const WANTED = {
  "plase don't delete this u.u": 'design-credit.png',
}

/* ── minimal PNG encoder (8-bit RGBA, no interlace) ─────────────────────────── */

const CRC_TABLE = (() => {
  const t = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
})()

function crc32(buf) {
  let c = -1
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ -1) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'latin1'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function encodePng(width, height, rgba) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // colour type RGBA
  // 10..12 = compression / filter / interlace, all 0

  // one filter byte (0 = none) in front of every scanline
  const stride = width * 4
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0
    Buffer.from(rgba.buffer ?? rgba, rgba.byteOffset ?? 0, rgba.length).copy(
      raw,
      y * (stride + 1) + 1,
      y * stride,
      y * stride + stride,
    )
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/* ── walk the psd and write what is asked for ──────────────────────────────── */

const psd = readPsd(readFileSync(PSD), {
  useImageData: true,
  skipCompositeImageData: true,
  skipThumbnail: true,
})

mkdirSync(OUT_DIR, { recursive: true })

const found = new Set()

function walk(layers, path) {
  for (const l of layers ?? []) {
    const here = [...path, l.name ?? '(unnamed)']
    const key = here.join(' / ')
    const out = WANTED[key]
    if (out && l.imageData) {
      const { width, height, data } = l.imageData
      writeFileSync(`${OUT_DIR}/${out}`, encodePng(width, height, data))
      console.log(`${key}  ${width}x${height} -> ${OUT_DIR}/${out}  (psd ${l.left},${l.top})`)
      found.add(key)
    }
    if (l.children) walk(l.children, here)
  }
}
walk(psd.children, [])

for (const k of Object.keys(WANTED)) {
  if (!found.has(k)) console.error(`MISSING layer: ${k}`)
}
