/**
 * อ่าน theme1.psd ด้วย ag-psd แล้ว dump โครงสร้าง layer ทั้งหมด (bbox, z, text)
 * เป็น JSON — พิกัดทุกตัวในแอปมาจากไฟล์นี้ ไม่ใช่การกะจากภาพ preview
 *
 *   node scripts/extract-psd.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { readPsd } from 'ag-psd'

const PSD = process.argv[2] ?? 'For prompt app/theme1.psd'
const OUT = process.argv[3] ?? 'scripts/psd-dump.json'

const psd = readPsd(readFileSync(PSD), {
  skipCompositeImageData: true,
  skipLayerImageData: true,
  skipThumbnail: true,
})

let z = 0
const flat = []

function walk(layers, path) {
  for (const l of layers ?? []) {
    const name = l.name ?? '(unnamed)'
    const here = [...path, name]
    const entry = {
      z: z++,
      path: here.join(' / '),
      name,
      group: !!l.children,
      hidden: l.hidden === true,
      opacity: l.opacity,
      blendMode: l.blendMode,
      left: l.left, top: l.top, right: l.right, bottom: l.bottom,
      w: (l.right ?? 0) - (l.left ?? 0),
      h: (l.bottom ?? 0) - (l.top ?? 0),
    }
    if (l.text) {
      entry.text = {
        value: l.text.text,
        font: l.text.style?.font?.name,
        size: l.text.style?.fontSize,
        fillColor: l.text.style?.fillColor,
        justification: l.text.paragraphStyle?.justification,
        transform: l.text.transform,
      }
    }
    flat.push(entry)
    if (l.children) walk(l.children, here)
  }
}
walk(psd.children, [])

const out = { canvas: { width: psd.width, height: psd.height }, layers: flat }
writeFileSync(OUT, JSON.stringify(out, null, 2))
console.log(`canvas ${psd.width}x${psd.height} — ${flat.length} layers -> ${OUT}`)
