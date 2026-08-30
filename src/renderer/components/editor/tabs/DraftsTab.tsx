/**
 * แท็บฉบับร่าง (แผนข้อ 8.6)
 *
 *  · รายการมีภาพย่อของการ์ดจริงตอนบันทึก — ข้อความล้วนจำไม่ได้ว่าอันไหนคืออันไหน
 *  · มีช่องค้นหาและตัวเรียง (แก้ล่าสุด / ชื่อ)
 *  · ลบต้องกดยืนยันอีกครั้ง ไม่ใช่กดแล้วหายเลย
 *  · ไม่มี `!px-2 !py-1 !text-xs` เหลืออยู่แล้ว — ใช้ `size="sm"` ของ `Btn` แทน
 */
import { useEffect, useMemo, useState } from 'react'
import { get, set } from 'idb-keyval'
import type Konva from 'konva'
import { useScheduleStore, snapshot, uid } from '../../../store/scheduleStore'
import { weekDays, monthRangeLabel, weekRangeLabel, yearLabel } from '../../../utils/date'
import { capturePNG } from '../../../export/exporter'
import type { DraftEntry } from '../../../types'
import { Btn, ConfirmButton, EmptyState, Field, SectionTitle, SegmentedControl, TextInput } from '../ui'
import { toast } from '../toast'
import { Copy, FileText, Pencil, Save, Search, Trash2, Upload } from 'lucide-react'
import { useTranslation } from '../../../i18n/translations'

const MAX_DRAFTS = 30
/** ความกว้างของภาพย่อที่เก็บลง draft — พอให้จำได้ ไม่ถ่วงไฟล์ */
const THUMB_W = 260

type SortBy = 'recent' | 'name'

function useDraftName() {
  const meta = useScheduleStore((s) => s.meta)
  const dates = weekDays(meta.startDate)
  return `${meta.channelName || 'schedule'} • ${monthRangeLabel(dates[0], dates[6], meta.language)} ${weekRangeLabel(dates[0], dates[6])} ${yearLabel(dates[0], meta.language)}`
}

async function loadList(): Promise<DraftEntry[]> {
  if (window.api?.store) return (await window.api.store.get('vsg:drafts')) ?? []
  return (await get<DraftEntry[]>('vsg:drafts')) ?? []
}

