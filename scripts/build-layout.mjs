/**
 * Turn scripts/psd-dump.json into src/renderer/template/layout.default.json.
 *
 * Every coordinate the renderer uses comes from here, so a new .psd only needs
 *
 *   node scripts/extract-psd.mjs && node scripts/build-layout.mjs
 *
 * and no renderer code changes.
 *
 * Two things are normalised on the way through:
 *  - PSD font sizes are pre-transform, so they are multiplied by the text layer's
 *    transform scale (2.0833 in theme1.psd) to get on-canvas pixels.
 *  - The artist nudged each day row by a few pixels by hand. Offsets inside a row
 *    are averaged into one shared row template, and only the seven row tops are
 *    kept per-row, so an edited day still lines up with the rest.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

const DUMP = process.argv[2] ?? 'scripts/psd-dump.json'
const OUT = process.argv[3] ?? 'src/renderer/template/layout.default.json'

const dump = JSON.parse(readFileSync(DUMP, 'utf8'))
// a few layer names carry a stray trailing space in the PSD — match on trimmed parts
const key = (p) => p.split('/').map((s) => s.trim()).join('/')
const byPath = new Map(dump.layers.map((l) => [key(l.path), l]))
const at = (path) => {
  const l = byPath.get(key(path))
  if (!l) throw new Error(`layer not found: ${path}`)
  return l
}
const rect = (path) => {
  const l = at(path)
  return { x: l.left, y: l.top, w: l.w, h: l.h }
}
/** on-canvas font size = psd point size x the text layer's transform scale */
const fontSize = (path) => {
  const t = at(path).text
  const [a, b] = t.transform ?? [1, 0]
  return round(t.size * Math.hypot(a, b))
}
const round = (n) => Math.round(n * 100) / 100
const avg = (xs) => round(xs.reduce((a, b) => a + b, 0) / xs.length)

/** tilt of the top title line, measured off 00_full_composite_reference.png */
const TITLE_TOP_ROTATION = -7

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

/* ── one row template, averaged over all seven rows ────────────────────────── */

const rowTops = DAYS.map((d) => at(`${d} / Online / ${dayNameLayer(d)}`).top)

function dayNameLayer(d) {
  return d === 'Monday' ? 'MONDAY' : d
}
/** every row has its own "Capa NN" numbering — find them by geometry instead */
function rowParts(day, variant) {
  const kids = dump.layers.filter((l) => l.path.startsWith(`${day} / ${variant} / `) && !l.group)
  const raster = kids.filter((l) => !l.text)
  return {
    bullet: raster.find((l) => l.w < 60 && l.h < 60),
    dash: raster.find((l) => l.h <= 10 && l.w > 200),
    ribbon: raster.find((l) => l.h > 40 && l.w > 200),
  }
}

const offsets = { bullet: [], dashTop: [], dashRight: [], time: [], sub: [], ribbon: [], offText: [] }
const lefts = { ribbon: [], offText: [] }
const gaps = { nameToBullet: [], bulletToDash: [] }

DAYS.forEach((day, i) => {
  const top = rowTops[i]
  const name = at(`${day} / Online / ${dayNameLayer(day)}`)
  const on = rowParts(day, 'Online')
  const off = rowParts(day, 'Offline')

  offsets.bullet.push(on.bullet.top - top)
  offsets.dashTop.push(on.dash.top - top)
  offsets.dashRight.push(on.dash.left + on.dash.w)
  offsets.time.push(at(`${day} / Online / 10:00 PM`).top - top)
  offsets.sub.push(dump.layers.find((l) => l.path.startsWith(`${day} / Online / Example`)).top - top)
  offsets.ribbon.push(off.ribbon.top - top)
  lefts.ribbon.push(off.ribbon.left)
  const offText = dump.layers.find((l) => key(l.path).endsWith('/OFFLINE') && l.path.startsWith(day))
  offsets.offText.push(offText.top - top)
  lefts.offText.push(offText.left)

  gaps.nameToBullet.push(on.bullet.left - (name.left + name.w))
  gaps.bulletToDash.push(on.dash.left - (on.bullet.left + on.bullet.w))
})

const timeRight = DAYS.map((d) => {
  const l = at(`${d} / Online / 10:00 PM`)
  return l.left + l.w
})
const monBullet = rowParts('Monday', 'Online').bullet
const monDash = rowParts('Monday', 'Online').dash
const monRibbon = rowParts('Monday', 'Offline').ribbon
const monName = at('Monday / Online / MONDAY')
const monSub = at('Monday / Online / Example stream title')
const monOffText = at('Monday / Offline / OFFLINE')

