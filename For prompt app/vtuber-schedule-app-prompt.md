# AI Build Prompt: VTuber Weekly Schedule Generator (Desktop App)

## 0. วัตถุประสงค์ของไฟล์นี้

ไฟล์นี้คือ prompt/spec ฉบับสมบูรณ์สำหรับป้อนให้ AI coding agent (เช่น Claude Code) ใช้สร้างแอป desktop
สำหรับสร้างรูปตารางสตรีมรายสัปดาห์ (weekly schedule graphic) ของ VTuber

อ้างอิงจาก:
- `00_full_composite_reference.png` = ภาพต้นแบบที่ผลลัพธ์สุดท้ายต้อง **เหมือน 100%**
- asset แยกชิ้นในโฟลเดอร์ `Downloads/Coding/vtuber-schedule-app for new/For prompt app/`

---

## 1. กฎเหล็ก (Non-negotiable Rules) — อ่านก่อนเริ่มโค้ด

1. **ห้าม AI วาด/สร้างกราฟิกใหม่เอง (background, ริบบิ้น, ดอกไม้, กรอบ ฯลฯ) เด็ดขาด** — ทุกภาพประกอบต้องมาจากไฟล์ asset จริงที่ให้มาเท่านั้น:
   `Background.png`, `Frame.png`, `place-holder.png`, `Rectangle.png`, `Title_flowers.png`,
   `Week-of_Capa-46.png`, `Sunday_Offline_Capa-8.png`, `Sunday_Offline_Capa-9.png`, `Sunday_Offline_Capa-13.png`
2. ถ้ามี `.png` อยู่แล้ว **ห้าม** แกะ/export ใหม่จาก `.psd` — ใช้ไฟล์ที่มีอยู่ตรงๆ
3. ถ้ามี layer ใน `.psd` ที่ยังไม่มีไฟล์ `.png` รองรับ ค่อย extract/export layer นั้นออกมา (ตั้งชื่อไฟล์ตาม layer name ให้ตรงกับใน PSD)
4. renderer/ตาราง ต้องเป็น **canvas ที่ประกอบสดทุกครั้งจาก asset + ข้อมูล** ไม่ใช่ภาพ static ที่ bake ไว้ล่วงหน้า เพราะวัน/เวลา/ชื่อสตรีมต้องแก้ไขได้แบบ real-time แล้ว re-render ทันที
5. ทุกครั้งที่มีไฟล์ `.psd` เทมเพลตใหม่แนบมา ให้ใช้มันเป็นแหล่งอ้างอิง position/rotation/z-index ที่แม่นยำที่สุด — **ห้ามกะตำแหน่งด้วยสายตาจากภาพ preview เพียงอย่างเดียว** (ดูคำแนะนำข้อ 11.1)

---

## 2. Tech Stack (fixed)

- Frontend: **React + Vite + TypeScript**
- Canvas/Rendering: **Konva.js + react-konva**
- State Management: **Zustand**
- Styling (เฉพาะ UI ควบคุม ไม่ใช่ตัว canvas): **Tailwind CSS**
- Desktop packaging: **Electron** → build เป็น `.exe`
- แนะนำเพิ่ม: `ag-psd` (อ่านไฟล์ .psd ด้วยโค้ด แทนการกะด้วยตา — ดูข้อ 11.1)

---

## 3. Asset Inventory

