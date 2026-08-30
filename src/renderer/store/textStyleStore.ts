/**
 * Per-text styling on top of the theme hue.
 *
 * The hue slider rotates every palette colour together; entries here pin single
 * roles to an exact colour (or swap the drawn face per script), so a user can
 * match their brand without touching the artwork tint.
 */
import { create } from 'zustand'
import type { TemplatePalette } from '../template/layout.schema'
import type { FontScript } from '../utils/fonts'

/** one swatch per colour the template draws text with */
export type TextRole = keyof TemplatePalette

export const TEXT_ROLES: { role: TextRole; key: string }[] = [
  { role: 'titleTop', key: 'roleTitleTop' },
  { role: 'titleBottom', key: 'roleTitleBottom' },
  { role: 'weekOfText', key: 'roleWeekOf' },
  { role: 'dayOnline', key: 'roleDayOnline' },
  { role: 'dayOffline', key: 'roleDayOffline' },
  { role: 'time', key: 'roleTime' },
  { role: 'subtitle', key: 'roleSubtitle' },
  { role: 'offlineText', key: 'roleOffline' },
  { role: 'artCredit', key: 'roleArtCredit' },
]

export interface TextStyleState {
  /** exact colours pinned by the user — absent roles follow the theme rotation */
  textColors: Partial<Record<TextRole, string>>
  /** family per script — absent scripts use the template faces */
  fonts: Partial<Record<FontScript, string>>
  /** families registered from user-uploaded font files */
  customFonts: string[]
  setTextColor: (role: TextRole, color: string | undefined) => void
  resetTextColors: () => void
  setFont: (script: FontScript, family: string | undefined) => void
  resetFonts: () => void
  addCustomFont: (name: string) => void
  removeCustomFont: (name: string) => void
}

const STORE_KEY = 'vsg:text-style'

type Persisted = Pick<TextStyleState, 'textColors' | 'fonts'>

function load(): Persisted {
  const fallback = { textColors: {}, fonts: {} }
  if (typeof localStorage === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(STORE_KEY)
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback
  } catch {
    return fallback
  }
}

function persist(s: Persisted) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORE_KEY, JSON.stringify({ textColors: s.textColors, fonts: s.fonts }))
}

export const useTextStyleStore = create<TextStyleState>((set, get) => ({
  ...load(),
  customFonts: [],

  setTextColor: (role, color) =>
    set(() => {
      const next = { ...get().textColors }
      if (color) next[role] = color
      else delete next[role]
      persist({ textColors: next, fonts: get().fonts })
      return { textColors: next }
    }),
  resetTextColors: () =>
    set(() => {
      persist({ textColors: {}, fonts: get().fonts })
      return { textColors: {} }
    }),

  setFont: (script, family) =>
    set(() => {
      const next = { ...get().fonts }
      if (family && family !== 'default') next[script] = family
      else delete next[script]
      persist({ textColors: get().textColors, fonts: next })
      return { fonts: next }
    }),
  resetFonts: () =>
    set(() => {
      persist({ textColors: get().textColors, fonts: {} })
      return { fonts: {} }
    }),

  addCustomFont: (name) =>
    set((s) => (s.customFonts.includes(name) ? s : { customFonts: [...s.customFonts, name] })),
  removeCustomFont: (name) =>
    set(() => {
      // drop any slot pointing at the deleted face so nothing draws on a ghost family
      const fonts = { ...get().fonts }
      for (const k of Object.keys(fonts) as FontScript[]) {
        if (fonts[k] === name) delete fonts[k]
      }
      persist({ textColors: get().textColors, fonts })
      return { customFonts: get().customFonts.filter((f) => f !== name), fonts }
    }),
}))
