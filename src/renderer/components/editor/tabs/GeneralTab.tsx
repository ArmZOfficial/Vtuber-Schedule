/**
 * แท็บทั่วไป — ยุบเหลือหน้าเดียวไม่มีหัวข้อย่อย (แผนข้อ 8.1)
 *
 * ทุกฟิลด์ที่นี่คือของที่กรอกครั้งเดียวแล้วแทบไม่กลับมาแก้ จึงไม่ต้องมีลำดับชั้น
 * ซ้อนอีกชั้น และรูปแบบวัน/เวลามีพรีวิวสดของจริง ไม่ใช่แค่ชื่อรูปแบบ
 */
import { useScheduleStore } from '../../../store/scheduleStore'
import { LANG_NAME } from '../../../data/labels'
import type { Lang, TimeFormat } from '../../../types'
import { formatTime, weekDays } from '../../../utils/date'
import { Field, SegmentedControl, SelectV2, TextInput } from '../ui'
import { useTranslation } from '../../../i18n/translations'

const ddmm = (d: Date) =>
  `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`

export function GeneralTab() {
  const meta = useScheduleStore((s) => s.meta)
  const setMeta = useScheduleStore((s) => s.setMeta)
  const uiLanguage = useScheduleStore((s) => s.uiLanguage)
  const tr = useTranslation(uiLanguage)
  const th = uiLanguage === 'th'

  const dates = weekDays(meta.startDate)
  const weekEnd = new Date(dates[0])
  weekEnd.setDate(weekEnd.getDate() + 7)

  return (
    <div className="space-y-4">
      <Field
        label={th ? 'ชื่อ VTuber' : 'VTuber name'}
        hint={th ? 'ใช้ตั้งชื่อไฟล์และฉบับร่าง' : 'Used to name files and drafts'}
      >
        <TextInput
          value={meta.channelName ?? ''}
          placeholder={th ? 'ชื่อช่องของคุณ' : 'Your channel name'}
          onChange={(e) => setMeta({ channelName: e.target.value })}
        />
      </Field>

      <Field
        label={th ? 'เครดิตศิลปิน' : 'Artist credit'}
        hint={th ? 'เว้นว่างเพื่อซ่อนบนการ์ด' : 'Leave empty to hide it on the card'}
      >
        <TextInput
          value={meta.artCredit ?? ''}
          placeholder="Art by: @username"
          onChange={(e) => setMeta({ artCredit: e.target.value })}
        />
      </Field>

      <Field
        label={th ? 'เครดิตผู้ออกแบบธีม' : 'Theme designer credit'}
        hint={th ? 'เว้นว่างเพื่อซ่อน' : 'Leave empty to hide'}
      >
        <TextInput
          value={meta.designCredit ?? ''}
          placeholder="schedule design by @you"
          onChange={(e) => setMeta({ designCredit: e.target.value })}
        />
      </Field>

      <Field label={tr.cardLanguageLabel} hint={tr.cardLanguageHint}>
        <SelectV2
          ariaLabel={tr.cardLanguageLabel}
          value={meta.language}
          onValueChange={(v) => setMeta({ language: v as Lang })}
          items={(Object.keys(LANG_NAME) as Lang[]).map((l) => ({
            value: l,
            label: `${LANG_NAME[l]} (${l.toUpperCase()})`,
          }))}
        />
      </Field>

      <Field label={tr.timeFormatLabel} hint={tr.timeFormatHint}>
        <SegmentedControl<TimeFormat>
          full
          value={meta.timeFormat ?? '24h'}
          onChange={(v) => setMeta({ timeFormat: v })}
          ariaLabel={tr.timeFormatLabel}
          options={[
            { value: '24h', label: tr.timeFormat24 },
            { value: '12h', label: tr.timeFormat12 },
          ]}
        />
      </Field>

      {/* พรีวิวสดของรูปแบบวัน/เวลา — เห็นผลจริงก่อนไปดูบนการ์ด (ข้อ 8.1.2) */}
      <div className="rounded-card border border-line bg-canvas px-3 py-2.5">
        <p className="mb-1 text-label font-medium text-ink-muted">{tr.datePreviewLabel}</p>
        <p className="font-mono text-body tabular-nums text-ink">
          WEEK OF {ddmm(dates[0])} / {ddmm(weekEnd)}
        </p>
        <p className="mt-0.5 font-mono text-label tabular-nums text-ink-faint">
          {formatTime('20:00', meta.timeFormat ?? '24h')} · {formatTime('09:30', meta.timeFormat ?? '24h')}
        </p>
      </div>

      <p className="text-label leading-relaxed text-ink-faint">{tr.cardLanguageNote}</p>
    </div>
  )
}