| ไฟล์ | หน้าที่ในภาพต้นแบบ | หมายเหตุ |
|---|---|---|
| `Background.png` | พื้นหลังเต็มภาพ (gradient ชมพู + ลายเส้นพวงดอกไม้มุมบน + ขอบหยักซ้าย) | full-bleed, cover ทั้ง canvas, z=0 |
| `Frame.png` | กรอบสี่เหลี่ยมสีชมพูอ่อนฝั่งซ้าย ใส่ผลงานศิลปิน หมุนเอียงเล็กน้อย | มี rotation (ประมาณ -3° ถึง -5°, ยืนยันจริงจาก PSD) |
| `place-holder.png` | silhouette ดอกไม้สีชมพูอ่อน + ข้อความ "PLACE YOUR ART HERE" กลางกรอบ | แสดงเฉพาะตอนยังไม่มีรูปอาร์ตอัปโหลด — เมื่อผู้ใช้อัปโหลดรูป ให้แทนที่ตำแหน่งนี้ด้วยรูปจริง |
| `Rectangle.png` | แผงพื้นหลังขาว/ครีมมุมโค้งฝั่งขวา บรรจุหัวข้อ+ตารางวัน | container หลักฝั่งขวา |
| `Title_flowers.png` | ดอกไม้ประดับรอบคำว่า "WEEKLY SCHEDULE" + ดอกไม้กระจายตามขอบภาพ | อาจต้องใช้ซ้ำหลายจุด (sprite/reusable instance) |
| `Week-of_Capa-46.png` | ป้ายริบบิ้นมุมขวาบน "WEEK OF" | fix ตำแหน่งมุมขวาบนของ Rectangle |
| `Sunday_Offline_Capa-8/-9/-13.png` | ป้ายริบบิ้นเล็ก "OFFLINE" (3 layer ซ้อนกัน) | "Capa" = ภาษาสเปนแปลว่า "Layer" → คาดว่าเป็น shadow/ริบบิ้นหลัก/รอยพับ 3 ชั้นจาก PSD เดียวกัน **ต้อง group ไว้เป็นชุดเดียว รักษา offset สัมพัทธ์เดิม ห้ามแยกวางเอง** |
| Font Jp / Font Thai / Font Eng (โฟลเดอร์) | ฟอนต์แต่ละภาษา | โหลดแบบ dynamic ตามภาษาที่พิมพ์ หรือเลือก manual ในเมนู |

> หมายเหตุ: ไม่มี asset สำหรับ "แถบเวลาออนไลน์" (เช่น `10:00 PM`) เพราะวันออนไลน์ใช้ text ล้วน ไม่มีป้าย/ริบบิ้น
> มีแค่เส้นประ (dotted line) คั่นกลาง ซึ่งวาดด้วย `Konva.Line` (dash) ได้เลย ไม่ต้องใช้ภาพ asset

---

## 4. Layout Specification (วิเคราะห์จาก `00_full_composite_reference.png`)

Canvas อ้างอิงเริ่มต้น: **1600×900px** (สัดส่วนใกล้เคียงภาพต้นแบบ) — ตัวเลขตำแหน่งด้านล่างเป็น **ค่าประมาณจากการอ่านภาพ** เท่านั้น
เมื่อได้ไฟล์ `.psd` จริง **ต้อง override ด้วยพิกัดจริงทันที** (ดูข้อ 11.1)

| Element | ตำแหน่งโดยประมาณ | หมายเหตุ |
|---|---|---|
| Background | x=0, y=0, w=100%, h=100% | z=0 |
| ArtFrame group (`Frame.png`) | x≈6%, y≈10%, w≈32%, h≈78%, rotation≈-3° | z=1 |
| ↳ place-holder / user art | fit ในกรอบด้านใน padding≈4% | z=2 |
| ↳ "Art by: @username" | เหนือกรอบ มุมซ้ายบน ตัวหนาสีชมพูเข้ม | z=3 |
| `Rectangle.png` (main panel) | x≈40%, y≈6%, w≈56%, h≈88% | z=1 |
| Title "WEEKLY SCHEDULE" | ในส่วนบนของ Rectangle x≈44%, y≈10% | 2 บรรทัด ฟอนต์กลมหนาสีชมพู, z=3 |
| `Title_flowers.png` decorations | รอบ title + มุมซ้ายบน/ขวาล่างของ canvas | หลาย instance ต่างขนาด/มุมหมุน, z=4 |
| `Week-of_Capa-46.png` + text | มุมขวาบนของ Rectangle เกยขอบบนเล็กน้อย | ข้อความ "WEEK OF DD.MM / DD.MM" overlay, z=3 |
| 7× Day row (loop) | เรียงแนวตั้งใน Rectangle, สูงแถวละ≈8.5% ของความสูง Rectangle | ดูรายละเอียดด้านล่าง |
| Credit "schedule design by @username" | ขอบขวาสุดของ canvas หมุน 90° | z=5 |

**โครงสร้างแต่ละ Day row:**
- ชื่อวัน (bold, ชมพู, ชิดซ้าย) + ไอคอนดอกไม้เล็ก
- เส้นประแนวนอนคั่นกลาง (`Konva.Line`, dash)
- ฝั่งขวา: **ถ้าออนไลน์** → text เวลาธรรมดา (เช่น "10:00 PM") / **ถ้าออฟไลน์** → OfflineBadge group (Capa-8/9/13 ซ้อนกัน) + text "OFFLINE"
- บรรทัดใต้ชื่อวัน: subtitle (ชื่อสตรีมที่ผู้ใช้กำหนด หรือ "Day off, sorry!" ถ้าออฟไลน์)

---

## 5. Data Model

