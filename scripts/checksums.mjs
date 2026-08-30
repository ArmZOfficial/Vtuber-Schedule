// สร้างไฟล์ SHA256SUMS.txt จากไฟล์ .exe ทุกตัวในโฟลเดอร์ release/
// ใช้แทนลายเซ็นดิจิทัลระหว่างที่ยังไม่มี code-signing certificate —
// ผู้ใช้เทียบค่าแฮชเองได้ว่าไฟล์ที่โหลดไปไม่ถูกดัดแปลงระหว่างทาง
// ดูรายละเอียดที่ docs/code-signing.md
import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { readdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const RELEASE_DIR = 'release'

function sha256(path) {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256')
    createReadStream(path)
      .on('error', reject)
      .on('data', (chunk) => hash.update(chunk))
      .on('end', () => resolve(hash.digest('hex')))
  })
}

const entries = await readdir(RELEASE_DIR, { withFileTypes: true })
const exeFiles = entries
  .filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.exe'))
  .map((e) => e.name)
  .sort()

if (exeFiles.length === 0) {
  console.error(`ไม่พบไฟล์ .exe ใน ${RELEASE_DIR}/ — สั่ง npm run build ก่อน`)
  process.exit(1)
}

// GitHub แทนช่องว่างในชื่อ asset ด้วยจุดตอนอัปโหลดขึ้น release
// จึงต้องบันทึกชื่อแบบที่ผู้ใช้โหลดมาจริง ไม่ใช่ชื่อไฟล์ในเครื่อง
const releaseName = (name) => name.replace(/ /g, '.')

const lines = [
  '# SHA-256 ของไฟล์ที่ build ได้จากซอร์สโค้ดรุ่นนี้',
  '# ตรวจสอบด้วย PowerShell:  Get-FileHash <ชื่อไฟล์> -Algorithm SHA256',
  '# ชื่อไฟล์ตรงตามที่ดาวน์โหลดจาก GitHub (ช่องว่างถูกแทนด้วยจุด)',
]
for (const name of exeFiles) {
  const digest = await sha256(join(RELEASE_DIR, name))
  // รูปแบบเดียวกับคำสั่ง sha256sum เพื่อให้ตรวจสอบข้ามเครื่องมือกันได้
  lines.push(`${digest}  ${releaseName(name)}`)
  console.log(`${digest}  ${releaseName(name)}`)
}

const outPath = join(RELEASE_DIR, 'SHA256SUMS.txt')
await writeFile(outPath, lines.join('\n') + '\n', 'utf8')
console.log(`\nเขียนแล้ว: ${outPath}`)
