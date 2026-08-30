# VTuber Schedule

โปรแกรมเดสก์ท็อปสำหรับสร้าง **ภาพตารางสตรีมรายสัปดาห์** ของ VTuber — กรอกวัน/เวลา/ชื่อสตรีม แล้วได้ภาพพร้อมโพสต์ทันที ไม่ต้องเปิด Photoshop

> Desktop app that generates weekly VTuber stream-schedule graphics. Fill in your week, get a post-ready image.

---

## ดาวน์โหลด (Download)

โหลดไฟล์ `.exe` ได้จากหน้า [**Releases**](../../releases/latest)

| ไฟล์ | ใช้ตอนไหน |
|---|---|
| `VTuber Schedule <version> portable.exe` | **Portable** — ดับเบิลคลิกใช้ได้เลย ไม่ต้องติดตั้ง เก็บลงแฟลชไดรฟ์ได้ |
| `VTuber Schedule Setup <version>.exe` | ตัวติดตั้งปกติ (NSIS) — เลือกโฟลเดอร์ติดตั้งได้ มี shortcut ให้ |

รองรับ Windows x64

> Windows SmartScreen อาจเตือนเพราะไฟล์ยังไม่ได้เซ็น code-signing certificate — กด **More info → Run anyway** ได้

---

## ความสามารถ

- **แก้แล้วเห็นผลทันที** — canvas ประกอบสดจาก asset จริงทุกครั้ง (Konva) ไม่ใช่ภาพ bake ไว้ล่วงหน้า
- **ตารางครบ 7 วัน** — ตั้งเวลา ชื่อสตรีม แพลตฟอร์ม หรือทำเครื่องหมาย OFFLINE รายวันได้
- **ไอคอนแพลตฟอร์ม** — YouTube, Twitch, TikTok, X, Kick, Bilibili, Niconico, Discord และอัปโหลดไอคอนเองได้
- **ใส่รูปอาร์ตของตัวเอง** — ลากรูปลงกรอบ ปรับตำแหน่ง/ซูมได้
- **ปรับโทนสีทั้งใบ** — เปลี่ยนสีเทมเพลตด้วย hue/tint engine
- **ฟอนต์ไทย / อังกฤษ / ญี่ปุ่น** — มีฟอนต์ให้ในตัว (Kanit, Nunito, Umeboshi) และเลือกฟอนต์จากเครื่องหรือ Google Fonts ได้
- **ส่งออก PNG และ GIF** (GIF = ตารางแบบมีอนิเมชัน)
- **Undo / Redo แบบบอกได้ว่าย้อนอะไร** — tooltip บอกชื่อการกระทำ เช่น "เลิกทำ — เปลี่ยนสัปดาห์"
- **Autosave + ระบบ draft** — งานไม่หายถ้าปิดแอป
- **สลับภาษา UI ไทย/อังกฤษ**, ธีมสว่าง/มืด, คีย์ลัดครบ (`Ctrl+1…6` สลับแท็บ, `Ctrl+Z/Y`)

---

## Tech stack

| ส่วน | ใช้อะไร |
|---|---|
| UI | React 19 + TypeScript + Vite |
| Canvas | Konva.js + react-konva |
| State | Zustand |
| Styling | Tailwind CSS v4 |
| Desktop | Electron + electron-builder |
| Lint | Oxlint |

---

## พัฒนาต่อ (Development)

ต้องมี Node.js 20+ และ npm

```bash
npm install
```

```bash
npm run dev
```

เปิด dev server ของ Vite พร้อมหน้าต่าง Electron (HMR ใช้ได้)

```bash
npm run build
```

typecheck → build ด้วย Vite → แพ็กเป็น `.exe` ทั้งแบบ portable และ installer ลงในโฟลเดอร์ `release/`

```bash
npm run lint
```

### สคริปต์ PSD pipeline

เทมเพลตต้นฉบับเป็นไฟล์ `.psd` — ชุดสคริปต์นี้อ่านพิกัดจริงจาก PSD ด้วย `ag-psd` แทนการกะตำแหน่งด้วยตา

```bash
npm run psd:all
```

- `psd:dump` — dump โครงสร้าง PSD เป็น JSON
- `psd:layers` — export layer ออกเป็น `.png`
- `psd:layout` — สร้างไฟล์ layout จากพิกัดจริงใน PSD

---

## โครงสร้างโปรเจกต์

```
src/
├─ main/            # Electron main process (หน้าต่าง, IPC, storage)
├─ preload/         # bridge ที่ปลอดภัยระหว่าง main กับ renderer
└─ renderer/        # แอปฝั่ง React
   ├─ components/
   │  ├─ canvas/    # ชั้นวาดภาพตาราง (Konva)
   │  └─ editor/    # แผงควบคุมและแท็บต่าง ๆ
   ├─ store/        # Zustand store + autosave + history
   ├─ template/     # schema และ layout ของเทมเพลต
   ├─ export/       # ส่งออก PNG / GIF
   └─ utils/        # ฟอนต์, สี, รูปภาพ, วันที่
public/
├─ fonts/           # ฟอนต์ที่ฝังมากับแอป
└─ template/        # asset ของเทมเพลต (.png จาก PSD)
scripts/            # PSD pipeline
docs/               # บันทึกความคืบหน้างาน redesign
"For prompt app"/   # ไฟล์ต้นฉบับงานออกแบบ (.psd, asset, spec)
```

---

## เอกสารอื่น

- [`ux-ui-redesign-plan.md`](ux-ui-redesign-plan.md) — แผน redesign UX/UI ฉบับเต็ม
- [`docs/redesign-progress.md`](docs/redesign-progress.md) — สถานะงานล่าสุดว่าทำถึงไหนแล้ว
- [`For prompt app/vtuber-schedule-app-prompt.md`](For%20prompt%20app/vtuber-schedule-app-prompt.md) — spec ต้นทางของแอป

---

## เครดิต

- เทมเพลตกราฟิกต้นฉบับ: ดูเครดิตผู้ออกแบบในภาพที่ส่งออก (`design-credit.png`)
- ไอคอนแพลตฟอร์ม: [Simple Icons](https://simpleicons.org/)
- ฟอนต์: Kanit, Nunito (SIL OFL), Umeboshi