export function DraftsTab({ stageRef }: { stageRef?: React.RefObject<Konva.Stage | null> }) {
  const draftName = useDraftName()
  const lastAutosave = useScheduleStore((s) => s.lastAutosave)
  const uiLanguage = useScheduleStore((s) => s.uiLanguage)
  const tr = useTranslation(uiLanguage)
  const locale = uiLanguage === 'th' ? 'th-TH' : 'en-US'

  const [drafts, setDrafts] = useState<DraftEntry[] | null>(null)
  const [customName, setCustomName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortBy>('recent')

  useEffect(() => {
    void loadList().then(setDrafts)
  }, [])

  const persist = async (list: DraftEntry[]) => {
    setDrafts(list)
    if (window.api?.store) await window.api.store.set('vsg:drafts', list)
    else await set('vsg:drafts', list)
  }

  /** ภาพย่อจากการ์ดที่กำลังแสดงอยู่ — ล้มเหลวก็บันทึกต่อได้ ไม่ใช่ของบังคับ */
  const grabThumb = async (): Promise<string | undefined> => {
    const stage = stageRef?.current
    if (!stage) return undefined
    try {
      return await capturePNG(stage, { pixelRatio: THUMB_W / (stage.width() || THUMB_W) })
    } catch {
      return undefined
    }
  }

  const saveDraft = async () => {
    const name = customName.trim() || draftName
    const thumb = await grabThumb()
    const list = [
      { id: uid(), name, savedAt: Date.now(), state: snapshot(useScheduleStore.getState()), thumb },
      ...(drafts ?? []),
    ].slice(0, MAX_DRAFTS)
    await persist(list)
    setCustomName('')
    toast(uiLanguage === 'th' ? 'บันทึกฉบับร่างแล้ว' : 'Draft saved')
  }

  const renameDraft = async (id: string) => {
    if (!editName.trim()) return
    await persist((drafts ?? []).map((d) => (d.id === id ? { ...d, name: editName.trim() } : d)))
    setEditingId(null)
    toast(uiLanguage === 'th' ? 'เปลี่ยนชื่อฉบับร่างแล้ว' : 'Draft renamed')
  }

  const duplicateDraft = async (d: DraftEntry) => {
    const list = [
      {
        ...d,
        id: uid(),
        name: `${d.name} (${uiLanguage === 'th' ? 'สำเนา' : 'copy'})`,
        savedAt: Date.now(),
      },
      ...(drafts ?? []),
    ].slice(0, MAX_DRAFTS)
    await persist(list)
    toast(uiLanguage === 'th' ? 'ทำสำเนาฉบับร่างแล้ว' : 'Draft duplicated')
  }

  const loadDraft = (d: DraftEntry) => {
    useScheduleStore.getState().hydrate(d.state)
    toast(uiLanguage === 'th' ? 'โหลดฉบับร่างแล้ว' : 'Draft loaded')
  }

  const deleteDraft = async (id: string) => {
    await persist((drafts ?? []).filter((x) => x.id !== id))
    toast(uiLanguage === 'th' ? 'ลบฉบับร่างแล้ว' : 'Draft deleted')
  }

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = (drafts ?? []).filter((d) => !q || d.name.toLowerCase().includes(q))
    return sortBy === 'name'
      ? [...list].sort((a, b) => a.name.localeCompare(b.name, locale))
      : [...list].sort((a, b) => b.savedAt - a.savedAt)
  }, [drafts, query, sortBy, locale])

  return (
    <div className="space-y-5">
      <section className="space-y-3">
        <Field label={tr.draftNameLabel} hint={tr.autosaveNote}>
          <TextInput
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder={draftName}
          />
        </Field>
        <Btn variant="primary" className="w-full" onClick={() => void saveDraft()}>
          <Save size={14} aria-hidden /> {tr.saveDraftBtn}
        </Btn>
        {lastAutosave && (
          <p className="text-label text-ink-faint">
            {tr.savedAt} {new Date(lastAutosave).toLocaleTimeString(locale)}
          </p>
        )}
      </section>

      <section>
        <SectionTitle
          right={
            drafts && drafts.length > 0 ? (
              <span className="text-micro text-ink-faint">
                {tr.draftsCount.replace('{n}', String(drafts.length))}
              </span>
            ) : undefined
          }
        >
          {tr.draftListSection}
        </SectionTitle>

        {drafts === null && <p className="text-label text-ink-faint">{tr.loading}</p>}

        {drafts?.length === 0 && (
          <EmptyState
            icon={<FileText size={20} />}
            title={tr.noDraftsTitle}
            message={tr.noDraftsMsg}
            action={
              <Btn variant="primary" size="sm" onClick={() => void saveDraft()}>
                <Save size={13} aria-hidden /> {tr.saveFirstDraftBtn}
              </Btn>
            }
          />
        )}

        {drafts && drafts.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-btn border border-line-strong bg-canvas px-2">
                <Search size={13} className="shrink-0 text-ink-faint" aria-hidden />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={tr.draftSearchPlaceholder}
                  aria-label={tr.draftSearchPlaceholder}
                  className="h-[var(--control-md)] w-full min-w-0 bg-transparent text-body text-ink outline-none placeholder:text-ink-disabled"
                />
              </div>
              <SegmentedControl<SortBy>
                size="sm"
                value={sortBy}
                onChange={setSortBy}
                ariaLabel={tr.sortRecent}
                options={[
                  { value: 'recent', label: tr.sortRecent },
                  { value: 'name', label: tr.sortName },
                ]}
              />
            </div>

            {shown.length === 0 && <p className="py-4 text-center text-label text-ink-faint">{tr.searchEmpty}</p>}

            {shown.map((d) => (
              <div key={d.id} className="overflow-hidden rounded-card border border-line-strong bg-canvas">
                <div className="flex items-center gap-2.5 p-2">
                  <span className="stage-checker relative h-11 w-[74px] shrink-0 overflow-hidden rounded-btn border border-line">
                    {d.thumb ? (
                      <img src={d.thumb} alt="" className="absolute inset-0 h-full w-full object-cover" />
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center text-ink-disabled">
                        <FileText size={16} aria-hidden />
                      </span>
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    {editingId === d.id ? (
                      <div className="flex items-center gap-1">
                        <TextInput
                          size="sm"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') void renameDraft(d.id)
                            if (e.key === 'Escape') setEditingId(null)
                          }}
                          autoFocus
                        />
                        <Btn size="sm" onClick={() => void renameDraft(d.id)}>
                          {tr.doneBtn}
                        </Btn>
                      </div>
                    ) : (
                      <>
                        <div className="truncate text-body font-medium text-ink">{d.name}</div>
                        <div className="font-mono text-micro text-ink-faint">
                          {new Date(d.savedAt).toLocaleString(locale)}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 border-t border-line px-2 py-1.5">
                  <Btn variant="primary" size="sm" className="flex-1" onClick={() => loadDraft(d)}>
                    <Upload size={12} aria-hidden /> {tr.loadBtn}
                  </Btn>
                  <Btn
                    variant="ghost"
                    size="sm"
                    iconOnly
                    aria-label={tr.renameBtn}
                    title={tr.renameBtn}
                    onClick={() => {
                      setEditingId(d.id)
                      setEditName(d.name)
                    }}
                  >
                    <Pencil size={12} aria-hidden />
                  </Btn>
                  <Btn
                    variant="ghost"
                    size="sm"
                    iconOnly
                    aria-label={tr.duplicateBtn}
                    title={tr.duplicateBtn}
                    onClick={() => void duplicateDraft(d)}
                  >
                    <Copy size={12} aria-hidden />
                  </Btn>
                  <ConfirmButton
                    label={tr.deleteBtn}
                    confirmLabel={tr.confirmDeleteBtn}
                    icon={<Trash2 size={12} aria-hidden />}
                    onConfirm={() => void deleteDraft(d.id)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
