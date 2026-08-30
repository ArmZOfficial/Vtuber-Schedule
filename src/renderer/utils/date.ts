import { MONTHS } from '../data/labels'
import type { Lang } from '../types'

/** normalize วันใดก็ได้ให้เป็นวันจันทร์ของสัปดาห์นั้น */
export function mondayOf(iso: string): Date {
  const d = new Date(iso + 'T00:00:00')
  const day = (d.getDay() + 6) % 7 // 0 = Monday
  d.setDate(d.getDate() - day)
  return d
}

/** คำนวณ Mon–Sun ทั้งสัปดาห์จากวันเริ่มต้น (auto-fill) */
export function weekDays(startDate: string): Date[] {
  const m = mondayOf(startDate)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(m)
    d.setDate(m.getDate() + i)
    return d
  })
}

export function monthLabel(d: Date, lang: Lang): string {
  return MONTHS[lang][d.getMonth()]
}

/** label ของการ์ดเดือน — รองรับสัปดาห์คาบเกี่ยวข้ามเดือน เช่น AUG–SEP */
export function monthRangeLabel(start: Date, end: Date, lang: Lang): string {
  const a = monthLabel(start, lang)
  const b = monthLabel(end, lang)
  return a === b ? a : `${a}–${b}`
}

export function yearLabel(d: Date, lang: Lang): string {
  const y = d.getFullYear()
  if (lang === 'th') return String(y + 543)
  return String(y)
}

export function weekRangeLabel(start: Date, end: Date): string {
  return `${start.getDate()}-${end.getDate()}`
}

export function dateNumber(d: Date): string {
  return String(d.getDate())
}

/** สำหรับแสดงใน editor: "อังคาร 18 ส.ค." */
export function dayHeaderTH(d: Date): string {
  const thDays = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์']
  const thMonths = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
  ]
  return `${thDays[(d.getDay() + 6) % 7]} ${d.getDate()} ${thMonths[d.getMonth()]}`
}

export function dayHeaderLocal(d: Date, lang: string): string {
  if (lang === 'th') return dayHeaderTH(d)
  const enDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const enMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${enDays[(d.getDay() + 6) % 7]}, ${enMonths[d.getMonth()]} ${d.getDate()}`
}

/**
 * แปลงเวลา 24 ชั่วโมง ("20:00" — รูปแบบที่เก็บใน state) ให้ตรงกับที่ผู้ใช้เลือกแสดง
 * 12h → "8:00 PM" (เที่ยงคืน = 12:00 AM, เที่ยงวัน = 12:00 PM)
 */
export function formatTime(hhmm: string, format: import('../types').TimeFormat = '24h'): string {
  const m = hhmm?.match(/^(\d{1,2}):(\d{2})$/)
  if (!m) return hhmm || '--:--'
  if (format === '24h') return `${m[1].padStart(2, '0')}:${m[2]}`
  const h = Number(m[1])
  const suffix = h < 12 ? 'AM' : 'PM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${m[2]} ${suffix}`
}
