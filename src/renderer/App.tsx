/**
 * ตัวเลือกโครงหน้าจอ + สมองส่วนที่อยู่เหนือทุกโครง (แผน UX/UI เฟส 3.1–3.4)
 *
 * ไฟล์นี้ไม่วาดหน้าตาอะไรเองแล้ว หน้าที่เหลืออย่างเดียวคือ
 *   1. ถือ state ระดับแอปที่ทั้งสองโครงใช้ร่วมกัน — แท็บ ธีม สถานะขยายหน้าต่าง
 *   2. เดินเรื่อง lifecycle — คืนค่า autosave, เปิด history, เซฟอัตโนมัติ, คีย์ลัด
 *   3. เลือกว่าจะเรนเดอร์ `AppShell` (ใหม่) หรือ `LegacyShell` (เก่า)
 *
 * สวิตช์คือ `localStorage['vsg:ui']` ค่า `'v1'` = โครงเดิม อย่างอื่น = โครงใหม่
 * ตั้งค่าแล้วรีเฟรชก็สลับได้ทันที ไม่ต้อง build ใหม่ (แผนข้อ 10 เฟส 3.8)
 *
 * ห้ามย้าย logic เหล่านี้ลงไปในโครงใดโครงหนึ่ง ไม่งั้นการสลับโครงจะทำให้ autosave
 * หรือ undo/redo หายไปเงียบ ๆ — ทั้งคู่ต้องได้พฤติกรรมเดียวกันเป๊ะ
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import type Konva from 'konva'
import { useScheduleStore, snapshot, quickSaveDraft } from './store/scheduleStore'
import { loadAutosave, saveAutosave } from './store/autosave'
import { initHistory, undo, redo, stateSignature } from './store/history'
import { TAB_ORDER, type Tab } from './components/editor/IconRail'
import { toast } from './components/editor/toast'
import { useTranslation } from './i18n/translations'
import { AppShell } from './AppShell'
import { LegacyShell } from './LegacyShell'

/** โครงเดิมเป็นทางถอย ต้องขอเท่านั้นถึงจะได้ ค่าปกติคือโครงใหม่ */
function useLegacyShell() {
  return typeof window !== 'undefined' && localStorage.getItem('vsg:ui') === 'v1'
}

/**
 * ธีมสว่าง/มืด — ชื่อคีย์ `vsg:theme` ต้องคงเดิมตลอดไป ผู้ใช้ที่เคยตั้งค่าไว้แล้ว
 * จะได้ไม่เด้งกลับธีมสว่างโดยไม่รู้สาเหตุ (ความเสี่ยงข้อ 12.7)
 */
function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light'
    const stored = localStorage.getItem('vsg:theme')
    if (stored === 'dark' || stored === 'light') return stored
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    window.api?.theme?.setSource(theme)
  }, [theme])

  const toggle = () => {
    setTheme((cur) => {
      const next = cur === 'light' ? 'dark' : 'light'
      localStorage.setItem('vsg:theme', next)
      return next
    })
  }

  return { theme, toggle }
}

/** ปุ่มขยาย/คืนขนาดต้องสลับรูปตามสถานะจริงของหน้าต่าง ไม่ใช่เดาจากการกดครั้งล่าสุด */
function useMaximized() {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    const cleanup = window.api?.window?.onMaximizeChange?.(setIsMaximized)
    return () => {
      if (typeof cleanup === 'function') cleanup()
    }
  }, [])

  return isMaximized
}

