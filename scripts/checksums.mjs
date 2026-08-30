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

const lines = []
for (const name of exeFiles) {
  const digest = await sha256(join(RELEASE_DIR, name))
  // รูปแบบเดียวกับคำสั่ง sha256sum เพื่อให้ตรวจสอบข้ามเครื่องมือกันได้
  lines.push(`${digest}  ${name}`)
  console.log(`${digest}  ${name}`)
}

const outPath = join(RELEASE_DIR, 'SHA256SUMS.txt')
await writeFile(outPath, lines.join('\n') + '\n', 'utf8')
console.log(`\nเขียนแล้ว: ${outPath}`)
