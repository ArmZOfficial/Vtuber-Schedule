/**
 * โหมดแก้วัน — แผงข้าง ไม่ใช่ modal อีกต่อไป (แผน UX/UI ข้อ 7.6)
 *
 * นี่คือการเปลี่ยนที่คุ้มที่สุดในแผนทั้งฉบับ: ของเดิมเป็น `RDialog` เต็มจอที่บังการ์ด
 * ทั้งใบ ผู้ใช้พิมพ์ชื่อสตรีมโดยไม่เห็นว่ามันล้นกรอบไหม ต้องปิดกล่องถึงจะรู้
 * ตอนนี้แผงกินที่ของเนื้อหาแท็บแทน พรีวิวยังเห็นเต็ม ๆ และวันที่กำลังแก้ถูกไฮไลต์
 * บนการ์ดอยู่แล้ว (`DayRow` วาดกรอบจาก prop `selected`)
 *
 * เนื้อหาในฟอร์มเก็บไว้เกือบทั้งหมด แค่ย้ายที่อยู่ ตามข้อ 7.6.5
 */
import { useEffect, useRef } from 'react'
import { useScheduleStore, DEFAULT_OFF_NOTE } from '../../store/scheduleStore'
import { OFF_LABEL_PRESETS } from '../../data/labels'
import { PLATFORMS } from '../../data/platforms'
import { fileToDataURL } from '../../utils/image'
import { dayHeaderLocal } from '../../utils/date'
import type { DayData, PlatformId } from '../../types'
import { Badge, Btn, Chip, DropZone, Field, IconButton, SelectV2, TextInput, Toggle } from './ui'
import {
  ChevronLeft,
  ChevronRight,
  Moon,
  Plus,
  RotateCcw,
  Star,
  Trash2,
  Users,
  Video,
  X,
} from 'lucide-react'
import { useTranslation } from '../../i18n/translations'

function MiniPlatformIcon({ id, size = 16, customIcon }: { id: string; size?: number; customIcon?: string }) {
  if (id === 'custom' && customIcon) {
    return <img src={customIcon} alt="" width={size} height={size} className="shrink-0 rounded-[3px] object-contain" />
  }
  const p = PLATFORMS.find((pl) => pl.id === id)
  if (!p) return null
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="shrink-0 fill-current">
      <path d={p.path} />
    </svg>
  )
}

/* ═════════════ ฟอร์มแก้วัน ═════════════ */

