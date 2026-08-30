/**
 * Theme = one hue rotation applied to the whole template, plus optional per-part
 * colour pins.
 *
 * No theme ever ships its own artwork: the PNGs from the PSD are the only source
 * of graphics, and a theme just spins their hue (plus saturation/lightness trim).
 * A preset is a named hue; the three sliders are the same rotation entered by hand.
 *
 * A part left unpinned keeps following that one rotation, exactly as before. A
 * pinned part is Colorized (see utils/hue.ts) straight onto the chosen colour
 * instead — still the real PSD pixels, still no artwork generated, just a second
 * way to land on a colour precisely instead of by rotation.
 */
import { create } from 'zustand'
import type { TemplatePalette } from '../template/layout.schema'
import { shiftColor } from '../utils/hue'

/** the raster parts of the template a colour pin can target independently */
export type ArtPart =
  | 'background'
  | 'frame'
  | 'panel'
  | 'titleFlowers'
  | 'weekRibbon'
  | 'rowAccent'
  | 'offlineRibbon'

/** iteration order for the artwork-colour list in ThemeTab, paired with its i18n key */
export const ART_PARTS: { part: ArtPart; key: string }[] = [
  { part: 'background', key: 'partBackground' },
  { part: 'frame', key: 'partFrame' },
  { part: 'panel', key: 'partPanel' },
  { part: 'titleFlowers', key: 'partTitleFlowers' },
  { part: 'weekRibbon', key: 'partWeekRibbon' },
  { part: 'rowAccent', key: 'partRowAccent' },
  { part: 'offlineRibbon', key: 'partOfflineRibbon' },
]

export interface ThemePreset {
  id: string
  name: string
  hueShift: number
  saturationShift?: number
  lightnessShift?: number
}

export const THEME_PRESETS: ThemePreset[] = [
  { id: 'sakura', name: 'Sakura Pink', hueShift: 0 },
  { id: 'peach', name: 'Peach', hueShift: 30 },
  { id: 'butter', name: 'Butter', hueShift: 60 },
  { id: 'mint', name: 'Mint', hueShift: 150 },
  { id: 'sky', name: 'Sky Blue', hueShift: 200 },
  { id: 'lavender', name: 'Lavender', hueShift: 260 },
]

interface ThemeStore {
  presetId: string
  hueShift: number
  saturationShift: number
  lightnessShift: number
  /** exact colours pinned per artwork part — absent parts follow the rotation above */
  artColors: Partial<Record<ArtPart, string>>
  applyPreset: (id: string) => void
  setHue: (deg: number) => void
  setSaturation: (v: number) => void
  setLightness: (v: number) => void
  setArtColor: (part: ArtPart, color: string | undefined) => void
  resetArtColors: () => void
  reset: () => void
}

const STORE_KEY = 'vsg:theme-hue'

type Persisted = Pick<ThemeStore, 'presetId' | 'hueShift' | 'saturationShift' | 'lightnessShift' | 'artColors'>

const DEFAULTS: Persisted = {
  presetId: 'sakura',
  hueShift: 0,
  saturationShift: 0,
  lightnessShift: 0,
  artColors: {},
}

const num = (v: unknown, fallback: number) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback)

const isArtColors = (v: unknown): v is Partial<Record<ArtPart, string>> =>
  !!v && typeof v === 'object' && !Array.isArray(v)

/**
 * Only the keys above are read back. Older builds also stored a single artwork
 * colour under a different shape; ignoring anything unexpected keeps those saves
 * loading cleanly instead of throwing.
 */
function load(): Persisted {
  if (typeof localStorage === 'undefined') return DEFAULTS
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (!raw) return DEFAULTS
    const p = JSON.parse(raw) as Partial<Record<keyof Persisted, unknown>>
    return {
      presetId: typeof p.presetId === 'string' ? p.presetId : DEFAULTS.presetId,
      hueShift: num(p.hueShift, DEFAULTS.hueShift),
      saturationShift: num(p.saturationShift, DEFAULTS.saturationShift),
      lightnessShift: num(p.lightnessShift, DEFAULTS.lightnessShift),
      artColors: isArtColors(p.artColors) ? p.artColors : {},
    }
  } catch {
    return DEFAULTS
  }
}

function persist(s: Persisted) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(
    STORE_KEY,
    JSON.stringify({
      presetId: s.presetId,
      hueShift: s.hueShift,
      saturationShift: s.saturationShift,
      lightnessShift: s.lightnessShift,
      artColors: s.artColors,
    }),
  )
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  ...load(),

  applyPreset: (id) =>
    set(() => {
      const p = THEME_PRESETS.find((x) => x.id === id) ?? THEME_PRESETS[0]
      const next = {
        ...get(),
        presetId: p.id,
        hueShift: p.hueShift,
        saturationShift: p.saturationShift ?? 0,
        lightnessShift: p.lightnessShift ?? 0,
      }
      persist(next)
      return next
    }),
  // a hand-turned slider no longer matches any preset, so the preset chip clears
  setHue: (deg) => {
    persist({ ...get(), presetId: 'custom', hueShift: deg })
    set({ presetId: 'custom', hueShift: deg })
  },
  setSaturation: (v) => {
    persist({ ...get(), presetId: 'custom', saturationShift: v })
    set({ presetId: 'custom', saturationShift: v })
  },
  setLightness: (v) => {
    persist({ ...get(), presetId: 'custom', lightnessShift: v })
    set({ presetId: 'custom', lightnessShift: v })
  },
  setArtColor: (part, color) =>
    set(() => {
      const next = { ...get().artColors }
      if (color) next[part] = color
      else delete next[part]
      persist({ ...get(), artColors: next })
      return { artColors: next }
    }),
  resetArtColors: () =>
    set(() => {
      persist({ ...get(), artColors: {} })
      return { artColors: {} }
    }),
  // rotation only — a pinned artwork colour is a separate, deliberate choice, the
  // same way pinned text colours already survive this button; its own "reset all"
  // link (next to the artwork-colour list) clears those
  reset: () => {
    const next = { ...DEFAULTS, artColors: get().artColors }
    persist(next)
    set(next)
  },
}))

/** what the artwork filter needs: the rotation to apply to every template PNG */
export interface ArtTint {
  hue: number
  saturation: number
  lightness: number
}

type ThemeInput = Pick<ThemeStore, 'hueShift' | 'saturationShift' | 'lightnessShift'>

/**
 * The rotation is the single source of truth for both the PNGs and the text, so
 * resolving it lives here rather than in the canvas.
 */
export function resolveTint(s: ThemeInput): ArtTint {
  return { hue: s.hueShift, saturation: s.saturationShift, lightness: s.lightnessShift }
}

/** Text colours for the current theme — always the same rotation as the artwork. */
export function resolvePalette(base: TemplatePalette, s: ThemeInput): TemplatePalette {
  return shiftPalette(base, s.hueShift, s.saturationShift, s.lightnessShift)
}

/** template colours after the current hue rotation — always in sync with the art */
export function shiftPalette(
  base: TemplatePalette,
  hueShift: number,
  saturationShift: number,
  lightnessShift: number,
): TemplatePalette {
  const out = {} as TemplatePalette
  for (const [k, v] of Object.entries(base)) {
    out[k as keyof TemplatePalette] = shiftColor(v, hueShift, saturationShift, lightnessShift)
  }
  return out
}
