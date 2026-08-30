/**
 * แท็บสัปดาห์ — ปฏิทินเลือกสัปดาห์ + รายการ 7 วันแบบแถวกะทัดรัด (แผนข้อ 8.2)
 *
 * ของเดิมเป็นการ์ดสูงที่มี SegmentedControl สถานะโชว์พร้อมกันทั้ง 7 แถว กินความสูง
 * จนต้องเลื่อนหาวันที่จะแก้ ตอนนี้แถวหนึ่งบรรทัดครึ่ง บอกครบว่า วัน · เวลา ·
 * แพลตฟอร์ม · ชื่อรายการ และการสลับสถานะย้ายเข้าไปอยู่ในโหมดแก้วันแทน (ข้อ 8.2.4)
 */
import { useScheduleStore } from '../../../store/scheduleStore'
import { DAY_ABBR } from '../../../data/labels'
import { getPlatform } from '../../../data/platforms'
import { weekDays, formatTime } from '../../../utils/date'
import { Badge, SectionTitle } from '../ui'
import { WeekPicker } from '../WeekPicker'
import { ChevronRight, Star } from 'lucide-react'
import { useTranslation } from '../../../i18n/translations'

function MiniPlatformIcon({ id, size = 12, customIcon }: { id: string; size?: number; customIcon?: string }) {
  if (id === 'custom' && customIcon) {
    return <img src={customIcon} alt="" width={size} height={size} className="shrink-0 rounded-[3px] object-contain" />
  }
  const p = getPlatform(id as never)
  if (!p) return null
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="shrink-0 fill-current" aria-hidden>
      <path d={p.path} />
    </svg>
  )
}

export function ScheduleTab() {
  const days = useScheduleStore((s) => s.days)
  const selectedDay = useScheduleStore((s) => s.selectedDay)
  const selectDay = useScheduleStore((s) => s.selectDay)
  const meta = useScheduleStore((s) => s.meta)
  const uiLanguage = useScheduleStore((s) => s.uiLanguage)
  const dates = weekDays(meta.startDate)
  const tr = useTranslation(uiLanguage)

  const dayAbbr = DAY_ABBR[uiLanguage]

  return (
    <div className="space-y-5">
      <section>
        <SectionTitle>{tr.weekSection}</SectionTitle>
        <WeekPicker />
      </section>

      <section>
        <SectionTitle right={<span className="text-micro text-ink-faint">{tr.selectDayHint}</span>}>
          {tr.fullWeekSection}
        </SectionTitle>
        <div className="space-y-1">
          {days.map((d, i) => {
            const date = dates[i]
            const hasHighlight = d.events.some((e) => e.highlight)
            const active = selectedDay === i
            const first = d.events[0]

            return (
              <button
                key={i}
                type="button"
                onClick={() => selectDay(i)}
                aria-current={active ? 'true' : undefined}
                className={`group flex w-full items-center gap-2.5 rounded-card border px-2.5 py-2 text-left transition ${
                  active
                    ? 'border-accent bg-accent-soft'
                    : 'border-line-strong bg-canvas hover:bg-raised'
                }`}
              >
                <span className="flex w-11 shrink-0 flex-col items-center">
                  <span className={`text-body font-semibold ${active ? 'text-accent' : 'text-ink'}`}>
                    {dayAbbr[i]}
                  </span>
                  <span className="font-mono text-micro tabular-nums text-ink-faint">{date.getDate()}</span>
                </span>

                <span className="min-w-0 flex-1">
                  {d.status === 'stream' && first ? (
                    <>
                      <span className="flex items-center gap-1.5 text-label text-ink-muted">
                        <span className="font-mono tabular-nums">
                          {first.time ? formatTime(first.time, meta.timeFormat) : '—'}
                        </span>
                        <MiniPlatformIcon id={first.platform} customIcon={first.customPlatform?.icon} />
                        {d.events.length > 1 && (
                          <span className="text-ink-faint">
                            +{d.events.length - 1} {tr.itemCount}
                          </span>
                        )}
                      </span>
                      <span className="block truncate text-body text-ink">{first.title}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-label text-ink-faint">{d.statusLabel || tr.dayOff}</span>
                      <span className="block truncate text-body text-ink-muted">{d.offNote}</span>
                    </>
                  )}
                </span>

                <span className="flex shrink-0 items-center gap-1">
                  {hasHighlight && (
                    <Badge tone="special" size="sm">
                      <Star size={9} aria-hidden />
                    </Badge>
                  )}
                  {d.status !== 'stream' && (
                    <Badge tone="neutral" size="sm">
                      {tr.dayOff}
                    </Badge>
                  )}
                  <ChevronRight
                    size={14}
                    aria-hidden
                    className={active ? 'text-accent' : 'text-ink-faint group-hover:text-ink-muted'}
                  />
                </span>
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}