```ts
interface ScheduleDay {
  id: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
  label: string;       // ชื่อวัน (localized)
  isOffline: boolean;
  time?: string;        // "10:00 PM" — จำเป็นถ้า !isOffline
  title: string;         // ชื่อสตรีม หรือข้อความ offline เช่น "Day off, sorry!"
}

interface ScheduleData {
  weekOfStart: string;    // "01.04"
  weekOfEnd: string;        // "08.04"
  artCredit: string;         // "@username"
  designCredit: string;       // "@lennajpeg" (attribution, editable)
  artImage: string | null;     // รูปที่ผู้ใช้อัปโหลด, null = แสดง place-holder
  days: ScheduleDay[];           // length 7
}

interface ThemeConfig {
  id: string;
  name: string;
  hueShift: number;              // องศา ใช้กับ raster asset สีชมพูทุกชิ้น
  saturationShift?: number;
  lightnessShift?: number;
  textPalette: { primary: string; secondary: string; accent: string };
  fontFamily: { thai: string; jp: string; en: string };
}
```

---

## 6. Theme System — ปรับสีด้วย Hue เท่านั้น (ห้ามสร้าง asset ใหม่ต่อ theme)

- ใช้ `Konva.Filters.HSL` กับทุก image node ที่โหลดจาก asset จริง (Background, Frame, Rectangle, ริบบิ้นต่างๆ, ดอกไม้) โดยตั้งค่า `hue` ตาม `ThemeConfig.hueShift` เดียวกันทั้งหมด → คง contrast/ลวดลายเดิม 100% แค่หมุนโทนสี
- ข้อความ (Konva.Text) ไม่ได้อยู่ใน PNG จึงต้องคำนวณสีจาก `textPalette` ที่ผูก hue เดียวกัน (คำนวณผ่านสูตร HSL) เพื่อให้ sync กับสีของภาพเสมอ โดยไม่ต้อง hardcode สีแยกทีละ theme
- Cache node หลัง apply filter (`node.cache()`) เพื่อ performance ไม่ให้ recompute ทุกเฟรม
- Theme menu (dropdown/swatch selector) → เปลี่ยน `hueShift` ใน Zustand store → trigger re-filter ของทุก layer ที่ subscribe อยู่

ตัวอย่าง preset เริ่มต้น: Sakura Pink (hue 0, default), Lavender (~260°), Mint (~150°), Sky Blue (~200°), Peach (~30°)
— เพิ่ม custom hue slider ให้ผู้ใช้ปรับเองได้อิสระ

---

## 7. Component Architecture

```
src/
  assets/                    # asset ต้นฉบับทั้งหมด (ห้ามแก้ไข/ห้ามสร้างใหม่)
  fonts/{thai,jp,en}/
  store/
    scheduleStore.ts         # Zustand: ScheduleData
    themeStore.ts             # Zustand: current ThemeConfig
  layout/
    layout.schema.ts          # TS type ตำแหน่ง/rotation ต่อ element
    layout.default.json        # ค่าตำแหน่งปัจจุบัน (ถูก overwrite เมื่อมี PSD ใหม่)
  canvas/
    ScheduleStage.tsx           # <Stage><Layer> หลัก
    BackgroundLayer.tsx
    ArtFrameGroup.tsx            # Frame.png + place-holder/art + credit text
    SchedulePanel.tsx              # Rectangle.png + title + week-of ribbon
    DayRow.tsx                       # 1 แถววัน (reusable, loop 7 ครั้ง)
    OfflineBadge.tsx                   # group ของ Capa-8/9/13
    FlowerDecor.tsx                      # sprite ดอกไม้ reusable
  ui/
    ThemeMenu.tsx
    ScheduleEditorPanel.tsx                 # form แก้ข้อมูลแต่ละวัน
    ArtUploadButton.tsx
    ExportButton.tsx                          # export PNG (stage.toDataURL)
  scripts/
    extract-psd.ts                              # (แนะนำ) parse .psd → layout.default.json + export layer ที่ขาด
electron/
  main.ts
  preload.ts
```

---

## 8. Font System

- ตรวจ character range ของข้อความที่พิมพ์ (Thai unicode range / Japanese kana-kanji range / ที่เหลือใช้ Latin) → auto-select font จาก `Font Thai / Font Jp / Font Eng`
- หรือให้เลือก manual ผ่าน dropdown ในเมนู (เผื่อกรณี mix ภาษาในข้อความเดียว)
- Register ผ่าน `@font-face` และ **preload ให้เสร็จก่อน** Konva.Text render (Konva ไม่รอ font โหลดอัตโนมัติ ไม่งั้นจะ fallback เป็น font อื่นตอน render รอบแรก)

