/**
 * Flips once the template fonts are registered.
 *
 * Konva measures text with whatever font is available at that moment, so the
 * first frame can land on a fallback face. Components subscribe to this to redraw
 * with real metrics as soon as the real faces are in.
 *
 * `rev` also bumps whenever a user font is installed or a slot reassigned —
 * measurements taken under the old face must be dropped then too.
 */
import { create } from 'zustand'

interface FontsReady {
  ready: boolean
  rev: number
  markReady: () => void
  bump: () => void
}

export const useFontsReady = create<FontsReady>((set) => ({
  ready: false,
  rev: 0,
  markReady: () => set((s) => (s.ready ? s : { ready: true, rev: s.rev + 1 })),
  bump: () => set((s) => ({ rev: s.rev + 1 })),
}))
