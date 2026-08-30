# การเซ็นโปรแกรม (Code Signing)

เอกสารนี้บอกว่าจะทำให้ `.exe` ไม่โดน Windows SmartScreen เตือนได้อย่างไร

โปรเจกต์นี้ **ต่อสายรอไว้ให้หมดแล้ว** — พอมี certificate ก็ตั้ง env var แล้ว `npm run build`
ได้ไฟล์ที่เซ็นแล้วทันที ไม่ต้องแก้โค้ดหรือ config ใด ๆ อีก

---

## 1. ทำไมยังเซ็นไม่ได้ตอนนี้

การเซ็นต้องใช้ **code-signing certificate** ที่ออกโดย Certificate Authority (CA) ที่ Windows เชื่อถือ
ซึ่งต้อง **เสียเงินซื้อ** และ **ยืนยันตัวตนด้วยเอกสารจริง** (บัตรประชาชน/หนังสือรับรองบริษัท)
ไม่มีทางสร้างเองฟรีได้

> **self-signed certificate ไม่ช่วยอะไร** — สร้างเองได้ก็จริง แต่เครื่องคนอื่นไม่เชื่อถือ
> SmartScreen ยังเตือนเหมือนเดิม บางทีแย่กว่าเดิมด้วยซ้ำเพราะดูเหมือนพยายามปลอมลายเซ็น
> อย่าเสียเวลากับทางนี้

---

## 2. ความจริงที่ต้องรู้ก่อนจ่ายเงิน

**จ่ายเงินแล้วคำเตือนอาจยังไม่หายทันที**

SmartScreen ตัดสินจาก 2 อย่าง คือ *ลายเซ็น* กับ *ชื่อเสียง (reputation)*

| ประเภท cert | คำเตือนหายทันทีไหม |
|---|---|
| **OV** (Organization Validation) — แบบมาตรฐาน | **ไม่** ต้องสะสมยอดดาวน์โหลดสักพัก (เป็นสัปดาห์ถึงเป็นเดือน) คำเตือนถึงจะค่อย ๆ หาย |
| **EV** (Extended Validation) | เดิมได้ reputation ทันที ปัจจุบัน Microsoft ลดความสำคัญลงแล้ว ไม่การันตี 100% |

ข้อดีที่ได้แน่นอนตั้งแต่วันแรกแม้ใช้ OV คือ **กล่องเตือนจะแสดงชื่อคุณเป็นผู้เผยแพร่**
แทนที่จะขึ้นว่า "Unknown publisher" ซึ่งช่วยเรื่องความน่าเชื่อถือมาก

---

## 3. ทางเลือกในการซื้อ

> ราคาและเงื่อนไขเปลี่ยนบ่อย ตัวเลขข้างล่างเป็นระดับคร่าว ๆ ให้เทียบกัน — เช็คหน้าเว็บจริงก่อนตัดสินใจ

### ทางที่ 1 — Azure Trusted Signing (ถูกที่สุด แนะนำถ้าผ่านเงื่อนไข)

บริการของ Microsoft เอง คิดค่าบริการ **รายเดือน** ประมาณ $10/เดือน ถูกกว่าแบบดั้งเดิมมาก
ไม่ต้องมี USB token ให้เสียบ เพราะกุญแจอยู่บนคลาวด์

- ต้องมี Azure subscription และผ่านการยืนยันตัวตนกับ Microsoft
- **เช็คเงื่อนไขคุณสมบัติก่อน** — Microsoft มีข้อกำหนดเรื่องอายุของนิติบุคคล/ตัวตนที่ยื่น
  ซึ่งบางรายไม่ผ่าน และเงื่อนไขนี้ปรับอยู่เรื่อย ๆ
- หน้าเว็บ: https://learn.microsoft.com/azure/trusted-signing/

### ทางที่ 2 — Certificate แบบดั้งเดิม (OV/EV)

ซื้อจาก Sectigo, DigiCert, SSL.com, GlobalSign ฯลฯ