---

## 9. Electron Packaging

- ใช้ `electron-builder`
- ระวัง path ของ asset ตอน build — ใช้ `extraResources` หรือ copy ไปไว้ที่ `public/` แล้ว reference แบบ relative เพื่อให้ `Image()` โหลดได้ทั้งตอน dev (Vite) และตอน packaged app (`file://`)
- Target: Windows portable `.exe` (และเพิ่ม NSIS installer ได้ถ้าต้องการ)

---

## 10. Acceptance Criteria

- [ ] Layout ที่ render ออกมาต้อง "เหมือน 100%" กับ `00_full_composite_reference.png` ที่ default theme + default data
- [ ] แก้ข้อมูล (วัน/เวลา/ชื่อสตรีม/สถานะออฟไลน์) แล้ว canvas re-render ถูกต้องทันที ไม่พัง layout
- [ ] เปลี่ยน theme แล้ว hue เปลี่ยนทั้ง raster asset + text พร้อมกัน โดยรูปทรง/ลายเส้นเดิมไม่เปลี่ยน
- [ ] ไม่มีภาพประกอบชิ้นใดถูกสร้างขึ้นใหม่โดย AI/โค้ด — ทุกภาพมาจาก asset ไฟล์จริง
- [ ] อัปโหลดรูปอาร์ตแทน place-holder ได้ และ fit ในกรอบ Frame ตามสัดส่วนเดิม
- [ ] Export ผลลัพธ์เป็น `.png` ความละเอียดสูงได้
- [ ] Build เป็น `.exe` ด้วย Electron สำเร็จ รันแล้ว asset โหลดครบทุกไฟล์

---

## 11. คำแนะนำเพิ่มเติม

**11.1 Auto-extract layout จาก PSD แทนการกะด้วยตา (สำคัญที่สุด)**
ใช้ library `ag-psd` เขียน script อ่านทุก layer ใน `.psd` (bounding box, offset, ลำดับ z) แล้ว dump เป็น `layout.default.json` อัตโนมัติ
ทุกครั้งที่มี PSD ใหม่มา รัน script เดียวจบ ไม่ต้องแก้โค้ด renderer เลย — วิธีนี้ตรงกับที่ขอ "ห้ามสร้าง template เลียนแบบขึ้นมาใหม่" ที่สุด เพราะพิกัดมาจากไฟล์จริง ไม่ใช่การเดาจากภาพ preview

**11.2 OfflineBadge ต้อง group แบบ fixed offset**
เพราะ `Sunday_Offline_Capa-8/9/13.png` น่าจะเป็น shadow/ริบบิ้นหลัก/รอยพับซ้อนกัน 3 ชั้นจาก PSD เดียวกัน ถ้าแยกวางเองใหม่โดยไม่รู้ offset เดิม รูปจะเพี้ยน — ดึง offset สัมพัทธ์จาก PSD ตรงๆ ตามข้อ 11.1

**11.3 ตรวจสอบว่า `Title_flowers.png` เป็นภาพเดียวรวมดอกไม้หลายดอก หรือแยก layer**
ถ้า PSD ต้นฉบับแยก layer ดอกไม้แต่ละดอกไว้ ให้ export แยกไฟล์ เพื่อวาง/หมุน/สเกลอิสระได้ตามตำแหน่งจริงในภาพต้นแบบ

**11.4 เพิ่มปุ่ม "Reset to template default"** ในเมนู เผื่อผู้ใช้แก้ตำแหน่ง/ข้อมูลเพี้ยนแล้วอยากกลับค่าเริ่มต้น

**11.5 ออกแบบ `layout.schema.ts` ให้รองรับหลาย template pack ในอนาคต** ไม่ใช่แค่เปลี่ยนสี — เผื่อวันหลังมี PSD หน้าตาใหม่ทั้งหมด ระบบจะสลับได้โดยไม่ต้อง refactor โครงสร้าง

**11.6 Export ควร render ที่ความละเอียดสูงกว่าที่แสดงบนจอ** (เช่น 2×–3× scale) เพื่อให้ภาพคมชัดพอสำหรับโพสต์ social media

**11.7 หากมีแผนแจก/ขายให้ VTuber คนอื่นใช้** ควรคง credit "schedule design by @lennajpeg" เป็น text layer ที่ลบไม่ได้ (แก้ได้แค่ `artCredit` ของศิลปินเจ้าของภาพ ไม่ใช่ credit ผู้ออกแบบ template)
