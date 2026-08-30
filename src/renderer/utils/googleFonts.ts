/**
 * Google Fonts.
 *
 * The CSS API is asked for the three template weights and every subset it wants
 * to serve; each @font-face block in the reply becomes one FontFace with its own
 * weight and unicode-range, which is how a Thai or Japanese family keeps its
 * glyphs. The files are downloaded once and kept with the uploaded fonts, so the
 * app still draws them with no network on the next run.
 *
 * No API key is involved: the suggestions below are a fixed list, and the search
 * box simply asks the CSS API for whatever family name was typed.
 */
import { installFontFaces, type FaceBytes } from './customFonts'

const CSS_API = 'https://fonts.googleapis.com/css2'
const WEIGHTS = [500, 800, 900]

/** families that suit this template, grouped by the script they cover */
export const GOOGLE_SUGGESTIONS: { script: 'en' | 'thai' | 'jp'; families: string[] }[] = [
  {
    script: 'en',
    families: [
      'Nunito',
      'Poppins',
      'Quicksand',
      'Comfortaa',
      'Fredoka',
      'Baloo 2',
      'Outfit',
      'Plus Jakarta Sans',
      'Montserrat',
      'Playfair Display',
    ],
  },
  {
    script: 'thai',
    families: [
      'Kanit',
      'Prompt',
      'Mitr',
      'Sarabun',
      'Bai Jamjuree',
      'Chakra Petch',
      'IBM Plex Sans Thai',
      'Noto Sans Thai',
      'Mali',
      'Charmonman',
    ],
  },
  {
    script: 'jp',
    families: [
      'Noto Sans JP',
      'M PLUS Rounded 1c',
      'Zen Maru Gothic',
      'Kosugi Maru',
      'Sawarabi Gothic',
      'Yusei Magic',
      'Kiwi Maru',
      'Klee One',
    ],
  },
]

const cssUrl = (family: string, weighted: boolean) => {
  const name = family.trim().replace(/\s+/g, '+')
  const spec = weighted ? `${name}:wght@${WEIGHTS.join(';')}` : name
  return `${CSS_API}?family=${spec}&display=swap`
}

/**
 * One entry per @font-face block. A family with no explicit weights (many display
 * faces ship one) still yields blocks — they just all carry weight 400, which is
 * remapped onto the template weights so nothing falls back mid-line.
 */
function parseFaces(css: string): { url: string; weight: string; unicodeRange?: string }[] {
  const out: { url: string; weight: string; unicodeRange?: string }[] = []
  for (const block of css.split('@font-face').slice(1)) {
    const url = /url\((https:\/\/[^)]+\.woff2?)\)/.exec(block)?.[1]
    if (!url) continue
    const weight = /font-weight:\s*([0-9]+)/.exec(block)?.[1] ?? '400'
    const unicodeRange = /unicode-range:\s*([^;]+);/.exec(block)?.[1]?.trim()
    out.push({ url, weight, unicodeRange })
  }
  return out
}

/**
 * Template text is drawn at 500/800/900. A family that served none of them gets
 * its heaviest available file mapped onto the missing weights, so a bold day name
 * stays in the same family instead of dropping to a system face.
 */
function remapWeights(
  faces: { url: string; weight: string; unicodeRange?: string }[],
): { url: string; weight: string; unicodeRange?: string }[] {
  const wanted = WEIGHTS.map(String)
  const have = new Set(faces.map((f) => f.weight))
  if (wanted.every((w) => have.has(w))) return faces

  const byRange = new Map<string, { url: string; weight: string; unicodeRange?: string }[]>()
  for (const f of faces) {
    const key = f.unicodeRange ?? ''
    byRange.set(key, [...(byRange.get(key) ?? []), f])
  }

  const out: { url: string; weight: string; unicodeRange?: string }[] = []
  for (const [, group] of byRange) {
    const sorted = [...group].sort((a, b) => Number(a.weight) - Number(b.weight))
    for (const want of wanted) {
      const exact = sorted.find((f) => f.weight === want)
      // nearest at or above the wanted weight, else the heaviest there is
      const near = sorted.find((f) => Number(f.weight) >= Number(want)) ?? sorted[sorted.length - 1]
      const pick = exact ?? near
      if (pick) out.push({ ...pick, weight: want })
    }
  }
  return out
}

async function fetchCss(family: string): Promise<string | null> {
  // a family that ships only one weight rejects the :wght@ form — ask again plain
  for (const weighted of [true, false]) {
    try {
      const res = await fetch(cssUrl(family, weighted))
      if (res.ok) return await res.text()
    } catch {
      // offline or blocked: retrying the same host will not help
      return null
    }
  }
  return null
}

/**
 * Download a family and register it. Returns the family name, or null when the
 * name does not exist on Google Fonts or the machine is offline.
 */
export async function installGoogleFont(family: string): Promise<string | null> {
  const name = family.trim()
  if (!name) return null

  const css = await fetchCss(name)
  if (!css) return null

  const wanted = remapWeights(parseFaces(css))
  if (!wanted.length) return null

  // one download per distinct file, reused across the weights mapped onto it
  const cache = new Map<string, Promise<ArrayBuffer>>()
  const bytesFor = (url: string) => {
    const hit = cache.get(url)
    if (hit) return hit
    const p = fetch(url).then((r) => {
      if (!r.ok) throw new Error(`font file ${r.status}`)
      return r.arrayBuffer()
    })
    cache.set(url, p)
    return p
  }

  try {
    const faces: FaceBytes[] = await Promise.all(
      wanted.map(async (f) => ({
        data: await bytesFor(f.url),
        weight: f.weight,
        unicodeRange: f.unicodeRange,
      })),
    )
    return await installFontFaces(name, faces)
  } catch {
    return null
  }
}