- OV ประมาณ **$200–400/ปี** · EV ประมาณ **$400–700/ปี**
- ตั้งแต่มิถุนายน 2023 กฎ CA/Browser Forum บังคับว่า **กุญแจต้องเก็บบนฮาร์ดแวร์**
  จึงได้มาเป็น USB token ส่งไปรษณีย์มา (ต้องเสียบตอน build ทุกครั้ง)
  หรือเลือกแบบ **cloud HSM** ของผู้ขายซึ่งเซ็นผ่านเน็ตได้ สะดวกกว่าถ้า build บน CI

---

## 4. เซ็นยังไงเมื่อได้ cert มาแล้ว

### กรณี certificate ไฟล์ `.pfx`

electron-builder อ่านตัวแปรสภาพแวดล้อม 2 ตัวนี้เองอัตโนมัติ ไม่ต้องแก้ `package.json`

PowerShell:

```powershell
$env:CSC_LINK = "C:\path\to\certificate.pfx"; $env:CSC_KEY_PASSWORD = "รหัสผ่านของ cert"; npm run build
```

Git Bash:

```bash
CSC_LINK="/c/path/to/certificate.pfx" CSC_KEY_PASSWORD="รหัสผ่านของ cert" npm run build
```

`CSC_LINK` ใส่เป็น base64 ของไฟล์ `.pfx` ก็ได้ เหมาะกับตอนเก็บเป็น secret ใน CI

### กรณี USB token (กุญแจอยู่บนฮาร์ดแวร์ ไม่มีไฟล์ .pfx)

เสียบ token แล้วอ้างอิง cert ด้วยชื่อผู้ถือครองแทน — เพิ่มใน `package.json` ที่ `build.win.signtoolOptions`

```json
"certificateSubjectName": "ชื่อที่อยู่ในช่อง issued to ของ certificate"
```

### กรณี Azure Trusted Signing

เพิ่มใน `package.json` ที่ `build.win` แล้วล็อกอิน Azure CLI ก่อน build

```json
"azureSignOptions": {
  "endpoint": "https://eus.codesigning.azure.net",
  "codeSigningAccountName": "ชื่อบัญชี Trusted Signing",
  "certificateProfileName": "ชื่อ certificate profile",
  "publisherName": "ชื่อผู้เผยแพร่ตามที่ลงทะเบียนไว้"
}
```

---

## 5. สิ่งที่ตั้งค่ารอไว้ให้แล้วในโปรเจกต์นี้

อยู่ใน `package.json` ที่ `build.win.signtoolOptions`

| ค่า | ทำไมต้องมี |
|---|---|
| `rfc3161TimeStampServer` + `timeStampServer` | ประทับเวลาลงในลายเซ็น ทำให้ไฟล์ที่เซ็นไว้ **ยังถือว่าถูกต้องต่อไปแม้ certificate หมดอายุ** ถ้าไม่มีข้อนี้ พอ cert หมดอายุไฟล์เก่าทั้งหมดจะกลายเป็นไม่มีลายเซ็นทันที |
| `signingHashAlgorithms: ["sha256"]` | บังคับ SHA-256 · SHA-1 ถูกเลิกใช้แล้ว |
| `copyright` | ฝังข้อความลิขสิทธิ์ลงใน metadata ของ `.exe` (เห็นได้จาก คลิกขวา → Properties) |

ทั้งหมดนี้ **ไม่ทำให้ build พังตอนที่ยังไม่มี cert** — ถ้าไม่ได้ตั้ง `CSC_LINK`
electron-builder จะข้ามขั้นตอนการเซ็นไปเฉย ๆ

---

## 6. ระหว่างที่ยังไม่มี cert ทำอะไรได้บ้าง

แนบ **SHA-256 checksum** ไปกับทุก release แล้วบอกให้ผู้ใช้ตรวจสอบเอง
ไม่ได้ทำให้คำเตือนหาย แต่พิสูจน์ได้ว่าไฟล์ที่โหลดไปไม่ถูกดัดแปลงระหว่างทาง

ผู้ใช้ตรวจได้ด้วยคำสั่งนี้ใน PowerShell

```powershell
Get-FileHash "VTuber.Schedule.0.0.1.portable.exe" -Algorithm SHA256
```

แล้วเทียบกับค่าที่ประกาศไว้ในหน้า release

สร้างไฟล์ checksum ตอน build เสร็จ

```bash
sha256sum release/*.exe > release/SHA256SUMS.txt
```
