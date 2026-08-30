export interface ResolutionPreset {
  id: string
  name: string
  w: number
  h: number
  /** ป้ายสัดส่วนภาพ (ไม่ผูกภาษา UI) */
  hint: string
  /** คำอธิบายสั้น ๆ แยกตามภาษา UI */
  hintLocal: { en: string; th: string }
}

/**
 * ทุกขนาดที่ส่งออกได้เป็น 16:9 ทั้งหมด — ผืนงานถูกออกแบบมาบน 16:9
 * สัดส่วนอื่นทำให้องค์ประกอบยืด/ล้นกรอบ จึงไม่เปิดให้เลือก
 */
export const EXPORT_ASPECT = 16 / 9

/**
 * มีสามขนาดพอ
 *
 * ผืนงานจริงคือ 4001x2251 ซึ่งใหญ่เกินความจำเป็นสำหรับโพสต์ทุกแพลตฟอร์ม —
 * ไฟล์หนัก จับภาพช้า และเครื่องที่แรม/GPU น้อยสะดุดตอน export ส่วนขนาดกำหนดเอง
 * เปิดช่องให้หลุดสัดส่วนโดยไม่ตั้งใจ ทั้งสองอย่างจึงถูกถอดออก 2K คือค่าเริ่มต้น
 * เพราะยังคมกว่าจอส่วนใหญ่และเบากว่าผืนงานเต็มราวสี่เท่า
 */
export const RESOLUTION_PRESETS: ResolutionPreset[] = [
  {
    id: 'qhd-2560',
    name: '2K',
    w: 2560,
    h: 1440,
    hint: '16:9',
    hintLocal: { en: 'sharpest — best for archiving', th: 'คมที่สุด — เหมาะกับเก็บไฟล์ต้นฉบับ' },
  },
  {
    id: 'fhd-1920',
    name: '1080p',
    w: 1920,
    h: 1080,
    hint: '16:9',
    hintLocal: { en: 'standard for posting', th: 'มาตรฐานสำหรับโพสต์' },
  },
  {
    id: 'hd-1600',
    name: '1600x900',
    w: 1600,
    h: 900,
    hint: '16:9',
    hintLocal: { en: 'lightest file', th: 'ไฟล์เล็กที่สุด' },
  },
]

export const DEFAULT_PRESET_ID = RESOLUTION_PRESETS[0].id

/** draft เก่าอาจเก็บ preset ที่ถูกถอดออกไปแล้ว (template-native / custom) — ดึงกลับมาเป็นค่าที่ยังมีอยู่ */
export function normalizePresetId(id: string): string {
  return RESOLUTION_PRESETS.some((p) => p.id === id) ? id : DEFAULT_PRESET_ID
}

export function exportDims(presetId: string) {
  const p = RESOLUTION_PRESETS.find((x) => x.id === presetId) ?? RESOLUTION_PRESETS[0]
  return { W: p.w, H: p.h }
}
