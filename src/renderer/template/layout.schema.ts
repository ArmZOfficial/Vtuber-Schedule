/**
 * Shape of a template pack.
 *
 * A pack is one PSD turned into JSON by `scripts/build-layout.mjs` — no positions
 * live in component code, so a future PSD only needs a second .json file here and
 * an entry in TEMPLATES, not a renderer rewrite.
 *
 * ── ชิ้นส่วนบังคับ กับ ชิ้นส่วนที่มีก็ได้ ไม่มีก็ได้ (แผน UX/UI ข้อ 4.3) ──
 *
 * เดิม schema บังคับให้ทุกเทมเพลตมีดอกไม้หัวการ์ด ริบบิ้น จุด และขีด ครบชุด ซึ่งเป็น
 * ชิ้นส่วนเฉพาะของ Sakura Diary เทมเพลตแนวตั๋วหรือลิสต์มินิมอลไม่มีของพวกนี้ และจะต้อง
 * ใส่รูปโปร่งใส 1×1 px หลอกไปเรื่อย ๆ ตอนนี้ชิ้นส่วนที่ไม่ใช่แกนกลางเป็น optional และ
 * ตัวเรนเดอร์ข้ามการวาดสิ่งที่เทมเพลตไม่ประกาศ
 *
 * แกนกลางที่ทุกเทมเพลตต้องมี: `canvas`, `palette`, `rowTops`,
 * `images.background`, `row.dayName`, `row.time`, `row.subtitle`
 */
import defaultLayout from './layout.default.json'

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export interface ImageRect extends Rect {
  /** path under public/, relative so it also resolves from file:// in Electron */
  src: string
}

export interface TextRect extends Rect {
  size: number
}

/** every colour the template draws text with — hue-rotated together with the art */
export interface TemplatePalette {
  dayOnline: string
  dayOffline: string
  time: string
  subtitle: string
  offlineText: string
  weekOfText: string
  titleTop: string
  titleBottom: string
  artCredit: string
}

/** one day row, expressed relative to that row's top edge */
export interface RowTemplate {
  dayName: { x: number; dy: number; size: number; upper: boolean }
  /** จุดนำหน้าแถว — เทมเพลตแนวมินิมอลไม่มี */
  bullet?: { dy: number; w: number; h: number; gap: number; src: string }
  /** เส้นประคั่นระหว่างชื่อวันกับเวลา — ไม่มีก็ได้ */
  dash?: { dy: number; h: number; gap: number; right: number; src: string }
  time: { dy: number; right: number; size: number }
  subtitle: { x: number; dy: number; size: number }
  /** ริบบิ้นท้ายแถวของวันหยุด — ไม่มีก็วางป้ายไว้ที่ตำแหน่งเวลาแทน */
  ribbon?: { x: number; dy: number; w: number; h: number; src: string }
  offlineText?: { x: number; dy: number; w: number; size: number; upper: boolean }
}

/**
 * ตัวปรับที่แท็บ Template ควรโชว์สำหรับเทมเพลตนี้
 * ไม่ประกาศ = โชว์ทุกอย่าง (เข้ากันได้กับเทมเพลตเดิม 100%)
 */
export type TemplateControl = 'tone' | 'artColors' | 'textColors' | 'fonts'

/** สไตล์ของเทมเพลต ใช้เป็นตัวกรองในแกลเลอรี (ข้อ 4.2.4) */
export type TemplateStyle = 'notebook' | 'ribbon' | 'ticket' | 'sticker' | 'minimal' | 'fullbleed'

export interface TemplateLayout {
  id: string
  name: string
  source: string
  /** ป้ายสไตล์สำหรับตัวกรองในแกลเลอรี */
  style?: TemplateStyle
  /** ภาพย่อที่สร้างไว้ล่วงหน้า เช่น `templates/sakura/thumb.webp` (relative ใต้ public/) */
  thumb?: string
  canvas: { w: number; h: number }
  palette: TemplatePalette
  images: {
    background: ImageRect
    panel?: ImageRect
    frame?: ImageRect
    placeholder?: ImageRect
    titleFlowers?: ImageRect
    weekRibbon?: ImageRect
    designCredit?: ImageRect
  }
  /** the top line is tilted; x/y anchor the cap-top of its left edge before rotation */
  title: { top: TextRect & { rotation: number }; bottom: TextRect }
  weekOf: { label: TextRect; dates: TextRect }
  /** anchored at the PSD text origin: x is the centre, baseline is the y */
  artCredit: { x: number; baseline: number; size: number; rotation: number }
  rowTops: number[]
  row: RowTemplate
  controls?: TemplateControl[]
  /**
   * โทนสีที่เทมเพลตนี้แนะนำ อ้างด้วย `id` ของ `THEME_PRESETS` (แผนข้อ 4.4 ทางเลือกที่ 3)
   *
   * เทมเพลตโทนเข้มเจอ Butter แล้วออกมาไม่สวย การปล่อยให้เลือกได้ทั้ง 6 โทนทุกใบจึงแปลว่า
   * มีคู่ที่คุมคุณภาพไม่ได้อยู่จำนวนหนึ่ง ฟิลด์นี้ให้แต่ละเทมเพลตเลือกโทนที่ตัวเองรับได้
   * แล้ว UI ยังมีปุ่ม "โทนสีทั้งหมด" ให้คนที่อยากลองเองกดข้ามได้ — คุมคุณภาพเป็นค่าเริ่มต้น
   * แต่ไม่ปิดกั้น
   *
   * ไม่ประกาศ = รับได้ทุกโทน (เข้ากันได้กับเทมเพลตเดิม 100%)
   */
  tones?: string[]
}

export const TEMPLATES: TemplateLayout[] = [defaultLayout as TemplateLayout]

export const DEFAULT_TEMPLATE_ID = TEMPLATES[0].id

export function getTemplate(id: string): TemplateLayout {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0]
}

/**
 * เทมเพลตนี้ควรโชว์ตัวปรับตัวนี้ไหม
 *
 * เทมเพลตที่ยังไม่ประกาศ `controls` ถือว่าโชว์ทุกอย่าง — UI จึงอ่านจากข้อมูล
 * ไม่ใช่ hardcode เงื่อนไขต่อเทมเพลต (ข้อ 4.3.4–4.3.5)
 */
export function hasControl(t: TemplateLayout, c: TemplateControl): boolean {
  return !t.controls || t.controls.includes(c)
}

/**
 * โทนสีที่เทมเพลตนี้แนะนำ — `null` แปลว่า "รับได้ทุกโทน" ซึ่งต่างจากอาเรย์ว่าง
 * ตัวเรียกจึงแยกได้ว่าควรโชว์ปุ่ม "โทนสีทั้งหมด" ไหม (ข้อ 4.4)
 */
export function recommendedTones(t: TemplateLayout): string[] | null {
  return t.tones && t.tones.length > 0 ? t.tones : null
}

/** every image file a template needs — used to preload before the first draw */
export function templateImageSources(t: TemplateLayout): string[] {
  return [
    ...Object.values(t.images).map((i) => i?.src),
    t.row.bullet?.src,
    t.row.dash?.src,
    t.row.ribbon?.src,
  ].filter((s): s is string => typeof s === 'string')
}
