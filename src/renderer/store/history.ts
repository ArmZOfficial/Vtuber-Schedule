import { create } from 'zustand'
import { useScheduleStore, snapshot } from './scheduleStore'
import type { ScheduleData } from '../types'

/**
 * Undo/Redo — เก็บ snapshot ของส่วนที่ serialize ได้ (ScheduleData)
 * การแก้ไขต่อเนื่องภายใน 600ms ถูกรวมเป็น step เดียว (เช่น การพิมพ์ทีละตัวอักษร)
 * 
 * Performance: ใช้ Fast Structural Cloning และ Lightweight Signature เพื่อหลีกเลี่ยง
 * การ JSON.stringify ข้อมูล base64 รูปภาพขนาดใหญ่ (5-10MB) ทุก ๆ mouse event
 */

/**
 * ป้ายกำกับของหนึ่งก้าวใน history — บอกว่าก้าวนั้น "เปลี่ยนอะไร" (แผนข้อ 7.2.2)
 *
 * history ที่นี่ไม่ได้ถูกสั่งด้วยชื่อ action แต่ดักจากการที่ store ขยับ ป้ายจึงต้อง
 * ได้มาจากการเทียบ snapshot ก่อน/หลัง ไม่ใช่จากตัวเรียก — ข้อดีคือไม่ต้องไปไล่ใส่ชื่อ
 * ที่ call site ทุกจุดแล้วลืมบางจุด ข้อเสียคือละเอียดได้เท่าที่ diff บอกได้
 */
export interface ChangeLabel {
  /** คีย์ใน `Translations` ที่ UI เอาไปแปลเป็นข้อความ */
  key:
    | 'histTemplate'
    | 'histDay'
    | 'histWeekStart'
    | 'histArt'
    | 'histExport'
    | 'histAnim'
    | 'histMeta'
    | 'histEdit'
  /** ดัชนีวัน 0–6 มีเฉพาะตอนที่เปลี่ยนวันเดียว UI เอาไปเติมชื่อวัน */
  day?: number
}

/**
 * เทียบสองสถานะแล้วบอกว่าเปลี่ยนอะไร — ไล่จากเฉพาะเจาะจงไปกว้าง
 * อันแรกที่ตรงชนะ เพราะการเปลี่ยนเทมเพลตมักลากค่าอื่นเปลี่ยนตามไปด้วย
 */
function describeChange(prev: ScheduleData, next: ScheduleData): ChangeLabel {
  if (prev.meta.templateId !== next.meta.templateId) return { key: 'histTemplate' }
  if (prev.meta.startDate !== next.meta.startDate) return { key: 'histWeekStart' }
  if (
    prev.characterArt !== next.characterArt ||
    JSON.stringify(prev.characterArtTransform) !== JSON.stringify(next.characterArtTransform)
  ) {
    return { key: 'histArt' }
  }

  const changedDays: number[] = []
  for (let i = 0; i < next.days.length; i++) {
    if (JSON.stringify(prev.days[i]) !== JSON.stringify(next.days[i])) changedDays.push(i)
  }
  if (changedDays.length === 1) return { key: 'histDay', day: changedDays[0] }
  if (changedDays.length > 1) return { key: 'histEdit' }

  if (JSON.stringify(prev.exportSettings) !== JSON.stringify(next.exportSettings)) return { key: 'histExport' }
  if (JSON.stringify(prev.animation) !== JSON.stringify(next.animation)) return { key: 'histAnim' }
  if (JSON.stringify(prev.meta) !== JSON.stringify(next.meta)) return { key: 'histMeta' }
  return { key: 'histEdit' }
}

const past: ScheduleData[] = []
const pastLabels: ChangeLabel[] = []
const future: ScheduleData[] = []
const futureLabels: ChangeLabel[] = []
let lastPush = 0
let applying = false

const COALESCE_MS = 600
const LIMIT = 60

interface HistoryMeta {
  canUndo: boolean
  canRedo: boolean
  bump: number
  /** ก้าวที่ Ctrl+Z จะย้อน — `null` เมื่อไม่มีอะไรให้ย้อน */
  undoLabel: ChangeLabel | null
  /** ก้าวที่ Ctrl+Shift+Z จะทำซ้ำ */
  redoLabel: ChangeLabel | null
}

