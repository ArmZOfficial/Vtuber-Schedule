import { create } from 'zustand'
import { get, set } from 'idb-keyval'
import type {
  AnimSettings,
  ArtTransform,
  CollabMember,
  DayData,
  DraftEntry,
  EventItem,
  ExportSettings,
  PlatformId,
  ScheduleData,
  ScheduleMeta,
} from '../types'
import { DEFAULT_ART_TRANSFORM } from '../types'
import { weekDays, monthRangeLabel, weekRangeLabel, yearLabel, mondayOf } from '../utils/date'
import { DEFAULT_TEMPLATE_ID } from '../template/layout.schema'
import { DEFAULT_PRESET_ID, normalizePresetId } from '../utils/layout'

export const uid = () => Math.random().toString(36).slice(2, 10)

function mondayThisWeek(): string {
  const d = new Date()
  const day = (d.getDay() + 6) % 7 // 0 = Monday
  d.setDate(d.getDate() - day)
  return toISO(d)
}

export function toISO(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

function defaultEvent(platform: PlatformId, title: string, time: string, highlight = false): EventItem {
  return { id: uid(), platform, title, time, highlight }
}

export const DEFAULT_OFF_NOTE = 'Day off, sorry!'

function defaultDays(): DayData[] {
  return [
    { status: 'off', statusLabel: 'OFFLINE', offNote: DEFAULT_OFF_NOTE, events: [] },
    { status: 'stream', statusLabel: 'STREAM', events: [defaultEvent('twitch', 'Just Chatting / Free Talk', '20:00')] },
    { status: 'off', statusLabel: 'OFFLINE', offNote: DEFAULT_OFF_NOTE, events: [] },
    {
      status: 'stream',
      statusLabel: 'STREAM',
      events: [defaultEvent('youtube', 'Special Event Stream', '21:00', true)],
    },
    {
      status: 'stream',
      statusLabel: 'STREAM',
      events: [
        defaultEvent('youtube', 'Gaming Stream (Title Example)', '14:00'),
        defaultEvent('kick', 'Late Night Stream', '22:00'),
      ],
    },
    { status: 'stream', statusLabel: 'STREAM', events: [defaultEvent('youtube', 'Singing Stream 🎵', '20:00')] },
    { status: 'off', statusLabel: 'OFFLINE', offNote: DEFAULT_OFF_NOTE, events: [] },
  ]
}

function defaultData(): ScheduleData {
  return {
    meta: {
      // ถอดออกจาก UI แล้ว — คงไว้เพื่อให้ draft เก่าโหลดได้ ไม่มีที่ไหนวาดค่านี้
      channelName: '',
      watermark: '',
      startDate: mondayThisWeek(),
      language: 'en',
      timeFormat: '24h',
      templateId: DEFAULT_TEMPLATE_ID,
      artCredit: 'Art by: @username',
      designCredit: 'schedule design by @you',
    },
    weekArchive: {},
    characterArt: undefined,
    characterArtTransform: { ...DEFAULT_ART_TRANSFORM },
    channelLogo: undefined,
    days: defaultDays(),
    animation: { enabled: true, sparkle: true, moon: true, glow: true, durationMs: 3000 },
    exportSettings: { presetId: DEFAULT_PRESET_ID },
  }
}

/**
 * ยกระดับ draft ที่บันทึกจากเวอร์ชันก่อนให้เข้ากับโครงสร้างใหม่ —
 * ข้อมูลตารางเดิมต้องไม่หาย และค่าที่ระบบใหม่ไม่มีต้อง fallback แบบไม่ error
 */
export function migrateScheduleData(raw: ScheduleData): ScheduleData {
  const data = { ...raw } as ScheduleData & Record<string, unknown>

  data.weekArchive = raw.weekArchive ?? {}

  // วันหยุด: เติมข้อความบรรทัดรองให้ draft เก่าที่ยังไม่มีฟิลด์นี้
  data.days = (raw.days ?? []).map((d) => ({
    ...d,
    offNote: d.offNote ?? (d.status === 'off' ? DEFAULT_OFF_NOTE : undefined),
    events: (d.events ?? []).map((e) => ({ ...e })),
  }))

  // ฟิลด์ของระบบธีม/เลย์เอาต์เดิมไม่มีอยู่แล้ว (renderer ที่วาดตารางถูกถอดออกทั้งหมด) —
  // ตัดทิ้งเพื่อไม่ให้ค้างอยู่ใน draft ที่บันทึกใหม่
  for (const k of [
    'themeId',
    'layoutTemplate',
    'decorations',
    'colorOverrides',
    'fontOverrides',
    'textScale',
    'colorPresetId',
    'fontPresetId',
    'displayFontOverride',
    'bodyFontOverride',
  ]) {
    delete (data as Record<string, unknown>)[k]
  }

  // ขนาด export เหลือสามค่า — draft ที่เก็บ template-native หรือ custom ไว้ถูกดึงกลับ
  // มาที่ค่าเริ่มต้น และตัวเลขกำหนดเองที่ค้างอยู่ถูกทิ้ง
  data.exportSettings = { presetId: normalizePresetId(raw.exportSettings?.presetId ?? '') }

  return data as ScheduleData
}

interface ScheduleStore extends ScheduleData {
  uiLanguage: 'en' | 'th'
  setUiLanguage: (lang: 'en' | 'th') => void
  selectedDay: number | null
  exporting: boolean
  lastAutosave: number | null

  setMeta: (patch: Partial<ScheduleMeta>) => void
  setCharacterArt: (url: string | undefined) => void
  setChannelLogo: (url: string | undefined) => void
  setCharacterArtTransform: (patch: Partial<ArtTransform>) => void
  resetCharacterArtTransform: () => void
  setAnimation: (patch: Partial<AnimSettings>) => void
  setExportSettings: (patch: Partial<ExportSettings>) => void
  selectDay: (i: number | null) => void
  setExporting: (v: boolean) => void
  setLastAutosave: (t: number | null) => void

  setDayStatus: (i: number, status: DayData['status']) => void
  setDayLabel: (i: number, label: string) => void
  setDayOffNote: (i: number, note: string) => void
  /** เขียนทั้งวันทับ — ใช้ตอนกด "ยกเลิก" ในหน้าต่างแก้ไขวัน เพื่อคืนค่าก่อนแก้ */
  replaceDay: (i: number, data: DayData) => void
  setCollabMembers: (i: number, members: CollabMember[]) => void

  /** ย้ายไปสัปดาห์ที่มีวันที่นี้อยู่ — เก็บตารางสัปดาห์เดิมไว้ใน archive แล้วโหลดของสัปดาห์ใหม่ถ้าเคยทำไว้ */
  setWeekStart: (iso: string) => void
  /** เลื่อนสัปดาห์ ±n */
  shiftWeek: (weeks: number) => void
  /** คัดลอกตารางจากสัปดาห์ก่อนหน้ามาทับสัปดาห์ปัจจุบัน — คืน false ถ้าไม่เคยมีข้อมูล */
  duplicateLastWeek: () => boolean
  addEvent: (i: number) => void
  updateEvent: (dayIdx: number, evId: string, patch: Partial<EventItem>) => void
  removeEvent: (dayIdx: number, evId: string) => void

  customOffPresets: string[]
  addCustomOffPreset: (p: string) => void
  removeCustomOffPreset: (p: string) => void

  hydrate: (data: ScheduleData) => void
}

export const useScheduleStore = create<ScheduleStore>((set) => ({
  ...defaultData(),
  uiLanguage: (typeof localStorage !== 'undefined' && (localStorage.getItem('vsg:uiLanguage') as 'en' | 'th')) || 'en',
  setUiLanguage: (uiLang) => {
    if (typeof localStorage !== 'undefined') localStorage.setItem('vsg:uiLanguage', uiLang)
    set(() => ({ uiLanguage: uiLang }))
  },
  selectedDay: null,
  exporting: false,
  lastAutosave: null,

  customOffPresets: (() => {
    if (typeof localStorage !== 'undefined') {
      try {
        const stored = localStorage.getItem('vsg:customOffPresets')
        if (stored) return JSON.parse(stored) as string[]
      } catch {
        // ignore JSON parse error
      }
    }
    return []
  })(),
  addCustomOffPreset: (p) => set((s) => {
    const newPresets = Array.from(new Set([...s.customOffPresets, p]))
    if (typeof localStorage !== 'undefined') localStorage.setItem('vsg:customOffPresets', JSON.stringify(newPresets))
    return { customOffPresets: newPresets }
  }),
  removeCustomOffPreset: (p) => set((s) => {
    const newPresets = s.customOffPresets.filter((x) => x !== p)
    if (typeof localStorage !== 'undefined') localStorage.setItem('vsg:customOffPresets', JSON.stringify(newPresets))
    return { customOffPresets: newPresets }
  }),

  setMeta: (patch) => set((s) => ({ meta: { ...s.meta, ...patch } })),
  setCharacterArt: (url) =>
    set(() => ({ characterArt: url, characterArtTransform: { ...DEFAULT_ART_TRANSFORM } })),
  setChannelLogo: (url) => set(() => ({ channelLogo: url })),
  setCharacterArtTransform: (patch) =>
    set((s) => ({ characterArtTransform: { ...(s.characterArtTransform ?? DEFAULT_ART_TRANSFORM), ...patch } })),
  resetCharacterArtTransform: () => set(() => ({ characterArtTransform: { ...DEFAULT_ART_TRANSFORM } })),
  setAnimation: (patch) => set((s) => ({ animation: { ...s.animation, ...patch } })),
  setExportSettings: (patch) => set((s) => ({ exportSettings: { ...s.exportSettings, ...patch } })),
  selectDay: (i) => set(() => ({ selectedDay: i })),
  setExporting: (v) => set(() => ({ exporting: v })),
  setLastAutosave: (t) => set(() => ({ lastAutosave: t })),

  setDayStatus: (i, status) =>
    set((s) => {
      const days = s.days.map((d, idx) => (idx === i ? { ...d, status } : d))
      return { days }
    }),
  setDayLabel: (i, label) =>
    set((s) => ({ days: s.days.map((d, idx) => (idx === i ? { ...d, statusLabel: label } : d)) })),
  setDayOffNote: (i, note) =>
    set((s) => ({ days: s.days.map((d, idx) => (idx === i ? { ...d, offNote: note } : d)) })),
  replaceDay: (i, data) => set((s) => ({ days: s.days.map((d, idx) => (idx === i ? data : d)) })),
  setCollabMembers: (i, members) =>
    set((s) => ({ days: s.days.map((d, idx) => (idx === i ? { ...d, collabMembers: members } : d)) })),

  setWeekStart: (iso) =>
    set((s) => {
      const nextKey = toISO(mondayOf(iso))
      const curKey = toISO(mondayOf(s.meta.startDate))
      if (nextKey === curKey) return { meta: { ...s.meta, startDate: nextKey } }

      // เก็บสัปดาห์ที่กำลังจะออกไว้ แล้วโหลดสัปดาห์ปลายทางถ้าเคยแก้ไว้
      const archive = { ...s.weekArchive, [curKey]: s.days }
      const restored = archive[nextKey]
      return {
        meta: { ...s.meta, startDate: nextKey },
        weekArchive: archive,
        days: restored ? restored.map((d) => ({ ...d })) : s.days,
        selectedDay: null,
      }
    }),
  shiftWeek: (weeks) => {
    const s = useScheduleStore.getState()
    const d = mondayOf(s.meta.startDate)
    d.setDate(d.getDate() + weeks * 7)
    s.setWeekStart(toISO(d))
  },
  duplicateLastWeek: () => {
    const s = useScheduleStore.getState()
    const prev = mondayOf(s.meta.startDate)
    prev.setDate(prev.getDate() - 7)
    const source = s.weekArchive[toISO(prev)]
    if (!source) return false
    // deep clone + id ใหม่ กัน event id ชนกันระหว่างสัปดาห์
    set(() => ({
      days: source.map((d) => ({ ...d, events: d.events.map((e) => ({ ...e, id: uid() })) })),
      selectedDay: null,
    }))
    return true
  },
  addEvent: (i) =>
    set((s) => ({
      days: s.days.map((d, idx) =>
        idx === i && d.events.length < 2
          ? { ...d, events: [...d.events, defaultEvent('youtube', s.uiLanguage === 'th' ? 'รายการใหม่' : 'New Event', '20:00')] }
          : d,
      ),
    })),
  updateEvent: (dayIdx, evId, patch) =>
    set((s) => ({
      days: s.days.map((d, idx) =>
        idx === dayIdx
          ? { ...d, events: d.events.map((e) => (e.id === evId ? { ...e, ...patch } : e)) }
          : d,
      ),
    })),
  removeEvent: (dayIdx, evId) =>
    set((s) => ({
      days: s.days.map((d, idx) =>
        idx === dayIdx ? { ...d, events: d.events.filter((e) => e.id !== evId) } : d,
      ),
    })),

  hydrate: (data) =>
    set(() => {
      const base = defaultData()
      const migrated = migrateScheduleData(data)
      return {
        ...base,
        ...migrated,
        meta: { ...base.meta, ...migrated.meta },
        selectedDay: null,
        exporting: false,
      }
    }),
}))

/** ดึง state ส่วนที่ serialize ได้ (สำหรับ draft/autosave) */
export function snapshot(s: ScheduleStore): ScheduleData {
  return {
    meta: s.meta,
    weekArchive: s.weekArchive,
    characterArt: s.characterArt,
    characterArtTransform: s.characterArtTransform,
    channelLogo: s.channelLogo,
    days: s.days,
    animation: s.animation,
    exportSettings: s.exportSettings,
  }
}

/** บันทึก Draft ปัจจุบันลงระบบจัดเก็บข้อมูลอย่างรวดเร็ว */
export async function quickSaveDraft(): Promise<void> {
  const state = useScheduleStore.getState()
  const meta = state.meta
  const dates = weekDays(meta.startDate)
  const draftName = `${meta.channelName || 'schedule'} • ${monthRangeLabel(dates[0], dates[6], meta.language)} ${weekRangeLabel(dates[0], dates[6])} ${yearLabel(dates[0], meta.language)}`

  let drafts: DraftEntry[] = []
  if (window.api?.store) {
    drafts = (await window.api.store.get('vsg:drafts')) ?? []
  } else {
    drafts = (await get<DraftEntry[]>('vsg:drafts')) ?? []
  }

  const newDraft: DraftEntry = {
    id: uid(),
    name: draftName,
    savedAt: Date.now(),
    state: snapshot(state),
  }

  const updated = [newDraft, ...drafts].slice(0, 30)

  if (window.api?.store) {
    await window.api.store.set('vsg:drafts', updated)
  } else {
    await set('vsg:drafts', updated)
  }
}
