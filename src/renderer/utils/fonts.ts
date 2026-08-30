/**
 * Template fonts.
 *
 * Konva measures and draws text immediately — it does not wait for a webfont to
 * arrive — so every face is registered through the FontFace API and awaited once
 * before the first frame. Files ship in public/fonts and are addressed relative to
 * BASE_URL so they resolve both from the Vite dev server and from file:// in the
 * packaged app.
 */

export type FontScript = 'en' | 'thai' | 'jp'

/** family names used inside Konva — not the raw file names */
export const FONT_FAMILY: Record<FontScript, string> = {
  en: 'TemplateEn',
  thai: 'TemplateThai',
  jp: 'TemplateJp',
}

const asset = (p: string) => `${import.meta.env.BASE_URL}${p}`

interface FaceDef {
  family: string
  weight: string
  file: string
}

const FACES: FaceDef[] = [
  { family: FONT_FAMILY.en, weight: '500', file: 'fonts/Nunito-Medium.ttf' },
  { family: FONT_FAMILY.en, weight: '800', file: 'fonts/Nunito-ExtraBold.ttf' },
  { family: FONT_FAMILY.en, weight: '900', file: 'fonts/Nunito-Black.ttf' },
  { family: FONT_FAMILY.thai, weight: '500', file: 'fonts/Kanit-Medium.ttf' },
  { family: FONT_FAMILY.thai, weight: '800', file: 'fonts/Kanit-ExtraBold.ttf' },
  { family: FONT_FAMILY.thai, weight: '900', file: 'fonts/Kanit-Black.ttf' },
  // umeboshi ships one weight only — map every weight to it so a bold run never
  // falls back to a different family mid-line
  { family: FONT_FAMILY.jp, weight: '500', file: 'fonts/umeboshi_natural.ttf' },
  { family: FONT_FAMILY.jp, weight: '800', file: 'fonts/umeboshi_natural.ttf' },
  { family: FONT_FAMILY.jp, weight: '900', file: 'fonts/umeboshi_natural.ttf' },
]

let ready: Promise<void> | null = null

export function loadTemplateFonts(): Promise<void> {
  if (ready) return ready
  ready = (async () => {
    if (typeof document === 'undefined' || !('FontFace' in window)) return
    await Promise.all(
      FACES.map(async (f) => {
        try {
          const face = new FontFace(f.family, `url(${asset(f.file)})`, { weight: f.weight })
          await face.load()
          document.fonts.add(face)
        } catch {
          // a missing face must not stop the app — Konva falls back to a system font
        }
      }),
    )
    await document.fonts.ready
  })()
  return ready
}

const THAI = /[฀-๿]/
const JP = /[぀-ヿㇰ-ㇿ㐀-䶿一-鿿ｦ-ﾟ]/

/** pick the face by what is actually typed, unless the user forced one */
export function scriptOf(text: string, manual?: FontScript | 'auto'): FontScript {
  if (manual && manual !== 'auto') return manual
  if (JP.test(text)) return 'jp'
  if (THAI.test(text)) return 'thai'
  return 'en'
}

export function familyFor(text: string, manual?: FontScript | 'auto'): string {
  return FONT_FAMILY[scriptOf(text, manual)]
}

/** per-script family overrides from the text-style store */
export type FontOverrides = Partial<Record<FontScript, string>>

/** families registered at runtime from user uploads — filled by utils/customFonts */
const runtimeFaces = new Set<string>()

/** called by utils/customFonts once a FontFace is live */
export function markFaceRegistered(family: string) {
  runtimeFaces.add(family)
}

export function markFaceRemoved(family: string) {
  runtimeFaces.delete(family)
}

/**
 * Family for a run honouring user overrides. An override naming a face that is
 * not registered (still restoring at boot, or the file was removed) falls back
 * to the template face instead of leaving Konva on a system serif.
 */
export function resolveFamily(
  overrides: FontOverrides | undefined,
  text: string,
  manual?: FontScript | 'auto',
): string {
  const s = scriptOf(text, manual)
  const pick = overrides?.[s]
  if (pick && (runtimeFaces.has(pick) || FONT_FAMILY[s] === pick || document.fonts.check(`16px "${pick}"`)))
    return pick
  return FONT_FAMILY[s]
}
