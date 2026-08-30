/**
 * Where a font can come from: a file on disk, a face already installed on this
 * machine, or Google Fonts.
 *
 * All three end at the same place — bytes registered as a FontFace and kept in
 * IndexedDB — so this only picks the source and hands the resulting family name
 * back. The panels stay collapsed until asked for: listing every font on a Windows
 * machine is a few hundred files, and nobody needs that on the way to the colour
 * pickers above.
 */
import { useEffect, useState } from 'react'
import { Download, HardDrive, Loader2, Upload } from 'lucide-react'
import { installCustomFont } from '../../utils/customFonts'
import { installGoogleFont, GOOGLE_SUGGESTIONS } from '../../utils/googleFonts'
import { canReadSystemFonts, installSystemFont, listSystemFonts, type SystemFont } from '../../utils/systemFonts'
import type { Translations } from '../../i18n/translations'
import { Btn, FileButton, TextInput } from './ui'

const FONT_FILE_RE = /\.(ttf|otf|woff2?)$/i

/** a long font list is scrolled, not paged — this caps what a filter can render */
const MAX_ROWS = 120

type Panel = 'system' | 'google' | null

export function FontSourcePicker({
  tr,
  onInstalled,
  onError,
}: {
  tr: Translations
  /** called with the family name once it is registered and drawable */
  onInstalled: (name: string) => void
  onError: (message: string) => void
}) {
  const [panel, setPanel] = useState<Panel>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const [sysFonts, setSysFonts] = useState<SystemFont[] | null>(null)
  const [sysQuery, setSysQuery] = useState('')
  const [googleQuery, setGoogleQuery] = useState('')

  const hasBridge = canReadSystemFonts()

  // the machine list is read once per session, the first time the panel opens
  useEffect(() => {
    if (panel !== 'system' || sysFonts || !hasBridge) return
    let alive = true
    void listSystemFonts().then((list) => {
      if (alive) setSysFonts(list)
    })
    return () => {
      alive = false
    }
  }, [panel, sysFonts, hasBridge])

  const finish = (name: string | null, failMessage: string) => {
    if (name) onInstalled(name)
    else onError(failMessage)
    setBusy(null)
  }

  const handleUpload = async (file: File) => {
    if (!FONT_FILE_RE.test(file.name)) {
      onError(tr.fontUploadFail)
      return
    }
    const name = file.name.replace(FONT_FILE_RE, '')
    setBusy(name)
    finish(await installCustomFont(name, file), tr.fontUploadFail)
  }

  const handleSystem = async (font: SystemFont) => {
    setBusy(font.family)
    finish(await installSystemFont(font), tr.fontUploadFail)
  }

  const handleGoogle = async (family: string) => {
    const name = family.trim()
    if (!name) return
    setBusy(name)
    finish(await installGoogleFont(name), tr.fontGoogleFail)
  }

  const visibleSys = (sysFonts ?? []).filter((f) =>
    f.family.toLowerCase().includes(sysQuery.trim().toLowerCase()),
  )

  const toggle = (p: Exclude<Panel, null>) => setPanel((cur) => (cur === p ? null : p))

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <FileButton accept=".ttf,.otf,.woff,.woff2" onFile={(f) => void handleUpload(f)}>
          <Upload size={13} /> {tr.fontUploadBtn}
        </FileButton>
        <Btn size="sm" variant={panel === 'system' ? 'primary' : 'default'} onClick={() => toggle('system')}>
          <HardDrive size={13} aria-hidden /> {tr.fontAddSystem}
        </Btn>
        <Btn size="sm" variant={panel === 'google' ? 'primary' : 'default'} onClick={() => toggle('google')}>
          <Download size={13} aria-hidden /> {tr.fontAddGoogle}
        </Btn>
        {busy && (
          <span className="inline-flex items-center gap-1.5 text-micro text-ink-muted">
            <Loader2 size={12} className="animate-spin" aria-hidden />
            {tr.fontLoading}
          </span>
        )}
      </div>

      {panel === 'system' && (
        <div className="rounded-card border border-line bg-canvas p-2.5">
          {!hasBridge ? (
            <p className="text-label text-ink-muted">{tr.fontSystemUnavailable}</p>
          ) : (
            <>
              <TextInput
                size="sm"
                value={sysQuery}
                onChange={(e) => setSysQuery(e.target.value)}
                placeholder={tr.fontSystemSearch}
                aria-label={tr.fontSystemSearch}
              />
              <div className="mt-2 max-h-56 overflow-y-auto">
                {sysFonts === null ? (
                  <p className="px-1 py-2 text-label text-ink-muted">{tr.fontLoading}</p>
                ) : visibleSys.length === 0 ? (
                  <p className="px-1 py-2 text-label text-ink-muted">{tr.fontSystemEmpty}</p>
                ) : (
                  visibleSys.slice(0, MAX_ROWS).map((f) => (
                    <button
                      key={f.file}
                      type="button"
                      onClick={() => void handleSystem(f)}
                      disabled={busy !== null}
                      className="block w-full truncate rounded-btn px-2 py-1.5 text-left text-label text-ink transition hover:bg-raised disabled:opacity-40"
                    >
                      {f.family}
                    </button>
                  ))
                )}
                {sysFonts !== null && visibleSys.length > MAX_ROWS && (
                  <p className="px-2 py-1.5 text-micro text-ink-faint">
                    {tr.fontListTruncated.replace('{n}', String(visibleSys.length - MAX_ROWS))}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {panel === 'google' && (
        <div className="space-y-2.5 rounded-card border border-line bg-canvas p-2.5">
          <div className="flex gap-1.5">
            <TextInput
              size="sm"
              value={googleQuery}
              onChange={(e) => setGoogleQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleGoogle(googleQuery)
              }}
              placeholder={tr.fontGoogleSearch}
              aria-label={tr.fontGoogleSearch}
            />
            <Btn size="sm" onClick={() => void handleGoogle(googleQuery)} disabled={busy !== null || !googleQuery.trim()}>
              {tr.fontGoogleAdd}
            </Btn>
          </div>

          {GOOGLE_SUGGESTIONS.map((group) => (
            <div key={group.script}>
              <p className="mb-1 text-micro uppercase tracking-[0.12em] text-ink-faint">
                {group.script === 'en' ? tr.fontGroupEn : group.script === 'thai' ? tr.fontGroupTh : tr.fontGroupJp}
              </p>
              <div className="flex flex-wrap gap-1">
                {group.families.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => void handleGoogle(f)}
                    disabled={busy !== null}
                    className="min-h-[var(--control-sm)] rounded-full border border-line-strong bg-canvas px-2.5 text-micro text-ink-muted transition hover:bg-raised hover:text-ink disabled:opacity-40"
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <p className="text-micro leading-snug text-ink-faint">{tr.fontGoogleNote}</p>
        </div>
      )}
    </div>
  )
}
