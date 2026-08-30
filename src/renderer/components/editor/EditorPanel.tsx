/**
 * แผงแก้ไข — หัวติดหนึบบอกว่าอยู่แท็บไหน เนื้อหาเลื่อนข้างใน (แผนข้อ 7.4.3)
 *
 * เมื่อมีวันถูกเลือก แผงทั้งใบสลับเป็นโหมด "แก้วัน" แทนที่จะเปิด modal ทับพรีวิว
 * (ข้อ 7.6) — `selectedDay` เป็นตัวสลับตัวเดียว เหมือนเดิมทุกประการ
 */
import type Konva from 'konva'
import { useScheduleStore } from '../../store/scheduleStore'
import { useTranslation, type Translations } from '../../i18n/translations'
import type { Tab } from './IconRail'
import { DayEditPanel } from './DayEditPanel'
import { Panel } from './ui'
import { GeneralTab } from './tabs/GeneralTab'
import { ScheduleTab } from './tabs/ScheduleTab'
import { TemplateTab } from './tabs/TemplateTab'
import { AssetsTab } from './tabs/AssetsTab'
import { ExportTab } from './tabs/ExportTab'
import { DraftsTab } from './tabs/DraftsTab'

const TAB_TITLE: Record<Tab, keyof Translations> = {
  general: 'tabGeneral',
  schedule: 'tabSchedule',
  template: 'tabTemplate',
  assets: 'tabAssets',
  export: 'tabExport',
  drafts: 'tabDrafts',
}

export function EditorPanel({
  stageRef,
  activeTab,
}: {
  stageRef: React.RefObject<Konva.Stage | null>
  activeTab: Tab
}) {
  const selectedDay = useScheduleStore((s) => s.selectedDay)
  const uiLanguage = useScheduleStore((s) => s.uiLanguage)
  const tr = useTranslation(uiLanguage)

  if (selectedDay !== null) return <DayEditPanel key={selectedDay} index={selectedDay} />

  return (
    <Panel title={tr[TAB_TITLE[activeTab]]}>
      {activeTab === 'general' && <GeneralTab />}
      {activeTab === 'schedule' && <ScheduleTab />}
      {activeTab === 'template' && <TemplateTab />}
      {activeTab === 'assets' && <AssetsTab />}
      {activeTab === 'export' && <ExportTab stageRef={stageRef} />}
      {activeTab === 'drafts' && <DraftsTab stageRef={stageRef} />}
    </Panel>
  )
}
