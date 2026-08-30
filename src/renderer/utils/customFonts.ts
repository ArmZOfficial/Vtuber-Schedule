/**
 * Fonts the user brings in — an uploaded file, a face already installed on the
 * machine, or one pulled from Google Fonts.
 *
 * Whatever the source, a face ends up here as bytes: registered through the
 * FontFace API under its own family name and kept in IndexedDB so it survives a
 * restart (localStorage is far too small for font files). A single-file face maps
 * every template weight to the one file (like umeboshi), so a bold run never
 * switches family mid-line; a Google family arrives as several files and keeps its
 * own weights and unicode-ranges, exactly as Google serves them.
 */
import { get, set } from 'idb-keyval'
import { clearInkCache } from '../components/canvas/InkText'
import { markFaceRegistered, markFaceRemoved } from './fonts'

const IDB_KEY = 'vsg:custom-fonts'
const WEIGHTS = ['500', '800', '900']

/** how many families survive a restart — the oldest drop out past this */
const MAX_STORED = 20

export interface FaceBytes {
  data: ArrayBuffer
  weight: string
  /** Google splits a family across subsets; the range is what picks the right file */
  unicodeRange?: string
}

interface StoredFont {
  name: string
  /** single-file record — what an upload or a machine font produces */
  data?: ArrayBuffer
  /** multi-file record: one entry per weight and subset */
  faces?: FaceBytes[]
}

/** one file, every template weight — so a bold run cannot fall back mid-line */
const expand = (data: ArrayBuffer): FaceBytes[] => WEIGHTS.map((weight) => ({ data, weight }))

const facesOf = (f: StoredFont): FaceBytes[] => f.faces ?? (f.data ? expand(f.data) : [])

async function registerFaces(name: string, faces: FaceBytes[]): Promise<boolean> {
  if (typeof document === 'undefined' || !('FontFace' in window)) return false
  if (!faces.length) return false
  try {
    await Promise.all(
      faces.map(async (f) => {
        const face = new FontFace(name, f.data, {
          weight: f.weight,
          ...(f.unicodeRange ? { unicodeRange: f.unicodeRange } : {}),
        })
        await face.load()
        document.fonts.add(face)
      }),
    )
    markFaceRegistered(name)
    return true
  } catch {
    return false
  }
}

async function store(name: string, record: StoredFont): Promise<void> {
  const all = (await get<StoredFont[]>(IDB_KEY)) ?? []
  await set(IDB_KEY, [...all.filter((f) => f.name !== name), record].slice(-MAX_STORED))
}

/**
 * Register a family from raw bytes and remember it. Returns null when the browser
 * rejects the file — a renamed archive, a broken download, a format Chrome will
 * not parse (.ttc among them).
 */
export async function installFontBytes(name: string, data: ArrayBuffer): Promise<string | null> {
  if (!(await registerFaces(name, expand(data)))) return null
  await store(name, { name, data })
  clearInkCache()
  return name
}

/** same, for a family that ships as several weight/subset files */
export async function installFontFaces(name: string, faces: FaceBytes[]): Promise<string | null> {
  if (!(await registerFaces(name, faces))) return null
  await store(name, { name, faces })
  clearInkCache()
  return name
}

/** register a freshly picked file; returns null when the browser rejects it */
export async function installCustomFont(name: string, file: File): Promise<string | null> {
  return installFontBytes(name, await file.arrayBuffer())
}

/** re-register everything from a previous session — call once during boot */
export async function restoreCustomFonts(): Promise<string[]> {
  try {
    const all = (await get<StoredFont[]>(IDB_KEY)) ?? []
    const ok: string[] = []
    for (const f of all) {
      if (await registerFaces(f.name, facesOf(f))) ok.push(f.name)
    }
    if (ok.length) clearInkCache()
    return ok
  } catch {
    return []
  }
}

export async function uninstallCustomFont(name: string): Promise<void> {
  markFaceRemoved(name)
  try {
    const all = (await get<StoredFont[]>(IDB_KEY)) ?? []
    await set(
      IDB_KEY,
      all.filter((f) => f.name !== name),
    )
    // FontFace has no remove(); dropping it from IDB keeps it gone after restart,
    // and this session simply stops selecting the family
  } catch {
    // losing the IDB row is not fatal — the assignment was already cleared
  }
}
