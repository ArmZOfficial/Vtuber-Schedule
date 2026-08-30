/**
 * ปฏิทินเลือกช่วงสัปดาห์ — คลิกวันไหนก็ได้ ระบบเลือกทั้งสัปดาห์ (จันทร์–อาทิตย์) ให้
 *
 * ปุ่มลัด "สัปดาห์นี้ / สัปดาห์หน้า" กดครั้งเดียวจบ ตรงกับเป้าหมาย "เปิดแอปถึง
 * export ครั้งแรก ≤ 5 คลิก" (แผนข้อ 8.2.1)
 *
 * ── ทุกข้อความที่นี่ตามภาษา UI ไม่ใช่ภาษาการ์ด ──
 * เดิมชื่อเดือนอ่านจาก `meta.language` ซึ่งเป็นภาษาที่จะ "พิมพ์ลงการ์ด" ผลคือตั้ง UI
 * เป็นอังกฤษแต่ปฏิทินขึ้น "ส.ค. 2026" ปนอยู่กลางเมนูอังกฤษ ปฏิทินเป็นส่วนควบคุม
 * ไม่ใช่สิ่งที่ถูกพิมพ์ลงการ์ด จึงต้องตามภาษา UI
 *
 * ปุ่ม "คัดลอกจากสัปดาห์ก่อน" ถูกถอดออกตามคำสั่งเจ้าของงาน (26 ส.ค. 2026)
 * — action `duplicateLastWeek` ใน store ยังอยู่ ไม่ได้ลบ เผื่อเรียกใช้ที่อื่น
 */
import { useState } from 'react'
import { useScheduleStore, toISO } from '../../store/scheduleStore'
import { mondayOf } from '../../utils/date'
import { DOW_INITIAL, MONTHS } from '../../data/labels'
import { Btn, IconButton } from './ui'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from '../../i18n/translations'

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export function WeekPicker() {
  const startDate = useScheduleStore((s) => s.meta.startDate)
  const setWeekStart = useScheduleStore((s) => s.setWeekStart)
  const shiftWeek = useScheduleStore((s) => s.shiftWeek)
  const uiLanguage = useScheduleStore((s) => s.uiLanguage)
  const tr = useTranslation(uiLanguage)
  const months = MONTHS[uiLanguage]
  const dow = DOW_INITIAL[uiLanguage]

  const selectedMonday = mondayOf(startDate)
  const selectedSunday = new Date(selectedMonday)
  selectedSunday.setDate(selectedMonday.getDate() + 6)

  // เดือนที่ปฏิทินกำลังแสดง (เลื่อนดูเดือนอื่นได้โดยไม่ต้องเปลี่ยนสัปดาห์ที่เลือก)
  const [view, setView] = useState(() => new Date(selectedMonday.getFullYear(), selectedMonday.getMonth(), 1))

  // ตาราง 6 สัปดาห์ เริ่มจากวันจันทร์ของสัปดาห์ที่มีวันที่ 1 ของเดือนนั้น
  const gridStart = mondayOf(toISO(new Date(view.getFullYear(), view.getMonth(), 1)))
  const cells = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart)
    d.setDate(gridStart.getDate() + i)
    return d
  })

  const monthName = months[view.getMonth()]
  const rangeLabel = `${selectedMonday.getDate()} ${months[selectedMonday.getMonth()]} – ${selectedSunday.getDate()} ${
    months[selectedSunday.getMonth()]
  } ${selectedMonday.getFullYear()}`

  const shiftView = (months: number) => setView(new Date(view.getFullYear(), view.getMonth() + months, 1))

  const jumpTo = (d: Date) => {
    setWeekStart(toISO(d))
    setView(new Date(d.getFullYear(), d.getMonth(), 1))
  }

  return (
    <div className="space-y-2.5 rounded-card border border-line bg-canvas p-2.5">
      {/* แถบสัปดาห์ที่เลือก */}
      <div className="flex items-center justify-between gap-2">
        <IconButton
          label={tr.prevWeek}
          side="bottom"
          size="sm"
          onClick={() => shiftWeek(-1)}
          icon={<ChevronLeft size={15} />}
        />
        <div className="min-w-0 flex-1 text-center">
          <div className="text-micro font-semibold uppercase tracking-wider text-ink-faint">{tr.weekOfLabel}</div>
          <div className="truncate text-body font-semibold text-ink">{rangeLabel}</div>
        </div>
        <IconButton
          label={tr.nextWeek}
          side="bottom"
          size="sm"
          onClick={() => shiftWeek(1)}
          icon={<ChevronRight size={15} />}
        />
      </div>

      {/* ปฏิทิน */}
      <div className="rounded-card border border-line bg-surface p-2">
        <div className="mb-1.5 flex items-center justify-between">
          <IconButton
            label={tr.prevWeek}
            side="bottom"
            size="sm"
            onClick={() => shiftView(-1)}
            icon={<ChevronLeft size={14} />}
          />
          <span className="text-label font-semibold text-ink">
            {monthName} {view.getFullYear()}
          </span>
          <IconButton
            label={tr.nextWeek}
            side="bottom"
            size="sm"
            onClick={() => shiftView(1)}
            icon={<ChevronRight size={14} />}
          />
        </div>

        <div className="grid grid-cols-7 gap-0.5">
          {dow.map((d, i) => (
            <div key={i} className="py-0.5 text-center text-micro font-semibold uppercase text-ink-faint">
              {d}
            </div>
          ))}
          {cells.map((d, i) => {
            const inWeek = d >= selectedMonday && d <= selectedSunday
            const outMonth = d.getMonth() !== view.getMonth()
            const isToday = sameDay(d, new Date())
            const first = inWeek && d.getDay() === 1
            const last = inWeek && d.getDay() === 0
            return (
              <button
                key={i}
                type="button"
                onClick={() => setWeekStart(toISO(d))}
                className={`relative flex min-h-[32px] items-center justify-center text-center text-micro tabular-nums transition ${
                  inWeek
                    ? `bg-accent-soft font-semibold text-accent ${first ? 'rounded-l-full' : ''} ${last ? 'rounded-r-full' : ''}`
                    : `rounded-btn ${outMonth ? 'text-ink-disabled' : 'text-ink-muted'} hover:bg-raised`
                }`}
              >
                {d.getDate()}
                {isToday && <span className="absolute inset-x-0 bottom-0.5 mx-auto h-1 w-1 rounded-full bg-accent" />}
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        <Btn size="sm" onClick={() => jumpTo(new Date())}>
          <CalendarDays size={13} aria-hidden /> {tr.thisWeek}
        </Btn>
        <Btn
          size="sm"
          onClick={() => {
            const d = new Date()
            d.setDate(d.getDate() + 7)
            jumpTo(d)
          }}
        >
          <CalendarDays size={13} aria-hidden /> {tr.nextWeekBtn}
        </Btn>
      </div>
    </div>
  )
}