function DayEditForm({ index }: { index: number }) {
  const day = useScheduleStore((s) => s.days[index])
  const setDayStatus = useScheduleStore((s) => s.setDayStatus)
  const setDayLabel = useScheduleStore((s) => s.setDayLabel)
  const setDayOffNote = useScheduleStore((s) => s.setDayOffNote)
  const addEvent = useScheduleStore((s) => s.addEvent)
  const updateEvent = useScheduleStore((s) => s.updateEvent)
  const removeEvent = useScheduleStore((s) => s.removeEvent)
  const uiLanguage = useScheduleStore((s) => s.uiLanguage)
  const tr = useTranslation(uiLanguage)
  const customOffPresets = useScheduleStore((s) => s.customOffPresets)
  const addCustomOffPreset = useScheduleStore((s) => s.addCustomOffPreset)
  const removeCustomOffPreset = useScheduleStore((s) => s.removeCustomOffPreset)

  if (!day) return null

  return (
    <div className="space-y-4">
      {/* ── สถานะวัน ── */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setDayStatus(index, 'stream')}
          className={`flex min-h-[var(--control-lg)] items-center justify-center gap-2 rounded-card border text-body font-medium transition ${
            day.status === 'stream'
              ? 'border-accent bg-accent-soft text-accent'
              : 'border-line-strong bg-canvas text-ink-muted hover:bg-raised'
          }`}
        >
          <Video size={15} aria-hidden /> {tr.hasStream}
        </button>
        <button
          type="button"
          onClick={() => {
            setDayStatus(index, 'off')
            if (!day.offNote) setDayOffNote(index, DEFAULT_OFF_NOTE)
            if (!day.statusLabel || day.statusLabel === 'STREAM') setDayLabel(index, 'OFFLINE')
          }}
          className={`flex min-h-[var(--control-lg)] items-center justify-center gap-2 rounded-card border text-body font-medium transition ${
            day.status === 'off'
              ? 'border-accent bg-accent-soft text-accent'
              : 'border-line-strong bg-canvas text-ink-muted hover:bg-raised'
          }`}
        >
          <Moon size={15} aria-hidden /> {tr.noStream}
        </button>
      </div>

      {/* ── วันหยุด ── */}
      {day.status === 'off' && (() => {
        const currentLabel = day.statusLabel.trim()
        const allPresets = [...OFF_LABEL_PRESETS, ...customOffPresets]
        const canSave = currentLabel.length > 0 && !allPresets.includes(currentLabel)

        return (
          <div className="space-y-3">
            <Field label={tr.offBadgeLabel} hint={tr.offBadgeHint}>
              <div className="flex gap-2">
                <TextInput
                  value={day.statusLabel}
                  placeholder="OFFLINE"
                  onChange={(e) => setDayLabel(index, e.target.value)}
                />
                <Btn
                  iconOnly
                  aria-label={tr.savePresetTooltip}
                  title={tr.savePresetTooltip}
                  disabled={!canSave}
                  onClick={() => addCustomOffPreset(currentLabel)}
                >
                  <Plus size={15} aria-hidden />
                </Btn>
              </div>
            </Field>
            <div className="flex flex-wrap gap-1.5">
              {OFF_LABEL_PRESETS.map((p) => (
                <Chip key={p} size="sm" active={day.statusLabel === p} onClick={() => setDayLabel(index, p)}>
                  {p}
                </Chip>
              ))}
              {customOffPresets.map((p) => (
                <span
                  key={p}
                  className={`flex min-h-[var(--control-sm)] items-center gap-1 rounded-full border pl-2.5 pr-1 text-micro font-medium transition ${
                    day.statusLabel === p
                      ? 'border-accent bg-accent-soft text-accent'
                      : 'border-line-strong bg-canvas text-ink-muted hover:bg-raised hover:text-ink'
                  }`}
                >
                  <button type="button" onClick={() => setDayLabel(index, p)} className="rounded-full outline-none">
                    {p}
                  </button>
                  <button
                    type="button"
                    aria-label={`${tr.deleteBtn} ${p}`}
                    className="flex h-4 w-4 items-center justify-center rounded-full text-ink-faint transition hover:text-danger"
                    onClick={() => removeCustomOffPreset(p)}
                  >
                    <X size={11} aria-hidden />
                  </button>
                </span>
              ))}
            </div>

            <Field label={tr.offNoteLabel} hint={tr.offNoteHint}>
              <TextInput
                value={day.offNote ?? ''}
                placeholder={DEFAULT_OFF_NOTE}
                onChange={(e) => setDayOffNote(index, e.target.value)}
              />
            </Field>
          </div>
        )
      })()}

      {/* ── วันที่มีสตรีม ── */}
      {day.status === 'stream' && (
        <div className="space-y-3">
          {day.events.map((ev, ei) => (
            <div key={ev.id} className="space-y-3 rounded-card border border-line-strong bg-canvas p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-micro font-bold uppercase tracking-wider text-ink-faint">
                  {tr.itemNumber} {ei + 1}
                </span>
                <div className="flex items-center gap-1.5">
                  {ev.highlight && (
                    <Badge tone="special" size="sm">
                      <Star size={9} aria-hidden /> {tr.specialActivity}
                    </Badge>
                  )}
                  <Btn
                    variant="danger"
                    size="sm"
                    iconOnly
                    aria-label={tr.deleteBtn}
                    title={tr.deleteBtn}
                    onClick={() => removeEvent(index, ev.id)}
                  >
                    <Trash2 size={13} aria-hidden />
                  </Btn>
                </div>
              </div>

              <Toggle
                checked={ev.highlight}
                onChange={(v) => updateEvent(index, ev.id, { highlight: v })}
                label={tr.specialEvent}
                icon={<Star size={14} />}
              />

              <Field label={tr.platformLabel}>
                <SelectV2
                  ariaLabel={tr.platformLabel}
                  value={ev.platform}
                  onValueChange={(v) => updateEvent(index, ev.id, { platform: v as PlatformId })}
                  items={PLATFORMS.map((p) => ({ value: p.id, label: p.name }))}
                />
              </Field>

              {ev.platform === 'custom' && (
                <div className="space-y-3 rounded-card border border-dashed border-line-strong bg-surface p-2.5">
                  <Field label={tr.customPlatformName} density="compact">
                    <TextInput
                      value={ev.customPlatform?.name ?? ''}
                      placeholder="Bilibili Live"
                      onChange={(e) =>
                        updateEvent(index, ev.id, {
                          customPlatform: { ...(ev.customPlatform ?? {}), name: e.target.value },
                        })
                      }
                    />
                  </Field>
                  <Field label={tr.customPlatformIcon} density="compact">
                    {ev.customPlatform?.icon ? (
                      <div className="flex items-center gap-2">
                        <MiniPlatformIcon id="custom" size={26} customIcon={ev.customPlatform.icon} />
                        <Btn
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            updateEvent(index, ev.id, {
                              customPlatform: { ...(ev.customPlatform ?? {}), icon: undefined },
                            })
                          }
                        >
                          <Trash2 size={12} aria-hidden /> {tr.deleteBtn}
                        </Btn>
                      </div>
                    ) : (
                      <DropZone
                        compact
                        title={tr.uploadIcon}
                        onFile={async (f) => {
                          const url = await fileToDataURL(f)
                          updateEvent(index, ev.id, {
                            customPlatform: { ...(ev.customPlatform ?? { name: '' }), icon: url },
                          })
                        }}
                      />
                    )}
                  </Field>
                </div>
              )}

              {/* เวลาเริ่มไลฟ์ — ตารางแสดงแค่เวลาเริ่ม ไม่มีเวลาจบ */}
              <Field label={tr.startTimeLabel}>
                <TextInput
                  type="time"
                  value={ev.time}
                  onChange={(e) => updateEvent(index, ev.id, { time: e.target.value })}
                />
              </Field>

              <Field label={tr.streamTitleLabel}>
                <TextInput
                  value={ev.title}
                  placeholder={tr.streamTitlePlaceholder}
                  onChange={(e) => updateEvent(index, ev.id, { title: e.target.value })}
                />
              </Field>

              {/* คอลแลบ — ชื่อที่ใส่ตรงนี้ไปต่อท้ายชื่อรายการบนตาราง */}
              <div className="space-y-2 rounded-card border border-line bg-surface p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-label font-semibold text-ink-muted">
                    <Users size={13} aria-hidden />
                    {tr.collabSectionTitle}
                  </span>
                  <Btn
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      updateEvent(index, ev.id, { collabMembers: [...(ev.collabMembers ?? []), { name: '' }] })
                    }
                  >
                    <Plus size={12} aria-hidden /> {tr.addCollabBtn}
                  </Btn>
                </div>
                <p className="text-micro leading-snug text-ink-faint">{tr.collabHint}</p>
                {ev.collabMembers && ev.collabMembers.length > 0 && (
                  <div className="space-y-1.5">
                    {ev.collabMembers.map((cm, cidx) => (
                      <div key={cidx} className="flex items-center gap-2">
                        <TextInput
                          size="sm"
                          value={cm.name}
                          placeholder={tr.collabNamePlaceholder}
                          onChange={(e) => {
                            const list = [...(ev.collabMembers ?? [])]
                            list[cidx] = { ...list[cidx], name: e.target.value }
                            updateEvent(index, ev.id, { collabMembers: list })
                          }}
                        />
                        <Btn
                          variant="danger"
                          size="sm"
                          iconOnly
                          aria-label={tr.deleteBtn}
                          onClick={() =>
                            updateEvent(index, ev.id, {
                              collabMembers: (ev.collabMembers ?? []).filter((_, i) => i !== cidx),
                            })
                          }
                        >
                          <Trash2 size={12} aria-hidden />
                        </Btn>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          <Btn className="w-full" disabled={day.events.length >= 2} onClick={() => addEvent(index)}>
            <Plus size={14} aria-hidden /> {tr.addItemBtn}
          </Btn>
        </div>
      )}
    </div>
  )
}

/* ═════════════ แผงข้าง ═════════════ */

export function DayEditPanel({ index }: { index: number }) {
  const selectDay = useScheduleStore((s) => s.selectDay)
  const replaceDay = useScheduleStore((s) => s.replaceDay)
  const startDate = useScheduleStore((s) => s.meta.startDate)
  const uiLanguage = useScheduleStore((s) => s.uiLanguage)
  const tr = useTranslation(uiLanguage)

  // สแนปช็อตตอนเปิด สำหรับปุ่มย้อนค่าที่เพิ่งแก้
  const snapshotRef = useRef<DayData | null>(null)
  useEffect(() => {
    const d = useScheduleStore.getState().days[index]
    snapshotRef.current = d ? JSON.parse(JSON.stringify(d)) : null
  }, [index])

  const monday = new Date(startDate + 'T00:00:00')
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
  const d = new Date(monday)
  d.setDate(monday.getDate() + index)

  const goto = (i: number) => selectDay((i + 7) % 7)

  // Ctrl+Enter = ยืนยันแล้วไปวันถัดไป (Esc จัดการที่ระดับแอป)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        selectDay((index + 1) % 7)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, selectDay])

  return (
    <div className="anim-slide-in flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-1 border-b border-line bg-surface px-2 py-2">
        <Btn variant="ghost" size="sm" onClick={() => selectDay(null)}>
          <ChevronLeft size={14} aria-hidden /> {tr.backToWeek}
        </Btn>
        <div className="flex-1" />
        <IconButton
          label={tr.prevDay}
          side="bottom"
          size="sm"
          onClick={() => goto(index - 1)}
          icon={<ChevronLeft size={15} />}
        />
        <IconButton
          label={tr.nextDay}
          side="bottom"
          size="sm"
          onClick={() => goto(index + 1)}
          icon={<ChevronRight size={15} />}
        />
      </div>

      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-line bg-surface px-4 py-2.5">
        <div className="min-w-0">
          <h2 className="truncate text-title font-semibold text-ink">{dayHeaderLocal(d, uiLanguage)}</h2>
          <p className="truncate text-label text-ink-faint">{tr.dayEditHint}</p>
        </div>
        <IconButton
          label={tr.themeResetBtn}
          side="left"
          size="sm"
          onClick={() => {
            if (snapshotRef.current) replaceDay(index, snapshotRef.current)
          }}
          icon={<RotateCcw size={14} />}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
        <DayEditForm index={index} />
      </div>

      <div className="flex shrink-0 items-center gap-2 border-t border-line bg-canvas px-4 py-2.5">
        <Btn variant="ghost" className="flex-1" onClick={() => selectDay(null)}>
          {tr.doneBtn}
        </Btn>
        <Btn variant="primary" className="flex-1" onClick={() => selectDay((index + 1) % 7)}>
          {tr.saveAndNextDay} <ChevronRight size={14} aria-hidden />
        </Btn>
      </div>
    </div>
  )
}
