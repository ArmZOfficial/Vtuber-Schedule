/**
 * โครงหน้าจอใหม่ "Quiet Studio" (แผน UX/UI ข้อ 7)
 *
 * ┌───────────────────────────────────────────────────────────────┐
 * │ titlebar 36px  VSG │ ↶ ↷ │        บันทึกแล้ว 14:32 │ ☾ │ ─ □ ✕ │
 * ├────┬────────────────────┬─────────────────────────────────────┤
 * │rail│ EditorPanel        │ 1920×1080 │ แอป:TH การ์ด:TH │ Export│
 * │48px│ 280–520px (ลากได้) ├─────────────────────────────────────┤
 * │    │ หัวแท็บติดหนึบ      │  พื้น sunken + การ์ดลอยพร้อมเงา     │
 * └────┴────────────────────┴─────────────────────────────────────┘
 *
 * สาขา desktop กับ mobile รวมเป็นชุดเดียวแล้ว — แถบพรีวิวและแผงแก้ไขเป็น component
 * ตัวเดียวกันทั้งสองขนาด ต่างกันแค่ทิศทางการวาง (แก้ปัญหาข้อ 2.3.12)
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import type Konva from 'konva'
import { Globe, Moon, Redo2, Sun, Undo2 } from 'lucide-react'
import { LANG_NAME } from './data/labels'
import { useScheduleStore } from './store/scheduleStore'
import { undo, redo, useHistoryMeta, type ChangeLabel } from './store/history'
import { useTranslation, type Translations } from './i18n/translations'
import { DAY_FULL_EN, DAY_FULL_TH } from './data/labels'
import { ErrorBoundary } from './components/ErrorBoundary'
import { EditorPanel } from './components/editor/EditorPanel'
import { IconRail, MobileTabBar, type Tab } from './components/editor/IconRail'
import { StageArea } from './components/editor/StageArea'
import { HelpSheet } from './components/editor/HelpSheet'
import { FirstRunSheet } from './components/editor/FirstRunSheet'
import { Toaster } from './components/editor/toast'
import { IconButton, Tip } from './components/editor/ui'

const PANEL_KEY = 'vsg:panelWidth'
const PANEL_MIN = 280
const PANEL_MAX = 520
const PANEL_DEFAULT = 380

export interface ShellProps {
  stageRef: React.RefObject<Konva.Stage | null>
  activeTab: Tab
  onTabChange: (t: Tab) => void
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  isMaximized: boolean
}

/* ═════════════════════════ titlebar ═════════════════════════ */

function StatusPill() {
  const uiLanguage = useScheduleStore((s) => s.uiLanguage)
  const lastAutosave = useScheduleStore((s) => s.lastAutosave)
  const t = useTranslation(uiLanguage)

  return (
    <span className="font-mono text-micro tabular-nums text-ink-faint">
      {lastAutosave
        ? `${t.savedAt} ${new Date(lastAutosave).toLocaleTimeString(uiLanguage === 'th' ? 'th-TH' : 'en-US', {
            hour: '2-digit',
            minute: '2-digit',
          })}`
        : t.loading}
    </span>
  )
}

function WindowButton({
  label,
  onClick,
  danger,
  children,
}: {
  label: string
  onClick: () => void
  danger?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`titlebar-nodrag flex h-9 w-11 items-center justify-center text-ink transition ${
        danger ? 'hover:bg-danger hover:text-on-accent' : 'hover:bg-raised'
      }`}
    >
      {children}
    </button>
  )
}

/**
 * "เลิกทำ" เฉย ๆ ไม่บอกอะไรเลยว่ากดแล้วจะเสียอะไรไป tooltip จึงต่อท้ายด้วยชื่อก้าว
 * (แผนข้อ 7.2.2) — ต่อท้าย ไม่ใช่แทนที่ เพราะคำกริยาเดิมพ่วงคีย์ลัดมาด้วยแล้ว
 * ถ้ายังไม่มีอะไรให้ย้อน ก็เหลือแค่คำกริยาเหมือนเดิม
 */
function historyTip(verb: string, label: ChangeLabel | null, t: Translations, th: boolean) {
  if (!label) return verb
  const days = th ? DAY_FULL_TH : DAY_FULL_EN
  const what =
    label.key === 'histDay' && label.day !== undefined
      ? t.histDay.replace('{day}', days[label.day] ?? '')
      : t[label.key]
  return `${verb} — ${what}`
}

