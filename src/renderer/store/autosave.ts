/**
 * Autosave — แยกรูปภาพ (base64 ก้อนใหญ่) ออกจากข้อมูลตาราง
 *
 * ปัญหาเดิม: ทุกครั้งที่พิมพ์ตัวอักษร snapshot ทั้งก้อน (รวม characterArt/channelLogo
 * ที่เป็น base64 หลายเมกะไบต์) ถูกส่งข้าม IPC แล้ว electron-store เขียนลงดิสก์แบบ
 * synchronous ที่ main process → หน้าต่างค้างเป็นระยะใน .exe
 * (ใน browser ไม่เจอ เพราะ idb-keyval เป็น async)
 *
 * ตอนนี้: ข้อมูลตารางเขียนทุกครั้ง (เล็ก ไม่กี่ KB) ส่วนรูปเขียนเฉพาะตอนที่รูปเปลี่ยนจริง
 */
import { get, set } from 'idb-keyval'
import type { ScheduleData } from '../types'

const KEY_MAIN = 'vsg:current'
const KEY_ASSETS = 'vsg:current-assets'

interface StoredAssets {
  characterArt?: string
  channelLogo?: string
}

async function readKey<T>(key: string): Promise<T | undefined> {
  if (window.api?.store) return (await window.api.store.get(key)) as T | undefined
  return await get<T>(key)
}

async function writeKey(key: string, value: unknown): Promise<void> {
  if (window.api?.store) await window.api.store.set(key, value)
  else await set(key, value)
}

/** ลายนิ้วมือของรูป — ใช้เทียบว่าต้องเขียนใหม่ไหม โดยไม่ต้อง hash ทั้งก้อน */
function assetSignature(d: Pick<ScheduleData, 'characterArt' | 'channelLogo'>): string {
  const tag = (v?: string) => (v ? `${v.length}:${v.slice(0, 48)}` : '-')
  return `${tag(d.characterArt)}|${tag(d.channelLogo)}`
}

let lastAssetSig: string | null = null

/** โหลด autosave ล่าสุด แล้วประกอบรูปกลับเข้าไป */
export async function loadAutosave(): Promise<ScheduleData | undefined> {
  const light = await readKey<ScheduleData>(KEY_MAIN)
  if (!light) return undefined
  const assets = (await readKey<StoredAssets>(KEY_ASSETS)) ?? {}
  const merged: ScheduleData = {
    ...light,
    characterArt: assets.characterArt,
    channelLogo: assets.channelLogo,
  }
  lastAssetSig = assetSignature(merged)
  return merged
}

/** เขียน autosave — รูปเขียนเฉพาะตอนเปลี่ยน */
export async function saveAutosave(data: ScheduleData): Promise<void> {
  const { characterArt, channelLogo, ...light } = data
  await writeKey(KEY_MAIN, light)

  const sig = assetSignature(data)
  if (sig !== lastAssetSig) {
    lastAssetSig = sig
    await writeKey(KEY_ASSETS, { characterArt, channelLogo })
  }
}
