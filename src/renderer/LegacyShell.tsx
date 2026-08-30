/**
 * โครงหน้าจอแบบเดิม — ทางถอย ไม่ใช่ของหลัก (แผนเฟส 3.1)
 *
 * เปิดด้วย `localStorage['vsg:ui'] = 'v1'` แล้วรีเฟรช ค่าเริ่มต้นคือ `v2` ซึ่งเป็น
 * โครงใหม่ใน `AppShell.tsx` เก็บอันนี้ไว้เผื่อว่าโครงใหม่มีปัญหาบนเครื่องผู้ใช้จริง
 * จะได้ยังทำงานต่อได้โดยไม่ต้อง build ใหม่
 *
 * ตัวมันเองใช้ token ชุดใหม่และ primitive ชุดใหม่หมดแล้ว ต่างจาก v2 แค่เรื่องโครง:
 * แผงกว้างคงที่ ไม่มีซูม/เลื่อนพรีวิว และปุ่ม export อยู่ในแท็บอย่างเดียว
 */
import { useEffect, useRef, useState } from 'react'
import { MousePointerClick } from 'lucide-react'
import { ScheduleStage } from './components/canvas/ScheduleStage'
import { ErrorBoundary } from './components/ErrorBoundary'
import { EditorPanel } from './components/editor/EditorPanel'
import { IconRail, MobileTabBar } from './components/editor/IconRail'
import { HelpSheet } from './components/editor/HelpSheet'
import { Toaster } from './components/editor/toast'
import { SegmentedControl, Toolbar } from './components/editor/ui'
import { TitleBar, useWideLayout, type ShellProps } from './AppShell'
import { useScheduleStore } from './store/scheduleStore'
import { getTemplate } from './template/layout.schema'
import { exportDims } from './utils/layout'
import { rafThrottle } from './utils/rafThrottle'
import { fitScale, quantizeScale } from './utils/zoom'
import { LANG_NAME } from './data/labels'
import type { Lang } from './types'
import { useTranslation } from './i18n/translations'

/** ย่อ stage ให้พอดีพื้นที่พรีวิว — ไม่มีซูม ไม่มีเลื่อน เหมือนของเดิมทุกประการ */
function FitStage({
  stageRef,
  stageW,
  stageH,
}: {
  stageRef: ShellProps['stageRef']
  stageW: number
  stageH: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState({ w: 0, h: 0 })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const apply = rafThrottle((w: number, h: number) =>
      setBox((prev) => (prev.w === w && prev.h === h ? prev : { w, h })),
    )
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect
      apply(Math.round(r.width), Math.round(r.height))
    })
    ro.observe(el)
    return () => {
      ro.disconnect()
      apply.cancel()
    }
  }, [])

  const scale = quantizeScale(fitScale(box.w, box.h, stageW, stageH))

  return (
    <div ref={ref} className="relative flex h-full w-full items-center justify-center overflow-hidden">
      <div
        className="stage-checker relative shadow-stage"
        style={{ width: Math.round(stageW * scale), height: Math.round(stageH * scale) }}
      >
        <ErrorBoundary>
          <ScheduleStage ref={stageRef} previewScale={scale} />
        </ErrorBoundary>
      </div>
    </div>
  )
}

export function LegacyShell({
  stageRef,
  activeTab,
  onTabChange,
  theme,
  onToggleTheme,
  isMaximized,
}: ShellProps) {
  const uiLanguage = useScheduleStore((s) => s.uiLanguage)
  const cardLanguage = useScheduleStore((s) => s.meta.language)
  const setMeta = useScheduleStore((s) => s.setMeta)
  const templateId = useScheduleStore((s) => s.meta.templateId)
  const presetId = useScheduleStore((s) => s.exportSettings.presetId)
  const t = useTranslation(uiLanguage)

  const [help, setHelp] = useState(false)
  const wide = useWideLayout()

  const { W, H } = exportDims(presetId)
  const canvas = getTemplate(templateId ?? '').canvas

  const toolbar = (
    <Toolbar
      className="bg-canvas"
      left={
        <>
          <span className="font-mono text-micro tabular-nums text-ink-faint">
            {W}×{H}
          </span>
          <span className="hidden items-center gap-1.5 text-micro text-ink-faint lg:flex">
            <MousePointerClick size={12} aria-hidden />
            {t.clickRowHint}
          </span>
        </>
      }
      right={
        <SegmentedControl<Lang>
          size="sm"
          ariaLabel={t.cardLanguageLabel}
          value={cardLanguage}
          onChange={(l) => setMeta({ language: l })}
          options={(Object.keys(LANG_NAME) as Lang[]).map((l) => ({ value: l, label: l.toUpperCase() }))}
        />
      }
    />
  )

  const panel = (
    <ErrorBoundary inline>
      <EditorPanel stageRef={stageRef} activeTab={activeTab} />
    </ErrorBoundary>
  )

  return (
    <div className="flex h-screen flex-col bg-canvas text-ink">
      <TitleBar theme={theme} onToggleTheme={onToggleTheme} isMaximized={isMaximized} />

      <div className="flex min-h-0 flex-1">
        {wide ? (
          <>
            <IconRail activeTab={activeTab} onTabChange={onTabChange} onHelp={() => setHelp(true)} />
            <aside className="flex w-[380px] shrink-0 flex-col border-r border-line bg-surface">{panel}</aside>
            <main className="flex min-w-0 flex-1 flex-col bg-canvas">
              {toolbar}
              <div className="min-h-0 flex-1 bg-sunken p-6">
                <FitStage stageRef={stageRef} stageW={canvas.w} stageH={canvas.h} />
              </div>
            </main>
          </>
        ) : (
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="shrink-0 border-b border-line bg-canvas">
              {toolbar}
              <div className="bg-sunken p-3" style={{ aspectRatio: `${W}/${H}`, maxHeight: '45vh' }}>
                <FitStage stageRef={stageRef} stageW={canvas.w} stageH={canvas.h} />
              </div>
            </div>
            <div className="min-h-0 flex-1 bg-surface">{panel}</div>
          </div>
        )}
      </div>

      {!wide && <MobileTabBar activeTab={activeTab} onTabChange={onTabChange} onHelp={() => setHelp(true)} />}

      <HelpSheet open={help} onClose={() => setHelp(false)} />
      <Toaster />
    </div>
  )
}