export default function App() {
  const stageRef = useRef<Konva.Stage | null>(null)
  const legacy = useLegacyShell()

  const setLastAutosave = useScheduleStore((s) => s.setLastAutosave)
  const selectedDay = useScheduleStore((s) => s.selectedDay)
  const selectDay = useScheduleStore((s) => s.selectDay)
  const uiLanguage = useScheduleStore((s) => s.uiLanguage)
  const t = useTranslation(uiLanguage)

  const [activeTab, setActiveTab] = useState<Tab>('template')
  const { theme, toggle: toggleTheme } = useTheme()
  const isMaximized = useMaximized()

  /**
   * เลือกแท็บ = ออกจากโหมดแก้วันเสมอ
   *
   * แผงแก้วันกินที่ของเนื้อหาแท็บทั้งใบ และมันเปิดอยู่ตราบใดที่ `selectedDay` ยังไม่ว่าง
   * ถ้าเปลี่ยนแค่ `activeTab` เฉย ๆ ปุ่มบนแถบเมนูจะดูเหมือนกดไม่ติด — กดแล้วหน้าจอ
   * ไม่ขยับเลยเพราะแผงแก้วันยังทับอยู่ ทุกทางที่เปลี่ยนแท็บจึงต้องผ่านตัวนี้
   */
  const goToTab = useCallback(
    (tab: Tab) => {
      useScheduleStore.getState().selectDay(null)
      setActiveTab(tab)
    },
    [],
  )

  // คืนค่างานล่าสุดตอนเปิดแอป แล้วค่อยเปิด history — ไม่งั้นการคืนค่าจะกลายเป็น
  // ก้าวแรกของ undo stack และกด Ctrl+Z ครั้งเดียวงานหายทั้งหมด
  useEffect(() => {
    const boot = async () => {
      const data = await loadAutosave()
      if (data) useScheduleStore.getState().hydrate(data)
      // ตัวเทียบผลเรนเดอร์ต้องมาทีหลังสุด จะได้ไม่ถูกค่าที่คืนมาทับ
      const { applyRenderTestFromHash } = await import('./utils/renderTest')
      applyRenderTestFromHash()
      setLastAutosave(Date.now())
      initHistory()
    }
    boot()
  }, [setLastAutosave])

  // เซฟอัตโนมัติลง IndexedDB — หน่วง 1200ms และเทียบลายเซ็นก่อนเขียน
  // ถ้าเขียนทุกครั้งที่ store ขยับ การเซฟจะไปปลุก subscribe ของตัวเองเป็นวงวน
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    let lastSavedSig = stateSignature(snapshot(useScheduleStore.getState()))

    const unsub = useScheduleStore.subscribe(() => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        const data = snapshot(useScheduleStore.getState())
        const sig = stateSignature(data)
        if (sig === lastSavedSig) return
        lastSavedSig = sig
        saveAutosave(data)
        setLastAutosave(Date.now())
      }, 1200)
    })
    return () => {
      unsub()
      clearTimeout(timer)
    }
  }, [setLastAutosave])

  // คีย์ลัดระดับแอป — รายการเดียวกับที่แผ่นวิธีใช้ประกาศไว้ (HelpSheet)
  // ส่วน Ctrl+0 / Ctrl+Alt+1 อยู่ที่ StageArea และ Ctrl+Enter อยู่ที่ DayEditPanel
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      const isInput =
        !!el && (['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName) || el.isContentEditable)
      const mod = e.ctrlKey || e.metaKey

      if (mod && !e.altKey && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        if (isInput) return
        e.preventDefault()
        undo()
        return
      }
      if (mod && !e.altKey && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
        if (isInput) return
        e.preventDefault()
        redo()
        return
      }
      if (mod && e.key.toLowerCase() === 's') {
        e.preventDefault()
        quickSaveDraft().then(() => toast(t.draftSavedToast))
        return
      }
      if (mod && e.key.toLowerCase() === 'e') {
        e.preventDefault()
        setActiveTab('export')
        return
      }
      // Ctrl+1…6 = สลับแท็บตามลำดับที่แถบไอคอนวางไว้
      // กัน Alt ไว้เพราะ Ctrl+Alt+1 เป็นคีย์ซูมขนาดจริงของพื้นที่พรีวิว
      if (mod && !e.altKey && !e.shiftKey && /^[1-6]$/.test(e.key)) {
        const next = TAB_ORDER[Number(e.key) - 1]
        if (next) {
          e.preventDefault()
          goToTab(next)
        }
        return
      }
      if (e.key === 'Escape') selectDay(null)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [t, selectDay, goToTab])

  // คลิกแถววันบนการ์ด = เปิดแผงแก้วันนั้น ซึ่งอยู่ในกลุ่มเดียวกับแท็บตาราง
  // หัวแผงจึงต้องบอกว่าอยู่ "ตาราง" ไม่ใช่ค้างชื่อแท็บก่อนหน้า
  useEffect(() => {
    if (selectedDay !== null) setActiveTab('schedule')
  }, [selectedDay])

  const shellProps = {
    stageRef,
    activeTab,
    onTabChange: goToTab,
    theme,
    onToggleTheme: toggleTheme,
    isMaximized,
  }

  return legacy ? <LegacyShell {...shellProps} /> : <AppShell {...shellProps} />
}
