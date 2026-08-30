export type Lang = 'th' | 'en' | 'jp'

export type PlatformId =
  | 'youtube'
  | 'twitch'
  | 'tiktok'
  | 'bilibili'
  | 'niconico'
  | 'kick'
  | 'discord'
  | 'x-space'
  | 'bigo'
  | 'custom'

export type DayStatus = 'stream' | 'off'

export type TimeFormat = '24h' | '12h'

// ─── Core Data Types ──────────────────────────────────────────────────────────

/** แพลตฟอร์มที่ผู้ใช้เพิ่มเอง (ใช้เมื่อ platform === 'custom') */
export interface CustomPlatform {
  name?: string
  /** dataURL ของไอคอนที่อัปโหลด */
  icon?: string
}

export interface EventItem {
  id: string
  platform: PlatformId
  title: string
  /** "20:30" — เวลาเริ่มไลฟ์ อย่างเดียว (ไม่มีเวลาสิ้นสุด/ระยะเวลาแล้ว) */
  time: string
  /** ชื่อ+ไอคอนแพลตฟอร์มที่ผู้ใช้ตั้งเอง (platform === 'custom') */
  customPlatform?: CustomPlatform
  highlight: boolean
  collabMembers?: CollabMember[]
}

export interface CollabMember {
  name: string
  avatarUrl?: string
}

export interface DayData {
  status: DayStatus
  /** ข้อความแสดงเมื่อไม่มีสตรีม เช่น WORKING / REST / ลาพัก (ป้ายสถานะ) */
  statusLabel: string
  /** ข้อความบรรทัดรองของวันหยุด เช่น "Day off, sorry!" */
  offNote?: string
  events: EventItem[]
  collabMembers?: CollabMember[]
}

export interface AnimSettings {
  enabled: boolean
  sparkle: boolean
  moon: boolean
  glow: boolean
  durationMs: number
}

export interface ExportSettings {
  /** ต้องเป็น id ของ RESOLUTION_PRESETS — ค่าอื่นถูกดึงกลับโดย normalizePresetId */
  presetId: string
  /** เลิกใช้แล้ว: เหลือไว้ให้ draft เก่าอ่านได้โดยไม่ error */
  customW?: number
  customH?: number
}

export interface ScheduleMeta {
  channelName: string
  watermark: string
  /** วันจันทร์ของสัปดาห์นั้น (หรือวันใดก็ได้ ระบบ normalize) — ISO yyyy-mm-dd */
  startDate: string
  language: Lang
  /** รูปแบบเวลา — 24 ชั่วโมง ("20:00") หรือ 12 ชั่วโมง ("8:00 PM") */
  timeFormat?: TimeFormat
  /** template pack ที่ใช้วาด (ดู src/renderer/template) */
  templateId?: string
  /** เครดิตศิลปิน */
  artCredit?: string
  /** เครดิตผู้ออกแบบธีม */
  designCredit?: string
}

/** ตำแหน่ง/ซูมภาพตัวละครในกรอบ — offset เป็นเศษส่วนของขนาดกรอบ (-0.5..0.5) */
export interface ArtTransform {
  scale: number
  offsetX: number
  offsetY: number
  /**
   * องศาการหมุน หมุนรอบจุดกึ่งกลางช่องภาพ ค่าบวก = ตามเข็มนาฬิกา
   *
   * เป็น optional เพราะ draft ที่บันทึกไว้ก่อนหน้านี้ไม่มีฟิลด์นี้ — ไม่มี = 0
   * ต้องอ่านด้วย `?? 0` เสมอ ห้ามสมมติว่ามีค่า
   */
  rotation?: number
  /** กลับภาพซ้าย–ขวา (กระจกเงา) */
  flipX?: boolean
  /** กลับภาพบน–ล่าง */
  flipY?: boolean
}

export const DEFAULT_ART_TRANSFORM: ArtTransform = {
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  rotation: 0,
  flipX: false,
  flipY: false,
}

/** ส่วนที่ serialize ลง draft ได้ทั้งหมด */
export interface ScheduleData {
  meta: ScheduleMeta
  /** ตารางของสัปดาห์อื่นที่เคยแก้ไว้ — key = ISO ของวันจันทร์ */
  weekArchive: Record<string, DayData[]>
  characterArt?: string
  characterArtTransform?: ArtTransform
  channelLogo?: string
  days: DayData[]
  animation: AnimSettings
  exportSettings: ExportSettings
}

export interface DraftEntry {
  id: string
  name: string
  savedAt: number
  state: ScheduleData
  /** ภาพย่อของการ์ดตอนบันทึก — รายการข้อความล้วนจำไม่ได้ว่าอันไหนคืออันไหน (แผนข้อ 8.6.1) */
  thumb?: string
}