/**
 * สลับภาษาเมนู — ลูกโลก + รหัสภาษาที่ใช้อยู่ (เจ้าของงานสั่งเปลี่ยน 26 ส.ค. 2026)
 *
 * เดิมเป็นแถบ TH/EN คู่กับแถบภาษาการ์ดอยู่กลางแถบพรีวิว ซึ่งหน้าตาเหมือนกันเป๊ะ
 * สองอัน แยกไม่ออกว่าอันไหนเปลี่ยนเมนูอันไหนเปลี่ยนการ์ด ลูกโลกบอกได้ในตัวว่า
 * "นี่คือภาษา" และการวางไว้ข้างปุ่มธีมจัดมันเข้ากลุ่ม "ตั้งค่าตัวโปรแกรม" ถูกที่
 *
 * มีสองภาษาจึงเป็นปุ่มสลับไปมา ไม่ใช่เมนู — กดหนึ่งครั้งจบ
 */
function LangButton() {
  const uiLanguage = useScheduleStore((s) => s.uiLanguage)
  const setUiLanguage = useScheduleStore((s) => s.setUiLanguage)
  const t = useTranslation(uiLanguage)
  const next = uiLanguage === 'th' ? 'en' : 'th'
  // ชื่อภาษาเขียนด้วยภาษานั้นเอง — คนที่เผลอตั้งเป็นภาษาที่อ่านไม่ออกยังหาทางกลับเจอ
  const label = t.langSwitch.replace('{lang}', LANG_NAME[next])

  return (
    <Tip label={label} side="bottom">
      <button
        type="button"
        onClick={() => setUiLanguage(next)}
        aria-label={label}
        className="tap-min flex h-[var(--control-sm)] items-center gap-1 rounded-btn border border-transparent px-1.5 text-ink-muted transition hover:bg-raised hover:text-ink"
      >
        <Globe size={14} aria-hidden />
        <span className="font-mono text-micro font-bold uppercase">{uiLanguage}</span>
      </button>
    </Tip>
  )
}

export function TitleBar({ theme, onToggleTheme, isMaximized }: Pick<ShellProps, 'theme' | 'onToggleTheme' | 'isMaximized'>) {
  const uiLanguage = useScheduleStore((s) => s.uiLanguage)
  const t = useTranslation(uiLanguage)
  const canUndo = useHistoryMeta((s) => s.canUndo)
  const canRedo = useHistoryMeta((s) => s.canRedo)
  const undoLabel = useHistoryMeta((s) => s.undoLabel)
  const redoLabel = useHistoryMeta((s) => s.redoLabel)
  const th = uiLanguage === 'th'

  return (
    <header className="titlebar-drag flex h-9 shrink-0 items-center justify-between border-b border-line bg-surface pl-3">
      <div className="flex items-center gap-2">
        <Tip label={`${t.appTitle} — ${t.appSubtitle}`} side="bottom">
          <span className="font-display text-body font-bold tracking-tight text-ink">{t.appShort}</span>
        </Tip>

        {/* gap 4px ขั้นต่ำ — พื้นที่กดของปุ่ม sm ขยายออกข้างละ 2px (ดู .tap-min) */}
        <div className="titlebar-nodrag flex items-center gap-1">
          <IconButton
            label={historyTip(t.undo, canUndo ? undoLabel : null, t, th)}
            side="bottom"
            size="sm"
            disabled={!canUndo}
            onClick={() => undo()}
            icon={<Undo2 size={15} />}
          />
          <IconButton
            label={historyTip(t.redo, canRedo ? redoLabel : null, t, th)}
            side="bottom"
            size="sm"
            disabled={!canRedo}
            onClick={() => redo()}
            icon={<Redo2 size={15} />}
          />
        </div>
      </div>

      <div className="titlebar-nodrag flex h-full items-center gap-2">
        {/* สถานะบันทึกต้องเห็นเสมอ ไม่ซ่อนตามความกว้าง (ข้อ 7.2.3) */}
        <StatusPill />
        <LangButton />
        <IconButton
          label={theme === 'light' ? t.themeSwitchDark : t.themeSwitchLight}
          side="bottom"
          size="sm"
          onClick={onToggleTheme}
          icon={theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
        />
        <div className="ml-1 flex h-full items-center">
          <WindowButton label={t.winMinimize} onClick={() => window.api?.window?.minimize()}>
            <svg width="10" height="1" viewBox="0 0 10 1" fill="currentColor" aria-hidden>
              <rect width="10" height="1" />
            </svg>
          </WindowButton>
          <WindowButton
            label={isMaximized ? t.winRestore : t.winMaximize}
            onClick={() => window.api?.window?.maximize()}
          >
            {isMaximized ? (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" aria-hidden>
                <path d="M2.5 2.5v-2h7v7h-2M0.5 2.5h7v7h-7z" />
              </svg>
            ) : (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" aria-hidden>
                <rect x="0.5" y="0.5" width="9" height="9" />
              </svg>
            )}
          </WindowButton>
          <WindowButton danger label={t.winClose} onClick={() => window.api?.window?.close()}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" aria-hidden>
              <path d="M0.5 0.5L9.5 9.5" />
              <path d="M9.5 0.5L0.5 9.5" />
            </svg>
          </WindowButton>
        </div>
      </div>
    </header>
  )
}

/* ═════════════════════════ เลย์เอาต์กว้าง/แคบ ═════════════════════════ */

/**
 * ≥768px = วางแบบเดสก์ท็อป (แถบเมนูซ้าย) ต่ำกว่านั้น = วางแบบมือถือ (แถบล่าง)
 *
 * เดิมอ่าน `window.innerWidth` ตอน render แรกครั้งเดียวแล้วรอ event `resize` มาแก้
 * ปัญหาคือหน้าต่างที่ยังจัดขนาดตัวเองไม่เสร็จตอนสคริปต์รันจะให้ค่าผิด แล้วถ้าไม่มี
 * `resize` ตามมาเลย จอกว้างก็จะค้างอยู่กับเลย์เอาต์มือถือจนกว่าผู้ใช้จะลากหน้าต่างเอง
 *
 * `matchMedia` ยิง event ทุกครั้งที่ "ผลของเงื่อนไข" เปลี่ยนจริง และการ sync ซ้ำใน
 * effect ปิดช่องว่างระหว่าง render แรกกับตอนที่หน้าต่างนิ่งแล้ว
 */
export function useWideLayout() {
  const [wide, setWide] = useState(() =>
    typeof window === 'undefined' ? true : window.matchMedia('(min-width: 768px)').matches,
  )

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const sync = () => setWide(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  return wide
}

/* ═════════════════════════ ขอบลากปรับความกว้าง ═════════════════════════ */

function ResizeHandle({ onDelta, onReset }: { onDelta: (dx: number) => void; onReset: () => void }) {
  const uiLanguage = useScheduleStore((s) => s.uiLanguage)
  const tr = useTranslation(uiLanguage)
  const start = useRef<number | null>(null)

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={tr.panelResizeAria}
      tabIndex={0}
      onDoubleClick={onReset}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') onDelta(-16)
        if (e.key === 'ArrowRight') onDelta(16)
      }}
      onPointerDown={(e) => {
        start.current = e.clientX
        ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
      }}
      onPointerMove={(e) => {
        if (start.current === null) return
        onDelta(e.clientX - start.current)
        start.current = e.clientX
      }}
      onPointerUp={() => {
        start.current = null
      }}
      className="group relative w-1 shrink-0 cursor-col-resize bg-line transition hover:bg-accent"
    >
      <span className="absolute inset-y-0 -left-1 -right-1" aria-hidden />
    </div>
  )
}