export const useHistoryMeta = create<HistoryMeta>(() => ({
  canUndo: false,
  canRedo: false,
  bump: 0,
  undoLabel: null,
  redoLabel: null,
}))

function syncMeta() {
  useHistoryMeta.setState((m) => ({
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    bump: m.bump + 1,
    undoLabel: pastLabels[pastLabels.length - 1] ?? null,
    redoLabel: futureLabels[futureLabels.length - 1] ?? null,
  }))
}

function cloneSnapshot(s: ScheduleData): ScheduleData {
  return {
    meta: { ...s.meta },
    weekArchive: { ...s.weekArchive },
    characterArt: s.characterArt, // preserve string reference in V8 heap
    characterArtTransform: s.characterArtTransform ? { ...s.characterArtTransform } : undefined,
    channelLogo: s.channelLogo, // preserve string reference in V8 heap
    days: s.days.map((d) => ({
      ...d,
      collabMembers: d.collabMembers ? [...d.collabMembers] : undefined,
      events: d.events.map((e) => ({
        ...e,
        collabMembers: e.collabMembers ? [...e.collabMembers] : undefined,
        customPlatform: e.customPlatform ? { ...e.customPlatform } : undefined,
      })),
    })),
    animation: { ...s.animation },
    exportSettings: { ...s.exportSettings },
  }
}

/** สร้าง signature เบา ๆ เพื่อเช็คว่า content เปลี่ยนจริงหรือไม่ โดยตัด Base64 ขนาดใหญ่ทิ้ง */
export function stateSignature(s: ScheduleData): string {
  const light = {
    ...s,
    characterArt: s.characterArt ? `art:${s.characterArt.length}:${s.characterArt.slice(0, 32)}` : undefined,
    channelLogo: s.channelLogo ? `logo:${s.channelLogo.length}:${s.channelLogo.slice(0, 32)}` : undefined,
  }
  return JSON.stringify(light)
}

let unsubscribeHistory: (() => void) | null = null
let historyDebounceTimer: ReturnType<typeof setTimeout> | null = null

function flushHistoryPending() {
  if (historyDebounceTimer) {
    clearTimeout(historyDebounceTimer)
    historyDebounceTimer = null
  }
}

/** เรียกครั้งเดียวหลัง restore autosave เสร็จ ก่อนผู้ใช้เริ่มแก้ไข */
export function initHistory() {
  flushHistoryPending()
  if (unsubscribeHistory) {
    unsubscribeHistory()
    unsubscribeHistory = null
  }

  let currentSnapObj = cloneSnapshot(snapshot(useScheduleStore.getState()))
  let lastSnapSig = stateSignature(currentSnapObj)

  unsubscribeHistory = useScheduleStore.subscribe(() => {
    if (applying) return
    flushHistoryPending()
    historyDebounceTimer = setTimeout(() => {
      const curSnap = snapshot(useScheduleStore.getState())
      const sig = stateSignature(curSnap)
      if (sig === lastSnapSig) return

      const now = Date.now()
      if (now - lastPush > COALESCE_MS) {
        past.push(currentSnapObj)
        pastLabels.push(describeChange(currentSnapObj, curSnap))
        if (past.length > LIMIT) {
          past.shift()
          pastLabels.shift()
        }
        future.length = 0
        futureLabels.length = 0
        lastPush = now
        syncMeta()
      }
      currentSnapObj = cloneSnapshot(curSnap)
      lastSnapSig = sig
    }, 150)
  })

  return unsubscribeHistory
}

export function undo(): boolean {
  flushHistoryPending()
  if (!past.length) return false
  const curState = snapshot(useScheduleStore.getState())
  const target = past.pop()!
  futureLabels.push(pastLabels.pop() ?? { key: 'histEdit' })
  future.push(cloneSnapshot(curState))
  applying = true
  useScheduleStore.getState().hydrate(target)
  applying = false
  syncMeta()
  return true
}

export function redo(): boolean {
  flushHistoryPending()
  if (!future.length) return false
  const curState = snapshot(useScheduleStore.getState())
  const target = future.pop()!
  pastLabels.push(futureLabels.pop() ?? { key: 'histEdit' })
  past.push(cloneSnapshot(curState))
  applying = true
  useScheduleStore.getState().hydrate(target)
  applying = false
  syncMeta()
  return true
}
