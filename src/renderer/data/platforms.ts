import {
  siBilibili,
  siDiscord,
  siKick,
  siNiconico,
  siTiktok,
  siTwitch,
  siX,
  siYoutube,
} from 'simple-icons'
import type { PlatformId } from '../types'

export interface PlatformDef {
  id: PlatformId
  name: string
  /** SVG path ใน viewBox 24x24 */
  path: string
  brand: string
}

/** วงกลมเรียบ — ใช้เป็นไอคอนแทนเมื่อผู้ใช้ยังไม่อัปโหลดไอคอนของแพลตฟอร์มที่ตั้งเอง */
const GENERIC_PATH = 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 3.2a6.8 6.8 0 1 1 0 13.6 6.8 6.8 0 0 1 0-13.6z'

/** simple-icons ไม่มีโลโก้ Bigo — ใช้ไอคอนสัญญาณถ่ายทอดสดแทน */
const BROADCAST_PATH =
  'M12 9.4a2.6 2.6 0 1 0 0 5.2 2.6 2.6 0 0 0 0-5.2zM7.8 5.6a1.2 1.2 0 0 1 0 1.7 6.6 6.6 0 0 0 0 9.4 1.2 1.2 0 1 1-1.7 1.7 9 9 0 0 1 0-12.8 1.2 1.2 0 0 1 1.7 0zm9.9 0a9 9 0 0 1 0 12.8 1.2 1.2 0 0 1-1.7-1.7 6.6 6.6 0 0 0 0-9.4 1.2 1.2 0 0 1 1.7-1.7zM4.4 2.2a1.2 1.2 0 0 1 0 1.7 11.5 11.5 0 0 0 0 16.2 1.2 1.2 0 1 1-1.7 1.7 13.9 13.9 0 0 1 0-19.6 1.2 1.2 0 0 1 1.7 0zm16.9 0a13.9 13.9 0 0 1 0 19.6 1.2 1.2 0 1 1-1.7-1.7 11.5 11.5 0 0 0 0-16.2 1.2 1.2 0 0 1 1.7-1.7z'

export const PLATFORMS: PlatformDef[] = [
  { id: 'youtube', name: 'YouTube', path: siYoutube.path, brand: '#FF0000' },
  { id: 'twitch', name: 'Twitch', path: siTwitch.path, brand: '#9146FF' },
  { id: 'tiktok', name: 'TikTok Live', path: siTiktok.path, brand: '#ffffff' },
  { id: 'discord', name: 'Discord', path: siDiscord.path, brand: '#5865F2' },
  { id: 'x-space', name: 'X / Twitter Space', path: siX.path, brand: '#ffffff' },
  { id: 'kick', name: 'Kick', path: siKick.path, brand: '#53FC18' },
  { id: 'bigo', name: 'Bigo Live', path: BROADCAST_PATH, brand: '#00CFFF' },
  { id: 'bilibili', name: 'bilibili', path: siBilibili.path, brand: '#00A1D6' },
  { id: 'niconico', name: 'ニコニコ', path: siNiconico.path, brand: '#ffffff' },
  { id: 'custom', name: 'Other / Custom', path: GENERIC_PATH, brand: '#94a3b8' },
]

export function getPlatform(id: PlatformId): PlatformDef {
  return PLATFORMS.find((p) => p.id === id) ?? PLATFORMS[0]
}

/** ชื่อที่จะแสดง — ถ้าเป็น custom ใช้ชื่อที่ผู้ใช้ตั้ง */
export function platformLabel(id: PlatformId, custom?: { name?: string }): string {
  if (id === 'custom') return custom?.name?.trim() || getPlatform('custom').name
  return getPlatform(id).name
}
