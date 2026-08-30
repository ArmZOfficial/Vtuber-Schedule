/**
 * Fonts already installed on the machine.
 *
 * Chrome cannot read a font off disk by name, so the main process lists the font
 * folders and hands back the bytes for the one that was picked; from there it is
 * the same path as an uploaded file. Only .ttf/.otf/.woff/.woff2 are offered —
 * FontFace cannot parse a .ttc collection, which is most of the CJK faces Windows
 * ships.
 */
import { installFontBytes } from './customFonts'

export interface SystemFont {
  /** display name, derived from the file name */
  family: string
  /** absolute path, only ever passed straight back to the main process */
  file: string
}

const bridge = () =>
  (window as unknown as { api?: { fonts?: { list: () => Promise<SystemFont[]>; read: (f: string) => Promise<string | null> } } })
    .api?.fonts

/** available only in the packaged/dev Electron shell — empty in a plain browser */
export const canReadSystemFonts = (): boolean => !!bridge()

export async function listSystemFonts(): Promise<SystemFont[]> {
  const api = bridge()
  if (!api) return []
  try {
    return await api.list()
  } catch {
    return []
  }
}

function toArrayBuffer(base64: string): ArrayBuffer {
  const bin = atob(base64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out.buffer
}

/** copy a machine font into the app's own store so it survives a restart */
export async function installSystemFont(font: SystemFont): Promise<string | null> {
  const api = bridge()
  if (!api) return null
  try {
    const base64 = await api.read(font.file)
    if (!base64) return null
    return await installFontBytes(font.family, toArrayBuffer(base64))
  } catch {
    return null
  }
}
