import type { Lang } from '../types'

export const LANG_NAME: Record<Lang, string> = {
  th: 'ภาษาไทย',
  en: 'English',
  jp: '日本語',
}

/** ชื่อวันแบบสั้นสำหรับ canvas (index 0 = จันทร์) */
export const DAY_SHORT: Record<Lang, string[]> = {
  en: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
  th: ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา'],
  jp: ['月', '火', '水', '木', '金', '土', '日'],
}

/**
 * อักษรย่อหัวคอลัมน์ปฏิทินใน editor (index 0 = จันทร์)
 *
 * สั้นกว่า `DAY_SHORT` เพราะช่องปฏิทินกว้างราว 40px เท่านั้น "MON" จะชนกัน
 * และตามภาษา UI ไม่ใช่ภาษาการ์ด — นี่คือส่วนควบคุม ไม่ใช่สิ่งที่พิมพ์ลงการ์ด
 */
export const DOW_INITIAL: Record<'en' | 'th', string[]> = {
  en: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
  th: ['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'อา.'],
}

/**
 * ชื่อย่อวันสำหรับรายการ 7 วันใน editor (index 0 = จันทร์)
 *
 * ตัดชื่อเต็มด้วย `slice` ไม่ได้ — ไทยตัดกลางสระ/วรรณยุกต์ ทุกวันจะกลายเป็น "วั"
 * เหมือนกันหมด ไทยจึงเขียนย่อตามธรรมเนียม จ. อ. พ. พฤ. ศ. ส. อา. (เจ้าของงานสั่ง)
 */
export const DAY_ABBR: Record<'en' | 'th', string[]> = {
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  th: ['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'อา.'],
}

/** ชื่อวันแบบเต็มสำหรับ canvas (index 0 = จันทร์) — ใช้กับธีมที่โชว์ชื่อวันเต็ม */
export const DAY_FULL: Record<Lang, string[]> = {
  en: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
  th: ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'],
  jp: ['月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日', '日曜日'],
}

/** ชื่อวันเต็มสำหรับ editor (อังกฤษ) — ต่างจาก `DAY_FULL.en` ที่เป็นตัวพิมพ์ใหญ่ล้วนสำหรับวาดบนการ์ด */
export const DAY_FULL_EN = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]

/** ชื่อวันเต็มสำหรับ editor (ไทย) */
export const DAY_FULL_TH = [
  'วันจันทร์',
  'วันอังคาร',
  'วันพุธ',
  'วันพฤหัสบดี',
  'วันศุกร์',
  'วันเสาร์',
  'วันอาทิตย์',
]

export const MONTHS: Record<Lang, string[]> = {
  en: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'],
  th: ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'],
  jp: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
}

/** quick chips สำหรับ label ของวันหยุด (ไทยล้วนตามสเปคข้อ 5.2.4) */
export const OFF_LABEL_PRESETS = ['FREE', 'REST', 'DAY OFF', 'PREP', 'MEETING']