/* ═════════════════════════ shell ═════════════════════════ */

export function AppShell({ stageRef, activeTab, onTabChange, theme, onToggleTheme, isMaximized }: ShellProps) {
  const [help, setHelp] = useState(false)
  const wide = useWideLayout()

  const [panelWidth, setPanelWidth] = useState(() => {
    const stored = Number(localStorage.getItem(PANEL_KEY))
    return Number.isFinite(stored) && stored >= PANEL_MIN && stored <= PANEL_MAX ? stored : PANEL_DEFAULT
  })

  const applyWidth = useCallback((next: number) => {
    const clamped = Math.min(PANEL_MAX, Math.max(PANEL_MIN, Math.round(next)))
    setPanelWidth(clamped)
    localStorage.setItem(PANEL_KEY, String(clamped))
  }, [])

  // F1 เปิดวิธีใช้ — คีย์ลัดที่ทุกโปรแกรมบนวินโดวส์ใช้เหมือนกัน
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault()
        setHelp(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const panel = (
    <ErrorBoundary inline>
      <EditorPanel stageRef={stageRef} activeTab={activeTab} />
    </ErrorBoundary>
  )

  return (
    <div className="flex h-screen flex-col bg-canvas text-ink">
      <TitleBar theme={theme} onToggleTheme={onToggleTheme} isMaximized={isMaximized} />

      {wide ? (
        <div className="flex min-h-0 flex-1">
          <IconRail activeTab={activeTab} onTabChange={onTabChange} onHelp={() => setHelp(true)} />
          <aside className="flex shrink-0 flex-col bg-surface" style={{ width: panelWidth }}>
            {panel}
          </aside>
          <ResizeHandle onDelta={(dx) => applyWidth(panelWidth + dx)} onReset={() => applyWidth(PANEL_DEFAULT)} />
          <StageArea stageRef={stageRef} />
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="h-[42vh] shrink-0 border-b border-line">
            <StageArea stageRef={stageRef} />
          </div>
          <div className="min-h-0 flex-1 bg-surface">{panel}</div>
          <MobileTabBar activeTab={activeTab} onTabChange={onTabChange} onHelp={() => setHelp(true)} />
        </div>
      )}

      <HelpSheet open={help} onClose={() => setHelp(false)} />
      <FirstRunSheet onPickTemplate={() => onTabChange('template')} />
      <Toaster />
    </div>
  )
}
