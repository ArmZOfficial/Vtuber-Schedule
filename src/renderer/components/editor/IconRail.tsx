/**
 * แถบเมนูซ้ายมือ — ไอคอน + ชื่อเมนู
 *
 * เดิมเป็นไอคอนล้วน 48px ตามแผนข้อ 7.3.1 โดยหวังพึ่ง tooltip แต่ tooltip ต้อง "เอาเมาส์
 * ไปจ่อค้าง" ถึงจะเห็น คนที่เพิ่งเปิดโปรแกรมครั้งแรกจึงต้องไล่จ่อทีละปุ่มเพื่อรู้ว่า
 * แต่ละอันคืออะไร ตอนนี้ชื่อเมนูอยู่ใต้ไอคอนตลอดเวลา อ่านครั้งเดียวจบ
 * (เจ้าของงานสั่งเปลี่ยน 26 ส.ค. 2026 — ทับข้อ 7.3.1 ของแผน)
 *
 * ทุกปุ่มทรงเดียวกัน กลุ่มแยกด้วยเส้นคั่น ตัวชี้ว่าเลือกอยู่คือแถบ 2px ชิดซ้าย
 * + พื้น accent-soft ไม่ใช้ gradient
 */
import type { ReactNode } from 'react'
import {
  Settings2,
  CalendarDays,
  LayoutTemplate,
  ImagePlus,
  Download,
  FileText,
  HelpCircle,
} from 'lucide-react'
import { useScheduleStore } from '../../store/scheduleStore'
import { useTranslation, type Translations } from '../../i18n/translations'

export type Tab = 'general' | 'schedule' | 'template' | 'assets' | 'export' | 'drafts'

interface NavItem {
  id: Tab
  labelKey: keyof Translations
  icon: ReactNode
}

/** ลำดับบนแถบ — General อยู่บนสุดตามที่เจ้าของงานสั่ง */
export const CONTENT_TABS: NavItem[] = [
  { id: 'general', labelKey: 'tabGeneral', icon: <Settings2 size={18} /> },
  { id: 'template', labelKey: 'tabTemplate', icon: <LayoutTemplate size={18} /> },
  { id: 'schedule', labelKey: 'tabSchedule', icon: <CalendarDays size={18} /> },
  { id: 'assets', labelKey: 'tabAssets', icon: <ImagePlus size={18} /> },
]

export const ACTION_TABS: NavItem[] = [
  { id: 'export', labelKey: 'tabExport', icon: <Download size={18} /> },
  { id: 'drafts', labelKey: 'tabDrafts', icon: <FileText size={18} /> },
]

/** ลำดับเดียวกับที่เห็นบนแถบ ใช้กับคีย์ลัด Ctrl+1 … Ctrl+6 */
export const TAB_ORDER: Tab[] = [...CONTENT_TABS, ...ACTION_TABS].map((t) => t.id)

function RailButton({
  label,
  icon,
  active,
  onClick,
}: {
  label: string
  icon: ReactNode
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      title={label}
      className={`relative flex w-full flex-col items-center justify-center gap-1 rounded-btn px-1 py-2 outline-none transition ${
        active ? 'bg-accent-soft text-accent' : 'text-ink-muted hover:bg-raised hover:text-ink'
      }`}
    >
      {active && (
        <span aria-hidden className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-r-full bg-accent" />
      )}
      {icon}
      {/* ชื่อยาวกว่ากรอบให้ตัดด้วย … แทนที่จะดันแถบให้กว้างตามภาษาที่ยาวที่สุด
          `title` ข้างบนยังบอกชื่อเต็มอยู่ */}
      <span className="w-full truncate text-center text-micro font-medium leading-none">{label}</span>
    </button>
  )
}

export function IconRail({
  activeTab,
  onTabChange,
  onHelp,
}: {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
  onHelp: () => void
}) {
  const uiLanguage = useScheduleStore((s) => s.uiLanguage)
  const tr = useTranslation(uiLanguage)

  return (
    <nav
      aria-label={tr.navAria}
      className="flex h-full w-[76px] shrink-0 flex-col items-center gap-0.5 border-r border-line bg-surface px-1.5 py-2"
    >
      <div className="flex w-full flex-col gap-0.5" role="tablist">
        {CONTENT_TABS.map((t) => (
          <RailButton
            key={t.id}
            label={tr[t.labelKey]}
            icon={t.icon}
            active={activeTab === t.id}
            onClick={() => onTabChange(t.id)}
          />
        ))}
      </div>

      <div className="my-1.5 h-px w-8 shrink-0 bg-line" />

      <div className="flex w-full flex-col gap-0.5" role="tablist">
        {ACTION_TABS.map((t) => (
          <RailButton
            key={t.id}
            label={tr[t.labelKey]}
            icon={t.icon}
            active={activeTab === t.id}
            onClick={() => onTabChange(t.id)}
          />
        ))}
      </div>

      <div className="flex-1" />

      <RailButton label={tr.helpShort} icon={<HelpCircle size={18} />} active={false} onClick={onHelp} />
    </nav>
  )
}

/** แถบแท็บล่างสำหรับหน้าต่างแคบ — รายการชุดเดียวกับ rail ไม่ได้เขียนซ้ำ */
export function MobileTabBar({
  activeTab,
  onTabChange,
  onHelp,
}: {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
  onHelp: () => void
}) {
  const uiLanguage = useScheduleStore((s) => s.uiLanguage)
  const tr = useTranslation(uiLanguage)

  return (
    <nav
      aria-label={tr.mobileNavAria}
      className="mobile-tab-bar flex h-14 shrink-0 items-stretch justify-around border-t border-line bg-surface"
    >
      {[...CONTENT_TABS, ...ACTION_TABS].map((t) => {
        const active = activeTab === t.id
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onTabChange(t.id)}
            aria-current={active ? 'page' : undefined}
            className={`flex min-w-[48px] flex-col items-center justify-center gap-0.5 px-1 text-micro font-medium transition ${
              active ? 'text-accent' : 'text-ink-muted'
            }`}
          >
            {t.icon}
            <span className="max-w-[56px] truncate">{tr[t.labelKey]}</span>
          </button>
        )
      })}
      <button
        type="button"
        onClick={onHelp}
        aria-label={tr.helpTitle}
        className="flex min-w-[48px] flex-col items-center justify-center gap-0.5 px-1 text-micro font-medium text-ink-muted"
      >
        <HelpCircle size={18} />
        <span className="max-w-[56px] truncate">{tr.helpShort}</span>
      </button>
    </nav>
  )
}