const layout = {
  id: 'sakura-diary',
  name: 'Sakura Diary',
  source: 'For prompt app/theme1.psd',
  canvas: { w: dump.canvas.width, h: dump.canvas.height },

  /** base colours straight out of the PSD text layers — hue is rotated at runtime */
  palette: {
    dayOnline: '#E8AABF',
    dayOffline: '#D887A2',
    time: '#E8AABF',
    subtitle: '#D887A2',
    offlineText: '#F7D7E4',
    weekOfText: '#F7D0DF',
    titleTop: '#E8AABF',
    titleBottom: '#D887A2',
    artCredit: '#D887A2',
  },

  images: {
    background: { ...rect('Background'), src: 'template/Background.png' },
    panel: { ...rect('Rectangle'), src: 'template/Rectangle.png' },
    frame: { ...rect('Frame'), src: 'template/Frame.png' },
    placeholder: { ...rect('place holder'), src: 'template/place-holder.png' },
    titleFlowers: { ...rect('Title / flowers'), src: 'template/Title_flowers.png' },
    weekRibbon: { ...rect('Week of / Capa 46'), src: 'template/Week-of_Capa-46.png' },
    designCredit: { ...rect("plase don't delete this u.u"), src: 'template/design-credit.png' },
  },

  /**
   * The top title line is tilted in the original, so what ag-psd reports for it is
   * the *rotated* bounding box — which is why it comes out 73px taller than the flat
   * "Schedule" line at the same type size. The anchor below is the cap-top of its
   * left edge before rotation: the box height minus the upright letter height is
   * exactly how far the line climbs from left to right.
   */
  title: (() => {
    const topBox = at('Title / weekly')
    const bottomBox = at('Title / Schedule')
    const rad = (TITLE_TOP_ROTATION * Math.PI) / 180
    const rise = topBox.h - bottomBox.h * Math.cos(rad)
    return {
      top: {
        x: topBox.left,
        y: round(topBox.top + rise),
        w: topBox.w,
        h: bottomBox.h,
        size: fontSize('Title / weekly'),
        rotation: TITLE_TOP_ROTATION,
      },
      bottom: { ...rect('Title / Schedule'), size: fontSize('Title / Schedule') },
    }
  })(),

  weekOf: {
    label: { ...rect('Week of / WEEK OF'), size: fontSize('Week of / WEEK OF') },
    dates: { ...rect('Week of / 01.04 / 08.04'), size: fontSize('Week of / 01.04 / 08.04') },
  },

  /**
   * This one text layer has its own transform, so its matrix carries a real anchor:
   * e/f is the origin (centre x, baseline y) and a/b give the tilt. Anchoring there
   * beats deriving it from the rotated bounding box.
   */
  artCredit: (() => {
    const t = at('Art by: @username').text
    const [a, b, , , e, f] = t.transform
    return {
      x: round(e),
      baseline: round(f),
      size: round(t.size * Math.hypot(a, b)),
      rotation: round((Math.atan2(b, a) * 180) / Math.PI),
    }
  })(),

  /** y of each day-name row, straight from the PSD */
  rowTops,

  /** everything else in a row is expressed relative to that row's top */
  row: {
    dayName: { x: monName.left, dy: 0, size: fontSize('Monday / Online / MONDAY'), upper: true },
    bullet: { dy: avg(offsets.bullet), w: monBullet.w, h: monBullet.h, gap: avg(gaps.nameToBullet), src: 'template/Sunday_Offline_Capa-8.png' },
    dash: {
      dy: avg(offsets.dashTop),
      h: monDash.h,
      gap: avg(gaps.bulletToDash),
      right: avg(offsets.dashRight),
      src: 'template/Sunday_Offline_Capa-9.png',
    },
    time: { dy: avg(offsets.time), right: avg(timeRight), size: fontSize('Monday / Online / 10:00 PM') },
    subtitle: { x: monSub.left, dy: avg(offsets.sub), size: fontSize('Monday / Online / Example stream title') },
    ribbon: { x: avg(lefts.ribbon), dy: avg(offsets.ribbon), w: monRibbon.w, h: monRibbon.h, src: 'template/Sunday_Offline_Capa-13.png' },
    offlineText: { x: avg(lefts.offText), dy: avg(offsets.offText), w: monOffText.w, size: fontSize('Monday / Offline / OFFLINE'), upper: true },
  },
}

mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, JSON.stringify(layout, null, 2))
console.log(`canvas ${layout.canvas.w}x${layout.canvas.h} — rows at ${rowTops.join(', ')} -> ${OUT}`)
